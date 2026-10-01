import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, Building2, Edit2, Trash2, X, BookOpen, Users, Filter, GraduationCap } from 'lucide-react';
import { departmentService } from '../../services/departmentService';
import { facultyService } from '../../services/facultyService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const DeptModal = ({ isOpen, onClose, dept, faculties, onSave }) => {
  const [form, setForm] = useState({
    faculty_id: '',
    department_name: '',
    department_code: '',
    description: '',
    head_of_department: '',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (dept) {
      setForm({
        faculty_id: dept.faculty_id || '',
        department_name: dept.department_name || dept.name || '',
        department_code: dept.department_code || dept.code || '',
        description: dept.description || '',
        head_of_department: dept.head_of_department || '',
      });
    } else {
      setForm({
        faculty_id: faculties[0]?.id || '',
        department_name: '',
        department_code: '',
        description: '',
        head_of_department: '',
      });
    }
  }, [dept, isOpen, faculties]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.faculty_id) {
      toast.error('Please assign this department to a faculty.');
      return;
    }
    if (!form.department_name.trim()) {
      toast.error('Department name is required.');
      return;
    }

    try {
      setSaving(true);
      if (dept) {
        await departmentService.update(dept.id, form);
        toast.success('Department updated successfully.');
      } else {
        await departmentService.create(form);
        toast.success('Department created under selected faculty.');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save department.');
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
            <h2 className="text-base font-bold text-text-dark">{dept ? 'Edit Department' : 'Create Department'}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-dark hover:bg-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <Select
              label="Parent Faculty *"
              name="faculty_id"
              value={form.faculty_id}
              onChange={(e) => setForm((p) => ({ ...p, faculty_id: e.target.value }))}
              required
              options={[
                { value: '', label: 'Select University Faculty...' },
                ...faculties.map((f) => ({ value: f.id, label: f.faculty_name })),
              ]}
            />
            <Input
              label="Department Name *"
              name="department_name"
              placeholder="e.g. Computer Science & Software Engineering"
              value={form.department_name}
              onChange={(e) => setForm((p) => ({ ...p, department_name: e.target.value }))}
              required
            />
            <Input
              label="Department Code"
              name="department_code"
              placeholder="e.g. CSSE"
              value={form.department_code}
              onChange={(e) => setForm((p) => ({ ...p, department_code: e.target.value }))}
            />
            <Input
              label="Head of Department (HOD)"
              name="head_of_department"
              placeholder="e.g. Dr. Sarah Jenkins"
              value={form.head_of_department}
              onChange={(e) => setForm((p) => ({ ...p, head_of_department: e.target.value }))}
            />
            <div>
              <label className="block text-xs font-medium text-text-dark mb-1">Description</label>
              <textarea
                rows={3}
                placeholder="Department curriculum scope, teaching focus, labs..."
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
                {dept ? 'Save Changes' : 'Create Department'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const DepartmentsPage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [departments, setDepartments] = useState([]);
  const [faculties, setFaculties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterFaculty, setFilterFaculty] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  useEffect(() => {
    facultyService
      .getAll({ limit: 100 })
      .then((res) => {
        const list = res?.data || res || [];
        setFaculties(Array.isArray(list) ? list : list.faculties || []);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(() => {
    setLoading(true);
    departmentService
      .getAll({ search, faculty_id: filterFaculty || undefined })
      .then((res) => {
        const list = res?.data || res || [];
        setDepartments(Array.isArray(list) ? list : list.departments || []);
      })
      .catch((err) => toast.error(err.message || 'Failed to load departments.'))
      .finally(() => setLoading(false));
  }, [search, filterFaculty]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    try {
      await departmentService.delete(deleteTarget.id);
      toast.success('Department deactivated successfully.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to remove department.');
    } finally {
      setDeleteTarget(null);
    }
  };

  // Group departments by faculty
  const groupedByFaculty = departments.reduce((acc, d) => {
    const key = d.faculty_name || 'General / Unassigned';
    if (!acc[key]) acc[key] = [];
    acc[key].push(d);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Academic Departments</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Departments categorized under university faculties. Each department hosts degree programmes and teaching staff.
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => {
              if (faculties.length === 0) {
                toast.error('Please create at least one faculty first before creating departments.');
              }
              setEditing(null);
              setModalOpen(true);
            }}
          >
            Add Department
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search departments by name, code, or HOD..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
          />
        </div>
        <select
          value={filterFaculty}
          onChange={(e) => setFilterFaculty(e.target.value)}
          className="px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
        >
          <option value="">All Faculties ({faculties.length})</option>
          {faculties.map((f) => (
            <option key={f.id} value={f.id}>
              {f.faculty_name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-border shadow-sm">
          <LoadingSpinner message="Loading departments..." />
        </div>
      ) : departments.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
          <EmptyState
            icon={Building2}
            title="No departments found"
            description={
              faculties.length === 0
                ? 'Create a faculty first, then you can add departments under it.'
                : 'No departments match your filter. Click Add Department to create one.'
            }
            action={
              isAdmin ? (
                <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
                  Create Department
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedByFaculty).map(([facultyName, depts]) => (
            <div key={facultyName} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <div className="w-1.5 h-5 rounded-full bg-primary" />
                <h2 className="text-sm font-bold text-text-dark uppercase tracking-wider">{facultyName}</h2>
                <span className="text-xs text-text-secondary bg-slate-100 font-semibold px-2 py-0.5 rounded-full">
                  {depts.length} {depts.length === 1 ? 'Dept' : 'Depts'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {depts.map((d, i) => (
                  <motion.div
                    key={d.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary-light rounded-lg">
                          {d.department_code || d.code || 'DEPT'}
                        </span>
                        <Badge variant={d.is_active ? 'success' : 'default'}>
                          {d.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>

                      <h3 className="font-bold text-base text-text-dark mt-1">
                        {d.department_name || d.name}
                      </h3>

                      {d.head_of_department && (
                        <p className="text-xs text-text-secondary mt-1">
                          HOD: <span className="font-medium text-text-dark">{d.head_of_department}</span>
                        </p>
                      )}

                      <p className="text-xs text-text-secondary mt-2 line-clamp-2">
                        {d.description || 'Department committed to academic instruction and research.'}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
                      <div className="flex items-center gap-3 text-xs text-text-secondary">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5 text-primary" />
                          {d.programme_count || 0} Progs
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-emerald-600" />
                          {d.lecturer_count || 0} Staff
                        </span>
                      </div>
                      {isAdmin && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => { setEditing(d); setModalOpen(true); }}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary-light transition-colors"
                            title="Edit Department"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(d)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Deactivate Department"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <DeptModal
        isOpen={modalOpen}
        dept={editing}
        faculties={faculties}
        onClose={() => setModalOpen(false)}
        onSave={load}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Department?"
        message={`Are you sure you want to deactivate "${deleteTarget?.department_name || deleteTarget?.name}"?`}
        confirmText="Deactivate"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default DepartmentsPage;
