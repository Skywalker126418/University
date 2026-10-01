import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Eye,
  Edit,
  Trash2,
  Filter,
  CheckCircle,
  XCircle,
  Download,
} from 'lucide-react';
import { studentService } from '../../services/studentService';
import { departmentService } from '../../services/departmentService';
import { useToast } from '../../hooks/useToast';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import Tooltip from '../../components/ui/Tooltip';

const StudentsPage = () => {
  const navigate = useNavigate();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [departments, setDepartments] = useState([]);

  // Delete modal state
  const [deletingStudent, setDeletingStudent] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await studentService.getAll({
        search,
        department_id: selectedDept || undefined,
        year: selectedYear || undefined,
      });
      const data = res?.data || res || [];
      setStudents(Array.isArray(data) ? data : data.students || []);
    } catch (err) {
      toast.error('Failed to load students.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    departmentService
      .getAll()
      .then((res) => setDepartments(res?.data || res || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents();
    }, 300);
    return () => clearTimeout(timer);
  }, [search, selectedDept, selectedYear]);

  const handleConfirmDelete = async () => {
    if (!deletingStudent) return;
    try {
      setIsDeleting(true);
      await studentService.delete(deletingStudent.id);
      toast.success(`Student ${deletingStudent.first_name} ${deletingStudent.last_name} deactivated successfully.`);
      setDeletingStudent(null);
      fetchStudents();
    } catch (err) {
      toast.error(err.message || 'Failed to deactivate student.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleExportCSV = () => {
    if (students.length === 0) {
      toast.warning('No students to export.');
      return;
    }
    const headers = ['Student ID', 'First Name', 'Last Name', 'Email', 'Programme', 'Status'];
    const rows = students.map((s) => [
      `"${s.student_number || s.student_id || s.id}"`,
      `"${s.first_name || ''}"`,
      `"${s.last_name || ''}"`,
      `"${s.email || ''}"`,
      `"${s.programme_name || ''}"`,
      s.status || 'active',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `students_directory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Students directory CSV downloaded.');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Student Directory</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Manage enrolled students, academic standing, and profiles across all faculties.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" icon={Download} onClick={handleExportCSV}>
            Export Directory
          </Button>
          <Link to="/students/add">
            <Button variant="primary" icon={Plus}>
              Add Student
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search students by name, email, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-sm pl-10 pr-4 py-2 border border-border rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-white text-text-dark focus:outline-none focus:border-primary"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.department_name || d.name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="text-sm border border-border rounded-xl px-3 py-2 bg-white text-text-dark focus:outline-none focus:border-primary"
          >
            <option value="">All Years</option>
            <option value="1">Year 1</option>
            <option value="2">Year 2</option>
            <option value="3">Year 3</option>
            <option value="4">Year 4</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Fetching student records..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Student ID</th>
                  <th className="py-3.5 px-4">Name</th>
                  <th className="py-3.5 px-4">Programme</th>
                  <th className="py-3.5 px-4">Year</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.length > 0 ? (
                  students.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-semibold text-primary">
                        {s.student_number || s.student_id || `ST-${s.id}`}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-text-dark">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 overflow-hidden border border-border">
                            {s.avatar || s.profile_photo ? (
                              <img
                                src={(s.avatar || s.profile_photo).startsWith('http') ? (s.avatar || s.profile_photo) : `http://localhost:5000${s.avatar || s.profile_photo}`}
                                alt={`${s.first_name} ${s.last_name}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span className="text-primary text-xs font-bold">
                                {s.first_name?.[0]}{s.last_name?.[0]}
                              </span>
                            )}
                          </div>
                          <span>{s.first_name} {s.last_name}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-text-secondary text-xs">
                        {s.programme_name || 'B.Sc. Computer Science'}
                      </td>
                      <td className="py-3.5 px-4 text-text-dark font-medium">Year {s.year_of_study || 1}</td>
                      <td className="py-3.5 px-4 text-text-secondary text-xs">{s.email}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={s.status === 'active' ? 'success' : 'error'}>
                          {s.status || 'active'}
                        </Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip content="View Student Details">
                            <button
                              onClick={() => navigate(`/students/${s.id}`)}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-blue-50 transition-colors"
                              aria-label="View student details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          <Tooltip content="Edit Student">
                            <button
                              onClick={() => navigate(`/students/${s.id}?edit=true`)}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-primary hover:bg-blue-50 transition-colors"
                              aria-label="Edit student"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          <Tooltip content="Deactivate Student">
                            <button
                              onClick={() => setDeletingStudent(s)}
                              className="p-1.5 rounded-lg text-text-secondary hover:text-red-600 hover:bg-red-50 transition-colors"
                              aria-label="Deactivate student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-text-secondary text-xs">
                      No matching student records found. Try modifying your search or filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Deactivation */}
      <ConfirmDialog
        isOpen={!!deletingStudent}
        title="Deactivate Student Account?"
        message={`Are you sure you want to deactivate ${deletingStudent?.first_name} ${deletingStudent?.last_name} (${deletingStudent?.student_number || deletingStudent?.student_id})? The student will lose portal access until reactivated.`}
        confirmText="Deactivate"
        cancelText="Cancel"
        variant="danger"
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingStudent(null)}
      />
    </div>
  );
};

export default StudentsPage;
