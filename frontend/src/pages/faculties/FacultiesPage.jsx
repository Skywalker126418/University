import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Building, Edit2, Trash2, X, BookOpen, Users, GraduationCap, School } from 'lucide-react';
import { facultyService } from '../../services/facultyService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const FacultyModal = ({ isOpen, onClose, faculty, onSave }) => {
  const [form, setForm] = useState({ faculty_name: '', faculty_code: '', description: '', dean: '' });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (faculty) {
      setForm({
        faculty_name: faculty.faculty_name || '',
        faculty_code: faculty.faculty_code || '',
        description: faculty.description || '',
        dean: faculty.dean || ''
      });
    } else {
      setForm({ faculty_name: '', faculty_code: '', description: '', dean: '' });
    }
  }, [faculty, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.faculty_name.trim()) {
      toast.error('Faculty name is required.');
      return;
    }
    try {
      setSaving(true);
      if (faculty) {
        await facultyService.update(faculty.id, form);
        toast.success('Faculty updated successfully.');
      } else {
        await facultyService.create(form);
        toast.success('Faculty created successfully.');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save faculty.');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-slate-50">
            <h2 className="text-base font-bold text-text-dark">{faculty ? 'Edit Academic Faculty' : 'Add New Faculty'}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-dark hover:bg-slate-200 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input
              label="Faculty Name *"
              name="faculty_name"
              placeholder="e.g. Faculty of Science & Technology"
              value={form.faculty_name}
              onChange={(e) => setForm((p) => ({ ...p, faculty_name: e.target.value }))}
              required
            />
            <Input
              label="Faculty Code"
              name="faculty_code"
              placeholder="e.g. FST"
              value={form.faculty_code}
              onChange={(e) => setForm((p) => ({ ...p, faculty_code: e.target.value }))}
            />
            <Input
              label="Dean of Faculty"
              name="dean"
              placeholder="e.g. Prof. Robert Davis, Ph.D."
              value={form.dean}
              onChange={(e) => setForm((p) => ({ ...p, dean: e.target.value }))}
            />
            <div>
              <label className="block text-xs font-medium text-text-dark mb-1">Description & Objectives</label>
              <textarea
                name="description"
                rows={3}
                placeholder="Institutional scope, research focus, and academic mission..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {faculty ? 'Save Changes' : 'Create Faculty'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const FacultiesPage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    facultyService
      .getAll({ search })
      .then((res) => {
        const list = res?.data || res || [];
        setFaculties(Array.isArray(list) ? list : list.faculties || []);
      })
      .catch((err) => toast.error(err.message || 'Failed to load faculties.'))
      .finally(() => setLoading(false));
  }, [search]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    try {
      await facultyService.delete(deleteTarget.id);
      toast.success('Faculty deactivated successfully.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to remove faculty.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">University Faculties</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Organize high-level academic colleges. Each faculty oversees departments, academic degrees, and faculty staff.
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add Faculty
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search faculties by name, code, or dean..."
          className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
        />
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-border shadow-sm">
          <LoadingSpinner message="Fetching university faculties..." />
        </div>
      ) : faculties.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
          <EmptyState
            icon={School}
            title="No faculties created yet"
            description="Create your first academic faculty. Once created, you can attach multiple departments under each faculty."
            action={
              isAdmin ? (
                <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
                  Create First Faculty
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {faculties.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-text-dark leading-tight">{f.faculty_name}</h3>
                      {f.faculty_code && (
                        <span className="text-xs text-primary font-semibold tracking-wide">{f.faculty_code}</span>
                      )}
                    </div>
                  </div>
                  <Badge variant={f.is_active ? 'success' : 'default'}>
                    {f.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                {f.dean && (
                  <p className="text-xs text-text-secondary mb-1">
                    Dean: <span className="font-medium text-text-dark">{f.dean}</span>
                  </p>
                )}

                <p className="text-xs text-text-secondary line-clamp-3 mb-4">
                  {f.description || 'Faculty dedicated to university education, accreditation, and scientific research.'}
                </p>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-text-secondary font-medium">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-primary" />
                    {f.department_count || 0} Departments
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-emerald-600" />
                    {f.programme_count || 0} Programmes
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditing(f); setModalOpen(true); }}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary-light transition-colors"
                      title="Edit Faculty"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(f)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Deactivate Faculty"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <FacultyModal isOpen={modalOpen} faculty={editing} onClose={() => setModalOpen(false)} onSave={load} />
      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Faculty?"
        message={`Are you sure you want to deactivate "${deleteTarget?.faculty_name}"?`}
        confirmText="Deactivate"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default FacultiesPage;
