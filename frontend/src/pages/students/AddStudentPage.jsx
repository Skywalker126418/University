import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import StudentForm from '../../components/forms/StudentForm';
import { studentService } from '../../services/studentService';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';

import { authService } from '../../services/authService';

const AddStudentPage = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (formData) => {
    try {
      setIsLoading(true);
      const res = await studentService.create(formData);
      const created = res?.data || res;
      if (formData.photoFile && created?.user_id) {
        try {
          await authService.uploadUserPhoto(created.user_id, formData.photoFile);
        } catch (e) {
          console.warn('Student photo upload warning:', e);
        }
      }
      toast.success('Student account created successfully.');
      navigate('/students');
    } catch (err) {
      toast.error(err.message || 'Failed to create student account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/students')}
          className="p-2 rounded-xl border border-border bg-white text-text-secondary hover:text-text-dark hover:bg-slate-50 transition-colors"
          aria-label="Back to student list"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Enroll New Student</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Register personal, academic, and portal authentication details for a new student.
          </p>
        </div>
      </div>

      <StudentForm onSubmit={handleSubmit} isLoading={isLoading} />
    </div>
  );
};

export default AddStudentPage;
