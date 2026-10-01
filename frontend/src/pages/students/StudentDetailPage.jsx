import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  BookOpen,
  Award,
  Camera,
  Download,
  Trash2,
  ZoomIn,
  X,
  DoorOpen,
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { authService } from '../../services/authService';
import { useToast } from '../../hooks/useToast';
import StudentForm from '../../components/forms/StudentForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';

const StudentDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toast = useToast();

  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === 'true');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showFullPhoto, setShowFullPhoto] = useState(false);

  const fetchStudent = async () => {
    try {
      setLoading(true);
      const res = await studentService.getById(id);
      setStudent(res?.data || res);
    } catch (err) {
      toast.error('Failed to load student details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudent();
  }, [id]);

  const handleUpdate = async (formData) => {
    try {
      setIsSaving(true);
      await studentService.update(id, formData);
      toast.success('Student records updated successfully.');
      setIsEditing(false);
      fetchStudent();
    } catch (err) {
      toast.error(err.message || 'Failed to update student records.');
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size must be less than 5MB.');
      return;
    }

    try {
      setIsUploadingPhoto(true);
      await authService.uploadUserPhoto(student.user_id, file);
      toast.success('Student profile photo updated successfully.');
      fetchStudent();
    } catch (err) {
      toast.error(err.message || 'Failed to upload photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    if (!window.confirm('Are you sure you want to remove this profile photo?')) return;
    try {
      setIsUploadingPhoto(true);
      await authService.deleteUserPhoto(student.user_id);
      toast.success('Student profile photo removed.');
      fetchStudent();
    } catch (err) {
      toast.error(err.message || 'Failed to remove photo.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDownloadPhoto = () => {
    const photoUrl = student?.avatar || student?.profile_photo;
    if (!photoUrl) return;
    const fullUrl = photoUrl.startsWith('http') ? photoUrl : `http://localhost:5000${photoUrl}`;
    const link = document.createElement('a');
    link.href = fullUrl;
    link.download = `student_${student.student_number || student.id}_photo.jpg`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Downloading student photo...');
  };

  if (loading) {
    return <LoadingSpinner message="Loading student profile..." />;
  }

  if (!student) {
    return (
      <div className="bg-white p-8 rounded-2xl border border-border text-center space-y-4">
        <p className="text-sm text-text-secondary">Student record not found.</p>
        <Button variant="secondary" onClick={() => navigate('/students')}>
          Back to Students
        </Button>
      </div>
    );
  }

  const rawPhoto = student.avatar || student.profile_photo;
  const avatarSrc = rawPhoto
    ? (rawPhoto.startsWith('http') ? rawPhoto : `http://localhost:5000${rawPhoto}`)
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/students')}
            className="p-2 rounded-xl border border-border bg-white text-text-secondary hover:text-text-dark hover:bg-slate-50 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-text-dark">
              {student.first_name} {student.last_name}
            </h1>
            <p className="text-xs text-text-secondary">
              ID: <span className="font-semibold text-primary">{student.student_number || student.student_id}</span>
            </p>
          </div>
        </div>

        <Button
          variant={isEditing ? 'secondary' : 'primary'}
          onClick={() => setIsEditing(!isEditing)}
        >
          {isEditing ? 'View Profile' : 'Edit Information'}
        </Button>
      </div>

      {isEditing ? (
        <StudentForm initialData={student} onSubmit={handleUpdate} isLoading={isSaving} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left card with Photo actions */}
          <div className="bg-white p-6 rounded-2xl border border-border shadow-sm space-y-4 text-center">
            {/* Avatar container */}
            <div className="relative w-28 h-28 mx-auto group">
              <div className="w-28 h-28 rounded-2xl overflow-hidden bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold border-2 border-border shadow-sm">
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={`${student.first_name} ${student.last_name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {student.first_name?.[0]}{student.last_name?.[0]}
                  </span>
                )}
              </div>

              {/* Upload trigger overlay */}
              <label
                className="absolute bottom-1 right-1 p-2 bg-primary hover:bg-primary-hover text-white rounded-xl cursor-pointer shadow-md transition-all"
                title="Upload / Change Photo"
              >
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={isUploadingPhoto}
                  className="hidden"
                />
              </label>
            </div>

            {/* Photo Action Buttons */}
            <div className="flex items-center justify-center gap-2 pt-1 flex-wrap">
              {avatarSrc && (
                <>
                  <button
                    onClick={() => setShowFullPhoto(true)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-primary bg-slate-50 hover:bg-primary/10 rounded-lg transition-colors border border-border"
                    title="View full-size photo"
                  >
                    <ZoomIn className="w-3.5 h-3.5" /> View
                  </button>

                  <button
                    onClick={handleDownloadPhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-primary bg-slate-50 hover:bg-primary/10 rounded-lg transition-colors border border-border"
                    title="Download photo"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>

                  <button
                    onClick={handleDeletePhoto}
                    disabled={isUploadingPhoto}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                    title="Delete photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </>
              )}
            </div>

            <div className="text-center pt-2 border-t border-border">
              <h2 className="text-lg font-bold text-text-dark">{student.first_name} {student.last_name}</h2>
              <p className="text-xs text-text-secondary">{student.email}</p>
              <div className="mt-2">
                <Badge variant={student.status === 'active' ? 'success' : 'error'}>
                  {student.status || 'Active'}
                </Badge>
              </div>
            </div>

            <div className="pt-3 border-t border-border space-y-2.5 text-xs text-text-secondary text-left">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <span>{student.phone || 'No phone recorded'}</span>
              </div>
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <span>{student.programme_name || 'Degree Programme'}</span>
              </div>
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <span>Room: <strong className="text-text-dark">{student.room_number ? `${student.room_number} (${student.building || 'Campus'})` : 'Not assigned'}</strong></span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-text-secondary flex-shrink-0" />
                <span>Enrolled: {student.enrollment_date ? new Date(student.enrollment_date).toLocaleDateString() : 'Active'}</span>
              </div>
            </div>
          </div>

          {/* Right cards */}
          <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-border shadow-sm space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-text-dark border-b border-border pb-2 mb-4">
                Academic Standing & Enrollment
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-text-secondary">Year of Study</p>
                  <p className="font-semibold text-text-dark mt-0.5">Year {student.year_of_study || 1}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Department</p>
                  <p className="font-semibold text-text-dark mt-0.5">{student.department_name || 'Academic Department'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Intake Year</p>
                  <p className="font-semibold text-text-dark mt-0.5">{student.intake_year || new Date().getFullYear()}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-text-dark border-b border-border pb-2 mb-4">
                Personal Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="text-text-secondary">Gender</p>
                  <p className="font-semibold text-text-dark mt-0.5 capitalize">{student.gender || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-text-secondary">Date of Birth</p>
                  <p className="font-semibold text-text-dark mt-0.5">
                    {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-text-secondary">Residential Address</p>
                  <p className="font-semibold text-text-dark mt-0.5">{student.address || 'Campus Residence'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Full Photo Modal */}
      {showFullPhoto && avatarSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowFullPhoto(false)}
        >
          <div
            className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-semibold text-sm text-text-dark">
                {student.first_name} {student.last_name} — Profile Photo
              </h3>
              <button
                onClick={() => setShowFullPhoto(false)}
                className="p-1 rounded-lg text-text-secondary hover:text-text-dark hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img
                src={avatarSrc}
                alt="Student Full Profile"
                className="max-h-[65vh] w-auto object-contain rounded-xl shadow-md"
              />
            </div>
            <div className="p-4 flex items-center justify-between bg-white border-t border-border">
              <button
                onClick={handleDownloadPhoto}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-primary text-white rounded-lg hover:bg-primary-hover"
              >
                <Download className="w-4 h-4" /> Download Photo
              </button>
              <button
                onClick={() => setShowFullPhoto(false)}
                className="px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-slate-100 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDetailPage;
