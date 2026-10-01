import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6">
      <h1 className="text-6xl font-extrabold text-primary tracking-tight">404</h1>
      <h2 className="text-xl font-bold text-text-dark mt-2">Page Not Found</h2>
      <p className="text-sm text-text-secondary max-w-sm mt-1 mb-6">
        The university portal page you are looking for does not exist or has been relocated.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" icon={Home}>
          Back to Portal Home
        </Button>
      </Link>
    </div>
  );
};

export default NotFoundPage;
