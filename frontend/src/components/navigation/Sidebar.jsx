import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  BarChart2,
  Bell,
  User,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Calendar,
  UserCheck,
  Building2,
  FileText,
  CheckSquare,
  School,
  DoorOpen,
  Award,
  ClipboardCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { formatRole } from '../../utils/formatters';

const navItems = {
  student: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/courses', icon: BookOpen, label: 'My Courses' },
    { to: '/registration', icon: ClipboardList, label: 'Registration' },
    { to: '/results', icon: BarChart2, label: 'My Results' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  lecturer: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/attendance', icon: ClipboardCheck, label: 'Attendance' },
    { to: '/results', icon: BarChart2, label: 'Enter Results' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
  admin: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/lecturers', icon: UserCheck, label: 'Lecturers' },
    { to: '/registrars', icon: ClipboardList, label: 'Registrars' },
    { to: '/academic-years', icon: Calendar, label: 'Academic Years & Semesters' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/faculties', icon: School, label: 'Faculties' },
    { to: '/departments', icon: Building2, label: 'Departments' },
    { to: '/programmes', icon: Award, label: 'Programmes' },
    { to: '/rooms', icon: DoorOpen, label: 'Rooms & Venues' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ],
  registrar: [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/registrations/approvals', icon: CheckSquare, label: 'Registrations' },
    { to: '/academic-years', icon: Calendar, label: 'Academic Years & Semesters' },
    { to: '/students', icon: Users, label: 'Students' },
    { to: '/courses', icon: BookOpen, label: 'Courses' },
    { to: '/faculties', icon: School, label: 'Faculties' },
    { to: '/departments', icon: Building2, label: 'Departments' },
    { to: '/programmes', icon: Award, label: 'Programmes' },
    { to: '/rooms', icon: DoorOpen, label: 'Rooms & Venues' },
    { to: '/timetable', icon: Calendar, label: 'Timetable' },
    { to: '/notifications', icon: Bell, label: 'Notifications' },
    { to: '/profile', icon: User, label: 'Profile' },
  ],
};

const SidebarLink = ({ to, icon: Icon, label, collapsed }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group relative
      ${
        isActive
          ? 'bg-primary text-white shadow-md shadow-primary/20'
          : 'text-slate-300 hover:bg-white/10 hover:text-white'
      }`
    }
  >
    <Icon className="w-5 h-5 flex-shrink-0" />
    <AnimatePresence>
      {!collapsed && (
        <motion.span
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 'auto' }}
          exit={{ opacity: 0, width: 0 }}
          className="overflow-hidden whitespace-nowrap"
        >
          {label}
        </motion.span>
      )}
    </AnimatePresence>
    {collapsed && (
      <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50 shadow-lg transition-opacity duration-150">
        {label}
      </div>
    )}
  </NavLink>
);

const Sidebar = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const links = navItems[user?.role] || navItems.student;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 72 : 256 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className={`
          fixed top-0 left-0 h-full z-30 flex flex-col
          bg-gradient-to-b from-[#0F2456] to-[#1E3A8A]
          shadow-2xl
          lg:relative lg:translate-x-0
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
          transition-transform duration-300 ease-in-out
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
          <div className="flex-shrink-0 w-9 h-9 bg-primary-hover rounded-xl flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="overflow-hidden"
              >
                <p className="text-white font-bold text-sm leading-none">UMS</p>
                <p className="text-slate-400 text-xs mt-0.5 whitespace-nowrap">
                  University Management
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Mobile close */}
          <button
            onClick={onClose}
            className="ml-auto lg:hidden text-slate-400 hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 flex flex-col gap-1">
          {links.map((item) => (
            <SidebarLink
              key={item.to}
              {...item}
              collapsed={collapsed}
              // Close mobile drawer on nav
            />
          ))}
        </nav>

        {/* User + logout */}
        <div className="border-t border-white/10 p-3 space-y-2">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-2 py-2"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden bg-primary-hover flex items-center justify-center flex-shrink-0 border border-white/20">
                  {user?.avatar ? (
                    <img
                      src={user.avatar.startsWith('http') ? user.avatar : `http://localhost:5000${user.avatar}`}
                      alt={user.first_name || user.name || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-xs font-semibold">
                      {user?.name?.charAt(0)?.toUpperCase() || user?.first_name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-white text-xs font-medium truncate">{user?.name}</p>
                  <p className="text-slate-400 text-xs truncate">{formatRole(user?.role)}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-slate-300 hover:bg-red-500/20 hover:text-red-300 transition-all duration-200 text-sm font-medium"
          >
            <LogOut className="w-5 h-5 flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Collapse toggle - desktop only */}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 bg-white border border-border rounded-full items-center justify-center shadow-md text-text-secondary hover:text-primary transition-colors"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-3 h-3" />
          ) : (
            <ChevronLeft className="w-3 h-3" />
          )}
        </button>
      </motion.aside>
    </>
  );
};

export default Sidebar;
