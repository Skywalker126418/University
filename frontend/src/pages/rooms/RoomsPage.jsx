import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, DoorOpen, Edit2, Trash2, X, Users, Clock, Building, Calendar, CheckCircle } from 'lucide-react';
import { roomService } from '../../services/roomService';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import ConfirmDialog from '../../components/ui/ConfirmDialog';

const ROOM_TYPES = [
  { value: 'lecture_hall', label: 'Lecture Hall' },
  { value: 'lab', label: 'Computer / Science Lab' },
  { value: 'seminar', label: 'Seminar Room' },
  { value: 'tutorial', label: 'Tutorial Classroom' },
];

const RoomModal = ({ isOpen, onClose, room, onSave }) => {
  const [form, setForm] = useState({
    room_number: '',
    building: '',
    capacity: 40,
    room_type: 'lecture_hall',
    available_from: '07:30',
    available_until: '18:00',
  });
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (room) {
      setForm({
        room_number: room.room_number || '',
        building: room.building || '',
        capacity: room.capacity || 40,
        room_type: room.room_type || 'lecture_hall',
        available_from: (room.available_from || '07:30:00').slice(0, 5),
        available_until: (room.available_until || '18:00:00').slice(0, 5),
      });
    } else {
      setForm({
        room_number: '',
        building: '',
        capacity: 40,
        room_type: 'lecture_hall',
        available_from: '07:30',
        available_until: '18:00',
      });
    }
  }, [room, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.room_number.trim()) {
      toast.error('Room number is required.');
      return;
    }
    if (!form.capacity || parseInt(form.capacity) <= 0) {
      toast.error('Capacity must be greater than 0.');
      return;
    }
    if (form.available_from >= form.available_until) {
      toast.error('Available From must be before Available Until.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        ...form,
        capacity: parseInt(form.capacity),
        available_from: form.available_from + ':00',
        available_until: form.available_until + ':00',
      };
      if (room) {
        await roomService.update(room.id, payload);
        toast.success('Room updated successfully.');
      } else {
        await roomService.create(payload);
        toast.success('Room venue created successfully.');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.message || 'Failed to save room.');
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
            <h2 className="text-base font-bold text-text-dark">{room ? 'Edit Room Venue' : 'Create Room Venue'}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg text-text-secondary hover:text-text-dark hover:bg-slate-200">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Room Number / Identifier *"
                name="room_number"
                placeholder="e.g. Hall A-101"
                value={form.room_number}
                onChange={(e) => setForm((p) => ({ ...p, room_number: e.target.value }))}
                required
              />
              <Input
                label="Building / Campus Block"
                name="building"
                placeholder="e.g. Technology Complex"
                value={form.building}
                onChange={(e) => setForm((p) => ({ ...p, building: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Max Student Capacity *"
                name="capacity"
                type="number"
                min="1"
                max="1000"
                value={form.capacity}
                onChange={(e) => setForm((p) => ({ ...p, capacity: e.target.value }))}
                required
              />
              <Select
                label="Room Type"
                name="room_type"
                value={form.room_type}
                onChange={(e) => setForm((p) => ({ ...p, room_type: e.target.value }))}
                options={ROOM_TYPES}
              />
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-border space-y-2">
              <p className="text-xs font-semibold text-text-dark">Operational Hours</p>
              <p className="text-[11px] text-text-secondary">
                Timetable sessions and student enrollments will adhere strictly to this time window to prevent schedule overlaps.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-medium text-text-dark mb-1">Available From *</label>
                  <input
                    type="time"
                    value={form.available_from}
                    onChange={(e) => setForm((p) => ({ ...p, available_from: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-dark mb-1">Available Until *</label>
                  <input
                    type="time"
                    value={form.available_until}
                    onChange={(e) => setForm((p) => ({ ...p, available_until: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white"
                    required
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-border">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={saving}>
                {room ? 'Save Changes' : 'Create Room'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

const RoomsPage = () => {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    roomService
      .getAll({ search, room_type: filterType || undefined })
      .then((res) => {
        const list = res?.data || res || [];
        setRooms(Array.isArray(list) ? list : list.rooms || []);
      })
      .catch((err) => toast.error(err.message || 'Failed to load rooms.'))
      .finally(() => setLoading(false));
  }, [search, filterType]);

  useEffect(() => {
    load();
  }, [load]);

  const handleDelete = async () => {
    try {
      await roomService.delete(deleteTarget.id);
      toast.success('Room venue deactivated.');
      load();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate room.');
    } finally {
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Campus Lecture Rooms & Venues</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure lecture halls, labs, student quotas, and available operating hours. Lecture timetable strictly adheres to room capacity and schedules.
          </p>
        </div>
        {isAdmin && (
          <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
            Add Room Venue
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by room number, building, or type..."
            className="w-full pl-10 pr-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 text-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary bg-white shadow-sm"
        >
          <option value="">All Room Types</option>
          {ROOM_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="bg-white p-12 rounded-2xl border border-border shadow-sm">
          <LoadingSpinner message="Loading university venues..." />
        </div>
      ) : rooms.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-border shadow-sm">
          <EmptyState
            icon={DoorOpen}
            title="No rooms configured yet"
            description="Add classroom venues and assign their operational hours and maximum seating limit."
            action={
              isAdmin ? (
                <Button variant="primary" icon={Plus} onClick={() => { setEditing(null); setModalOpen(true); }}>
                  Create Room Venue
                </Button>
              ) : null
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rooms.map((r, i) => {
            const enrolled = parseInt(r.enrolled_students_count || 0);
            const capacity = parseInt(r.capacity || 40);
            const occupancyPct = Math.min(100, Math.round((enrolled / capacity) * 100));

            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-white rounded-2xl border border-border p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="text-xs font-bold text-primary px-2.5 py-1 bg-primary-light rounded-lg">
                      {r.room_number}
                    </span>
                    <Badge variant={occupancyPct >= 100 ? 'error' : occupancyPct >= 80 ? 'warning' : 'success'}>
                      {occupancyPct >= 100 ? 'Full' : `${occupancyPct}% Booked`}
                    </Badge>
                  </div>

                  <h3 className="font-bold text-base text-text-dark mt-1">
                    {r.building || 'Campus Central Building'}
                  </h3>

                  <p className="text-xs text-text-secondary capitalize mt-0.5">
                    {r.room_type?.replace('_', ' ') || 'Lecture Hall'}
                  </p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-xl space-y-2 border border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        <Users className="w-3.5 h-3.5 text-primary" />
                        Seating Limit:
                      </span>
                      <span className="font-semibold text-text-dark">
                        {enrolled} / {capacity} Seats
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          occupancyPct >= 100 ? 'bg-rose-500' : occupancyPct >= 80 ? 'bg-amber-500' : 'bg-primary'
                        }`}
                        style={{ width: `${occupancyPct}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60">
                      <span className="flex items-center gap-1.5 text-text-secondary">
                        <Clock className="w-3.5 h-3.5 text-emerald-600" />
                        Available Hours:
                      </span>
                      <span className="font-medium text-text-dark">
                        {(r.available_from || '07:30').slice(0, 5)} – {(r.available_until || '18:00').slice(0, 5)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-border mt-4 flex items-center justify-between">
                  <span className="text-xs text-text-secondary flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-primary" />
                    {r.scheduled_classes_count || 0} Scheduled Lectures
                  </span>

                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => { setEditing(r); setModalOpen(true); }}
                        className="p-1.5 rounded-lg text-primary hover:bg-primary-light transition-colors"
                        title="Edit Room"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(r)}
                        className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Deactivate Room"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <RoomModal
        isOpen={modalOpen}
        room={editing}
        onClose={() => setModalOpen(false)}
        onSave={load}
      />

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Room Venue?"
        message={`Are you sure you want to deactivate room "${deleteTarget?.room_number}"? Existing timetable schedules for this room will remain archived.`}
        confirmText="Deactivate"
        variant="danger"
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

export default RoomsPage;
