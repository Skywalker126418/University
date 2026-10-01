import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import StudentDashboard from '../../components/dashboard/StudentDashboard';
import LecturerDashboard from '../../components/dashboard/LecturerDashboard';
import AdminDashboard from '../../components/dashboard/AdminDashboard';
import RegistrarDashboard from '../../components/dashboard/RegistrarDashboard';

const DashboardPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'lecturer':
      return <LecturerDashboard />;
    case 'admin':
      return <AdminDashboard />;
    case 'registrar':
      return <RegistrarDashboard />;
    default:
      return <StudentDashboard />;
  }
};

export default DashboardPage;
