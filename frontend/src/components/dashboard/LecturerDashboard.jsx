import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Users,
  CheckSquare,
  Calendar,
  Award,
  ArrowRight,
  Clock,
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
import Button from '../ui/Button';

const LecturerDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getDashboardData()
      .then((res) => {
        setData(res?.data || res);
      })
      .catch((err) => console.error('Failed to load lecturer dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading lecturer portal from database..." />;
  }

  const assignedCourses = data?.assignedCourses || [];
  const todayClasses = data?.todayClasses || [];
  const pendingCount = data?.pendingResultsCount ?? data?.pendingResults ?? 0;
  const totalStudents = data?.totalStudents ?? 0;

  const chartData = assignedCourses.map((c) => ({
    name: c.course_code || 'CRS',
    students: parseInt(c.student_count || 0),
  }));

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-text-dark">Faculty Member Portal</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Manage your assigned courses, lecture venues, weekly timetables, and student grades.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/results">
            <Button variant="primary" icon={Award}>
              Enter Results
            </Button>
          </Link>
          <Link to="/timetable">
            <Button variant="secondary" icon={Calendar}>
              My Timetable
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Assigned Courses"
          value={assignedCourses.length}
          subtitle="Modules taught"
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          title="Total Students"
          value={totalStudents}
          subtitle="Enrolled across modules"
          icon={Users}
          color="green"
        />
        <StatCard
          title="Pending Results"
          value={pendingCount}
          subtitle="Awaiting grade entry"
          icon={CheckSquare}
          color="amber"
        />
        <StatCard
          title="Classes Today"
          value={todayClasses.length}
          subtitle="Scheduled sessions"
          icon={Calendar}
          color="blue"
        />
      </div>

      {/* Charts and Schedules */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-6 shadow-sm">
          <h2 className="text-base font-semibold text-text-dark mb-1">Student Enrollment by Course</h2>
          <p className="text-xs text-text-secondary mb-4">Total students registered per assigned module</p>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#64748B' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="students" fill="#2563EB" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-secondary border border-dashed border-border rounded-xl">
                <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-text-dark">No courses assigned yet</p>
                <p className="text-xs text-text-secondary mt-0.5">Assigned courses and student counts will display here.</p>
              </div>
            )}
          </div>
        </div>

        {/* Schedule / Action Panel */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-base font-semibold text-text-dark">Today's Class Schedule</h2>
          {todayClasses.length > 0 ? (
            <div className="space-y-3">
              {todayClasses.map((cls, idx) => (
                <div key={idx} className="p-3.5 rounded-xl border border-border bg-slate-50 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-primary">{cls.course_code}</span>
                    <span className="text-xs font-semibold text-text-dark flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      {(cls.start_time || '').slice(0, 5)} - {(cls.end_time || '').slice(0, 5)}
                    </span>
                  </div>
                  <p className="text-xs font-medium text-text-dark truncate">{cls.course_name}</p>
                  <p className="text-[11px] text-text-secondary flex items-center gap-1">
                    <DoorOpen className="w-3 h-3 text-text-secondary" />
                    Room: {cls.room_number || cls.room || 'TBA'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-text-secondary border border-dashed border-border rounded-xl">
              <Calendar className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
              <p className="text-xs font-medium text-text-dark">No classes scheduled today</p>
              <p className="text-[11px] text-text-secondary mt-0.5">Check your full weekly timetable for upcoming lectures.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LecturerDashboard;
