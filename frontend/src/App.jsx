import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import ToastContainer from './components/ui/ToastContainer';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { useAuth } from './hooks/useAuth';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import AccessDeniedPage from './pages/auth/AccessDeniedPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StudentsPage from './pages/students/StudentsPage';
import AddStudentPage from './pages/students/AddStudentPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import CoursesPage from './pages/courses/CoursesPage';
import CourseRegistrationPage from './pages/registration/CourseRegistrationPage';
import MyRegistrationsPage from './pages/registration/MyRegistrationsPage';
import MyResultsPage from './pages/results/MyResultsPage';
import EnterResultsPage from './pages/results/EnterResultsPage';
import TimetablePage from './pages/timetable/TimetablePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ProfilePage from './pages/profile/ProfilePage';
import SettingsPage from './pages/settings/SettingsPage';
import LecturersPage from './pages/lecturers/LecturersPage';
import DepartmentsPage from './pages/departments/DepartmentsPage';
import FacultiesPage from './pages/faculties/FacultiesPage';
import ProgrammesPage from './pages/programmes/ProgrammesPage';
import RoomsPage from './pages/rooms/RoomsPage';
import RegistrationApprovalsPage from './pages/registrar/RegistrationApprovalsPage';
import RegisterAdminPage from './pages/auth/RegisterAdminPage';
import RegistrarsPage from './pages/registrar/RegistrarsPage';
import AttendancePage from './pages/attendance/AttendancePage';
import AcademicYearsPage from './pages/academic/AcademicYearsPage';
import NotFoundPage from './pages/NotFoundPage';


// Smart Results Component: routes to EnterResultsPage for lecturers, MyResultsPage for students
const ResultsPageWrapper = () => {
  const { user } = useAuth();
  if (user?.role === 'lecturer') {
    return <EnterResultsPage />;
  }
  return <MyResultsPage />;
};

function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <BrowserRouter>
            <ToastContainer />
            <Routes>
              {/* Public Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register-admin" element={<RegisterAdminPage />} />
              </Route>

              {/* Access Denied */}
              <Route path="/access-denied" element={<AccessDeniedPage />} />

              {/* Protected Portal Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />

                {/* Students (Admin & Registrar) */}
                <Route
                  path="/students"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'registrar']}>
                      <StudentsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students/add"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'registrar']}>
                      <AddStudentPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/students/:id"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'registrar']}>
                      <StudentDetailPage />
                    </ProtectedRoute>
                  }
                />

                {/* Courses */}
                <Route path="/courses" element={<CoursesPage />} />

                {/* Course Registration (Students) */}
                <Route
                  path="/registration"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <CourseRegistrationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/my-registrations"
                  element={
                    <ProtectedRoute allowedRoles={['student']}>
                      <MyRegistrationsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Results (Role specific) */}
                <Route path="/results" element={<ResultsPageWrapper />} />

                {/* Timetable */}
                <Route path="/timetable" element={<TimetablePage />} />

                {/* Notifications */}
                <Route path="/notifications" element={<NotificationsPage />} />

                {/* Profile */}
                <Route path="/profile" element={<ProfilePage />} />

                {/* Settings */}
                <Route path="/settings" element={<SettingsPage />} />

                {/* Lecturers (Admin) */}
                <Route
                  path="/lecturers"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <LecturersPage />
                    </ProtectedRoute>
                  }
                />

                {/* Registrars (Admin) */}
                <Route
                  path="/registrars"
                  element={
                    <ProtectedRoute allowedRoles={['admin']}>
                      <RegistrarsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Faculties (Admin & Registrar) */}
                <Route
                  path="/faculties"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'registrar']}>
                      <FacultiesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Departments (Admin & Registrar) */}
                <Route
                  path="/departments"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'registrar']}>
                      <DepartmentsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Programmes (Admin & Registrar) */}
                <Route
                  path="/programmes"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'registrar']}>
                      <ProgrammesPage />
                    </ProtectedRoute>
                  }
                />

                {/* Rooms & Venues (Admin & Registrar) */}
                <Route
                  path="/rooms"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'registrar']}>
                      <RoomsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Academic Years & Semesters (Admin & Registrar) */}
                <Route
                  path="/academic-years"
                  element={
                    <ProtectedRoute allowedRoles={['admin', 'registrar']}>
                      <AcademicYearsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Registration Approvals (Registrar & Admin) */}

                <Route
                  path="/registrations/approvals"
                  element={
                    <ProtectedRoute allowedRoles={['registrar', 'admin']}>
                      <RegistrationApprovalsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Attendance (Lecturer & Admin) */}
                <Route
                  path="/attendance"
                  element={
                    <ProtectedRoute allowedRoles={['lecturer', 'admin']}>
                      <AttendancePage />
                    </ProtectedRoute>
                  }
                />
              </Route>

              {/* 404 Catch-All */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}

export default App;
