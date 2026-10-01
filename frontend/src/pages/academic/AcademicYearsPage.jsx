import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle,
  Edit2,
  Trash2,
  Check,
  X,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Sparkles,
  School,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { academicYearService } from '../../services/academicYearService';
import { semesterService } from '../../services/semesterService';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const AcademicYearsPage = () => {
  const toast = useToast();

  const [academicYears, setAcademicYears] = useState([]);
  const [selectedYearId, setSelectedYearId] = useState(null);
  const [semesters, setSemesters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [semestersLoading, setSemestersLoading] = useState(false);

  // Modals
  const [showYearModal, setShowYearModal] = useState(false);
  const [editingYear, setEditingYear] = useState(null);
  const [yearForm, setYearForm] = useState({
    year_label: '',
    start_date: '',
    end_date: '',
    is_current: false,
  });
  const [yearSaving, setYearSaving] = useState(false);

  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState(null);
  const [semesterForm, setSemesterForm] = useState({
    academic_year_id: '',
    name: 'Semester 1',
    start_date: '',
    end_date: '',
    registration_start: '',
    registration_end: '',
    is_current: false,
  });
  const [semesterSaving, setSemesterSaving] = useState(false);

  // Deletion dialog
  const [deleteTarget, setDeleteTarget] = useState(null); // { type: 'year' | 'semester', item }

  // Fetch academic years
  const fetchAcademicYears = useCallback(async () => {
    try {
      setLoading(true);
      const res = await academicYearService.getAll();
      const list = res?.data || res || [];
      const arr = Array.isArray(list) ? list : [];
      setAcademicYears(arr);

      if (arr.length > 0) {
        setSelectedYearId((prev) => {
          if (prev && arr.some((y) => y.id === prev)) return prev;
          const current = arr.find((y) => y.is_current);
          return current ? current.id : arr[0].id;
        });
      }
    } catch (err) {
      toast.error('Failed to load academic years.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch semesters for selected year
  const fetchSemesters = useCallback(async (yearId) => {
    if (!yearId) {
      setSemesters([]);
      return;
    }
    try {
      setSemestersLoading(true);
      const res = await semesterService.getAll({ academic_year_id: yearId });
      const list = res?.data || res || [];
      setSemesters(Array.isArray(list) ? list : []);
    } catch (err) {
      toast.error('Failed to load semesters.');
    } finally {
      setSemestersLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAcademicYears();
  }, [fetchAcademicYears]);

  useEffect(() => {
    if (selectedYearId) {
      fetchSemesters(selectedYearId);
    }
  }, [selectedYearId, fetchSemesters]);

  // Open Add/Edit Year modal
  const handleOpenYearModal = (year = null) => {
    if (year) {
      setEditingYear(year);
      setYearForm({
        year_label: year.year_label || '',
        start_date: year.start_date ? year.start_date.slice(0, 10) : '',
        end_date: year.end_date ? year.end_date.slice(0, 10) : '',
        is_current: Boolean(year.is_current),
      });
    } else {
      setEditingYear(null);
      // Auto-suggest next year label based on existing
      const latest = academicYears[0]?.year_label;
      let suggested = '';
      if (latest && latest.includes('/')) {
        const parts = latest.split('/').map(Number);
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
          suggested = `${parts[0] + 1}/${parts[1] + 1}`;
        }
      }
      setYearForm({
        year_label: suggested,
        start_date: '',
        end_date: '',
        is_current: academicYears.length === 0,
      });
    }
    setShowYearModal(true);
  };

  // Submit Year form
  const handleYearSubmit = async (e) => {
    e.preventDefault();
    if (!yearForm.year_label.trim() || !yearForm.start_date || !yearForm.end_date) {
      toast.error('Please fill in all required academic year fields.');
      return;
    }
    try {
      setYearSaving(true);
      if (editingYear) {
        await academicYearService.update(editingYear.id, yearForm);
        toast.success(`Academic year ${yearForm.year_label} updated.`);
      } else {
        const res = await academicYearService.create(yearForm);
        toast.success(`Academic year ${yearForm.year_label} created.`);
        if (res?.data?.id) setSelectedYearId(res.data.id);
      }
      setShowYearModal(false);
      fetchAcademicYears();
    } catch (err) {
      toast.error(err.message || 'Failed to save academic year.');
    } finally {
      setYearSaving(false);
    }
  };

  // Set Academic Year as Current
  const handleSetCurrentYear = async (year) => {
    try {
      await academicYearService.setCurrent(year.id);
      toast.success(`${year.year_label} is now the active academic year.`);
      fetchAcademicYears();
    } catch (err) {
      toast.error(err.message || 'Failed to set active academic year.');
    }
  };

  // Open Add/Edit Semester modal
  const handleOpenSemesterModal = (sem = null) => {
    if (sem) {
      setEditingSemester(sem);
      setSemesterForm({
        academic_year_id: sem.academic_year_id,
        name: sem.name || 'Semester 1',
        start_date: sem.start_date ? sem.start_date.slice(0, 10) : '',
        end_date: sem.end_date ? sem.end_date.slice(0, 10) : '',
        registration_start: sem.registration_start ? sem.registration_start.slice(0, 10) : '',
        registration_end: sem.registration_end ? sem.registration_end.slice(0, 10) : '',
        is_current: Boolean(sem.is_current),
      });
    } else {
      setEditingSemester(null);
      // Auto-suggest next semester name
      const existingNames = semesters.map((s) => s.name);
      let nextName = 'Semester 1';
      if (!existingNames.includes('Semester 1')) nextName = 'Semester 1';
      else if (!existingNames.includes('Semester 2')) nextName = 'Semester 2';
      else if (!existingNames.includes('Summer Semester') && !existingNames.includes('Semester 3')) nextName = 'Summer Semester';
      else nextName = 'Summer Semester';

      setSemesterForm({
        academic_year_id: selectedYearId || academicYears[0]?.id || '',
        name: nextName,
        start_date: '',
        end_date: '',
        registration_start: '',
        registration_end: '',
        is_current: semesters.length === 0,
      });
    }
    setShowSemesterModal(true);
  };

  // Submit Semester form
  const handleSemesterSubmit = async (e) => {
    e.preventDefault();
    if (!semesterForm.academic_year_id || !semesterForm.name || !semesterForm.start_date || !semesterForm.end_date) {
      toast.error('Please fill in all required semester fields.');
      return;
    }
    try {
      setSemesterSaving(true);
      if (editingSemester) {
        await semesterService.update(editingSemester.id, semesterForm);
        toast.success(`${semesterForm.name} updated.`);
      } else {
        await semesterService.create(semesterForm);
        toast.success(`${semesterForm.name} added to academic schedule.`);
      }
      setShowSemesterModal(false);
      fetchSemesters(semesterForm.academic_year_id || selectedYearId);
      fetchAcademicYears(); // Update semester counts
    } catch (err) {
      toast.error(err.message || 'Failed to save semester.');
    } finally {
      setSemesterSaving(false);
    }
  };

  // Helper to auto-calculate term end date based on duration
  const handleSetTermDuration = (months) => {
    if (!semesterForm.start_date) {
      toast.info('Please select a Start Date first.');
      return;
    }
    const d = new Date(semesterForm.start_date);
    d.setMonth(d.getMonth() + months);
    d.setDate(d.getDate() - 1);
    const dateStr = d.toISOString().slice(0, 10);
    setSemesterForm((prev) => ({ ...prev, end_date: dateStr }));
  };

  // Set Semester as Current
  const handleSetCurrentSemester = async (sem) => {
    try {
      await semesterService.setCurrent(sem.id);
      toast.success(`${sem.name} is now active.`);
      fetchSemesters(selectedYearId);
    } catch (err) {
      toast.error(err.message || 'Failed to activate semester.');
    }
  };

  // Delete Action
  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      if (deleteTarget.type === 'year') {
        await academicYearService.delete(deleteTarget.item.id);
        toast.success(`Academic year ${deleteTarget.item.year_label} deleted.`);
        fetchAcademicYears();
      } else {
        await semesterService.delete(deleteTarget.item.id);
        toast.success(`${deleteTarget.item.name} deleted.`);
        fetchSemesters(selectedYearId);
        fetchAcademicYears();
      }
    } catch (err) {
      toast.error(err.message || 'Failed to delete item.');
    } finally {
      setDeleteTarget(null);
    }
  };

  const selectedYear = academicYears.find((y) => y.id === selectedYearId) || academicYears[0];
  const activeYear = academicYears.find((y) => y.is_current);
  const activeSemester = semesters.find((s) => s.is_current);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2.5">
            <Calendar className="w-7 h-7 text-primary" />
            Academic Years & Semesters
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure institutional academic years, define semester calendars, and govern term activation.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="secondary"
            icon={Plus}
            onClick={() => handleOpenSemesterModal()}
            disabled={academicYears.length === 0}
            className="text-xs"
          >
            Add Semester
          </Button>
          <Button
            variant="primary"
            icon={Plus}
            onClick={() => handleOpenYearModal()}
            className="text-xs"
          >
            New Academic Year
          </Button>
        </div>
      </div>

      {/* ACTIVE STATUS BANNER */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-8">
          <School className="w-48 h-48" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-blue-500/30 border border-blue-400/40 rounded-full text-[11px] font-bold tracking-wider uppercase text-blue-200">
                Institutional Calendar
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Active Term: {activeYear?.year_label || 'Not Set'} &bull; {activeSemester?.name || 'Semester Not Active'}
            </h2>
            <p className="text-xs text-blue-200/80 max-w-xl">
              Course registrations, timetable scheduling, and grade reports default to this operational term unless overridden.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center min-w-[110px]">
              <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">Academic Years</p>
              <p className="text-2xl font-bold mt-0.5">{academicYears.length}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/15 text-center min-w-[110px]">
              <p className="text-[11px] uppercase tracking-wider text-blue-200 font-semibold">Semesters</p>
              <p className="text-2xl font-bold mt-0.5">
                {academicYears.reduce((sum, y) => sum + (parseInt(y.semester_count) || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-2xl border border-border p-16">
          <LoadingSpinner message="Loading academic schedule..." />
        </div>
      ) : academicYears.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto">
            <Calendar className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-text-dark">No Academic Years Configured</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto mt-1">
              Create your university's first academic year to establish semester terms, course enrollment periods, and timetables.
            </p>
          </div>
          <Button variant="primary" icon={Plus} onClick={() => handleOpenYearModal()}>
            Create Academic Year
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Academic Years List */}
          <div className="lg:col-span-4 space-y-3">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                Academic Years ({academicYears.length})
              </h3>
              <button
                onClick={() => handleOpenYearModal()}
                className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Year
              </button>
            </div>

            <div className="space-y-2.5">
              {academicYears.map((year) => {
                const isSelected = year.id === selectedYearId;
                const isCurrent = Boolean(year.is_current);

                return (
                  <div
                    key={year.id}
                    onClick={() => setSelectedYearId(year.id)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all relative ${
                      isSelected
                        ? 'bg-white border-primary shadow-sm ring-2 ring-primary/20'
                        : 'bg-white/80 border-border hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-text-dark">{year.year_label}</h4>
                          {isCurrent && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              Active Year
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-1 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>
                            {year.start_date ? new Date(year.start_date).toLocaleDateString() : '—'} &rarr;{' '}
                            {year.end_date ? new Date(year.end_date).toLocaleDateString() : '—'}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenYearModal(year)}
                          title="Edit Academic Year"
                          className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 hover:text-primary transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteTarget({ type: 'year', item: year })}
                          title="Delete Academic Year"
                          className="p-1.5 rounded-lg text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                      <span className="text-text-secondary font-medium">
                        {year.semester_count || 0} Semester{year.semester_count !== 1 ? 's' : ''}
                      </span>

                      {!isCurrent && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSetCurrentYear(year);
                          }}
                          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                        >
                          Set Active &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT: Semesters of Selected Year */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white rounded-2xl border border-border p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-text-dark">
                      Semesters for Academic Year {selectedYear?.year_label}
                    </h3>
                    {selectedYear?.is_current && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                        Current Year
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-text-secondary mt-0.5">
                    Manage semester start/end dates and student course registration windows.
                  </p>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() => handleOpenSemesterModal()}
                  className="text-xs self-start sm:self-auto"
                >
                  Add Semester to {selectedYear?.year_label}
                </Button>
              </div>

              {semestersLoading ? (
                <div className="py-12">
                  <LoadingSpinner message="Loading semester calendar..." />
                </div>
              ) : semesters.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-text-dark">No Semesters in {selectedYear?.year_label}</p>
                    <p className="text-xs text-text-secondary max-w-sm mx-auto mt-0.5">
                      Add semesters (e.g. Semester 1, Semester 2, Summer) to enable course registration and timetabling.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => handleOpenSemesterModal()}
                  >
                    Add First Semester
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {semesters.map((sem) => {
                    const isCurrent = Boolean(sem.is_current);

                    return (
                      <div
                        key={sem.id}
                        className={`rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4 ${
                          isCurrent
                            ? 'bg-gradient-to-br from-blue-50/50 via-white to-indigo-50/30 border-primary shadow-xs ring-1 ring-primary/20'
                            : 'bg-white border-border hover:border-slate-300'
                        }`}
                      >
                        <div className="space-y-3">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="text-base font-bold text-text-dark">{sem.name}</h4>
                                {isCurrent && (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                    ● Active Term
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-medium text-text-secondary">
                                {selectedYear?.year_label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenSemesterModal(sem)}
                                title="Edit Semester"
                                className="p-1.5 rounded-lg text-text-secondary hover:bg-slate-100 hover:text-primary transition-colors"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteTarget({ type: 'semester', item: sem })}
                                title="Delete Semester"
                                className="p-1.5 rounded-lg text-text-secondary hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* Term Dates */}
                          <div className="bg-slate-50 border border-border/80 rounded-xl p-3 space-y-2 text-xs">
                            <div>
                              <span className="text-text-secondary font-medium block text-[11px] uppercase tracking-wider">
                                Teaching Term Duration
                              </span>
                              <p className="font-semibold text-text-dark mt-0.5">
                                {sem.start_date ? new Date(sem.start_date).toLocaleDateString() : '—'} &rarr;{' '}
                                {sem.end_date ? new Date(sem.end_date).toLocaleDateString() : '—'}
                              </p>
                            </div>

                            <div className="pt-2 border-t border-border/60">
                              <span className="text-text-secondary font-medium block text-[11px] uppercase tracking-wider">
                                Student Registration Window
                              </span>
                              <p className="font-semibold text-text-dark mt-0.5">
                                {sem.registration_start
                                  ? `${new Date(sem.registration_start).toLocaleDateString()} → ${new Date(
                                      sem.registration_end || sem.end_date
                                    ).toLocaleDateString()}`
                                  : 'Aligned with term start'}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Bottom Actions */}
                        <div className="pt-3 border-t border-border flex items-center justify-between">
                          <span className="text-[11px] text-text-secondary">
                            Status: <strong className="text-text-dark">{isCurrent ? 'Current Term' : 'Inactive'}</strong>
                          </span>

                          {!isCurrent ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              icon={Check}
                              onClick={() => handleSetCurrentSemester(sem)}
                              className="text-xs"
                            >
                              Activate Term
                            </Button>
                          ) : (
                            <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                              <CheckCircle className="w-4 h-4" /> Operational
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: ACADEMIC YEAR ================= */}
      {showYearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-text-dark flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                {editingYear ? 'Edit Academic Year' : 'Create Academic Year'}
              </h3>
              <button
                onClick={() => setShowYearModal(false)}
                className="text-text-secondary hover:text-text-dark text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleYearSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Year Label (e.g. 2025/2026, 2026/2027) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="2026/2027"
                  value={yearForm.year_label}
                  onChange={(e) => setYearForm({ ...yearForm, year_label: e.target.value })}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={yearForm.start_date}
                    onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    End Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={yearForm.end_date}
                    onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={yearForm.is_current}
                    onChange={(e) => setYearForm({ ...yearForm, is_current: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-text-dark">
                    Set as active/current academic year immediately
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowYearModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={yearSaving}
                >
                  {editingYear ? 'Save Changes' : 'Create Year'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SEMESTER ================= */}
      {showSemesterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-lg p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-text-dark flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                {editingSemester ? 'Edit Semester' : 'Add New Semester'}
              </h3>
              <button
                onClick={() => setShowSemesterModal(false)}
                className="text-text-secondary hover:text-text-dark text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSemesterSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-text-secondary mb-1">
                    Academic Year *
                  </label>
                  <select
                    required
                    value={semesterForm.academic_year_id}
                    onChange={(e) => setSemesterForm({ ...semesterForm, academic_year_id: e.target.value })}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Academic Year...</option>
                    {academicYears.map((y) => (
                      <option key={y.id} value={y.id}>
                        {y.year_label} {y.is_current ? '(Current)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-text-secondary">
                      Semester Name *
                    </label>
                    {semesterForm.name.toLowerCase().includes('summer') || semesterForm.name.includes('3') ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        ☀️ Summer (≈2 Months)
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        📚 Regular (≈4 Months)
                      </span>
                    )}
                  </div>
                  <select
                    required
                    value={semesterForm.name}
                    onChange={(e) => {
                      const newName = e.target.value;
                      setSemesterForm((prev) => {
                        const next = { ...prev, name: newName };
                        if (next.start_date) {
                          const isSummer = newName.toLowerCase().includes('summer') || newName.includes('3');
                          const months = isSummer ? 2 : 4;
                          const d = new Date(next.start_date);
                          d.setMonth(d.getMonth() + months);
                          d.setDate(d.getDate() - 1);
                          next.end_date = d.toISOString().slice(0, 10);
                        }
                        return next;
                      });
                    }}
                    className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-primary"
                  >
                    <option value="Semester 1">Semester 1 (~4 Months)</option>
                    <option value="Semester 2">Semester 2 (~4 Months)</option>
                    <option value="Summer Semester">Summer Semester (~2 Months)</option>
                    <option value="Semester 3">Semester 3 (Summer / Special)</option>
                  </select>
                </div>
              </div>

              {/* Term Dates */}
              <div className="border border-border/80 rounded-xl p-3.5 bg-slate-50/60 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Teaching Term Period
                  </h4>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleSetTermDuration(4)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100/80 text-blue-800 hover:bg-blue-200 transition-colors"
                      title="Set end date to 4 months after start date"
                    >
                      +4 Months (Regular)
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSetTermDuration(2)}
                      className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-100/80 text-amber-800 hover:bg-amber-200 transition-colors"
                      title="Set end date to 2 months after start date"
                    >
                      +2 Months (Summer)
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={semesterForm.start_date}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        setSemesterForm((prev) => {
                          const next = { ...prev, start_date: newStart };
                          if (newStart && !prev.end_date) {
                            const isSummer = prev.name.toLowerCase().includes('summer') || prev.name.includes('3');
                            const months = isSummer ? 2 : 4;
                            const d = new Date(newStart);
                            d.setMonth(d.getMonth() + months);
                            d.setDate(d.getDate() - 1);
                            next.end_date = d.toISOString().slice(0, 10);
                          }
                          return next;
                        });
                      }}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={semesterForm.end_date}
                      onChange={(e) => setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              {/* Registration Window */}
              <div className="border border-border/80 rounded-xl p-3.5 bg-slate-50/60 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-text-secondary">
                  Course Registration Window (Optional)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Registration Start
                    </label>
                    <input
                      type="date"
                      value={semesterForm.registration_start}
                      onChange={(e) => setSemesterForm({ ...semesterForm, registration_start: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-text-secondary mb-1">
                      Registration Deadline
                    </label>
                    <input
                      type="date"
                      value={semesterForm.registration_end}
                      onChange={(e) => setSemesterForm({ ...semesterForm, registration_end: e.target.value })}
                      className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark bg-white focus:outline-none focus:border-primary"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={semesterForm.is_current}
                    onChange={(e) => setSemesterForm({ ...semesterForm, is_current: e.target.checked })}
                    className="w-4 h-4 text-primary rounded border-border focus:ring-primary"
                  />
                  <span className="text-xs font-medium text-text-dark">
                    Set as active/current semester for this academic year
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowSemesterModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={semesterSaving}
                >
                  {editingSemester ? 'Save Changes' : 'Add Semester'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deleteTarget)}
        title={deleteTarget?.type === 'year' ? 'Delete Academic Year' : 'Delete Semester'}
        message={
          deleteTarget?.type === 'year'
            ? `Are you sure you want to delete ${deleteTarget?.item?.year_label}? All semesters under this academic year will also be removed.`
            : `Are you sure you want to delete ${deleteTarget?.item?.name}?`
        }
        confirmText="Delete"
        variant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default AcademicYearsPage;
