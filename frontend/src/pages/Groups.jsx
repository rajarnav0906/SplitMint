import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Users, Trash2, Edit2, ArrowRight, Search, X, UserPlus, Loader2, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import * as groupService from '../services/groupService';
import * as userService from '../services/userService';
import { useAuth } from '../context/AuthContext.jsx';

const Groups = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const searchTimeoutRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    loadGroups();
  }, [location.key]);

  useEffect(() => {
    const handleFocus = () => {
      loadGroups();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length >= 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        searchUsers();
      }, 300);
    } else {
      setSearchResults([]);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const response = await groupService.getGroups();
      if (response.success) {
        setGroups(response.data.groups || []);
      }
    } catch (error) {
      alert('Failed to load groups. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await userService.searchUsers(searchQuery);
      if (response.success) {
        const users = response.data.users || [];
        const filteredUsers = users.filter(
          userItem => !selectedUsers.some(selected => selected._id === userItem.id)
        );
        setSearchResults(filteredUsers);
      }
    } catch (error) {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectUser = (userItem) => {
    if (selectedUsers.length >= 3) {
      alert('You can add a maximum of 3 additional participants.');
      return;
    }

    if (selectedUsers.some(u => u._id === userItem.id)) {
      return;
    }

    setSelectedUsers([...selectedUsers, {
      _id: userItem.id,
      name: userItem.name,
      email: userItem.email,
      userId: userItem.id
    }]);
    setSearchQuery('');
    setSearchResults([]);
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  const handleRemoveUser = (userId) => {
    setSelectedUsers(selectedUsers.filter(u => u._id !== userId));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      alert('Please enter a group name.');
      return;
    }

    if (newGroupName.trim().length > 100) {
      alert('Group name cannot exceed 100 characters.');
      return;
    }

    if (selectedUsers.length === 0) {
      alert('Please add at least one participant to the group.');
      return;
    }

    try {
      const groupData = {
        name: newGroupName.trim(),
        participants: selectedUsers.map(u => ({
          name: u.name,
          userId: u.userId
        }))
      };

      const response = await groupService.createGroup(groupData);
      if (response.success) {
        setShowCreateModal(false);
        setNewGroupName('');
        setSelectedUsers([]);
        setSearchQuery('');
        setSearchResults([]);
        loadGroups();
      }
    } catch (error) {
      alert(error.message || 'Failed to create group');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!confirm('Are you sure you want to delete this group? All expenses will be deleted.')) {
      return;
    }

    try {
      const response = await groupService.deleteGroup(groupId);
      if (response.success) {
        loadGroups();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete group');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Groups</h1>
            <p className="mt-2 text-gray-600">Manage your expense groups</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition shadow-md hover:shadow-lg cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No groups yet</h3>
            <p className="text-gray-600 mb-6">Create your first group to start splitting expenses</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition cursor-pointer"
            >
              Create Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group) => (
              <div
                key={group._id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6 cursor-pointer"
                onClick={() => navigate(`/groups/${group._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900">{group.name}</h3>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="text-blue-600 hover:text-blue-700 cursor-pointer"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group._id)}
                      className="text-red-600 hover:text-red-700 cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-4">
                  <Users className="w-4 h-4" />
                  <span className="text-sm">
                    {group.participants?.length || 0} participant{group.participants?.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/groups/${group._id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition cursor-pointer"
                >
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity cursor-pointer"
              onClick={() => {
                setShowCreateModal(false);
                setNewGroupName('');
                setSelectedUsers([]);
                setSearchQuery('');
                setSearchResults([]);
              }}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">Create New Group</h2>
                <button
                  onClick={() => {
                    setShowCreateModal(false);
                    setNewGroupName('');
                    setSelectedUsers([]);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleCreateGroup} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Group Name
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                    placeholder="Enter group name"
                    maxLength={100}
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">{newGroupName.length}/100 characters</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Add Participants (max 3)
                  </label>
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="Search registered users by name or email..."
                        disabled={selectedUsers.length >= 3}
                      />
                      {searching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                        </div>
                      )}
                    </div>

                    {searchResults.length > 0 && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                        {searchResults.map((userItem) => (
                          <button
                            key={userItem.id}
                            type="button"
                            onClick={() => handleSelectUser(userItem)}
                            className="w-full px-4 py-3 text-left hover:bg-blue-50 transition flex items-center gap-3 border-b border-gray-100 last:border-0 cursor-pointer"
                          >
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <UserPlus className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900 truncate">{userItem.name}</p>
                              <p className="text-sm text-gray-500 truncate">{userItem.email}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
                      <div className="absolute z-20 w-full mt-2 bg-white border border-gray-200 rounded-xl shadow-lg p-4 text-center text-gray-500">
                        No users found
                      </div>
                    )}
                  </div>

                  {selectedUsers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium text-gray-700">Selected Participants:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((userItem) => (
                          <div
                            key={userItem._id}
                            className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-2 rounded-lg text-sm"
                          >
                            <Check className="w-4 h-4" />
                            <span className="font-medium">{userItem.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(userItem._id)}
                              className="text-blue-600 hover:text-blue-800 transition cursor-pointer"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedUsers.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      Search and add registered users to your group
                    </p>
                  )}
                </div>

                <div className="flex gap-3 pt-4 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false);
                      setNewGroupName('');
                      setSelectedUsers([]);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedUsers.length === 0}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg cursor-pointer"
                  >
                    Create Group
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Groups;
