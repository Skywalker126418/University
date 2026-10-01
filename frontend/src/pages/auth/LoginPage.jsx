import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, Eye, EyeOff, Lock, Mail, AlertCircle, Shield, ArrowRight } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/ui/Button';

const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please enter both your university email and password.');
      return;
    }

    try {
      setIsLoading(true);
      await login(email.trim(), password);
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message || 'Incorrect email or password. Please check your information and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row bg-black-card text-white rounded-2xl shadow-2xl overflow-hidden border border-slate-800">
      {/* Left Branding Panel (30% Dark Blue / 50% Black) */}
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className="md:w-5/12 bg-darkblue p-8 md:p-10 flex flex-col justify-between border-b md:border-b-0 md:border-r border-darkblue-border relative overflow-hidden"
      >
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shadow-md">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">UMS</span>
              <p className="text-xs text-blue-200">University Portal</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-white mb-3 leading-snug">
            Academic Excellence & Portal Management
          </h2>
          <p className="text-xs text-blue-100/80 leading-relaxed">
            Centralized information gateway for students, faculty, registrars, and university administrators. Access course catalogs, timetable schedules, and academic milestones securely.
          </p>
        </div>

        <div className="pt-6 border-t border-white/15 text-xs text-blue-200/70 relative z-10">
          <p className="font-semibold text-white">© 2026 University Management System</p>
          <p className="mt-0.5">Secure Role-Based Access Control</p>
        </div>

        {/* Subtle decorative glow */}
        <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* Right Login Form (50% Black background, 20% Crisp White text) */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="md:w-7/12 p-8 md:p-10 flex flex-col justify-center bg-black-surface"
      >
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white tracking-tight">Portal Login</h1>
          <p className="text-xs text-slate-400 mt-1">
            Sign in with your university account credentials to access your portal.
          </p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 flex items-start gap-2.5 text-xs text-red-200"
          >
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              University Email <span className="text-red-400">*</span>
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. yourname@university.edu"
                className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl bg-black-card border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Password <span className="text-red-400">*</span>
              </label>
              <a
                href="#forgot"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Please contact your university administrator or registrar to reset your credentials.');
                }}
                className="text-xs text-blue-400 hover:underline font-medium"
              >
                Forgot password?
              </a>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl bg-black-card border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3 text-slate-400 hover:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center">
            <input
              id="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-black-card text-darkblue focus:ring-blue-500"
            />
            <label htmlFor="remember-me" className="ml-2 text-xs text-slate-400 cursor-pointer">
              Remember me on this workstation
            </label>
          </div>

          <Button
            type="submit"
            loading={isLoading}
            className="w-full py-2.5 bg-darkblue hover:bg-darkblue-royal text-white font-semibold rounded-xl border border-darkblue-border shadow-lg transition-all"
          >
            Log In to Portal <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </form>

        {/* Administrator Setup Link (Requested: Remove demo accounts, add link for creating account with PIN/password gate) */}
        <div className="mt-8 pt-5 border-t border-slate-800 text-center space-y-2">
          <p className="text-xs text-slate-400">
            Institutional Setup or New Administrator?
          </p>
          <Link
            to="/register-admin"
            className="inline-flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-white text-xs font-semibold border border-slate-700 hover:border-slate-600 transition-all shadow-sm group"
          >
            <Shield className="w-4 h-4 text-blue-400 group-hover:scale-110 transition-transform" />
            <span>Register Administrator Account</span>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
