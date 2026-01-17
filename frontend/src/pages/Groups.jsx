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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8 animate-fade-in">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-2">
              Groups
            </h1>
            <p className="text-gray-600 text-lg">Manage your expense groups</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 cursor-pointer font-semibold"
          >
            <Plus className="w-5 h-5" />
            Create Group
          </button>
        </div>

        {groups.length === 0 ? (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 p-16 text-center animate-fade-in">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-12 h-12 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">No groups yet</h3>
            <p className="text-gray-600 mb-8 text-lg">Create your first group to start splitting expenses</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-4 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 cursor-pointer font-semibold"
            >
              Create Your First Group
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groups.map((group, idx) => (
              <div
                key={group._id}
                className="group bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg hover:shadow-2xl transition-all duration-300 p-6 cursor-pointer animate-scale-in hover:scale-[1.02]"
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => navigate(`/groups/${group._id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{group.name}</h3>
                  <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => navigate(`/groups/${group._id}`)}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-2 rounded-lg transition-all cursor-pointer"
                    >
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group._id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all cursor-pointer"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-gray-600 mb-6">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">
                    {group.participants?.length || 0} participant{group.participants?.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/groups/${group._id}`);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 px-4 py-3 rounded-xl hover:from-blue-50 hover:to-indigo-50 hover:text-blue-700 transition-all duration-300 cursor-pointer font-medium border border-gray-200 hover:border-blue-200"
                >
                  View Details
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
