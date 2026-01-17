import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, DollarSign, Users, TrendingUp, TrendingDown, Search, Filter, X, Calendar, User, Loader2, Check } from 'lucide-react';
import Navbar from '../components/Navbar';
import * as groupService from '../services/groupService';
import * as expenseService from '../services/expenseService';
import * as balanceService from '../services/balanceService';
import { useAuth } from '../context/AuthContext.jsx';

const GroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [group, setGroup] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [balances, setBalances] = useState(null);
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterParticipant, setFilterParticipant] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterAmountMin, setFilterAmountMin] = useState('');
  const [filterAmountMax, setFilterAmountMax] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    payer: '',
    splitMode: 'equal',
    selectedParticipants: []
  });

  useEffect(() => {
    loadGroupData();
  }, [id, location.key]);

  useEffect(() => {
    const handleFocus = () => {
      loadGroupData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [id]);

  const loadGroupData = async () => {
    try {
      setLoading(true);
      const [groupRes, expensesRes, balancesRes, settlementsRes] = await Promise.all([
        groupService.getGroup(id),
        expenseService.getExpenses(id),
        balanceService.getBalances(id),
        balanceService.getSettlements(id)
      ]);

      if (groupRes.success) setGroup(groupRes.data.group);
      if (expensesRes.success) setExpenses(expensesRes.data.expenses || []);
      if (balancesRes.success) setBalances(balancesRes.data);
      if (settlementsRes.success) setSettlements(settlementsRes.data.settlements || []);
    } catch (error) {
      alert('Failed to load group data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredExpenses = useMemo(() => {
    let filtered = [...expenses];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(expense =>
        expense.description?.toLowerCase().includes(query) ||
        expense.payer?.name?.toLowerCase().includes(query)
      );
    }

    if (filterParticipant) {
      filtered = filtered.filter(expense =>
        expense.payer?._id === filterParticipant ||
        expense.splits?.some(split => split.participant?._id === filterParticipant)
      );
    }

    if (filterDateFrom) {
      const fromDate = new Date(filterDateFrom);
      filtered = filtered.filter(expense => new Date(expense.date) >= fromDate);
    }

    if (filterDateTo) {
      const toDate = new Date(filterDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(expense => new Date(expense.date) <= toDate);
    }

    if (filterAmountMin) {
      const min = parseFloat(filterAmountMin);
      filtered = filtered.filter(expense => expense.amount >= min);
    }

    if (filterAmountMax) {
      const max = parseFloat(filterAmountMax);
      filtered = filtered.filter(expense => expense.amount <= max);
    }

    return filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [expenses, searchQuery, filterParticipant, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax]);

  const handleCreateExpense = async (e) => {
    e.preventDefault();
    
    if (!expenseForm.amount || parseFloat(expenseForm.amount) <= 0) {
      alert('Please enter a valid expense amount greater than 0.');
      return;
    }

    if (!expenseForm.description || !expenseForm.description.trim()) {
      alert('Please enter an expense description.');
      return;
    }

    if (!expenseForm.payer) {
      alert('Please select who paid for this expense.');
      return;
    }

    if (expenseForm.splitMode === 'equal' && expenseForm.selectedParticipants.length === 0) {
      alert('Please select at least one person who owes for this expense.');
      return;
    }

    try {
      const expenseData = {
        amount: parseFloat(expenseForm.amount),
        description: expenseForm.description.trim(),
        date: new Date(expenseForm.date),
        payer: expenseForm.payer,
        group: id,
        splitMode: expenseForm.splitMode,
        participantIds: expenseForm.splitMode === 'equal' ? expenseForm.selectedParticipants : undefined
      };

      const response = await expenseService.createExpense(expenseData);
      if (response.success) {
        setShowExpenseModal(false);
        setExpenseForm({
          amount: '',
          description: '',
          date: new Date().toISOString().split('T')[0],
          payer: '',
          splitMode: 'equal',
          selectedParticipants: []
        });
        loadGroupData();
      }
    } catch (error) {
      alert(error.message || 'Failed to create expense');
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('Are you sure you want to delete this expense?')) return;

    try {
      const response = await expenseService.deleteExpense(expenseId);
      if (response.success) {
        loadGroupData();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete expense');
    }
  };

  const toggleParticipant = (participantId) => {
    if (expenseForm.selectedParticipants.includes(participantId)) {
      setExpenseForm({
        ...expenseForm,
        selectedParticipants: expenseForm.selectedParticipants.filter(id => id !== participantId)
      });
    } else {
      setExpenseForm({
        ...expenseForm,
        selectedParticipants: [...expenseForm.selectedParticipants, participantId]
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterParticipant('');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterAmountMin('');
    setFilterAmountMax('');
  };

  const hasActiveFilters = searchQuery || filterParticipant || filterDateFrom || filterDateTo || filterAmountMin || filterAmountMax;

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Group not found</div>
      </div>
    );
  }

  const allParticipants = (group.participants || []).map(p => ({
    _id: p._id,
    name: p.name || p.userId?.name || 'Unknown',
    userId: p.userId?._id || p.userId
  }));

  const totalSpent = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const participantBalances = balances?.participantBalances || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 cursor-pointer group transition-all duration-200 hover:translate-x-[-4px]"
        >
          <ArrowLeft className="w-5 h-5 group-hover:translate-x-[-4px] transition-transform" />
          <span className="font-medium">Back to Groups</span>
        </button>

        <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-xl p-8 mb-6 animate-fade-in">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent mb-3">
                {group.name}
              </h1>
              <div className="flex items-center gap-4 text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="font-medium">{allParticipants.length} participants</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowExpenseModal(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105 cursor-pointer font-semibold"
            >
              <Plus className="w-5 h-5" />
              Add Expense
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Total Spent</h3>
            </div>
            <p className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              ${totalSpent.toFixed(2)}
            </p>
          </div>

          {balances && (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-red-100 to-pink-100 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">You Owe</h3>
                </div>
                <p className="text-3xl font-bold text-red-600">
                  ${Math.abs(balances.netBalance < 0 ? balances.netBalance : 0).toFixed(2)}
                </p>
              </div>

              <div className="bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-6 hover:shadow-xl transition-all duration-300 animate-fade-in">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl flex items-center justify-center">
                    <TrendingDown className="w-6 h-6 text-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Owed to You</h3>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  ${(balances.netBalance > 0 ? balances.netBalance : 0).toFixed(2)}
                </p>
              </div>
            </>
          )}
        </div>

        {participantBalances.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Balance Overview</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Participant</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Net Balance</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Paid</th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Total Owed</th>
                  </tr>
                </thead>
                <tbody>
                  {participantBalances.map((balance, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${balance.netBalance < 0 ? 'bg-red-500' : balance.netBalance > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                          <span className="font-medium text-gray-900">{balance.participantName || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className={`py-3 px-4 text-right font-semibold ${balance.netBalance < 0 ? 'text-red-600' : balance.netBalance > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        ${balance.netBalance.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        ${balance.totalPaid.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-right text-gray-700">
                        ${balance.totalOwed.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {settlements.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Settlement Suggestions</h2>
            <div className="space-y-2">
              {settlements.map((settlement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-gray-700">
                    <span className="font-semibold text-blue-700">{settlement.from}</span> should pay <span className="font-semibold text-blue-700">{settlement.to}</span>
                  </span>
                  <span className="font-bold text-blue-900">${settlement.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Expenses</h2>
            <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition cursor-pointer ${
                    showFilters || hasActiveFilters
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                <Filter className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {[searchQuery, filterParticipant, filterDateFrom, filterDateTo, filterAmountMin, filterAmountMax].filter(Boolean).length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by description or payer..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Participant</label>
                  <select
                    value={filterParticipant}
                    onChange={(e) => setFilterParticipant(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">All participants</option>
                    {allParticipants.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date From</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={filterDateFrom}
                      onChange={(e) => setFilterDateFrom(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date To</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={filterDateTo}
                      onChange={(e) => setFilterDateTo(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Min Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filterAmountMin}
                    onChange={(e) => setFilterAmountMin(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    value={filterAmountMax}
                    onChange={(e) => setFilterAmountMax(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {hasActiveFilters && (
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {filteredExpenses.length} of {expenses.length} expenses
                  </span>
                  <button
                    onClick={clearFilters}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-200 rounded-lg transition cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          )}

          {filteredExpenses.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              {hasActiveFilters ? 'No expenses match your filters.' : 'No expenses yet. Add your first expense to get started.'}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((expense) => {
                const expenseDate = new Date(expense.date);
                const isRecent = (Date.now() - expenseDate.getTime()) < 7 * 24 * 60 * 60 * 1000;
                
                return (
                  <div
                    key={expense._id}
                    className={`flex items-center justify-between p-4 border rounded-lg transition cursor-pointer ${
                      isRecent
                        ? 'border-blue-200 bg-blue-50/30'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="font-semibold text-gray-900">{expense.description}</h3>
                        {isRecent && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            Recent
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          <span>{expense.payer?.name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          <span>{expenseDate.toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-semibold text-gray-900">${expense.amount.toFixed(2)}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteExpense(expense._id);
                        }}
                        className="text-red-600 hover:text-red-700 transition cursor-pointer"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showExpenseModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
              onClick={() => {
                setShowExpenseModal(false);
                setExpenseForm({
                  amount: '',
                  description: '',
                  date: new Date().toISOString().split('T')[0],
                  payer: '',
                  splitMode: 'equal',
                  selectedParticipants: []
                });
              }}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="text-2xl font-bold text-gray-900">Add Expense</h2>
                <button
                  onClick={() => {
                    setShowExpenseModal(false);
                    setExpenseForm({
                      amount: '',
                      description: '',
                      date: new Date().toISOString().split('T')[0],
                      payer: '',
                      splitMode: 'equal',
                      selectedParticipants: []
                    });
                  }}
                  className="text-gray-400 hover:text-gray-600 transition cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                <form onSubmit={handleCreateExpense} className="space-y-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={expenseForm.description}
                      onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      placeholder="What was this expense for?"
                      maxLength={200}
                      required
                    />
                    <p className="mt-1 text-xs text-gray-500">{expenseForm.description.length}/200 characters</p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Amount</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={expenseForm.amount}
                        onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={expenseForm.date}
                        onChange={(e) => setExpenseForm({ ...expenseForm, date: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Paid By</label>
                    <select
                      value={expenseForm.payer}
                      onChange={(e) => setExpenseForm({ ...expenseForm, payer: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                      required
                    >
                      <option value="">Select who paid</option>
                      {allParticipants.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">Split Equally Among</label>
                    <div className="border border-gray-300 rounded-xl p-4 bg-gray-50 max-h-48 overflow-y-auto">
                      {allParticipants.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">No participants available</p>
                      ) : (
                        <div className="space-y-2">
                          {allParticipants.map((p) => {
                            const isSelected = expenseForm.selectedParticipants.includes(p._id);
                            return (
                              <button
                                key={p._id}
                                type="button"
                                onClick={() => toggleParticipant(p._id)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg border transition cursor-pointer ${
                                  isSelected
                                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                                }`}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                                    isSelected
                                      ? 'bg-blue-600 border-blue-600'
                                      : 'border-gray-300'
                                  }`}>
                                    {isSelected && <Check className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className="font-medium">{p.name}</span>
                                </div>
                                {expenseForm.amount && expenseForm.selectedParticipants.length > 0 && isSelected && (
                                  <span className="text-sm text-gray-600">
                                    ${(parseFloat(expenseForm.amount) / expenseForm.selectedParticipants.length).toFixed(2)}
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    {expenseForm.amount && expenseForm.selectedParticipants.length > 0 && (
                      <p className="mt-2 text-sm text-gray-600">
                        Each person owes: <span className="font-semibold">${(parseFloat(expenseForm.amount) / expenseForm.selectedParticipants.length).toFixed(2)}</span>
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExpenseModal(false);
                        setExpenseForm({
                          amount: '',
                          description: '',
                          date: new Date().toISOString().split('T')[0],
                          payer: '',
                          splitMode: 'equal',
                          selectedParticipants: []
                        });
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition font-medium cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={expenseForm.selectedParticipants.length === 0}
                      className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg cursor-pointer"
                    >
                      Add Expense
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupDetail;
