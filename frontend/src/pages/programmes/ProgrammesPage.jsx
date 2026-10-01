import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, BookOpen, Edit2, Trash2, X, Clock, Award, Building2 } from 'lucide-react';
import { programmeService } from '../../services/programmeService';
import { departmentService } from '../../services/departmentService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const ProgModal = ({ isOpen, onClose, programme, departments, onSave }) => {
  const [form, setForm] = useState({
    programme_name: '',
    programme_code: '',
    department_id: '',
    duration_years: 4,
    degree_type: 'Bachelor',
    description: '',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (programme) {
      setForm({
        programme_name: programme.programme_name || programme.name || '',
        programme_code: programme.programme_code || programme.code || '',
        department_id: programme.department_id || '',
        duration_years: programme.duration_years || 4,
        degree_type: programme.degree_type || 'Bachelor',
        description: programme.description || '',
      });
    } else {
      setForm({
        programme_name: '',
        programme_code: '',
        department_id: departments[0]?.id || '',
        duration_years: 4,
        degree_type: 'Bachelor',
        description: '',
      });
    }
  }, [programme, isOpen, departments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.programme_name.trim()) {
      toast.error('Programme name is required.');
      return;
    }
    if (!form.department_id) {
      toast.error('Please assign this programme to a department.');
      return;
    }

    try {
      setSaving(true);
      if (programme) {
        await programmeService.update(programme.id, form);
        toast.success('Programme updated successfully.');
      } else {
        await programmeService.create(form);
        toast.success('Degree programme created successfully.');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save programme.');
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
            <h2 className="text-base font-bold text-text-dark">{programme ? 'Edit Degree Programme' : 'Add Degree Programme'}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-dark hover:bg-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Input
              label="Programme Name *"
              name="programme_name"
              placeholder="e.g. Bachelor of Science in Computer Science"
              value={form.programme_name}
              onChange={(e) => setForm((p) => ({ ...p, programme_name: e.target.value }))}
              required
            />
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Programme Code"
                name="programme_code"
                placeholder="e.g. BSCS"
                value={form.programme_code}
                onChange={(e) => setForm((p) => ({ ...p, programme_code: e.target.value }))}
              />
              <Select
                label="Degree Level"
                name="degree_type"
                value={form.degree_type}
                onChange={(e) => setForm((p) => ({ ...p, degree_type: e.target.value }))}
                options={[
                  { value: 'Bachelor', label: "Bachelor's Degree" },
                  { value: 'Master', label: "Master's Degree" },
                  { value: 'Doctorate', label: 'Doctorate (Ph.D.)' },
                  { value: 'Diploma', label: 'Diploma / Certificate' },
                ]}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Host Department *"
                name="department_id"
                value={form.department_id}
                onChange={(e) => setForm((p) => ({ ...p, department_id: e.target.value }))}
                required
                options={[
                  { value: '', label: 'Select Department...' },
                  ...departments.map((d) => ({
                    value: d.id,
                    label: d.department_name || d.name,
                  })),
                ]}
              />
              <Input
                label="Duration (Years)"
                name="duration_years"
                type="number"
                min="1"
                max="7"
                value={form.duration_years}
                onChange={(e) => setForm((p) => ({ ...p, duration_years: parseInt(e.target.value) || 1 }))}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-text-dark mb-1">Description & Career Outcomes</label>
              <textarea
                rows={3}
                placeholder="Programme overview, graduate attributes, accreditation..."
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {programme ? 'Save Changes' : 'Create Programme'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const ProgrammesPage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [programmes, setProgrammes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    departmentService
      .getAll({ limit: 100 })
      .then((res) => {
        const list = res?.data || res || [];
        setDepartments(Array.isArray(list) ? list : list.departments || []);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    programmeService
      .getAll({ search, department_id: filterDept || undefined })
      .then((res) => {
        const list = res?.data || res || [];
        setProgrammes(Array.isArray(list) ? list : list.programmes || []);
      })
      .catch((err) => toast.error(err.message || 'Failed to load programmes.'))
      .finally(() => setLoading(false));
  }, [search, filterDept]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    try {
      await programmeService.delete(deleteTarget.id);
      toast.success('Programme deactivated successfully.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to remove programme.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Academic Programmes</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Degree programmes available for student enrollment. Each programme is assigned to an academic department.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              if (departments.length === 0) {
                toast.error('Please create at least one department first.');
              }
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add Programme
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search programmes by name or code..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
        >
          <option value="">All Departments ({departments.length})</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>
              {d.department_name || d.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-border shadow-sm">
          <LoadingSpinner message="Fetching academic programmes..." />
        </div>
      ) : programmes.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
          <EmptyState
            icon={Award}
            title="No degree programmes found"
            description="Create programmes so that students can select them during enrollment."
            action={
              isAdmin ? (
                <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
                  Create Programme
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {programmes.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary-light rounded-lg">
                    {p.programme_code || p.code || 'PROG'}
                  </span>
                  <Badge variant={p.is_active ? 'success' : 'default'}>
                    {p.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <h3 className="font-bold text-base text-text-dark mt-1">
                  {p.programme_name || p.name}
                </h3>

                <p className="text-xs text-text-secondary mt-1">
                  Dept: <span className="font-medium text-text-dark">{p.department_name || 'General'}</span>
                </p>

                <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                  {p.description || 'Comprehensive curriculum preparing students for industry and research.'}
                </p>
              </div>

              <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-xs text-text-secondary">
                  <span className="flex items-center gap-1 font-medium">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    {p.duration_years || 4} Years
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    {p.student_count || 0} Students
                  </span>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => { setEditing(p); setModalOpen(true); }}
                      className="p-1.5 rounded-lg text-primary hover:bg-primary-light transition-colors"
                      title="Edit Programme"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(p)}
                      className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Deactivate Programme"
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

      <ProgModal
        isOpen={modalOpen}
        programme={editing}
        departments={departments}
        onClose={() => setModalOpen(false)}
        onSave={load}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Programme?"
        message={`Are you sure you want to deactivate "${deleteTarget?.programme_name || deleteTarget?.name}"?`}
        confirmText="Deactivate"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default ProgrammesPage;
