import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  BookOpen,
  Building2,
  Plus,
  ArrowRight,
  ShieldCheck,
  School,
  DoorOpen,
  Award,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import StatCard from './StatCard';
import { dashboardService } from '../../services/dashboardService';
import LoadingSpinner from '../ui/LoadingSpinner';
import Button from '../ui/Button';

const COLORS = ['#1E3A8A', '#2563EB', '#38BDF8', '#F59E0B', '#10B981', '#8B5CF6'];

const AdminDashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardService
      .getDashboardData()
      .then((res) => {
        setData(res?.data || res);
      })
      .catch((err) => console.error('Failed to load admin dashboard:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading live university analytics from database..." />;
  }

  const stats = data?.stats || {};
  const totalStudents = stats.totalStudents ?? data?.totalStudents ?? 0;
  const totalLecturers = stats.totalLecturers ?? data?.totalLecturers ?? 0;
  const totalCourses = stats.totalCourses ?? data?.totalCourses ?? 0;
  const totalDepartments = stats.totalDepartments ?? data?.totalDepartments ?? 0;
  const totalFaculties = stats.totalFaculties ?? data?.totalFaculties ?? 0;
  const totalRooms = stats.totalRooms ?? data?.totalRooms ?? 0;

  const byDept = data?.studentsByDepartment || data?.enrollmentByDepartment || [];
  const pieData = byDept
    .filter((d) => (parseInt(d.student_count || d.count || 0)) > 0)
    .map((d) => ({
      name: d.department_name || d.name,
      value: parseInt(d.student_count || d.count || 0),
    }));

  const recentRegistrations = data?.recentRegistrations || [];

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-primary font-medium text-sm">
            <ShieldCheck className="w-4 h-4" />
            <span>Administrative Control Center</span>
          </div>
          <h1 className="text-2xl font-bold text-text-dark mt-1">Institutional Overview</h1>
          <p className="text-text-secondary text-sm mt-0.5">
            Real-time live university analytics connected directly to your MySQL database.
          </p>
        </div>
        <div className="flex items-center gap-2.5 flex-wrap">
          <Link to="/students/add">
            <Button variant="primary" icon={Plus} size="sm">
              Add Student
            </Button>
          </Link>
          <Link to="/faculties">
            <Button variant="secondary" icon={School} size="sm">
              Faculties
            </Button>
          </Link>
          <Link to="/rooms">
            <Button variant="secondary" icon={DoorOpen} size="sm">
              Rooms & Venues
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <StatCard
          title="Students"
          value={totalStudents}
          subtitle="Enrolled active"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Lecturers"
          value={totalLecturers}
          subtitle="Teaching staff"
          icon={UserCheck}
          color="green"
        />
        <StatCard
          title="Courses"
          value={totalCourses}
          subtitle="Modules created"
          icon={BookOpen}
          color="amber"
        />
        <StatCard
          title="Faculties"
          value={totalFaculties}
          subtitle="Academic colleges"
          icon={School}
          color="blue"
        />
        <StatCard
          title="Departments"
          value={totalDepartments}
          subtitle="Faculties depts"
          icon={Building2}
          color="blue"
        />
        <StatCard
          title="Rooms & Halls"
          value={totalRooms}
          subtitle="Venues configured"
          icon={DoorOpen}
          color="green"
        />
      </div>

      {/* Visual Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Breakdown Bar Chart */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-dark mb-1">Student Enrollment by Department</h2>
            <p className="text-xs text-text-secondary mb-4">Live student distributions across university departments</p>
          </div>
          <div className="h-64 w-full">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pieData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <Bar dataKey="value" fill="#1E3A8A" radius={[6, 6, 0, 0]} name="Students" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-secondary border border-dashed border-border rounded-xl">
                <Building2 className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-text-dark">No student enrollment records yet</p>
                <p className="text-xs text-text-secondary mt-0.5">Enrolled students will appear here as they register for courses.</p>
              </div>
            )}
          </div>
        </div>

        {/* Department Ratio Donut Chart */}
        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-dark mb-1">Enrollment Proportions</h2>
            <p className="text-xs text-text-secondary mb-4">Percentage share of students across departments</p>
          </div>
          <div className="h-64 w-full flex-1">
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: '1px solid #E2E8F0' }} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-text-secondary border border-dashed border-border rounded-xl">
                <Award className="w-8 h-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-text-dark">No active student distributions</p>
                <p className="text-xs text-text-secondary mt-0.5">Charts will automatically render when data is added.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
