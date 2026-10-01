import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import ConfirmDialog from '../ui/ConfirmDialog';
import { Camera } from 'lucide-react';
import { departmentService } from '../../services/departmentService';
import { programmeService } from '../../services/programmeService';
import { roomService } from '../../services/roomService';

const StudentForm = ({ initialData, onSubmit, isLoading }) => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    student_number: initialData?.student_number || '',
    first_name: initialData?.first_name || '',
    last_name: initialData?.last_name || '',
    gender: initialData?.gender || 'male',
    date_of_birth: initialData?.date_of_birth ? initialData.date_of_birth.split('T')[0] : '',
    department_id: initialData?.department_id || '',
    programme_id: initialData?.programme_id || '',
    preferred_room_id: initialData?.preferred_room_id || '',
    year_of_study: initialData?.year_of_study || 1,
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    password: '',
  });

  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(
    initialData?.avatar || initialData?.profile_photo
      ? ((initialData.avatar || initialData.profile_photo).startsWith('http')
          ? (initialData.avatar || initialData.profile_photo)
          : `http://localhost:5000${initialData.avatar || initialData.profile_photo}`)
      : null
  );

  // Load departments and rooms on mount
  useEffect(() => {
    departmentService
      .getAll({ limit: 100 })
      .then((res) => {
        const depts = res?.data || res || [];
        setDepartments(Array.isArray(depts) ? depts : depts.departments || []);
      })
      .catch(() => {});

    roomService
      .getAll({ limit: 100 })
      .then((res) => {
        const roomList = res?.data || res || [];
        setRooms(Array.isArray(roomList) ? roomList : roomList.rooms || []);
      })
      .catch(() => {});
  }, []);

  // Dynamically load programmes whenever department changes
  useEffect(() => {
    const params = { limit: 100 };
    if (formData.department_id) {
      params.department_id = formData.department_id;
    }

    programmeService
      .getAll(params)
      .then((res) => {
        const progs = res?.data || res || [];
        setProgrammes(Array.isArray(progs) ? progs : progs.programmes || []);
      })
      .catch(() => setProgrammes([]));
  }, [formData.department_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const next = { ...prev, [name]: value };
      // If department changed, reset programme
      if (name === 'department_id') {
        next.programme_id = '';
      }
      return next;
    });
    setIsDirty(true);
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.first_name.trim()) errs.first_name = 'First name is required.';
    if (!formData.last_name.trim()) errs.last_name = 'Last name is required.';
    if (!formData.email.trim()) errs.email = 'Email address is required.';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) errs.email = 'Invalid email address format.';
    if (!initialData && !formData.password) errs.password = 'Initial portal password is required.';
    if (!formData.department_id) errs.department_id = 'Please select an academic department.';
    if (!formData.programme_id) errs.programme_id = 'Please select a degree programme.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({ ...formData, photoFile });
  };

  const handleCancel = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      navigate('/students');
    }
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-2xl border border-border shadow-sm">
        {/* 1. Personal Information */}
        <div>
          <h2 className="text-base font-semibold text-text-dark border-b border-border pb-2 mb-4">
            1. Personal Information
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <Input
              label="Student ID Number"
              name="student_number"
              placeholder="e.g. ST2026001 (auto-generated if empty)"
              value={formData.student_number}
              onChange={handleChange}
              error={errors.student_number}
            />
            <Input
              label="First Name *"
              name="first_name"
              placeholder="e.g. Alice"
              value={formData.first_name}
              onChange={handleChange}
              error={errors.first_name}
              required
            />
            <Input
              label="Last Name *"
              name="last_name"
              placeholder="e.g. Johnson"
              value={formData.last_name}
              onChange={handleChange}
              error={errors.last_name}
              required
            />
            <Select
              label="Gender"
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              options={[
                { value: 'male', label: 'Male' },
                { value: 'female', label: 'Female' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <Input
              label="Date of Birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
            />

            {/* Profile Photo Upload */}
            <div className="sm:col-span-2 lg:col-span-3 pt-2">
              <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5 tracking-wide">
                Student Profile Portrait (Optional)
              </label>
              <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-border">
                <div className="w-12 h-12 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden flex-shrink-0">
                  {photoPreview ? (
                    <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <Camera className="w-5 h-5 text-text-secondary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setPhotoFile(file);
                        setPhotoPreview(URL.createObjectURL(file));
                        setIsDirty(true);
                      }
                    }}
                    className="text-xs text-text-secondary file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-white hover:file:bg-primary-hover cursor-pointer"
                  />
                  <p className="text-[11px] text-text-secondary mt-1">
                    Accepts PNG, JPG, or WebP portrait photos (max 5MB).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Academic Enrollment & Room Allocation */}
        <div>
          <h2 className="text-base font-semibold text-text-dark border-b border-border pb-2 mb-4">
            2. Academic Enrollment & Room Venue Allocation
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Select
              label="Faculty Department *"
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              error={errors.department_id}
              required
              options={[
                { value: '', label: 'Select Department...' },
                ...departments.map((d) => ({
                  value: d.id,
                  label: `${d.department_name || d.name} (${d.faculty_name || 'Faculty'})`,
                })),
              ]}
            />

            <Select
              label="Degree Programme *"
              name="programme_id"
              value={formData.programme_id}
              onChange={handleChange}
              error={errors.programme_id}
              required
              options={[
                {
                  value: '',
                  label: formData.department_id
                    ? programmes.length > 0
                      ? 'Select Degree Programme...'
                      : 'No programmes found in this department'
                    : 'Select department first...',
                },
                ...programmes.map((p) => ({
                  value: p.id,
                  label: `${p.programme_name || p.name} (${p.programme_code || 'DEG'})`,
                })),
              ]}
            />

            <Select
              label="Study Year Level"
              name="year_of_study"
              value={formData.year_of_study}
              onChange={handleChange}
              options={[
                { value: 1, label: 'Year 1 (Freshman)' },
                { value: 2, label: 'Year 2 (Sophomore)' },
                { value: 3, label: 'Year 3 (Junior)' },
                { value: 4, label: 'Year 4 (Senior)' },
              ]}
            />

            <Select
              label="Assigned Lecture Room / Section"
              name="preferred_room_id"
              value={formData.preferred_room_id}
              onChange={handleChange}
              options={[
                { value: '', label: 'Select Lecture Room...' },
                ...rooms.map((r) => ({
                  value: r.id,
                  label: `${r.room_number} - Cap: ${r.capacity} (${(r.available_from || '').slice(0, 5)} - ${(r.available_until || '').slice(0, 5)})`,
                })),
              ]}
            />
          </div>
          <p className="text-[11px] text-text-secondary mt-2">
            ℹ️ Selecting a preferred room automatically checks against classroom capacity limits and operating timetable hours.
          </p>
        </div>

        {/* 3. Contact & Credentials */}
        <div>
          <h2 className="text-base font-semibold text-text-dark border-b border-border pb-2 mb-4">
            3. Contact & Portal Authentication
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="University Student Email *"
              name="email"
              type="email"
              placeholder="e.g. alice.johnson@student.edu"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
            />
            <Input
              label="Telephone / Mobile Phone"
              name="phone"
              placeholder="e.g. +1-555-200-0001"
              value={formData.phone}
              onChange={handleChange}
            />
            {!initialData && (
              <Input
                label="Assigned Portal Password *"
                name="password"
                type="password"
                placeholder="e.g. StudentPass@123"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                required
              />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
          <Button type="button" variant="secondary" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={isLoading}>
            {initialData ? 'Update Student Record' : 'Enroll Student'}
          </Button>
        </div>
      </form>

      <ConfirmDialog
        isOpen={showCancelConfirm}
        title="Discard Unsaved Changes?"
        message="Are you sure you want to leave? All entered student registration details will be discarded."
        confirmText="Leave Page"
        cancelText="Keep Editing"
        variant="danger"
        onConfirm={() => {
          setShowCancelConfirm(false);
          navigate('/students');
        }}
        onCancel={() => setShowCancelConfirm(false)}
      />
    </>
  );
};

export default StudentForm;
