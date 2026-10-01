import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Award,
  CreditCard,
  Bell,
  ArrowRight,
  Calendar,
  ClipboardList,
  UserCheck,
  CheckCircle,
  DoorOpen,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import StatCard from './StatCard';
import { dashboardService } from '../../services/dashboardService';
import LoadingSpinner from '../ui/LoadingSpinner';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getDashboardData()
      .then((res) => {
        setData(res?.data || res);
      })
      .catch((err) => console.error('Failed to load student dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your academic dashboard from database..." />;
  }

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const student = data?.student || {};
  const enrolledCourses = data?.enrolledCourses || [];
  const results = data?.recentResults || [];
  const notifications = data?.notifications || [];

  const rawGpa = data?.gpa ?? data?.academicSummary?.gpa;
  const displayGpa = rawGpa !== undefined && rawGpa !== null ? parseFloat(rawGpa).toFixed(2) : '0.00';
  const totalCredits = data?.totalCredits ?? data?.academicSummary?.totalCredits ?? 0;

  // Prepare chart data from results
  const chartData = results.map((r) => ({
    name: r.course_code || 'CRS',
    mark: parseFloat(r.mark || r.total_score || 0),
    grade: r.grade,
  }));

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <span>{getTimeGreeting()},</span>
            <span className="font-semibold text-text-dark">{student.first_name || 'Student'} 👋</span>
          </div>
          <h1 className="text-2xl font-bold text-text-dark mt-1">Student Academic Center</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Programme: <span className="font-medium text-text-dark">{student.programme_name || 'Enrolled Degree'}</span>
            {student.year_of_study && <span> • Year {student.year_of_study}</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/registration">
            <Button variant="primary" icon={ClipboardList}>
              Register Courses
            </Button>
          </Link>
          <Link to="/results">
            <Button variant="secondary" icon={Award}>
              View Results
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Registered Courses"
          value={enrolledCourses.length}
          subtitle="Current semester"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Current GPA"
          value={displayGpa}
          subtitle="Out of 4.00"
          icon={Award}
          color="green"
        />
        <StatCard
          title="Credits Earned"
          value={totalCredits}
          subtitle="Accumulated credits"
          icon={CreditCard}
          color="amber"
        />
        <StatCard
          title="Unread Notices"
          value={notifications.length}
          subtitle="Campus announcements"
          icon={Bell}
          color="blue"
        />
      </div>

      {/* Main Grid: Chart + Registered Modules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Marks Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-semibold text-text-dark">Academic Assessment</h2>
              <p className="text-xs text-text-secondary">Recent semester grades and evaluation scores</p>
            </div>
            <Link to="/results" className="text-xs font-medium text-primary hover:underline flex items-center gap-1">
              All results <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12, fill: '#64748B' }} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }}
                    formatter={(val) => [`${val}%`, 'Score']}
                  />
                  <Bar dataKey="mark" fill="#1E3A8A" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-secondary border border-dashed border-border rounded-xl">
                <Award className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-text-dark">No published marks yet</p>
                <p className="text-xs text-text-secondary mt-0.5">Your exam and assessment marks will appear here once entered by faculty.</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Links & Status */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-text-dark">Quick Navigation</h2>
            <div className="grid grid-cols-1 gap-2">
              <Link
                to="/timetable"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary hover:bg-primary-light transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-primary">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-dark">Class Timetable</p>
                    <p className="text-[11px] text-text-secondary">View lecture venues and schedule</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-secondary" />
              </Link>

              <Link
                to="/profile"
                className="flex items-center justify-between p-3 rounded-xl border border-border hover:border-primary hover:bg-primary-light transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 text-purple-700">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-text-dark">Student Profile</p>
                    <p className="text-[11px] text-text-secondary">Photo and security credentials</p>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-text-secondary" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Enrolled Courses Table */}
      <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-semibold text-text-dark">Enrolled Modules</h2>
            <p className="text-xs text-text-secondary">Courses currently approved in your academic registry</p>
          </div>
          <Link to="/courses" className="text-xs font-medium text-primary hover:underline">
            View course catalog
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-text-secondary text-xs uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-3 px-4">Code</th>
                <th className="py-3 px-4">Course Name</th>
                <th className="py-3 px-4">Credits</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {enrolledCourses.length > 0 ? (
                enrolledCourses.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-semibold text-primary">{c.course_code}</td>
                    <td className="py-3 px-4 text-text-dark font-medium">{c.course_name}</td>
                    <td className="py-3 px-4 text-text-secondary">{c.credits} Credits</td>
                    <td className="py-3 px-4">
                      <Badge variant="success">Registered</Badge>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="py-6 text-center text-text-secondary text-xs">
                    No active modules found for this semester. Click "Register Courses" above to enroll.
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

export default StudentDashboard;
