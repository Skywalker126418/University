import React, { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Button from '../ui/Button';
import { departmentService } from '../../services/departmentService';
import { lecturerService } from '../../services/lecturerService';

const CourseForm = ({ initialData, onSubmit, onCancel, isLoading }) => {
  const [formData, setFormData] = useState({
    course_code: initialData?.course_code || '',
    course_name: initialData?.course_name || '',
    credits: initialData?.credits || 3,
    department_id: initialData?.department_id || '',
    semester: initialData?.semester || 1,
    level: initialData?.level || 100,
    lecturer_id: initialData?.lecturer_id || '',
    description: initialData?.description || '',
    prerequisites: initialData?.prerequisites || '',
  });

  const [departments, setDepartments] = useState([]);
  const [lecturers, setLecturers] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    departmentService
      .getAll({ limit: 100 })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        setDepartments(list);
      })
      .catch(() => {});

    lecturerService
      .getAll({ limit: 200 })
      .then((res) => {
        const list = Array.isArray(res) ? res : (res?.data || res?.lecturers || []);
        setLecturers(list);
      })
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const errs = {};
    if (!formData.course_code.trim()) errs.course_code = 'Course code is required (e.g. CS201).';
    if (!formData.course_name.trim()) errs.course_name = 'Course name is required.';
    if (!formData.credits || formData.credits < 1 || formData.credits > 10) {
      errs.credits = 'Credits must be between 1 and 10.';
    }
    if (!formData.department_id) errs.department_id = 'Please select a department.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Course Code *"
          name="course_code"
          placeholder="e.g. CS201"
          value={formData.course_code}
          onChange={handleChange}
          error={errors.course_code}
          required
        />
        <Input
          label="Course Name *"
          name="course_name"
          placeholder="e.g. Database Systems"
          value={formData.course_name}
          onChange={handleChange}
          error={errors.course_name}
          required
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Credits *"
          name="credits"
          type="number"
          min="1"
          max="10"
          value={formData.credits}
          onChange={handleChange}
          error={errors.credits}
          required
        />
        <Select
          label="Department *"
          name="department_id"
          value={formData.department_id}
          onChange={handleChange}
          error={errors.department_id}
          required
          options={[
            { value: '', label: 'Select Department...' },
            ...departments.map((d) => ({
              value: d.id,
              label: d.department_name || d.name,
            })),
          ]}
        />
        <Select
          label="Semester"
          name="semester"
          value={formData.semester}
          onChange={handleChange}
          options={[
            { value: 1, label: 'Semester 1' },
            { value: 2, label: 'Semester 2' },
            { value: 3, label: 'Summer Semester' },
          ]}
        />
      </div>

      {/* Lecturer Assignment & Academic Level */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Assigned Lecturer / Instructor"
          name="lecturer_id"
          value={formData.lecturer_id}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select Lecturer to teach this course (Optional)...' },
            ...lecturers.map((l) => ({
              value: l.id,
              label: `${l.first_name} ${l.last_name}${l.specialization ? ` (${l.specialization})` : (l.department_name ? ` (${l.department_name})` : '')}`,
            })),
          ]}
        />
        <Select
          label="Academic Study Level"
          name="level"
          value={formData.level}
          onChange={handleChange}
          options={[
            { value: 100, label: '100 Level (Year 1)' },
            { value: 200, label: '200 Level (Year 2)' },
            { value: 300, label: '300 Level (Year 3)' },
            { value: 400, label: '400 Level (Year 4)' },
            { value: 500, label: '500 Level (Postgraduate)' },
          ]}
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-text-dark mb-1">Description & Syllabus</label>
        <textarea
          name="description"
          rows={3}
          value={formData.description}
          onChange={handleChange}
          placeholder="Brief description of the course, learning objectives, and scope..."
          className="w-full text-sm border border-border rounded-xl p-3 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary bg-white text-text-dark"
        />
      </div>

      <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" variant="primary" loading={isLoading}>
          {initialData ? 'Save Changes' : 'Create Course'}
        </Button>
      </div>
    </form>
  );
};

export default CourseForm;
