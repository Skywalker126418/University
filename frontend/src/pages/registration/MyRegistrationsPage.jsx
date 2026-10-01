import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardList, Plus, Calendar, Clock } from 'lucide-react';
import { registrationService } from '../../services/registrationService';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const MyRegistrationsPage = () => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    registrationService
      .getMyRegistrations()
      .then((res) => {
        const list = res?.data || res || [];
        setRegistrations(Array.isArray(list) ? list : list.registrations || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-dark">My Registered Courses</h1>
          <p className="text-xs text-text-secondary mt-0.5">
            View status of all course registration submissions across academic semesters.
          </p>
        </div>
        <Link to="/registration">
          <Button variant="primary" icon={Plus}>
            New Registration
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12">
            <LoadingSpinner message="Loading your registration submissions..." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="py-3.5 px-4">Course Code</th>
                  <th className="py-3.5 px-4">Course Name</th>
                  <th className="py-3.5 px-4">Credits</th>
                  <th className="py-3.5 px-4">Term</th>
                  <th className="py-3.5 px-4">Submitted Date</th>
                  <th className="py-3.5 px-4">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {registrations.length > 0 ? (
                  registrations.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-primary">{r.course_code || 'CS201'}</td>
                      <td className="py-3.5 px-4 font-medium text-text-dark">{r.course_name || 'Database Systems'}</td>
                      <td className="py-3.5 px-4 text-text-secondary">{r.credits || 3} Credits</td>
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {r.academic_year || '2025/2026'} - Sem {r.semester || 1}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-text-secondary">
                        {r.registered_at ? new Date(r.registered_at).toLocaleDateString() : 'Recent'}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
                          {r.status || 'Pending'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-text-secondary text-xs">
                      No registrations found. Click "New Registration" to register courses.
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

export default MyRegistrationsPage;
