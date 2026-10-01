import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle,
  BookOpen,
  Calendar,
  User,
  AlertCircle,
  Check,
  Clock,
  ArrowRight,
  Lock,
  Unlock,
  GraduationCap,
  ShieldCheck,
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const CourseRegistrationPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [availableCourses, setAvailableCourses] = useState([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState(new Set());
  const [semester, setSemester] = useState('1');
  const [academicYear, setAcademicYear] = useState('2025/2026');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [submittedData, setSubmittedData] = useState(null);

  // Student's existing registrations
  const [myRegistrations, setMyRegistrations] = useState([]);

  // Registration period open/close state
  const [periodStatus, setPeriodStatus] = useState(null);
  const [periodLoading, setPeriodLoading] = useState(true);

  // Fetch student's existing registrations
  const fetchMyRegistrations = async () => {
    try {
      const res = await registrationService.getMyRegistrations();
      const list = res?.data || res || [];
      setMyRegistrations(Array.isArray(list) ? list : list.registrations || []);
    } catch (err) {
      console.error('Error fetching registrations:', err);
    }
  };

  // Check period status for selected semester
  useEffect(() => {
    let isMounted = true;
    setPeriodLoading(true);
    registrationService
      .getPeriodStatus({ academic_year: academicYear, semester: parseInt(semester) })
      .then((res) => {
        if (!isMounted) return;
        const data = res?.data || res || {};
        setPeriodStatus(data);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error fetching period status:', err);
      })
      .finally(() => {
        if (isMounted) setPeriodLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [academicYear, semester]);

  // Load available courses and student registrations
  useEffect(() => {
    setLoading(true);
    setErrorMessage('');
    setSelectedCourseIds(new Set());

    Promise.all([
      courseService.getAll({ semester }),
      fetchMyRegistrations(),
    ])
      .then(([res]) => {
        const list = res?.data || res || [];
        setAvailableCourses(Array.isArray(list) ? list : list.courses || []);
      })
      .catch(() => toast.error('Failed to load courses.'))
      .finally(() => setLoading(false));
  }, [semester]);

  const currentSemesterRegistrations = myRegistrations.filter(
    (r) => String(r.semester) === String(semester) && r.status !== 'rejected'
  );
  const alreadyRegisteredCount = currentSemesterRegistrations.length;
  const totalCount = alreadyRegisteredCount + selectedCourseIds.size;
  const isMinMet = totalCount >= 3;
  const isMaxExceeded = totalCount > 7;

  const toggleCourse = (id, alreadyRegistered) => {
    if (alreadyRegistered) return;
    setErrorMessage('');
    setSelectedCourseIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (alreadyRegisteredCount + next.size >= 7) {
          toast.warning('Maximum 7 courses allowed per semester.');
          setErrorMessage('Maximum 7 courses allowed per semester. You cannot select more courses.');
          return prev;
        }
        next.add(id);
      }
      return next;
    });
  };

  const selectedCoursesList = availableCourses.filter((c) => selectedCourseIds.has(c.id));
  const totalCredits = selectedCoursesList.reduce((acc, c) => acc + (c.credits || 3), 0);

  const isRegistrationOpen = Boolean(periodStatus?.is_open);

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setErrorMessage('');

    if (!isRegistrationOpen) {
      setErrorMessage('Registration period is currently closed by the Registrar.');
      return;
    }

    if (selectedCourseIds.size === 0) {
      setErrorMessage('Please select courses before submitting your registration.');
      return;
    }

    if (totalCount < 3) {
      setErrorMessage(`You must register for a minimum of 3 courses per semester. Currently selected: ${selectedCourseIds.size}${alreadyRegisteredCount > 0 ? ` (already registered: ${alreadyRegisteredCount}, total: ${totalCount})` : ''}.`);
      return;
    }

    if (totalCount > 7) {
      setErrorMessage(`You cannot register for more than 7 courses per semester (currently attempting ${totalCount}).`);
      return;
    }

    try {
      setSubmitting(true);
      await registrationService.register({
        course_ids: Array.from(selectedCourseIds),
        academic_year: academicYear,
        semester: parseInt(semester),
      });

      setSubmittedData({
        coursesCount: selectedCourseIds.size,
        totalCredits: totalCredits,
      });
      toast.success('Registration submitted successfully.');
      fetchMyRegistrations();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to submit registration. Please check requirements.';
      setErrorMessage(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // If submitted, show the confirmation screen
  if (submittedData) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="max-w-2xl mx-auto bg-white rounded-2xl border border-border p-8 text-center shadow-sm space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <Check className="w-9 h-9 stroke-[2.5]" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-text-dark">Registration Successful</h1>
          <p className="text-sm text-text-secondary mt-1.5 max-w-md mx-auto">
            Your course registration has been submitted successfully and is queued for verification by the Registrar.
          </p>
        </div>

        <div className="bg-slate-50 border border-border rounded-xl p-5 flex justify-center gap-12 text-center">
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Registered Courses</p>
            <p className="text-3xl font-bold text-primary mt-1">{submittedData.coursesCount}</p>
          </div>
          <div className="w-px bg-border" />
          <div>
            <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Total Credits</p>
            <p className="text-3xl font-bold text-primary mt-1">{submittedData.totalCredits}</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link to="/courses" className="w-full sm:w-auto">
            <Button variant="primary" className="w-full">
              View My Courses
            </Button>
          </Link>
          <Link to="/timetable" className="w-full sm:w-auto">
            <Button variant="secondary" className="w-full">
              View Timetable
            </Button>
          </Link>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Course Registration</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Select your semester study units. Selected course count and credit calculations update instantly.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary">Semester:</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="text-sm font-medium border border-border rounded-xl px-3 py-1.5 bg-white text-text-dark focus:outline-none focus:border-primary shadow-sm"
          >
            <option value="1">Semester 1 (2025/2026)</option>
            <option value="2">Semester 2 (2025/2026)</option>
            <option value="3">Summer Semester (2025/2026)</option>
          </select>
        </div>
      </div>

      {/* REGISTRATION PERIOD STATUS BANNER */}
      {!periodLoading && (
        isRegistrationOpen ? (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-3 text-xs text-emerald-800 font-medium shadow-xs">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>
                <strong>Course Registration is OPEN</strong> for Semester {semester} ({academicYear}). Select your courses below and click Submit.
              </span>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 border border-emerald-300">
              Active
            </span>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-3 text-xs text-rose-800 font-medium shadow-xs">
            <div className="flex items-center gap-2.5">
              <Lock className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>
                <strong>Registration period is currently closed</strong> for Semester {semester} ({academicYear}). Submissions are temporarily paused by the Registrar.
              </span>
            </div>
            <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300">
              Closed
            </span>
          </div>
        )
      )}

      {/* Validation Error Banner */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 text-xs text-red-700 font-medium"
          >
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Course List */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-text-secondary uppercase tracking-wider">
            Available Courses ({availableCourses.length})
          </h2>
          <span className="text-xs text-text-secondary">
            Click on any available course card to select or unselect.
          </span>
        </div>

        {loading ? (
          <div className="bg-white p-12 rounded-2xl border border-border">
            <LoadingSpinner message="Loading semester courses..." />
          </div>
        ) : availableCourses.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-border text-center text-text-secondary text-sm">
            No courses available for Semester {semester}.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableCourses.map((c) => {
              const existingReg = myRegistrations.find(
                (r) => r.course_id === c.id && String(r.semester) === String(semester)
              );
              const alreadyRegistered = Boolean(existingReg);
              const isSelected = selectedCourseIds.has(c.id);

              return (
                <div
                  key={c.id}
                  onClick={() => toggleCourse(c.id, alreadyRegistered)}
                  className={`rounded-2xl border p-5 transition-all flex flex-col justify-between gap-4 ${
                    alreadyRegistered
                      ? 'bg-slate-50/80 border-slate-200 opacity-90 cursor-default'
                      : isSelected
                      ? 'cursor-pointer border-primary bg-blue-50/60 shadow-sm ring-1 ring-primary'
                      : 'cursor-pointer border-border bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div className="pt-0.5">
                      {alreadyRegistered ? (
                        <div className="w-4 h-4 rounded bg-emerald-100 text-emerald-600 flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by card click
                          className="w-4 h-4 text-primary rounded border-border focus:ring-primary cursor-pointer"
                        />
                      )}
                    </div>
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-primary px-2 py-0.5 bg-blue-100 rounded">
                          {c.course_code}
                        </span>
                        <div className="flex items-center gap-2">
                          {alreadyRegistered && (
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              existingReg.status === 'approved'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : existingReg.status === 'rejected'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {existingReg.status === 'approved' ? '✓ Enrolled' : '⏳ Pending Approval'}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-text-secondary">
                            {c.credits || 3} Credits
                          </span>
                        </div>
                      </div>
                      <h3 className="text-sm font-bold text-text-dark">{c.course_name || c.name}</h3>
                      <p className="text-xs text-text-secondary line-clamp-2">
                        {c.description || 'Core departmental module covering fundamental curriculum.'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-border/70 flex items-center justify-between text-xs text-text-secondary">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{c.lecturer_name || 'Assigned Lecturer'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-text-secondary" />
                      <span>{c.semester ? `Semester ${c.semester}` : 'Scheduled'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating / Bottom Sticky Summary Bar */}
      <div className="sticky bottom-4 z-10 bg-white border border-border shadow-lg rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <div>
            <p className="text-xs text-text-secondary">Selected Courses</p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xl font-bold text-primary">{selectedCourseIds.size}</span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                totalCount === 0
                  ? 'bg-slate-100 text-slate-600 border-slate-300'
                  : totalCount < 3
                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                  : totalCount <= 7
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border-rose-300'
              }`}>
                {totalCount} / 7 (Min 3)
              </span>
            </div>
            {alreadyRegisteredCount > 0 && (
              <p className="text-[10px] text-text-secondary mt-0.5">
                ({alreadyRegisteredCount} previously registered)
              </p>
            )}
          </div>
          <div className="h-8 w-px bg-border" />
          <div>
            <p className="text-xs text-text-secondary">Total Credits</p>
            <p className="text-xl font-bold text-text-dark">{totalCredits}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={selectedCourseIds.size === 0}
            onClick={() => {
              setSelectedCourseIds(new Set());
              setErrorMessage('');
            }}
          >
            Clear Selection
          </Button>
          <Button
            type="button"
            variant={isRegistrationOpen && isMinMet && !isMaxExceeded ? 'primary' : 'secondary'}
            onClick={handleSubmit}
            loading={submitting}
            disabled={!isRegistrationOpen || selectedCourseIds.size === 0 || !isMinMet || isMaxExceeded}
          >
            {!isRegistrationOpen
              ? 'Registration Closed'
              : !isMinMet
              ? `Select Min. 3 Courses (${totalCount}/3)`
              : isMaxExceeded
              ? 'Exceeds 7 Courses Limit'
              : 'Submit Registration'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CourseRegistrationPage;
