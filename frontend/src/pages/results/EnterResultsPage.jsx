import React, { useState, useEffect } from 'react';
import { BookOpen } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import lecturerService from '../../services/lecturerService';
import { courseService } from '../../services/courseService';
import ResultsEntryForm from '../../components/forms/ResultsEntryForm';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const EnterResultsPage = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);

  // Load lecturer's assigned courses only
  useEffect(() => {
    setLoading(true);
    lecturerService.getMyProfile()
      .then((res) => {
        const profile = res?.data || res || {};
        const lecturerId = profile?.id;
        if (lecturerId) {
          return lecturerService.getCourses(lecturerId);
        }
        return { data: [] };
      })
      .then((res) => {
        const list = Array.isArray(res) ? res : (Array.isArray(res?.data) ? res.data : []);
        setCourses(list);
        if (list.length > 0) {
          setSelectedCourseId(String(list[0].id));
        }
      })
      .catch(() => setCourses([]))
      .finally(() => setLoading(false));
  }, []);

  // Load students enrolled in the selected course
  useEffect(() => {
    if (!selectedCourseId) return;
    setStudentsLoading(true);
    courseService.getEnrolled(selectedCourseId)
      .then((res) => {
        const data = res?.data || res || [];
        const list = Array.isArray(data) ? data : (data.students || []);
        setStudents(list);
      })
      .catch(() => setStudents([]))
      .finally(() => setStudentsLoading(false));
  }, [selectedCourseId]);

  const selectedCourse = courses.find((c) => String(c.id) === String(selectedCourseId)) || courses[0];

  if (loading) {
    return <LoadingSpinner message="Loading course assessment portal..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Enter Student Results</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Record continuous assessment scores, examination marks, and compute semester grade points.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-text-secondary">Select Course:</label>
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="text-sm font-medium border border-border rounded-xl px-3 py-1.5 bg-white text-text-dark focus:outline-none focus:border-primary shadow-sm"
          >
            {courses.length === 0 && <option value="">No courses assigned</option>}
            {courses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.course_code} - {c.course_name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedCourse && (
        studentsLoading ? (
          <div className="bg-white rounded-2xl border border-border p-12 flex justify-center">
            <LoadingSpinner message="Loading enrolled students..." />
          </div>
        ) : (
          <ResultsEntryForm
            course={selectedCourse}
            students={students}
            onSaveSuccess={() => {}}
          />
        )
      )}
    </div>
  );
};

export default EnterResultsPage;
