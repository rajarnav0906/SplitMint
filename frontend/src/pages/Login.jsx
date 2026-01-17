import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, LogIn, ShieldCheck, Zap, Users, TrendingUp, ArrowRight, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { login as loginService } from "../services/authService.js";

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await loginService(formData.email, formData.password);
      
      if (res && res.success) {
        if (res.data && res.data.user) {
          login(res.data.user);
          navigate("/dashboard");
        } else {
          alert("Login successful but user data is missing. Please try again.");
        }
      } else {
        alert(res?.message || "Invalid email or password. Please try again.");
      }
    } catch (err) {
      let errorMessage = "Login failed. Please try again.";
      if (err?.message && !err.message.includes('<!DOCTYPE')) {
        errorMessage = err.message;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.status === 404) {
        errorMessage = "Backend server not found. Please check if the server is running.";
      } else if (!err?.response) {
        errorMessage = "Network error. Please check if the backend server is running.";
      }
      
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Zap, text: "Lightning fast expense tracking", color: "text-yellow-400" },
    { icon: Users, text: "Split with up to 4 people", color: "text-blue-400" },
    { icon: TrendingUp, text: "Real-time balance calculations", color: "text-green-400" },
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
            Split expenses effortlessly with your friends
          </h2>
          <p className="text-blue-100 text-xl mb-12 leading-relaxed">
            The smart way to manage shared expenses. Track who paid what, calculate balances automatically, and settle up with minimal transactions.
          </p>

          <div className="space-y-6 mb-12">
            {features.map((feature, idx) => (
              <div key={idx} className="flex items-center gap-4 group">
                <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/20 group-hover:bg-white/20 transition-all duration-300 group-hover:scale-110">
                  <feature.icon className={`h-7 w-7 ${feature.color}`} />
                </div>
                <span className="text-blue-50 text-lg">{feature.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 border-t border-white/20 pt-8">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <p className="text-blue-100 text-lg font-semibold">Trusted by thousands of users</p>
          </div>
          <div className="flex items-center gap-1">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-6 h-6 fill-yellow-300" viewBox="0 0 20 20">
                <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
              </svg>
            ))}
            <span className="ml-3 text-blue-100 text-lg">4.9/5 rating</span>
          </div>
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
            <p className="text-gray-600 text-lg">Sign in to your account</p>
          </div>

          <div className="hidden lg:block mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Welcome back</h1>
            <p className="text-gray-600 text-lg">Sign in to continue to SplitMint</p>
          </div>

          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-8 lg:p-10">
            <div className="flex items-center gap-2 text-gray-600 text-sm mb-8 pb-6 border-b border-gray-100">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <span className="font-medium">Secure and encrypted</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
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
                    placeholder="Enter your password"
                    className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all hover:border-gray-300"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 px-4 rounded-xl font-bold transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02] cursor-pointer"
              >
                {loading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="h-5 w-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <p className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="text-blue-600 font-bold hover:text-blue-700 hover:underline inline-flex items-center gap-1 transition-colors"
                >
                  Create one
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </p>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-600" />
                  <span>256-bit SSL</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-blue-600" />
                  <span>Encrypted</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
