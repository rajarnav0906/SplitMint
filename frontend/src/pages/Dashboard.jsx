import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { LogOut, UserCircle, Plus, Users, DollarSign, TrendingUp, ArrowRight, ShieldCheck, Zap, Calendar, Loader2 } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import * as groupService from "../services/groupService.js";
import * as expenseService from "../services/expenseService.js";
import * as balanceService from "../services/balanceService.js";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    groups: 0,
    totalExpenses: 0,
    netBalance: 0
  });

  useEffect(() => {
    loadDashboardData();
  }, [location.key]);

  useEffect(() => {
    const handleFocus = () => {
      loadDashboardData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const groupsRes = await groupService.getGroups();
      const groups = groupsRes.success ? groupsRes.data.groups || [] : [];

      let totalExpenses = 0;
      let netBalance = 0;

      for (const group of groups) {
        try {
          const expensesRes = await expenseService.getExpenses(group._id);
          if (expensesRes.success) {
            const expenses = expensesRes.data.expenses || [];
            totalExpenses += expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
          }

          const balancesRes = await balanceService.getBalances(group._id);
          if (balancesRes.success && balancesRes.data.netBalance) {
            netBalance += balancesRes.data.netBalance;
          }
        } catch (err) {
        }
      }

      setStats({
        groups: groups.length,
        totalExpenses,
        netBalance
      });
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const statsData = [
    { icon: Users, label: "Active Groups", value: stats.groups.toString(), bgColor: "bg-blue-100", iconColor: "text-blue-600" },
    { icon: DollarSign, label: "Total Expenses", value: `$${stats.totalExpenses.toFixed(2)}`, bgColor: "bg-green-100", iconColor: "text-green-600" },
    { icon: TrendingUp, label: "Net Balance", value: `$${stats.netBalance.toFixed(2)}`, bgColor: "bg-purple-100", iconColor: "text-purple-600" },
  ];

  const quickActions = [
    { icon: Plus, label: "Create Group", description: "Start a new expense group", bgColor: "bg-blue-100", iconColor: "text-blue-600", hoverBg: "hover:bg-blue-200", hoverText: "group-hover:text-blue-600", onClick: () => navigate("/groups") },
    { icon: Users, label: "View Groups", description: "Manage your groups", bgColor: "bg-green-100", iconColor: "text-green-600", hoverBg: "hover:bg-green-200", hoverText: "group-hover:text-green-600", onClick: () => navigate("/groups") },
    { icon: DollarSign, label: "Add Expense", description: "Record a new expense", bgColor: "bg-purple-100", iconColor: "text-purple-600", hoverBg: "hover:bg-purple-200", hoverText: "group-hover:text-purple-600", onClick: () => navigate("/groups") },
  ];

  const features = [
    { icon: Zap, title: "Lightning Fast", text: "Track expenses in real-time" },
    { icon: ShieldCheck, title: "Secure", text: "Your data is encrypted and safe" },
    { icon: Calendar, title: "Smart Tracking", text: "Automatic balance calculations" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <ShieldCheck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">SplitMint</span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-50 rounded-lg">
                <UserCircle className="h-5 w-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name?.split(' ')[0]}
          </h1>
          <p className="text-gray-600 text-lg">
            Manage your shared expenses and settle up with friends effortlessly
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <stat.icon className={`h-6 w-6 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="bg-white rounded-xl border border-gray-200 p-6 text-left hover:border-blue-300 hover:shadow-md transition-all group"
              >
                <div className={`w-12 h-12 ${action.bgColor} rounded-lg flex items-center justify-center mb-4 ${action.hoverBg} transition-colors`}>
                  <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                </div>
                <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
                <p className="text-sm text-gray-600">{action.description}</p>
                <ArrowRight className={`h-4 w-4 text-gray-400 mt-3 ${action.hoverText} group-hover:translate-x-1 transition-all`} />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Why SplitMint?</h2>
            <div className="space-y-4">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white shadow-lg">
            <h2 className="text-xl font-bold mb-4">Get Started</h2>
            <p className="text-blue-100 mb-6">
              Start splitting expenses with your friends. Create your first group and add expenses to get started.
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <span className="text-blue-50">Create a new group</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <span className="text-blue-50">Add registered users</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <span className="text-blue-50">Start adding expenses</span>
              </div>
            </div>
            <button 
              onClick={() => navigate("/groups")}
              className="mt-6 w-full bg-white text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
            >
              Create Your First Group
            </button>
          </div>
        </div>

        <div className="mt-8">
          <button
            onClick={() => navigate("/groups")}
            className="w-full bg-blue-600 text-white py-4 px-6 rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <Users className="h-5 w-5" />
            Go to Groups
          </button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
