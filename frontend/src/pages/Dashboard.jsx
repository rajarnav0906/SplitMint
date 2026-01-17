import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { LogOut, UserCircle, Plus, Users, DollarSign, TrendingUp, TrendingDown, ArrowRight, ShieldCheck, Zap, Calendar, Loader2, Sparkles, Activity } from "lucide-react";
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
          if (balancesRes.success && balancesRes.data.balances) {
            const userBalance = balancesRes.data.balances.find(
              b => b.participantId && group.participants.some(
                p => p._id.toString() === b.participantId.toString() && 
                     p.userId && p.userId.toString() === user?._id?.toString()
              )
            );
            if (userBalance) {
              netBalance += userBalance.netBalance || 0;
            }
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
    { 
      icon: Users, 
      label: "Active Groups", 
      value: stats.groups.toString(), 
      bgGradient: "from-blue-500 to-blue-600",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      trend: null
    },
    { 
      icon: DollarSign, 
      label: "Total Expenses", 
      value: `$${stats.totalExpenses.toFixed(2)}`, 
      bgGradient: "from-emerald-500 to-emerald-600",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      trend: null
    },
    { 
      icon: stats.netBalance >= 0 ? TrendingUp : TrendingDown, 
      label: "Net Balance", 
      value: `$${Math.abs(stats.netBalance).toFixed(2)}`, 
      bgGradient: stats.netBalance >= 0 ? "from-green-500 to-green-600" : "from-red-500 to-red-600",
      iconBg: stats.netBalance >= 0 ? "bg-green-100" : "bg-red-100",
      iconColor: stats.netBalance >= 0 ? "text-green-600" : "text-red-600",
      trend: stats.netBalance >= 0 ? "+" : "-"
    },
  ];

  const quickActions = [
    { 
      icon: Plus, 
      label: "Create Group", 
      description: "Start a new expense group", 
      gradient: "from-blue-500 to-blue-600",
      hoverGradient: "hover:from-blue-600 hover:to-blue-700",
      onClick: () => navigate("/groups") 
    },
    { 
      icon: Users, 
      label: "View Groups", 
      description: "Manage your groups", 
      gradient: "from-purple-500 to-purple-600",
      hoverGradient: "hover:from-purple-600 hover:to-purple-700",
      onClick: () => navigate("/groups") 
    },
    { 
      icon: DollarSign, 
      label: "Add Expense", 
      description: "Record a new expense", 
      gradient: "from-emerald-500 to-emerald-600",
      hoverGradient: "hover:from-emerald-600 hover:to-emerald-700",
      onClick: () => navigate("/groups") 
    },
  ];

  const features = [
    { icon: Zap, title: "Lightning Fast", text: "Track expenses in real-time with instant updates", color: "text-yellow-500" },
    { icon: ShieldCheck, title: "Secure & Private", text: "Your data is encrypted and completely safe", color: "text-blue-500" },
    { icon: Activity, title: "Smart Analytics", text: "Automatic balance calculations and insights", color: "text-purple-500" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">
                SplitMint
              </span>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg border border-gray-200/50">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                  <UserCircle className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700">{user?.name}</span>
              </div>

              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all duration-200 cursor-pointer"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-3">
            <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
              Welcome back, {user?.name?.split(' ')[0]}
            </h1>
            <Sparkles className="h-6 w-6 text-yellow-400 animate-pulse" />
          </div>
          <p className="text-gray-600 text-lg">
            Manage your shared expenses and settle up with friends effortlessly
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          {statsData.map((stat, idx) => (
            <div
              key={idx}
              className="group bg-white rounded-2xl border border-gray-200/50 p-6 shadow-sm hover:shadow-xl transition-all duration-300 animate-fade-in"
              style={{ animationDelay: `${idx * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-14 h-14 ${stat.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300`}>
                  <stat.icon className={`h-7 w-7 ${stat.iconColor}`} />
                </div>
                {stat.trend && (
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    stat.trend === '+' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {stat.trend}
                  </div>
                )}
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-8 animate-fade-in">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Activity className="h-6 w-6 text-blue-600" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {quickActions.map((action, idx) => (
              <button
                key={idx}
                onClick={action.onClick}
                className="group relative bg-white rounded-2xl border border-gray-200/50 p-6 text-left hover:border-transparent hover:shadow-2xl transition-all duration-300 overflow-hidden cursor-pointer animate-scale-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${action.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                <div className="relative z-10">
                  <div className={`w-14 h-14 bg-gradient-to-br ${action.gradient} rounded-xl flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <action.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="font-bold text-gray-900 mb-2 group-hover:text-white transition-colors duration-300">{action.label}</h3>
                  <p className="text-sm text-gray-600 group-hover:text-white/90 transition-colors duration-300">{action.description}</p>
                  <ArrowRight className="h-5 w-5 text-gray-400 mt-4 group-hover:text-white group-hover:translate-x-2 transition-all duration-300" />
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
          <div className="bg-white rounded-2xl border border-gray-200/50 p-8 shadow-sm hover:shadow-lg transition-shadow duration-300">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-blue-600" />
              Why SplitMint?
            </h2>
            <div className="space-y-6">
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-4 group">
                  <div className={`w-12 h-12 ${feature.color.replace('text-', 'bg-').replace('-500', '-100')} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 mb-1">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.text}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-2xl p-8 text-white shadow-2xl hover:shadow-3xl transition-all duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24"></div>
            <div className="relative z-10">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Zap className="h-6 w-6 text-yellow-300" />
                Get Started
              </h2>
              <p className="text-blue-100 mb-8 text-lg">
                Start splitting expenses with your friends. Create your first group and add expenses to get started.
              </p>
              <div className="space-y-4 mb-8">
                {[
                  "Create a new group",
                  "Add registered users",
                  "Start adding expenses"
                ].map((step, idx) => (
                  <div key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-sm font-bold border-2 border-white/30">
                      {idx + 1}
                    </div>
                    <span className="text-blue-50 font-medium">{step}</span>
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate("/groups")}
                className="w-full bg-white text-blue-600 py-4 px-6 rounded-xl font-bold hover:bg-blue-50 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 cursor-pointer"
              >
                Create Your First Group
              </button>
            </div>
          </div>
        </div>

        {stats.groups > 0 && (
          <div className="mt-8 animate-fade-in">
            <button
              onClick={() => navigate("/groups")}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-bold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-[1.02] cursor-pointer"
            >
              <Users className="h-5 w-5" />
              Go to Groups
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
