import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  BookOpen, Plus, Search, Edit, Trash2, CheckCircle, Clock,
  Download, GraduationCap, ClipboardList, ArrowRight, User
} from 'lucide-react';
import { courseService } from '../../services/courseService';
import { registrationService } from '../../services/registrationService';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Modal from '../../components/ui/Modal';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CourseForm from '../../components/forms/CourseForm';
import Tooltip from '../../components/ui/Tooltip';

const CoursesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const isStudent = user?.role === 'student';
  const isAdmin = user?.role === 'admin';

  // Tabs for students: 'enrolled' | 'catalog'
  const [activeTab, setActiveTab] = useState(isStudent ? 'enrolled' : 'catalog');

  const [courses, setCourses] = useState([]);
  const [myRegistrations, setMyRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolledLoading, setEnrolledLoading] = useState(false);
  const [search, setSearch] = useState('');

  // Modals for admin
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [deletingCourse, setDeletingCourse] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch full course catalog
  const fetchCourses = async () => {
    try {
      setLoading(true);
      const res = await courseService.getAll({ search });
      const data = res?.data || res || [];
      setCourses(Array.isArray(data) ? data : data.courses || []);
    } catch (err) {
      toast.error('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch student's own registered/enrolled courses
  const fetchMyRegistrations = async () => {
    if (!isStudent) return;
    try {
      setEnrolledLoading(true);
      const res = await registrationService.getMyRegistrations();
      const list = res?.data || res || [];
      setMyRegistrations(Array.isArray(list) ? list : list.registrations || []);
    } catch (err) {
      console.error('Error fetching enrolled courses:', err);
    } finally {
      setEnrolledLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCourses();
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    if (isStudent) {
      fetchMyRegistrations();
    }
  }, [isStudent]);

  const handleCreateCourse = async (formData) => {
    try {
      setIsSubmitting(true);
      await courseService.create(formData);
      toast.success('Course created successfully.');
      setIsAddModalOpen(false);
      fetchCourses();
    } catch (err) {
      toast.error(err.message || 'Failed to create course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCourse = async (formData) => {
    try {
      setIsSubmitting(true);
      await courseService.update(editingCourse.id, formData);
      toast.success('Course updated successfully.');
      setEditingCourse(null);
      fetchCourses();
    } catch (err) {
      toast.error(err.message || 'Failed to update course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCourse = async () => {
    if (!deletingCourse) return;
    try {
      setIsSubmitting(true);
      await courseService.delete(deletingCourse.id);
      toast.success(`Course ${deletingCourse.course_code} removed successfully.`);
      setDeletingCourse(null);
      fetchCourses();
    } catch (err) {
      toast.error(err.message || 'Failed to delete course.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    if (courses.length === 0) {
      toast.warning('No courses to export.');
      return;
    }
    const headers = ['Course Code', 'Course Name', 'Credits', 'Department', 'Semester', 'Level'];
    const rows = courses.map((c) => [
      `"${c.course_code || ''}"`,
      `"${c.course_name || ''}"`,
      c.credits || 0,
      `"${c.department_name || ''}"`,
      c.semester || 1,
      c.level || 100,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `course_catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Course catalog CSV downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">
            {isStudent ? 'My Academic Courses' : 'Course Catalog'}
          </h1>
          <p className="text-xs text-text-secondary mt-0.5">
            {isStudent
              ? 'View the courses you are currently enrolled in, or browse the university course catalog.'
              : 'Academic courses, module syllabus descriptions, and faculty assignments.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isStudent ? (
            <Link to="/registration">
              <Button variant="primary" icon={ClipboardList}>
                Register Courses
              </Button>
            </Link>
          ) : (
            <>
              <Button variant="outline" icon={Download} onClick={handleExportCSV}>
                Export Catalog
              </Button>
              {isAdmin && (
                <Button variant="primary" icon={Plus} onClick={() => setIsAddModalOpen(true)}>
                  Add Course
                </Button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Tabs for Students */}
      {isStudent && (
        <div className="flex items-center gap-2 border-b border-border pb-1">
          <button
            onClick={() => setActiveTab('enrolled')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'enrolled'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-dark'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>My Enrolled Courses</span>
            <span className={`px-2 py-0.2 rounded-full text-xs ${
              activeTab === 'enrolled' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-text-secondary'
            }`}>
              {myRegistrations.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('catalog')}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'catalog'
                ? 'border-primary text-primary'
                : 'border-transparent text-text-secondary hover:text-text-dark'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>All University Courses (Catalog)</span>
            <span className="px-2 py-0.2 rounded-full text-xs bg-slate-100 text-text-secondary">
              {courses.length}
            </span>
          </button>
        </div>
      )}

      {/* TAB 1: STUDENT ENROLLED COURSES */}
      {isStudent && activeTab === 'enrolled' ? (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
          {enrolledLoading ? (
            <div className="p-12">
              <LoadingSpinner message="Fetching your enrolled courses..." />
            </div>
          ) : myRegistrations.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="py-3.5 px-4">Course Code</th>
                    <th className="py-3.5 px-4">Course Title</th>
                    <th className="py-3.5 px-4">Credits</th>
                    <th className="py-3.5 px-4">Academic Term</th>
                    <th className="py-3.5 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {myRegistrations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-primary">{r.course_code || 'SENG 1849'}</td>
                      <td className="py-3.5 px-4 font-medium text-text-dark">{r.course_name || 'Software Engineering'}</td>
                      <td className="py-3.5 px-4 text-text-secondary">{r.credits || 3} Credits</td>
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {r.academic_year || '2025/2026'} &bull; Semester {r.semester || 1}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
                          {r.status === 'approved' ? 'Enrolled' : r.status === 'rejected' ? 'Rejected' : 'Pending Approval'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-16 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 text-primary flex items-center justify-center mx-auto">
                <GraduationCap className="w-8 h-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-text-dark">No Enrolled Courses Yet</h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  You have not registered for any study units this semester yet. Pick your semester modules in the course registration portal.
                </p>
              </div>
              <div className="pt-2">
                <Link to="/registration">
                  <Button variant="primary" icon={ArrowRight}>
                    Go to Course Registration
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* TAB 2: COURSE CATALOG (ALL COURSES) */
        <div className="space-y-4">
          {/* Search */}
          <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search catalog by course code (e.g. SENG 1849) or title..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-sm pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
            {loading ? (
              <div className="p-12">
                <LoadingSpinner message="Fetching academic courses..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                    <tr>
                      <th className="py-3.5 px-4">Code</th>
                      <th className="py-3.5 px-4">Course Name</th>
                      <th className="py-3.5 px-4">Credits</th>
                      <th className="py-3.5 px-4">Department</th>
                      <th className="py-3.5 px-4">Assigned Lecturer</th>
                      <th className="py-3.5 px-4">Semester</th>
                      <th className="py-3.5 px-4">Status</th>
                      {isAdmin && <th className="py-3.5 px-4 text-right">Actions</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {courses.length > 0 ? (
                      courses.map((c) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 px-4 font-bold text-primary">{c.course_code}</td>
                          <td className="py-3.5 px-4 font-medium text-text-dark">{c.course_name || c.name}</td>
                          <td className="py-3.5 px-4 text-text-secondary">{c.credits} Credits</td>
                          <td className="py-3.5 px-4 text-text-secondary text-xs">{c.department_name || 'Department'}</td>
                          <td className="py-3.5 px-4 text-xs">
                            {c.lecturer_name ? (
                              <span className="font-medium text-primary bg-primary/5 px-2.5 py-1 rounded-lg border border-primary/10">
                                {c.lecturer_name}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Not assigned</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-text-dark">Semester {c.semester || 1}</td>
                          <td className="py-3.5 px-4">
                            <Badge variant={c.is_active ? 'success' : 'default'}>
                              {c.is_active ? 'Active' : 'Archived'}
                            </Badge>
                          </td>
                          {isAdmin && (
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Tooltip content="Edit Course">
                                  <button
                                    onClick={() => setEditingCourse(c)}
                                    className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-blue-50 transition-colors"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                                <Tooltip content="Delete Course">
                                  <button
                                    onClick={() => setDeletingCourse(c)}
                                    className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </Tooltip>
                              </div>
                            </td>
                          )}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="py-12 text-center text-text-secondary text-xs">
                          No courses found matching the search criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Course Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Course"
      >
        <CourseForm
          onSubmit={handleCreateCourse}
          onCancel={() => setIsAddModalOpen(false)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Edit Course Modal */}
      <Modal
        isOpen={!!editingCourse}
        onClose={() => setEditingCourse(null)}
        title={`Edit Course: ${editingCourse?.course_code}`}
      >
        <CourseForm
          initialData={editingCourse}
          onSubmit={handleUpdateCourse}
          onCancel={() => setEditingCourse(null)}
          isLoading={isSubmitting}
        />
      </Modal>

      {/* Delete Course Confirm Dialog */}
      <ConfirmDialog
        isOpen={!!deletingCourse}
        title="Delete Course?"
        message={`Are you sure you want to delete ${deletingCourse?.course_code} - ${deletingCourse?.course_name}? This action cannot be easily undone.`}
        confirmText="Delete Course"
        cancelText="Cancel"
        variant="danger"
        isLoading={isSubmitting}
        onConfirm={handleDeleteCourse}
        onCancel={() => setDeletingCourse(null)}
      />
    </div>
  );
};

export default CoursesPage;
