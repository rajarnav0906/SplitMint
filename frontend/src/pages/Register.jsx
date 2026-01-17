import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, UserPlus, CheckCircle, ShieldCheck, Zap, Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { register as registerService } from "../services/authService.js";

const Register = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      alert("Passwords do not match. Please try again.");
      return;
    }

    if (formData.password.length < 6) {
      alert("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);

    try {
      const res = await registerService(
        formData.email,
        formData.password,
        formData.name
      );

      if (res && res.success) {
        if (res.data && res.data.user) {
          login(res.data.user);
          navigate("/dashboard");
        } else {
          alert("Registration successful but user data is missing. Please try logging in.");
        }
      } else {
        alert(res?.message || "Registration failed. Please check the console for details.");
      }
    } catch (err) {
      let errorMessage = "Registration failed. Please try again.";
      
      if (err?.message && !err.message.includes('<!DOCTYPE')) {
        errorMessage = err.message;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.data?.errors && Array.isArray(err.response.data.errors)) {
        errorMessage = err.response.data.errors.join(', ');
      } else if (err?.response?.status === 404) {
        errorMessage = "Backend server not found. Please check if the server is running and the API URL is correct.";
      } else if (!err?.response) {
        errorMessage = "Network error. Please check if the backend server is running.";
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Zap, title: "Fast Setup", text: "Get started in under 60 seconds", color: "text-yellow-400" },
    { icon: Users, title: "Group Management", text: "Create groups with up to 4 people", color: "text-blue-400" },
    { icon: TrendingUp, title: "Smart Balances", text: "Automatic balance calculations", color: "text-green-400" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-blue-600/20 to-indigo-600/20 backdrop-blur-sm p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/30">
              <ShieldCheck className="h-7 w-7" />
            </div>
            <span className="text-2xl font-bold">SplitMint</span>
          </div>
          
          <h2 className="text-5xl font-bold mb-6 leading-tight">
            Start splitting expenses the smart way
          </h2>
          <p className="text-blue-100 text-xl mb-12 leading-relaxed">
            Join thousands of users who trust SplitMint to manage their shared expenses. Free forever, no credit card required.
          </p>

          <div className="space-y-8">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="flex items-start gap-4 group">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110 flex-shrink-0">
                  <benefit.icon className={`h-8 w-8 ${benefit.color}`} />
                </div>
                <div>
                  <h3 className="font-bold text-xl mb-2">{benefit.title}</h3>
                  <p className="text-blue-100 text-lg">{benefit.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-8">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="h-6 w-6 text-green-300" />
            <span className="font-bold text-xl">Free forever</span>
          </div>
          <p className="text-blue-100 text-lg">No hidden fees, no subscriptions, no credit card required</p>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 bg-white">
        <div className="w-full max-w-md animate-fade-in">
          <div className="lg:hidden text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
                <ShieldCheck className="h-7 w-7 text-white" />
              </div>
              <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">SplitMint</span>
            </div>
            <p className="text-gray-600 text-lg">Create your free account</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600 text-lg">Get started in less than a minute</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-10">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-8 pb-6 border-b border-gray-100">
              <CheckCircle className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Free to use · No credit card required</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 6 characters"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">Must be at least 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="password"
                    name="confirmPassword"
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] cursor-pointer mt-6"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Creating account...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-5 w-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100 space-y-4">
              <p className="text-xs text-center text-gray-500">
                By creating an account, you agree to our Terms of Service and Privacy Policy
              </p>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="text-blue-600 font-bold hover:text-blue-700 hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  Sign in
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
