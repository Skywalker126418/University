import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldCheck,
  KeyRound,
  Lock,
  Mail,
  User,
  Phone,
  Camera,
  ArrowRight,
  AlertCircle,
  GraduationCap,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';
import { authService } from '../../services/authService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';

const RegisterAdminPage = () => {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const toast = useToast();

  // Step 1: Security Gate (PIN/Password), Step 2: Registration Form
  const [step, setStep] = useState(1);
  const [securityKey, setSecurityKey] = useState('');
  const [isVerifyingGate, setIsVerifyingGate] = useState(false);
  const [gateError, setGateError] = useState('');

  // Form Data
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    confirm_password: '',
    phone: '',
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleVerifyGate = async (e) => {
    e.preventDefault();
    setGateError('');

    if (!securityKey.trim()) {
      setGateError('Please enter the Master PIN or Master Password.');
      return;
    }

    try {
      setIsVerifyingGate(true);
      const res = await authService.verifyAdminGate(securityKey.trim());
      if (res?.success) {
        toast.success('Security verification passed. Proceed to account creation.');
        setStep(2);
      }
    } catch (err) {
      setGateError(err.message || 'Invalid Master PIN or Password. Access denied.');
    } finally {
      setIsVerifyingGate(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB.');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.first_name.trim() || !formData.last_name.trim() || !formData.email.trim() || !formData.password) {
      setFormError('Please fill in all required fields.');
      return;
    }

    if (formData.password.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirm_password) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      const data = new FormData();
      data.append('pinOrPassword', securityKey.trim());
      data.append('first_name', formData.first_name.trim());
      data.append('last_name', formData.last_name.trim());
      data.append('email', formData.email.trim());
      data.append('password', formData.password);
      data.append('phone', formData.phone.trim());
      if (avatarFile) {
        data.append('avatar', avatarFile);
      }

      const res = await authService.registerAdmin(data);
      const resData = res?.data || res;

      if (resData?.token && resData?.user) {
        sessionStorage.setItem('ums_token', resData.token);
        sessionStorage.setItem('ums_user', JSON.stringify(resData.user));
        localStorage.removeItem('ums_token');
        localStorage.removeItem('ums_user');
        if (setUser) setUser(resData.user);
        toast.success('Administrator account registered and authenticated!');
        navigate('/dashboard', { replace: true });
      } else {
        toast.success('Administrator registered successfully. You can now log in.');
        navigate('/login', { replace: true });
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create administrator account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-black-card text-white rounded-2xl shadow-2xl border border-darkblue-border/60 overflow-hidden">
      {/* Top Header */}
      <div className="bg-darkblue p-6 border-b border-darkblue-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">
              Administrator Setup Portal
            </h1>
            <p className="text-xs text-blue-200">
              {step === 1 ? 'Step 1: Security Authorization' : 'Step 2: Administrator Profile Details'}
            </p>
          </div>
        </div>

        <Link
          to="/login"
          className="text-xs font-medium text-slate-300 hover:text-white transition-colors"
        >
          Return to Login
        </Link>
      </div>

      <div className="p-8">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            /* STEP 1: SECURITY GATE */
            <motion.div
              key="gate"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="text-center max-w-md mx-auto space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-darkblue flex items-center justify-center mx-auto text-blue-400 border border-darkblue-border shadow-lg">
                  <KeyRound className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-xl font-bold text-white">Master Security Gate</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Creating an administrative account requires institutional authorization. Please enter your university Master PIN or Master Password below.
                </p>
              </div>

              {gateError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{gateError}</span>
                </div>
              )}

              <form onSubmit={handleVerifyGate} className="space-y-5 max-w-md mx-auto">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Master PIN or Master Password <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      value={securityKey}
                      onChange={(e) => setSecurityKey(e.target.value)}
                      placeholder="Enter Master PIN or Master Password"
                      className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl bg-black-surface border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                      required
                      autoFocus
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  loading={isVerifyingGate}
                  className="w-full py-2.5 bg-darkblue hover:bg-darkblue-royal text-white font-semibold rounded-xl border border-darkblue-border shadow-lg"
                >
                  Verify Key & Proceed <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </form>
            </motion.div>
          ) : (
            /* STEP 2: REGISTRATION FORM */
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">Create Administrator Account</h2>
                  <p className="text-xs text-slate-400">
                    This account will hold full root privileges over faculties, registrars, and students.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs text-blue-400 hover:underline"
                >
                  Change Security Key
                </button>
              </div>

              {formError && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-700/60 flex items-start gap-2.5 text-xs text-red-200">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-5">
                {/* Profile Photo Upload */}
                <div className="flex items-center gap-5 p-4 rounded-xl bg-black-surface border border-slate-800">
                  <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-darkblue-accent bg-darkblue flex items-center justify-center flex-shrink-0">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-8 h-8 text-slate-400" />
                    )}
                  </div>
                  <div className="space-y-1.5 flex-1">
                    <p className="text-xs font-semibold text-white">Profile Photo</p>
                    <p className="text-[11px] text-slate-400">
                      Upload an official administrative portrait (PNG, JPG, or WebP up to 5MB).
                    </p>
                    <label className="inline-flex items-center gap-1.5 text-xs font-medium text-white bg-darkblue hover:bg-darkblue-royal px-3 py-1.5 rounded-lg cursor-pointer border border-darkblue-border transition-colors">
                      <Camera className="w-3.5 h-3.5" />
                      Select Photo
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      First Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      value={formData.first_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Alexander"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-black-surface border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Last Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      value={formData.last_name}
                      onChange={handleInputChange}
                      placeholder="e.g. Hamilton"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-black-surface border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent outline-none"
                      required
                    />
                  </div>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Institutional Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="e.g. admin@university.edu"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-black-surface border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="e.g. +1-555-0100"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-black-surface border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent outline-none"
                    />
                  </div>
                </div>

                {/* Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      placeholder="Min. 6 characters"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-black-surface border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Confirm Password <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="password"
                      name="confirm_password"
                      value={formData.confirm_password}
                      onChange={handleInputChange}
                      placeholder="Re-enter password"
                      className="w-full text-sm px-3.5 py-2.5 rounded-xl bg-black-surface border border-slate-700 text-white placeholder:text-slate-500 focus:border-darkblue-accent outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    loading={isSubmitting}
                    className="w-full py-3 bg-darkblue hover:bg-darkblue-royal text-white font-bold rounded-xl border border-darkblue-border shadow-xl text-sm"
                  >
                    Complete Administrator Registration
                  </Button>
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RegisterAdminPage;
