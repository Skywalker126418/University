import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { calculateGrade } from '../../utils/formatters';
import { resultService } from '../../services/resultService';
import { useToast } from '../../hooks/useToast';

const ResultsEntryForm = ({ course, students = [], onSaveSuccess }) => {
  const toast = useToast();
  const [marks, setMarks] = useState({});
  const [errors, setErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    // Populate existing marks — students from /courses/:id/students have student_id field
    const initialMarks = {};
    students.forEach((s) => {
      const sId = s.student_id || s.id;
      if (s.mark !== undefined && s.mark !== null && s.mark !== '') {
        initialMarks[sId] = s.mark;
      }
    });
    setMarks(initialMarks);
    setErrors({});
  }, [students]);

  const handleMarkChange = (studentId, val) => {
    setMarks((prev) => ({ ...prev, [studentId]: val }));

    // Real-time validation
    const num = parseFloat(val);
    if (val === '') {
      setErrors((prev) => ({ ...prev, [studentId]: '' }));
    } else if (isNaN(num) || num < 0 || num > 100) {
      setErrors((prev) => ({ ...prev, [studentId]: 'Mark must be between 0 and 100' }));
    } else {
      setErrors((prev) => ({ ...prev, [studentId]: '' }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Check for invalid marks
    const newErrors = {};
    let hasError = false;

    students.forEach((s) => {
      const sId = s.student_id || s.id;
      const val = marks[sId];
      if (val !== undefined && val !== '') {
        const num = parseFloat(val);
        if (isNaN(num) || num < 0 || num > 100) {
          newErrors[sId] = 'Must be between 0 and 100';
          hasError = true;
        }
      }
    });

    if (hasError) {
      setErrors(newErrors);
      toast.error('Please correct mark validation errors before saving.');
      return;
    }

    const payload = students
      .filter((s) => {
        const sId = s.student_id || s.id;
        return marks[sId] !== undefined && marks[sId] !== '';
      })
      .map((s) => ({
        student_id: s.student_id || s.id,
        mark: parseFloat(marks[s.student_id || s.id]),
      }));

    if (payload.length === 0) {
      toast.warning('Please enter marks for at least one student.');
      return;
    }

    try {
      setIsSaving(true);
      await resultService.enterBulk({
        course_id: course.id,
        academic_year: '2025/2026',
        semester: 1,
        results: payload,
      });
      toast.success('Results saved successfully.');
      if (onSaveSuccess) onSaveSuccess();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Failed to save results.';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-white rounded-2xl border border-border p-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
        <div>
          <h2 className="text-lg font-bold text-text-dark">Enter Results</h2>
          <p className="text-xs text-text-secondary">
            Course: <span className="font-semibold text-primary">{course?.course_code} - {course?.course_name}</span> • Semester 1
          </p>
        </div>
        <Button type="submit" variant="primary" loading={isSaving}>
          Save Results
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
            <tr>
              <th className="py-3 px-4">Student ID</th>
              <th className="py-3 px-4">Student Name</th>
              <th className="py-3 px-4 w-40">Mark (0 - 100)</th>
              <th className="py-3 px-4 w-28">Grade</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {students.length > 0 ? (
              students.map((s) => {
                const sId = s.student_id || s.id;
                const currentMark = marks[sId] !== undefined ? marks[sId] : '';
                const calculated = currentMark !== '' && !isNaN(currentMark) ? calculateGrade(parseFloat(currentMark)) : null;
                const err = errors[sId];

                return (
                  <tr key={sId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-primary">{s.student_number || `ST-${sId}`}</td>
                    <td className="py-3 px-4 font-medium text-text-dark">{s.first_name ? `${s.first_name} ${s.last_name}` : s.name}</td>
                    <td className="py-3 px-4">
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={currentMark}
                        onChange={(e) => handleMarkChange(sId, e.target.value)}
                        placeholder="0 - 100"
                        className={`w-28 text-sm px-3 py-1.5 border rounded-lg focus:outline-none focus:ring-2 ${
                          err ? 'border-red-500 focus:ring-red-200' : 'border-border focus:border-primary focus:ring-blue-100'
                        }`}
                      />
                      {err && <p className="text-[11px] text-red-600 mt-1">{err}</p>}
                    </td>
                    <td className="py-3 px-4 font-bold text-text-dark">
                      {calculated ? (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          calculated.grade.startsWith('A') ? 'bg-emerald-100 text-emerald-800' :
                          calculated.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                          calculated.grade.startsWith('C') ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {calculated.grade} ({calculated.points} pts)
                        </span>
                      ) : (
                        <span className="text-text-secondary text-xs">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {currentMark !== '' ? (
                        <span className="text-xs text-emerald-600 font-medium">Ready</span>
                      ) : (
                        <span className="text-xs text-text-secondary">Unentered</span>
                      )}
                    </td>
                  </tr>
                );
              })

            ) : (
              <tr>
                <td colSpan="5" className="py-8 text-center text-text-secondary text-xs">
                  No enrolled students found for this module.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </form>
  );
};

export default ResultsEntryForm;
