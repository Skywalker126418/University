import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserCheck, Search, Plus, X, Pencil, Trash2, Eye, EyeOff,
  Mail, Phone, Building2, BookOpen, Award, ChevronDown, AlertCircle,
  Camera, Download, ZoomIn,
} from 'lucide-react';
import { lecturerService } from '../../services/lecturerService';
import departmentService from '../../services/departmentService';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EMPTY_FORM = {
  first_name: '', last_name: '', email: '', password: '',
  phone: '', department_id: '', specialization: '', qualification: '',
  gender: '', designation: '',
};

export default function LecturersPage() {
  const toast = useToast();
  const [lecturers, setLecturers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, object = edit
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Photo management state
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState(false);
  const [fullPhotoUrl, setFullPhotoUrl] = useState(null);

  const fetchLecturers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await lecturerService.getAll({ search });
      const rows = res?.data || res || [];
      setLecturers(Array.isArray(rows) ? rows : rows.lecturers || []);
    } catch {
      toast.error('Failed to load lecturers.');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchLecturers, 300);
    return () => clearTimeout(t);
  }, [fetchLecturers]);

  useEffect(() => {
    departmentService.getAll({ limit: 200 })
      .then(res => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setDepartments(list);
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormErrors({});
    setShowPassword(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setShowModal(true);
  };

  const openEdit = (lec) => {
    setEditing(lec);
    setForm({
      first_name: lec.first_name || '',
      last_name: lec.last_name || '',
      email: lec.email || '',
      password: '',
      phone: lec.phone || '',
      department_id: lec.department_id ? String(lec.department_id) : '',
      specialization: lec.specialization || '',
      qualification: lec.qualification || '',
      gender: lec.gender || '',
      designation: lec.designation || '',
    });
    setFormErrors({});
    setShowPassword(false);
    setPhotoFile(null);
    const existingAvatar = lec.avatar
      ? (lec.avatar.startsWith('http') ? lec.avatar : `http://localhost:5000${lec.avatar}`)
      : null;
    setPhotoPreview(existingAvatar);
    setShowModal(true);
  };

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleRemovePhoto = async () => {
    if (!editing?.user_id) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    if (!window.confirm('Are you sure you want to remove this lecturer\'s profile photo?')) return;
    try {
      setIsPhotoLoading(true);
      await authService.deleteUserPhoto(editing.user_id);
      setPhotoFile(null);
      setPhotoPreview(null);
      toast.success('Lecturer photo removed.');
      fetchLecturers();
    } catch {
      toast.error('Failed to remove photo.');
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleDownloadPhoto = () => {
    if (!photoPreview) return;
    const link = document.createElement('a');
    link.href = photoPreview;
    link.download = `lecturer_${editing?.staff_id || 'photo'}.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading photo...');
  };

  const validate = () => {
    const errs = {};
    if (!form.first_name.trim()) errs.first_name = 'First name is required.';
    if (!form.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'Invalid email format.';
    if (!editing && !form.password.trim()) errs.password = 'Password is required for new lecturer.';
    if (form.password && form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (!form.department_id) errs.department_id = 'Department is required.';
    return errs;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setSubmitting(true);
    try {
      const payload = { ...form };
      if (editing && !payload.password) delete payload.password;

      let targetUserId = editing?.user_id;

      if (editing) {
        await lecturerService.update(editing.id, payload);
        toast.success('Lecturer updated successfully.');
      } else {
        const createRes = await lecturerService.create(payload);
        const createdData = createRes?.data || createRes;
        targetUserId = createdData?.user_id;
        toast.success('Lecturer account created successfully.');
      }

      // If a new photo file was picked, upload it now
      if (photoFile && targetUserId) {
        try {
          await authService.uploadUserPhoto(targetUserId, photoFile);
        } catch {
          toast.error('Lecturer saved, but photo upload encountered an issue.');
        }
      }

      setShowModal(false);
      fetchLecturers();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await lecturerService.delete(id);
      toast.success('Lecturer deactivated.');
      setConfirmDelete(null);
      fetchLecturers();
    } catch {
      toast.error('Failed to deactivate lecturer.');
    }
  };

  const set = (field, val) => {
    setForm(p => ({ ...p, [field]: val }));
    if (formErrors[field]) setFormErrors(p => ({ ...p, [field]: '' }));
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-primary" />
            Lecturers
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage academic teaching staff, qualifications, profile portraits, and department assignments.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl font-medium text-sm hover:bg-primary-hover transition-colors shadow-sm shadow-primary/20"
        >
          <Plus className="w-4 h-4" />
          Add Lecturer
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm">
        <div className="relative">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, department, or staff ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12"><LoadingSpinner message="Loading lecturers..." /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Staff ID</th>
                  <th className="py-3.5 px-4">Faculty Member</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Specialization</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {lecturers.length > 0 ? lecturers.map(l => {
                  const avatarSrc = l.avatar
                    ? (l.avatar.startsWith('http') ? l.avatar : `http://localhost:5000${l.avatar}`)
                    : null;
                  return (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-bold text-primary font-mono text-xs">
                        {l.staff_id || `LEC-${l.id}`}
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            onClick={() => avatarSrc && setFullPhotoUrl(avatarSrc)}
                            className={`w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border ${
                              avatarSrc ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
                            }`}
                            title={avatarSrc ? 'Click to view full photo' : ''}
                          >
                            {avatarSrc ? (
                              <img
                                src={avatarSrc}
                                alt={`${l.first_name} ${l.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-primary text-xs font-bold">
                                {l.first_name?.[0]}{l.last_name?.[0]}
                              </span>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-text-dark">{l.first_name} {l.last_name}</p>
                            <p className="text-xs text-text-secondary">{l.qualification || 'Academic Staff'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary text-xs">{l.email}</td>
                      <td className="py-3.5 px-4 text-text-secondary text-xs">
                        {l.department_name || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary text-xs">
                        {l.specialization || <span className="text-slate-300">—</span>}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="success">Active</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEdit(l)}
                            className="p-2 rounded-lg text-text-secondary hover:bg-primary/10 hover:text-primary transition-colors"
                            title="Edit Lecturer & Photo"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDelete(l)}
                            className="p-2 rounded-lg text-text-secondary hover:bg-red-50 hover:text-red-600 transition-colors"
                            title="Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                }) : (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-text-secondary text-sm">
                      <UserCheck className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                      {search ? 'No lecturers match your search.' : 'No lecturers yet. Click "Add Lecturer" to get started.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={e => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-white z-10 rounded-t-2xl">
                <div>
                  <h2 className="text-lg font-bold text-text-dark">
                    {editing ? 'Edit Lecturer & Photo' : 'Add New Lecturer'}
                  </h2>
                  <p className="text-xs text-text-secondary mt-0.5">
                    {editing ? 'Update teaching staff information and portrait photo.' : 'Fill in the details to create a new lecturer account.'}
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-slate-100 text-text-secondary transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Profile Photo Section */}
                <div className="bg-slate-50 p-4 rounded-xl border border-border flex items-center gap-4">
                  <div className="relative w-16 h-16 rounded-full overflow-hidden bg-primary/10 border-2 border-border flex-shrink-0 flex items-center justify-center">
                    {photoPreview ? (
                      <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-primary font-bold text-lg">
                        {form.first_name?.[0] || 'L'}{form.last_name?.[0] || 'C'}
                      </span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-text-dark">Profile Portrait Image</p>
                    <p className="text-[11px] text-text-secondary mt-0.5">JPG, PNG, WebP up to 5MB</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <label className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-border rounded-lg text-xs font-medium text-text-dark hover:bg-slate-100 cursor-pointer transition-colors shadow-sm">
                        <Camera className="w-3.5 h-3.5 text-primary" /> {photoPreview ? 'Change Photo' : 'Upload Photo'}
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoSelect}
                          className="hidden"
                        />
                      </label>
                      {photoPreview && (
                        <>
                          <button
                            type="button"
                            onClick={handleDownloadPhoto}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-border rounded-lg text-xs font-medium text-text-secondary hover:text-primary transition-colors"
                            title="Download current photo"
                          >
                            <Download className="w-3.5 h-3.5" /> Download
                          </button>
                          <button
                            type="button"
                            onClick={handleRemovePhoto}
                            disabled={isPhotoLoading}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors"
                            title="Remove photo"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Remove
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Name row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="First Name" required error={formErrors.first_name}>
                    <input
                      type="text" value={form.first_name} onChange={e => set('first_name', e.target.value)}
                      placeholder="e.g. John"
                      className={inputCls(formErrors.first_name)}
                    />
                  </FormField>
                  <FormField label="Last Name" required error={formErrors.last_name}>
                    <input
                      type="text" value={form.last_name} onChange={e => set('last_name', e.target.value)}
                      placeholder="e.g. Doe"
                      className={inputCls(formErrors.last_name)}
                    />
                  </FormField>
                </div>

                {/* Email & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Email Address" required error={formErrors.email}>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                      <input
                        type="email" value={form.email} onChange={e => set('email', e.target.value)}
                        placeholder="lecturer@university.edu"
                        className={`${inputCls(formErrors.email)} pl-9`}
                      />
                    </div>
                  </FormField>
                  <FormField label="Phone Number" error={formErrors.phone}>
                    <div className="relative">
                      <Phone className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                      <input
                        type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
                        placeholder="+1 234 567 8900"
                        className={`${inputCls(formErrors.phone)} pl-9`}
                      />
                    </div>
                  </FormField>
                </div>

                {/* Password */}
                <FormField
                  label={editing ? 'New Password (leave blank to keep current)' : 'Password'}
                  required={!editing}
                  error={formErrors.password}
                >
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={e => set('password', e.target.value)}
                      placeholder={editing ? 'Leave blank to keep current' : 'Min. 6 characters'}
                      className={`${inputCls(formErrors.password)} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(p => !p)}
                      className="absolute right-3 top-2.5 text-text-secondary hover:text-text-dark"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </FormField>

                {/* Department & Gender */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Department" required error={formErrors.department_id}>
                    <div className="relative">
                      <Building2 className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                      <select
                        value={form.department_id}
                        onChange={e => set('department_id', e.target.value)}
                        className={`${inputCls(formErrors.department_id)} pl-9 appearance-none`}
                      >
                        <option value="">Select department...</option>
                        {departments.map(d => (
                          <option key={d.id} value={d.id}>{d.department_name}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-text-secondary pointer-events-none" />
                    </div>
                  </FormField>
                  <FormField label="Gender" error={formErrors.gender}>
                    <select
                      value={form.gender}
                      onChange={e => set('gender', e.target.value)}
                      className={`${inputCls()} appearance-none`}
                    >
                      <option value="">Select gender...</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                      <option value="prefer_not_to_say">Prefer not to say</option>
                    </select>
                  </FormField>
                </div>

                {/* Designation & Qualification */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <FormField label="Designation" error={formErrors.designation}>
                    <input
                      type="text" value={form.designation} onChange={e => set('designation', e.target.value)}
                      placeholder="e.g. Senior Lecturer"
                      className={inputCls()}
                    />
                  </FormField>
                  <FormField label="Qualification" error={formErrors.qualification}>
                    <div className="relative">
                      <Award className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                      <input
                        type="text" value={form.qualification} onChange={e => set('qualification', e.target.value)}
                        placeholder="e.g. PhD Computer Science"
                        className={`${inputCls()} pl-9`}
                      />
                    </div>
                  </FormField>
                </div>

                {/* Specialization */}
                <FormField label="Specialization" error={formErrors.specialization}>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-2.5 w-4 h-4 text-text-secondary" />
                    <input
                      type="text" value={form.specialization} onChange={e => set('specialization', e.target.value)}
                      placeholder="e.g. Machine Learning, Data Structures"
                      className={`${inputCls()} pl-9`}
                    />
                  </div>
                </FormField>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 bg-primary text-white text-sm font-medium rounded-lg hover:bg-primary-hover transition-colors disabled:opacity-60 flex items-center gap-2"
                  >
                    {submitting && <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                    {editing ? 'Save Changes' : 'Create Lecturer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Full Photo Modal */}
      {fullPhotoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setFullPhotoUrl(null)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-sm text-text-dark">Lecturer Profile Photo</h3>
              <button
                onClick={() => setFullPhotoUrl(null)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-dark hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={fullPhotoUrl}
                alt="Lecturer Full Profile"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
            <div className="p-4 flex items-center justify-between bg-white border-t border-border">
              <a
                href={fullPhotoUrl}
                download="lecturer_photo.jpg"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                <Download className="w-4 h-4" /> Download Photo
              </a>
              <button
                onClick={() => setFullPhotoUrl(null)}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="font-bold text-text-dark">Deactivate Lecturer</h3>
                  <p className="text-sm text-text-secondary mt-1">
                    Are you sure you want to deactivate{' '}
                    <strong>{confirmDelete.first_name} {confirmDelete.last_name}</strong>?
                    Their account will be disabled but data preserved.
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-5 justify-end">
                <button
                  onClick={() => setConfirmDelete(null)}
                  className="px-4 py-2 text-sm font-medium text-text-secondary hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(confirmDelete.id)}
                  className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                >
                  Deactivate
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Helpers
const inputCls = (err) =>
  `w-full border ${err ? 'border-red-400 bg-red-50' : 'border-border'} rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary placeholder:text-slate-400 bg-white`;

function FormField({ label, required, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && (
        <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
          <AlertCircle className="w-3 h-3 flex-shrink-0" />{error}
        </p>
      )}
    </div>
  );
}
