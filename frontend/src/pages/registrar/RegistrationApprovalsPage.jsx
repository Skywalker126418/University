import React, { useState, useEffect, useCallback } from 'react';
import {
  CheckSquare, Check, X, Search, Filter, Lock, Unlock,
  Calendar, Clock, AlertCircle, Settings, RefreshCw, ChevronDown
} from 'lucide-react';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../hooks/useToast';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const RegistrationApprovalsPage = () => {
  const toast = useToast();
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Period state
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [semester, setSemester] = useState('1');
  const [periodStatus, setPeriodStatus] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [showDateModal, setShowDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Fetch current period status
  const fetchPeriodStatus = useCallback(async () => {
    try {
      setPeriodLoading(true);
      const res = await registrationService.getPeriodStatus({
        academic_year: academicYear,
        semester: parseInt(semester),
      });
      const data = res?.data || res || {};
      setPeriodStatus(data);
      if (data.period) {
        if (data.period.start_date) setCustomStartDate(data.period.start_date.slice(0, 10));
        if (data.period.end_date) setCustomEndDate(data.period.end_date.slice(0, 10));
      }
    } catch (err) {
      console.error('Error fetching period status:', err);
    } finally {
      setPeriodLoading(false);
    }
  }, [academicYear, semester]);

  const fetchRegistrations = useCallback(async () => {
    try {
      setLoading(true);
      const res = await registrationService.getAll({
        status: statusFilter !== 'all' ? statusFilter : undefined,
        academic_year: academicYear,
        semester: parseInt(semester),
      });
      const list = res?.data || res || [];
      setRegistrations(Array.isArray(list) ? list : list.registrations || []);
    } catch (err) {
      toast.error('Failed to load registrations.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, academicYear, semester]);

  useEffect(() => {
    fetchPeriodStatus();
    fetchRegistrations();
  }, [fetchPeriodStatus, fetchRegistrations]);

  const handleTogglePeriod = async (targetOpen) => {
    try {
      setToggling(true);
      await registrationService.togglePeriod({
        academic_year: academicYear,
        semester: parseInt(semester),
        is_open: targetOpen,
      });
      toast.success(targetOpen ? 'Course registration is now OPEN!' : 'Course registration is now CLOSED.');
      fetchPeriodStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to update registration status.');
    } finally {
      setToggling(false);
    }
  };

  const handleSaveCustomDates = async (e) => {
    e.preventDefault();
    if (!customStartDate || !customEndDate) {
      toast.error('Please specify both start and end dates.');
      return;
    }
    try {
      setToggling(true);
      await registrationService.savePeriod({
        academic_year: academicYear,
        semester: parseInt(semester),
        start_date: `${customStartDate} 00:00:00`,
        end_date: `${customEndDate} 23:59:59`,
        is_open: 1,
      });
      toast.success('Registration schedule saved and activated.');
      setShowDateModal(false);
      fetchPeriodStatus();
    } catch (err) {
      toast.error(err.message || 'Failed to save schedule.');
    } finally {
      setToggling(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await registrationService.approve(id);
      toast.success('Registration approved.');
      fetchRegistrations();
    } catch (err) {
      toast.error(err.message || 'Failed to approve registration.');
    }
  };

  const handleReject = async (id) => {
    try {
      await registrationService.reject(id, 'Prerequisites unmet or maximum credits exceeded.');
      toast.success('Registration rejected.');
      fetchRegistrations();
    } catch (err) {
      toast.error(err.message || 'Failed to reject registration.');
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const studentName = `${r.first_name || ''} ${r.last_name || ''}`.toLowerCase();
    const studentNum = (r.student_number || '').toLowerCase();
    const course = `${r.course_code || ''} ${r.course_name || ''}`.toLowerCase();
    return studentName.includes(q) || studentNum.includes(q) || course.includes(q);
  });

  const pendingCount = registrations.filter((r) => r.status === 'pending').length;
  const approvedCount = registrations.filter((r) => r.status === 'approved').length;
  const rejectedCount = registrations.filter((r) => r.status === 'rejected').length;

  const isOpen = Boolean(periodStatus?.is_open);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Course Registration Adjudication</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage course registration periods and authorize semester student course enrollment submissions.
          </p>
        </div>

        {/* Academic Year and Semester Filters */}
        <div className="flex items-center gap-2">
          <select
            value={academicYear}
            onChange={(e) => setAcademicYear(e.target.value)}
            className="text-xs font-semibold border border-border rounded-xl px-3 py-2 bg-white text-text-dark focus:outline-none focus:border-primary shadow-xs"
          >
            <option value="2025/2026">2025/2026</option>
            <option value="2026/2027">2026/2027</option>
          </select>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="text-xs font-semibold border border-border rounded-xl px-3 py-2 bg-white text-text-dark focus:outline-none focus:border-primary shadow-xs"
          >
            <option value="1">Semester 1</option>
            <option value="2">Semester 2</option>
            <option value="3">Summer Semester</option>
          </select>
        </div>
      </div>

      {/* REGISTRATION PERIOD CONTROL CARD */}
      <div className={`rounded-2xl border p-5 shadow-xs transition-all ${
        isOpen
          ? 'bg-gradient-to-r from-emerald-50/70 via-white to-emerald-50/40 border-emerald-200'
          : 'bg-gradient-to-r from-rose-50/70 via-white to-rose-50/40 border-rose-200'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xs ${
              isOpen ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
            }`}>
              {isOpen ? <Unlock className="w-6 h-6 stroke-[2.2]" /> : <Lock className="w-6 h-6 stroke-[2.2]" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-text-dark">
                  Registration Window: {academicYear} — Semester {semester}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                  isOpen ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-rose-100 text-rose-800 border border-rose-300'
                }`}>
                  {isOpen ? '● Registration OPEN' : '○ Registration CLOSED'}
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-1">
                {isOpen ? (
                  periodStatus?.period?.end_date ? (
                    <span>
                      Students can freely select and register for courses until{' '}
                      <strong className="text-text-dark font-medium">
                        {new Date(periodStatus.period.end_date).toLocaleDateString()}
                      </strong>.
                    </span>
                  ) : (
                    'Students can currently register for their courses without restriction.'
                  )
                ) : (
                  'Course registration is closed. Students cannot submit new course selections until opened.'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto">
            <Button
              variant="secondary"
              size="sm"
              icon={Settings}
              onClick={() => setShowDateModal(true)}
              className="bg-white border-border hover:bg-slate-50 text-xs"
            >
              Schedule Dates
            </Button>
            {isOpen ? (
              <Button
                variant="danger"
                size="sm"
                icon={Lock}
                loading={toggling}
                onClick={() => handleTogglePeriod(false)}
                className="shadow-xs font-semibold text-xs"
              >
                Close Registration
              </Button>
            ) : (
              <Button
                variant="success"
                size="sm"
                icon={Unlock}
                loading={toggling}
                onClick={() => handleTogglePeriod(true)}
                className="shadow-xs font-semibold text-xs text-white bg-emerald-600 hover:bg-emerald-700"
              >
                Open Registration
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Date Scheduling Modal */}
      {showDateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-border shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <h3 className="font-bold text-base text-text-dark flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Schedule Registration Window
              </h3>
              <button
                onClick={() => setShowDateModal(false)}
                className="text-text-secondary hover:text-text-dark text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSaveCustomDates} className="space-y-4">
              <p className="text-xs text-text-secondary">
                Set a specific calendar window for Semester {semester} ({academicYear}). Students will only be permitted to register during these dates.
              </p>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  required
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Closing Deadline
                </label>
                <input
                  type="date"
                  required
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="w-full border border-border rounded-xl px-3 py-2 text-sm text-text-dark focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowDateModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={toggling}
                >
                  Save & Activate
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FILTER & SEARCH BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search student name, ID or course..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs border border-border rounded-xl pl-9 pr-3 py-2 bg-white text-text-dark focus:outline-none focus:border-primary shadow-xs"
          />
        </div>

        {/* Status filter tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-border rounded-xl shadow-xs self-start sm:self-auto">
          {[
            { id: 'all', label: 'All', count: registrations.length },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'approved', label: 'Approved', count: approvedCount },
            { id: 'rejected', label: 'Rejected', count: rejectedCount },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-primary text-white shadow-xs'
                  : 'text-text-secondary hover:text-text-dark hover:bg-slate-50'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count > 0 && (
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-slate-100 text-text-secondary'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUBMISSIONS TABLE */}
      <div className="bg-white rounded-2xl border border-border shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Fetching registration submissions..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Student Name</th>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-primary">{r.student_number || 'ST2026001'}</td>
                      <td className="py-3.5 px-4 font-medium text-text-dark">
                        {r.first_name ? `${r.first_name} ${r.last_name}` : 'Student'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-semibold text-text-dark">{r.course_code || 'CS201'}</span>{' '}
                        <span className="text-text-secondary text-xs">({r.course_name || 'Software Engineering'})</span>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary text-xs">
                        {r.registered_at ? new Date(r.registered_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
                          {r.status || 'pending'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        {r.status === 'pending' || !r.status ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="success"
                              size="sm"
                              icon={Check}
                              onClick={() => handleApprove(r.id)}
                              className="text-xs"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              icon={X}
                              onClick={() => handleReject(r.id)}
                              className="text-xs"
                            >
                              Reject
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-text-secondary italic">
                            {r.status === 'approved' ? 'Enrolled' : 'Declined'}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-text-secondary text-xs">
                      {searchQuery
                        ? 'No student registrations match your search.'
                        : 'No course registrations submitted yet in this category.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegistrationApprovalsPage;
