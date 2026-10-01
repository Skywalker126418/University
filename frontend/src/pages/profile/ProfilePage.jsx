import React, { useState, useEffect } from 'react';
import {
  User,
  Mail,
  Phone,
  Camera,
  Lock,
  KeyRound,
  Shield,
  Save,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  Download,
  Trash2,
  ZoomIn,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';

const ProfilePage = () => {
  const { user, setUser } = useAuth();
  const toast = useToast();

  const [formData, setFormData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  // Password change state
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone: user.phone || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      const res = await authService.updateProfile(formData);
      const updated = res?.data || res;
      if (setUser) setUser(updated);
      sessionStorage.setItem('ums_user', JSON.stringify(updated));
      toast.success('Profile details updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      const res = await authService.uploadProfilePhoto(file);
      const updatedUser = res?.data || res;
      if (setUser) setUser(updatedUser);
      sessionStorage.setItem('ums_user', JSON.stringify(updatedUser));
      toast.success('Profile photo uploaded and updated successfully.');
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove your profile photo?')) return;
    try {
      setIsUploadingPhoto(true);
      const res = await authService.deleteProfilePhoto();
      const updatedUser = res?.data || res;
      if (setUser) setUser(updatedUser);
      sessionStorage.setItem('ums_user', JSON.stringify(updatedUser));
      toast.success('Profile photo removed.');
    } catch (err) {
      toast.error(err.message || 'Failed to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDownloadPhoto = () => {
    if (!user?.avatar) return;
    const fullUrl = user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = `${user.first_name || 'profile'}_photo.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading photo...');
  };

  const handlePasswordSubmit = async (e) => {
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
      toast.success('Your password has been successfully updated.');
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Current password incorrect or update failed.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const avatarSrc = user?.avatar
    ? (user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`)
    : null;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-text-dark">User Profile & Account Security</h1>
        <p className="text-xs text-text-secondary mt-0.5">
          Manage your personal university credentials, uploaded portrait, and login password.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card with Photo Upload */}
        <div className="bg-white p-6 rounded-2xl border border-border shadow-sm text-center space-y-4">
          <div className="relative w-28 h-28 mx-auto group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-darkblue text-white flex items-center justify-center text-3xl font-bold border-4 border-slate-100 shadow-md">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`${user?.first_name} ${user?.last_name}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </span>
              )}
            </div>

            {/* Photo upload overlay button */}
            <label
              className="absolute bottom-0 right-0 p-2 bg-darkblue hover:bg-darkblue-royal text-white rounded-full cursor-pointer shadow-lg border-2 border-white transition-all transform hover:scale-105"
              title="Upload / Change Photo"
            >
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto}
                className="hidden"
              />
            </label>
          </div>

          {/* Quick Photo Actions */}
          <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
            <label className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-primary bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-border cursor-pointer">
              <Camera className="w-3.5 h-3.5" /> Change
              <input
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                disabled={isUploadingPhoto}
                className="hidden"
              />
            </label>

            {avatarSrc && (
              <>
                <button
                  onClick={() => setShowFullPhoto(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-primary bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-border"
                  title="View full-size photo"
                >
                  <ZoomIn className="w-3.5 h-3.5" /> View
                </button>

                <button
                  onClick={handleDownloadPhoto}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-primary bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-border"
                  title="Download photo"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>

                <button
                  onClick={handleDeletePhoto}
                  disabled={isUploadingPhoto}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                  title="Delete photo"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove
                </button>
              </>
            )}
          </div>

          <div>
            <h2 className="text-lg font-bold text-text-dark">
              {user?.first_name} {user?.last_name}
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">{user?.email}</p>
            <span className="inline-block mt-2 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-darkblue text-white shadow-sm">
              {user?.role}
            </span>
          </div>

          <div className="pt-4 border-t border-border text-left space-y-3 text-xs text-text-secondary">
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase">Account Status</p>
              <p className="font-medium text-emerald-600 mt-0.5 flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5" /> Verified & Active
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-text-secondary uppercase">Institutional ID</p>
              <p className="font-mono font-semibold text-text-dark mt-0.5">
                {user?.profile_id || user?.student_id || user?.staff_id || `UMS-2026-${user?.id || 1}`}
              </p>
            </div>
          </div>
        </div>

        {/* Profile Update & Password Change Forms */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
            <form onSubmit={handleSave} className="space-y-5">
              <h2 className="text-base font-bold text-text-dark border-b border-border pb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-darkblue" />
                Personal Information
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleChange}
                  required
                />
                <Input
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Email Address"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled
                  helper="Contact institutional admin to modify primary registered email."
                />
                <Input
                  label="Phone Number"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 234 567 8900"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <Button type="submit" variant="primary" loading={isSaving}>
                  Save Profile Details
                </Button>
              </div>
            </form>
          </div>

          {/* Change Password Form */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
            <form onSubmit={handlePasswordSubmit} className="space-y-5">
              <h2 className="text-base font-bold text-text-dark border-b border-border pb-3 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-darkblue" />
                Update Authentication Password
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    Current Portal Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
                    <input
                      type={showOldPass ? 'text' : 'password'}
                      value={passwordData.oldPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                      placeholder="Enter current password"
                      className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-border focus:border-darkblue focus:ring-1 focus:ring-darkblue outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPass(!showOldPass)}
                      className="absolute right-3.5 top-3 text-text-secondary hover:text-text-dark"
                    >
                      {showOldPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    New Password <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
                    <input
                      type={showNewPass ? 'text' : 'password'}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      placeholder="Min. 6 characters"
                      className="w-full text-sm pl-10 pr-10 py-2.5 rounded-xl border border-border focus:border-darkblue focus:ring-1 focus:ring-darkblue outline-none"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3.5 top-3 text-text-secondary hover:text-text-dark"
                    >
                      {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-text-dark mb-1">
                    Confirm New Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    placeholder="Repeat new password"
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-border focus:border-darkblue focus:ring-1 focus:ring-darkblue outline-none"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex justify-end">
                <Button type="submit" variant="primary" loading={isChangingPassword}>
                  Update Password
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Full Photo Modal */}
      {showFullPhoto && avatarSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowFullPhoto(false)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-sm text-text-dark">Your Profile Photo</h3>
              <button
                onClick={() => setShowFullPhoto(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-dark hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={avatarSrc}
                alt="Profile Full View"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
            <div className="p-4 flex items-center justify-between bg-white border-t border-border">
              <button
                onClick={handleDownloadPhoto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                <Download className="w-4 h-4" /> Download Photo
              </button>
              <button
                onClick={() => setShowFullPhoto(false)}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
