import React, { useState, useEffect, useContext } from 'react';
import { Lock, Bell, Eye, Moon, Sun, Shield, Save, KeyRound, CheckCircle, AlertCircle } from 'lucide-react';
import { ThemeContext } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const SettingsPage = () => {
  const { theme, toggleTheme } = useContext(ThemeContext);
  const { user } = useAuth();
  const toast = useToast();

  // Password state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [emailNotifs, setEmailNotifs] = useState(true);
  const [systemNotifs, setSystemNotifs] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Master Security Gate state (Admin only)
  const [gateSettings, setGateSettings] = useState({
    pin: '',
    password: '',
  });
  const [isLoadingGate, setIsLoadingGate] = useState(false);
  const [isUpdatingGate, setIsUpdatingGate] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchGateSettings();
    }
  }, [user]);

  const fetchGateSettings = async () => {
    try {
      setIsLoadingGate(true);
      const res = await authService.getSecurityGateSettings();
      const data = res?.data || res;
      if (data) {
        setGateSettings({
          pin: data.pin || '12345678',
          password: data.password || 'admin12',
        });
      }
    } catch (err) {
      console.error('Failed to load gate settings:', err);
    } finally {
      setIsLoadingGate(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.newPassword) {
      toast.error('Please complete all password fields.');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match.');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters.');
      return;
    }

    try {
      setIsChangingPassword(true);
      await authService.changePassword({
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });
      toast.success('Password updated successfully.');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleUpdateGateSettings = async (e) => {
    e.preventDefault();
    if (!gateSettings.pin.trim() && !gateSettings.password.trim()) {
      toast.error('PIN and Master Password cannot both be empty.');
      return;
    }

    try {
      setIsUpdatingGate(true);
      await authService.updateSecurityGateSettings({
        pin: gateSettings.pin.trim(),
        password: gateSettings.password.trim(),
      });
      toast.success('Master Security Gate credentials updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to update Master Security Gate credentials.');
    } finally {
      setIsUpdatingGate(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">System Settings</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Configure security credentials, administrative gatekeeper keys, and interface preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Administrator Master Security Gate (Requested: Admin can edit PIN & Password used to access registration form) */}
        {user?.role === 'admin' && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-darkblue/20 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-darkblue text-white shadow-sm">
                  <Shield className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-text-dark">
                    Administrator Security Gate Credentials
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Configure the Master PIN and Master Password required on the public registration portal to create new administrators.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateGateSettings} className="space-y-4 max-w-lg mt-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    Master PIN (Default: 12345678)
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={gateSettings.pin}
                      onChange={(e) => setGateSettings({ ...gateSettings, pin: e.target.value })}
                      placeholder="e.g. 12345678"
                      className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-border focus:border-darkblue focus:ring-1 focus:ring-darkblue outline-none font-mono"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    Master Password (Default: admin12)
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
                    <input
                      type="text"
                      value={gateSettings.password}
                      onChange={(e) => setGateSettings({ ...gateSettings, password: e.target.value })}
                      placeholder="e.g. admin12"
                      className="w-full text-sm pl-10 pr-4 py-2.5 rounded-xl border border-border focus:border-darkblue focus:ring-1 focus:ring-darkblue outline-none font-mono"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <Button
                  type="submit"
                  loading={isUpdatingGate}
                  className="bg-darkblue hover:bg-darkblue-royal text-white text-xs py-2 px-4 rounded-xl"
                >
                  Save Master Security Keys
                </Button>
              </div>
            </form>
          </div>
        )}

        {/* Security / Password */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
            <Lock className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-text-dark">Change Personal Password</h2>
          </div>

          <form onSubmit={handlePasswordChange} className="space-y-4 max-w-md">
            <Input
              label="Current Password"
              type="password"
              value={passwordData.oldPassword}
              onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
              required
            />
            <Input
              label="New Password"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              required
            />
            <Button type="submit" variant="primary" loading={isChangingPassword}>
              Update Password
            </Button>
          </form>
        </div>

        {/* Appearance & Theme */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
            <Sun className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-text-dark">Appearance & Theme</h2>
          </div>

          <div className="flex items-center justify-between max-w-md">
            <div>
              <p className="text-sm font-semibold text-text-dark">Dark Mode Theme</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Switch between high-contrast light mode and calm dark mode.
              </p>
            </div>
            <button
              onClick={toggleTheme}
              className={`p-2.5 rounded-xl border transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 text-yellow-400 border-slate-700'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Accessibility & Preferences */}
        <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border">
            <Eye className="w-5 h-5 text-primary" />
            <h2 className="text-base font-bold text-text-dark">Accessibility & Preferences</h2>
          </div>

          <div className="space-y-4 max-w-md">
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-text-dark">Reduced Motion</span>
                <p className="text-xs text-text-secondary">Minimize interface animations and transitions</p>
              </div>
              <input
                type="checkbox"
                checked={reducedMotion}
                onChange={(e) => setReducedMotion(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
              />
            </label>

            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <span className="text-sm font-semibold text-text-dark">Email Alerts</span>
                <p className="text-xs text-text-secondary">Receive academic updates and deadline digests</p>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
