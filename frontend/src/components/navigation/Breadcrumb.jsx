import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames = {
  dashboard: 'Dashboard',
  students: 'Students',
  add: 'Add New',
  courses: 'Courses',
  registration: 'Registration',
  'my-registrations': 'My Registrations',
  results: 'Results',
  timetable: 'Timetable',
  notifications: 'Notifications',
  profile: 'Profile',
  settings: 'Settings',
  lecturers: 'Lecturers',
  departments: 'Departments',
  registrations: 'Registrations',
  approvals: 'Approvals',
  'access-denied': 'Access Denied',
};

const Breadcrumb = () => {
  const { pathname } = useLocation();
  const parts = pathname.split('/').filter(Boolean);

  if (parts.length === 0) return null;

  const crumbs = parts.map((part, idx) => {
    const path = '/' + parts.slice(0, idx + 1).join('/');
    const label = routeNames[part] || (isNaN(part) ? part : `#${part}`);
    const isLast = idx === parts.length - 1;
    return { path, label, isLast };
  });

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-text-secondary">
      <Link
        to="/dashboard"
        className="flex items-center gap-1 hover:text-primary transition-colors"
        aria-label="Home"
      >
        <Home className="w-3.5 h-3.5" />
      </Link>
      {crumbs.map(({ path, label, isLast }) => (
        <React.Fragment key={path}>
          <ChevronRight className="w-3 h-3 flex-shrink-0 text-gray-300" />
          {isLast ? (
            <span className="font-medium text-text-dark" aria-current="page">
              {label}
            </span>
          ) : (
            <Link
              to={path}
              className="hover:text-primary transition-colors capitalize"
            >
              {label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export default Breadcrumb;
