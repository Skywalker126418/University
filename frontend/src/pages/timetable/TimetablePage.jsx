import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, MapPin, User, Download, Plus, X, DoorOpen, AlertTriangle } from 'lucide-react';
import { timetableService } from '../../services/timetableService';
import { courseService } from '../../services/courseService';
import { lecturerService } from '../../services/lecturerService';
import { roomService } from '../../services/roomService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = [
  '08:00 - 10:00',
  '10:00 - 12:00',
  '12:00 - 14:00',
  '14:00 - 16:00',
  '16:00 - 18:00',
];

const courseColors = [
  'border-l-4 border-blue-600 bg-blue-50/70',
  'border-l-4 border-indigo-600 bg-indigo-50/70',
  'border-l-4 border-emerald-600 bg-emerald-50/70',
  'border-l-4 border-purple-600 bg-purple-50/70',
  'border-l-4 border-amber-600 bg-amber-50/70',
  'border-l-4 border-rose-600 bg-rose-50/70',
  'border-l-4 border-teal-600 bg-teal-50/70',
  'border-l-4 border-cyan-600 bg-cyan-50/70',
];

const ScheduleModal = ({ isOpen, onClose, courses, lecturers, rooms, onScheduled }) => {
  const toast = useToast();
  const [form, setForm] = useState({
    course_id: '',
    lecturer_id: '',
    room_id: '',
    day_of_week: 'Monday',
    start_time: '08:00',
    end_time: '10:00',
  });
  const [saving, setSaving] = useState(false);
  const [conflictError, setConflictError] = useState('');

  const selectedRoom = rooms.find((r) => r.id === parseInt(form.room_id));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setConflictError('');

    if (!form.course_id || !form.lecturer_id || !form.room_id) {
      toast.error('Please select course, lecturer, and room.');
      return;
    }

    if (form.start_time >= form.end_time) {
      toast.error('Start time must be before end time.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        course_id: parseInt(form.course_id),
        lecturer_id: parseInt(form.lecturer_id),
        room_id: parseInt(form.room_id),
        day_of_week: form.day_of_week,
        start_time: form.start_time + ':00',
        end_time: form.end_time + ':00',
      };
      await timetableService.create(payload);
      toast.success('Lecture session scheduled successfully.');
      onScheduled();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Collision detected or scheduling failed.';
      setConflictError(msg);
      toast.error(msg);
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
            <h2 className="text-base font-bold text-text-dark">Schedule Lecture Session</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-dark hover:bg-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {conflictError && (
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Schedule Conflict / Collision</p>
                  <p className="mt-0.5">{conflictError}</p>
                </div>
              </div>
            )}

            <Select
              label="Course / Module *"
              value={form.course_id}
              onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))}
              required
              options={[
                { value: '', label: 'Select Course...' },
                ...courses.map((c) => ({
                  value: c.id,
                  label: `${c.course_code} - ${c.course_name}`,
                })),
              ]}
            />

            <Select
              label="Assigned Lecturer *"
              value={form.lecturer_id}
              onChange={(e) => setForm((p) => ({ ...p, lecturer_id: e.target.value }))}
              required
              options={[
                { value: '', label: 'Select Faculty Lecturer...' },
                ...lecturers.map((l) => ({
                  value: l.id,
                  label: `${l.first_name || ''} ${l.last_name || ''} (${l.department_name || 'Faculty'})`,
                })),
              ]}
            />

            <Select
              label="Lecture Room & Capacity *"
              value={form.room_id}
              onChange={(e) => setForm((p) => ({ ...p, room_id: e.target.value }))}
              required
              options={[
                { value: '', label: 'Select Lecture Room...' },
                ...rooms.map((r) => ({
                  value: r.id,
                  label: `${r.room_number} - Cap: ${r.capacity} Seats (${(r.available_from || '').slice(0, 5)} - ${(r.available_until || '').slice(0, 5)})`,
                })),
              ]}
            />

            {selectedRoom && (
              <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs text-primary space-y-1">
                <p className="font-semibold">Room Specifications:</p>
                <p>
                  • Max Seating Capacity: <strong>{selectedRoom.capacity} students</strong>
                </p>
                <p>
                  • Operational Hours: <strong>{(selectedRoom.available_from || '07:30').slice(0, 5)}</strong> to{' '}
                  <strong>{(selectedRoom.available_until || '18:00').slice(0, 5)}</strong>
                </p>
              </div>
            )}

            <div className="grid grid-cols-3 gap-3">
              <Select
                label="Day of Week"
                value={form.day_of_week}
                onChange={(e) => setForm((p) => ({ ...p, day_of_week: e.target.value }))}
                options={DAYS.map((d) => ({ value: d, label: d }))}
              />

              <div>
                <label className="block text-xs font-medium text-text-dark mb-1">Start Time *</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm((p) => ({ ...p, start_time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-dark mb-1">End Time *</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm((p) => ({ ...p, end_time: e.target.value }))}
                  className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                Confirm Schedule
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const TimetablePage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [timetable, setTimetable] = useState([]);
  const [courses, setCourses] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRoom, setFilterRoom] = useState('');
  const [modalOpen, setModalOpen] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    const params = {};
    if (filterRoom) params.room_id = filterRoom;

    timetableService
      .getTimetable(params)
      .then((res) => {
        const data = res?.data || res || [];
        setTimetable(Array.isArray(data) ? data : data.timetable || data.schedule || []);
      })
      .catch((err) => toast.error(err.message || 'Failed to load timetable.'))
      .finally(() => setLoading(false));
  }, [filterRoom]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Load auxiliary data for admin scheduling modal
  useEffect(() => {
    if (isAdmin) {
      courseService.getAll({ limit: 100 }).then((res) => {
        const list = res?.data || res || [];
        setCourses(Array.isArray(list) ? list : list.courses || []);
      }).catch(() => {});

      lecturerService.getAll({ limit: 100 }).then((res) => {
        const list = res?.data || res || [];
        setLecturers(Array.isArray(list) ? list : list.lecturers || []);
      }).catch(() => {});

      roomService.getAll({ limit: 100 }).then((res) => {
        const list = res?.data || res || [];
        setRooms(Array.isArray(list) ? list : list.rooms || []);
      }).catch(() => {});
    }
  }, [isAdmin]);

  const getEntry = (day, timeIndex) => {
    const startHour = 8 + timeIndex * 2;
    return timetable.find((entry) => {
      if (entry.day_of_week !== day) return false;
      const startH = parseInt(entry.start_time?.split(':')[0] || 0, 10);
      return startH >= startHour && startH < startHour + 2;
    });
  };

  const handleDownloadCSV = () => {
    if (timetable.length === 0) {
      toast.error('No timetable data to download.');
      return;
    }
    const headers = ['Day', 'Start Time', 'End Time', 'Course Code', 'Course Name', 'Room', 'Building', 'Lecturer'];
    const rows = timetable.map((e) => [
      `"${e.day_of_week || ''}"`,
      `"${e.start_time || ''}"`,
      `"${e.end_time || ''}"`,
      `"${e.course_code || ''}"`,
      `"${e.course_name || ''}"`,
      `"${e.room_number || e.room || ''}"`,
      `"${e.building || ''}"`,
      `"${e.lecturer_name || ''}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `timetable_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Class Timetable & Room Schedules</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Weekly lecture schedules, allocated lecture rooms, conflict protection, and teaching faculty.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {isAdmin && (
            <Button variant="primary" icon={Plus} size="sm" onClick={() => setModalOpen(true)}>
              Schedule Lecture
            </Button>
          )}
          <Button variant="outline" icon={Download} size="sm" onClick={handleDownloadCSV}>
            Download CSV
          </Button>
          <Button variant="secondary" icon={Download} size="sm" onClick={() => window.print()}>
            Print Schedule
          </Button>
        </div>
      </div>

      {rooms.length > 0 && (
        <div className="flex items-center gap-3">
          <label className="text-xs font-semibold text-text-secondary flex items-center gap-1.5">
            <DoorOpen className="w-4 h-4 text-primary" /> Filter by Venue:
          </label>
          <select
            value={filterRoom}
            onChange={(e) => setFilterRoom(e.target.value)}
            className="px-3 py-1.5 text-xs border border-border rounded-xl bg-white shadow-xs focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="">All Rooms & Venues</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_number} ({r.building || 'Campus'})
              </option>
            ))}
          </select>
        </div>
      )}

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-border shadow-sm">
          <LoadingSpinner message="Loading weekly timetable schedule..." />
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-x-auto p-4 sm:p-6">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr>
                <th className="w-28 p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border">
                  Time Slot
                </th>
                {DAYS.map((day) => (
                  <th
                    key={day}
                    className="p-3 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider border-b border-border"
                  >
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {TIME_SLOTS.map((slot, timeIndex) => (
                <tr key={slot} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 align-top text-xs font-semibold text-text-secondary whitespace-nowrap">
                    {slot}
                  </td>
                  {DAYS.map((day) => {
                    const entry = getEntry(day, timeIndex);
                    const colorIndex = entry ? (entry.course_code?.charCodeAt(0) || 0) % courseColors.length : 0;
                    const colorClass = entry ? courseColors[colorIndex] : '';

                    return (
                      <td key={day} className="p-2 align-top w-1/5">
                        {entry ? (
                          <div className={`p-3 rounded-xl border border-slate-200/80 shadow-xs ${colorClass}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-text-dark">
                                {entry.course_code}
                              </span>
                              <span className="text-[10px] text-text-secondary font-medium">
                                {(entry.start_time || '').slice(0, 5)} - {(entry.end_time || '').slice(0, 5)}
                              </span>
                            </div>
                            <p className="text-xs font-semibold text-text-dark mt-0.5 line-clamp-1">
                              {entry.course_name || 'Lecture'}
                            </p>
                            <div className="mt-2 space-y-1 text-[11px] text-text-secondary">
                              <div className="flex items-center gap-1.5">
                                <User className="w-3 h-3 text-text-secondary" />
                                <span className="truncate">{entry.lecturer_name || 'Faculty Lecturer'}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <MapPin className="w-3 h-3 text-primary" />
                                <span className="font-semibold text-text-dark">
                                  {entry.room_number || entry.room || 'TBA'}
                                  {entry.building ? ` (${entry.building})` : ''}
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="h-20 flex items-center justify-center text-xs text-slate-300">
                            —
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ScheduleModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        courses={courses}
        lecturers={lecturers}
        rooms={rooms}
        onScheduled={loadData}
      />
    </div>
  );
};

export default TimetablePage;
