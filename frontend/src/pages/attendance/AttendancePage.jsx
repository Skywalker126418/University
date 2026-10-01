import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, CheckCircle2, XCircle, Clock, BookOpen,
  Calendar, ChevronDown, Save, AlertCircle, RefreshCcw,
  UserCheck, Users, Percent, BarChart2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import lecturerService from '../../services/lecturerService';
import attendanceService from '../../services/attendanceService';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';

const STATUS_OPTIONS = [
  { value: 'present', label: 'Present', color: 'bg-green-100 text-green-700 border-green-200', icon: CheckCircle2 },
  { value: 'absent', label: 'Absent', color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
  { value: 'late', label: 'Late', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
  { value: 'excused', label: 'Excused', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: BookOpen },
];

const getStatusStyle = (status) => {
  const opt = STATUS_OPTIONS.find(s => s.value === status);
  return opt ? opt.color : 'bg-gray-100 text-gray-600 border-gray-200';
};

export default function AttendancePage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [sessionDate, setSessionDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coursesLoading, setCoursesLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [tab, setTab] = useState('mark'); // 'mark' | 'history'

  // Load lecturer's assigned courses
  useEffect(() => {
    setCoursesLoading(true);
    lecturerService.getMyProfile()
      .then(res => {
        // interceptor returns response.data = { success, data: {...} }
        const profile = res?.data || res || {};
        const lecturerId = profile?.id;
        if (lecturerId) {
          return lecturerService.getCourses(lecturerId);
        }
        return { data: [] };
      })
      .then(res => {
        // courses endpoint returns { success, data: [...] }
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setCourses(list);
        if (list.length) setSelectedCourse(String(list[0].id));
      })
      .catch(() => setCourses([]))
      .finally(() => setCoursesLoading(false));
  }, []);

  // Load attendance for selected course + date
  useEffect(() => {
    if (!selectedCourse || !sessionDate) return;
    setLoading(true);
    attendanceService.getAttendance(selectedCourse, sessionDate)
      .then(res => {
        const data = res?.data?.students || [];
        // If no attendance marked yet, default to 'present'
        setStudents(data.map(s => ({
          ...s,
          status: s.status || 'present',
          remarks: s.remarks || '',
        })));
      })
      .catch(() => setStudents([]))
      .finally(() => setLoading(false));
  }, [selectedCourse, sessionDate]);

  // Load history when tab switches
  useEffect(() => {
    if (tab !== 'history' || !selectedCourse) return;
    setHistoryLoading(true);
    attendanceService.getHistory(selectedCourse)
      .then(res => setHistory(res?.data || []))
      .catch(() => setHistory([]))
      .finally(() => setHistoryLoading(false));
  }, [tab, selectedCourse]);

  const updateStatus = (studentId, status) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, status } : s));
  };

  const updateRemarks = (studentId, remarks) => {
    setStudents(prev => prev.map(s => s.student_id === studentId ? { ...s, remarks } : s));
  };

  const markAll = (status) => {
    setStudents(prev => prev.map(s => ({ ...s, status })));
  };

  const handleSave = async () => {
    if (!selectedCourse || !sessionDate || !students.length) return;
    setSaving(true);
    try {
      const records = students.map(s => ({
        student_id: s.student_id,
        status: s.status,
        remarks: s.remarks,
      }));
      await attendanceService.markAttendance({
        course_id: parseInt(selectedCourse),
        session_date: sessionDate,
        records,
      });
      showToast('success', `Attendance saved for ${students.length} students!`);
    } catch (err) {
      showToast('error', err?.response?.data?.message || 'Failed to save attendance.');
    } finally {
      setSaving(false);
    }
  };

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // Stats
  const present = students.filter(s => s.status === 'present').length;
  const absent = students.filter(s => s.status === 'absent').length;
  const late = students.filter(s => s.status === 'late').length;
  const excused = students.filter(s => s.status === 'excused').length;
  const total = students.length;
  const rate = total ? Math.round(((present + late + excused) / total) * 100) : 0;

  const selectedCourseName = courses.find(c => String(c.id) === selectedCourse)?.course_name || 'Course';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-primary" />
            Attendance Management
          </h1>
          <p className="text-sm text-text-secondary mt-0.5">Mark and track student attendance for your courses</p>
        </div>

        {tab === 'mark' && students.length > 0 && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg hover:bg-primary-hover font-medium transition-all disabled:opacity-60"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Attendance'}
          </button>
        )}
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap gap-4 items-end">
        {/* Course selector */}
        <div className="flex-1 min-w-[200px]">
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Course
          </label>
          {coursesLoading ? (
            <div className="h-10 bg-slate-100 rounded-lg animate-pulse" />
          ) : (
            <div className="relative">
              <select
                value={selectedCourse}
                onChange={e => setSelectedCourse(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm text-text-dark bg-white appearance-none pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {courses.length === 0 && <option value="">No courses assigned</option>}
                {courses.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.course_code} — {c.course_name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary pointer-events-none" />
            </div>
          )}
        </div>

        {/* Date picker */}
        <div className="w-48">
          <label className="block text-xs font-semibold text-text-secondary mb-1.5 uppercase tracking-wide">
            Session Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              className="w-full border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-dark focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center border border-border rounded-lg overflow-hidden">
          {['mark', 'history'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize transition-colors ${
                tab === t ? 'bg-primary text-white' : 'bg-white text-text-secondary hover:bg-slate-50'
              }`}
            >
              {t === 'mark' ? 'Mark Attendance' : 'Session History'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats bar */}
      {tab === 'mark' && students.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { label: 'Total', value: total, color: 'text-text-dark', bg: 'bg-white' },
            { label: 'Present', value: present, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Absent', value: absent, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'Late', value: late, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Rate', value: `${rate}%`, color: rate >= 80 ? 'text-green-600' : 'text-red-600', bg: 'bg-white', icon: Percent },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border border-border p-3 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-secondary mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Mark Attendance Tab */}
      {tab === 'mark' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          {/* Quick actions */}
          {students.length > 0 && (
            <div className="px-4 py-3 border-b border-border bg-slate-50 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide mr-2">Mark All:</span>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => markAll(opt.value)}
                  className={`px-3 py-1 text-xs font-medium rounded-full border ${opt.color} transition-all hover:opacity-80`}
                >
                  All {opt.label}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div className="py-16 flex justify-center">
              <LoadingSpinner />
            </div>
          ) : students.length === 0 ? (
            <div className="py-16 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-text-secondary text-sm font-medium">No students enrolled in this course</p>
              <p className="text-xs text-text-secondary mt-1">Select a different course or check enrollment status</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">#</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Student</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Student ID</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((student, idx) => (
                    <motion.tr
                      key={student.student_id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-text-secondary font-mono text-xs">{idx + 1}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-primary text-xs font-bold">
                              {student.first_name?.[0]}{student.last_name?.[0]}
                            </span>
                          </div>
                          <span className="font-medium text-text-dark">{student.first_name} {student.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-text-secondary">{student.student_number || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {STATUS_OPTIONS.map(opt => {
                            const Icon = opt.icon;
                            const active = student.status === opt.value;
                            return (
                              <button
                                key={opt.value}
                                onClick={() => updateStatus(student.student_id, opt.value)}
                                title={opt.label}
                                className={`p-1.5 rounded-lg border text-xs font-medium transition-all ${
                                  active ? opt.color + ' scale-110 shadow-sm' : 'border-transparent text-slate-300 hover:text-slate-500'
                                }`}
                              >
                                <Icon className="w-4 h-4" />
                              </button>
                            );
                          })}
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${getStatusStyle(student.status)}`}>
                            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="text"
                          value={student.remarks}
                          onChange={e => updateRemarks(student.student_id, e.target.value)}
                          placeholder="Optional note..."
                          className="w-full border border-border rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary bg-transparent"
                        />
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* History Tab */}
      {tab === 'history' && (
        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-slate-50">
            <h3 className="font-semibold text-text-dark text-sm">Past Sessions — {selectedCourseName}</h3>
          </div>
          {historyLoading ? (
            <div className="py-16 flex justify-center"><LoadingSpinner /></div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center">
              <BarChart2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-text-secondary text-sm">No past sessions recorded for this course</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Day</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Total</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Present</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Absent</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Late</th>
                    <th className="text-center px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wide">Rate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((session, idx) => {
                    const sessionTotal = Number(session.total) || 0;
                    const sessionRate = sessionTotal
                      ? Math.round(((Number(session.present) + Number(session.late) + Number(session.excused)) / sessionTotal) * 100)
                      : 0;
                    return (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-text-dark font-medium">{session.session_date}</td>
                        <td className="px-4 py-3 text-text-secondary text-xs">{session.day_of_week}</td>
                        <td className="px-4 py-3 text-center font-medium text-text-dark">{sessionTotal}</td>
                        <td className="px-4 py-3 text-center text-green-600 font-medium">{session.present}</td>
                        <td className="px-4 py-3 text-center text-red-600 font-medium">{session.absent}</td>
                        <td className="px-4 py-3 text-center text-amber-600 font-medium">{session.late}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                            sessionRate >= 80 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {sessionRate}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20 }}
            className={`fixed bottom-6 left-1/2 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
