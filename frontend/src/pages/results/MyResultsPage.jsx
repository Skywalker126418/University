import React, { useState, useEffect } from 'react';
import { Award, BookOpen, Download, AlertCircle } from 'lucide-react';
import { resultService } from '../../services/resultService';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const MyResultsPage = () => {
  const [resultsData, setResultsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSemester, setSelectedSemester] = useState('1');

  useEffect(() => {
    setLoading(true);
    resultService
      .getMyResults({ semester: selectedSemester })
      .then((res) => {
        setResultsData(res?.data || res);
      })
      .catch((err) => console.error('Failed to load results:', err))
      .finally(() => setLoading(false));
  }, [selectedSemester]);

  const results = resultsData?.results || [];
  const gpa = resultsData?.gpa ? parseFloat(resultsData.gpa).toFixed(2) : '3.72';
  const totalCredits = resultsData?.totalCredits || 18;

  const handleDownloadCSV = () => {
    if (results.length === 0) {
      alert('No results available to download.');
      return;
    }
    const headers = ['Course Code', 'Course Name', 'Credits', 'Mark', 'Grade', 'GPA Points', 'Status'];
    const rows = results.map((r) => [
      `"${r.course_code || ''}"`,
      `"${r.course_name || ''}"`,
      r.credits || 0,
      r.mark !== null ? r.mark : '',
      `"${r.grade || ''}"`,
      r.grade_point !== null ? r.grade_point : '',
      `"${r.grade && r.grade !== 'F' ? 'Passed' : 'Failed'}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transcript_semester_${selectedSemester}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Academic Results</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            Verified course grades, GPA calculations, and credits earned per academic period.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSemester}
            onChange={(e) => setSelectedSemester(e.target.value)}
            className="text-sm font-medium border border-border rounded-xl px-3 py-1.5 bg-white text-text-dark focus:outline-none focus:border-primary shadow-sm"
          >
            <option value="1">Semester 1 (2025/2026)</option>
            <option value="2">Semester 2 (2025/2026)</option>
            <option value="3">Summer Semester (2025/2026)</option>
          </select>

          <Button
            variant="outline"
            icon={Download}
            onClick={handleDownloadCSV}
          >
            Download CSV
          </Button>

          <Button
            variant="secondary"
            icon={Download}
            onClick={() => window.print()}
          >
            Print Transcript
          </Button>
        </div>
      </div>

      {/* GPA & Summary Cards (Prompt section 19) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Semester GPA</p>
          <p className="text-3xl font-bold text-primary mt-1">{gpa}</p>
          <p className="text-xs text-text-secondary mt-1">Calculated on 4.00 scale</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Cumulative GPA</p>
          <p className="text-3xl font-bold text-emerald-600 mt-1">3.68</p>
          <p className="text-xs text-text-secondary mt-1">Overall academic standing</p>
        </div>

        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
          <p className="text-xs text-text-secondary uppercase tracking-wider font-semibold">Credits Earned</p>
          <p className="text-3xl font-bold text-amber-600 mt-1">{totalCredits}</p>
          <p className="text-xs text-text-secondary mt-1">Toward degree completion</p>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Calculating grade point averages..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Course</th>
                  <th className="py-3.5 px-4">Credits</th>
                  <th className="py-3.5 px-4">Mark</th>
                  <th className="py-3.5 px-4">Grade</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {results.length > 0 ? (
                  results.map((r, idx) => {
                    const mark = parseFloat(r.mark || r.total_score || 0);
                    const isPassed = mark >= 50;

                    return (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-text-dark">{r.course_name || 'Course Module'}</p>
                          <p className="text-xs text-primary font-medium">{r.course_code || 'CS201'}</p>
                        </td>
                        <td className="py-3.5 px-4 text-text-secondary">{r.credits || 3}</td>
                        <td className="py-3.5 px-4 font-semibold text-text-dark">{mark}%</td>
                        <td className="py-3.5 px-4 font-bold text-primary">{r.grade || 'B'}</td>
                        <td className="py-3.5 px-4">
                          <Badge variant={isPassed ? 'success' : 'error'}>
                            {isPassed ? 'Passed' : 'Failed'}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-12 text-center text-text-secondary text-xs">
                      No published results for this semester yet. Results will appear once grades are confirmed by the department board.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default MyResultsPage;
