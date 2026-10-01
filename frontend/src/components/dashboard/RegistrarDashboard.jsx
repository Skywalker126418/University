import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  CheckSquare,
  ArrowRight,
  Check,
  X,
  School,
  Building2,
  BookOpen,
} from 'lucide-react';
import StatCard from './StatCard';
import { dashboardService } from '../../services/dashboardService';
import { registrationService } from '../../services/registrationService';
import { useToast } from '../../hooks/useToast';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const RegistrarDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pendingList, setPendingList] = useState([]);
  const toast = useToast();

  const loadData = () => {
    setLoading(true);
    dashboardService
      .getDashboardData()
      .then((res) => {
        const d = res?.data || res;
        setData(d);
        setPendingList(d?.recentRegistrations || d?.pendingRegistrations || []);
      })
      .catch((err) => console.error('Failed to load registrar dashboard:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleApprove = async (id) => {
    try {
      await registrationService.approve(id);
      toast.success('Registration approved successfully.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to approve registration.');
    }
  };

  const handleReject = async (id) => {
    try {
      await registrationService.reject(id, 'Course prerequisites or quota limit reached.');
      toast.success('Registration rejected.');
      loadData();
    } catch (err) {
      toast.error(err.message || 'Failed to reject registration.');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading registrar records from database..." />;
  }

  const counts = data?.counts || data?.registrationCounts || {};
  const pendingCount = counts.pending ?? data?.pendingCount ?? 0;
  const approvedCount = counts.approved ?? data?.approvedCount ?? 0;
  const rejectedCount = counts.rejected ?? data?.rejectedCount ?? 0;
  const totalCount = counts.total ?? (pendingCount + approvedCount + rejectedCount);

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Registrar Academic Records</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Review student registrations, faculty allocations, and module approvals in real time.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/registrations/approvals">
            <Button variant="primary" icon={CheckSquare} size="sm">
              Process Approvals
            </Button>
          </Link>
          <Link to="/students">
            <Button variant="secondary" icon={FileText} size="sm">
              Students Registry
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Pending Approvals"
          value={pendingCount}
          subtitle="Awaiting registrar review"
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Approved Enrollments"
          value={approvedCount}
          subtitle="Officially confirmed"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="Rejected / Returned"
          value={rejectedCount}
          subtitle="Requires revision"
          icon={XCircle}
          color="red"
        />
        <StatCard
          title="Total Registrations"
          value={totalCount}
          subtitle="Processed this semester"
          icon={FileText}
          color="blue"
        />
      </div>

      {/* Prominent Pending Approvals Table */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-dark">Course Registration Submissions</h2>
            <p className="text-xs text-text-secondary">Direct enrollment records submitted by students</p>
          </div>
          <Link
            to="/registrations/approvals"
            className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
          >
            All approval queues <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Student ID</th>
                <th className="py-3 px-4">Course</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {pendingList.length > 0 ? (
                pendingList.map((r, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-medium text-text-dark">
                      {r.first_name ? `${r.first_name} ${r.last_name}` : 'Student'}
                    </td>
                    <td className="py-3 px-4 text-primary font-medium">{r.student_number || 'ST-N/A'}</td>
                    <td className="py-3 px-4 text-text-secondary">{r.course_code || r.course_name || 'Course'}</td>
                    <td className="py-3 px-4 text-text-secondary text-xs">
                      {r.registered_at ? new Date(r.registered_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={r.status === 'approved' ? 'success' : r.status === 'rejected' ? 'error' : 'warning'}>
                        {r.status || 'pending'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {r.status === 'pending' || !r.status ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleApprove(r.id)}
                            className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            title="Approve registration"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleReject(r.id)}
                            className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                            title="Reject registration"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-text-secondary">Processed</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-text-secondary text-xs">
                    No course registrations recorded in the database yet. When students register, they will appear here.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RegistrarDashboard;
