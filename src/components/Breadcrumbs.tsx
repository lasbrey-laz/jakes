import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

export interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleBreadcrumbClick = (item: BreadcrumbItem) => {
    if (item.path && item.path !== location.pathname) {
      navigate(item.path);
    }
  };

  return (
    <nav className={`flex items-center space-x-2 text-sm ${className}`} aria-label="Breadcrumb">
      {/* Home breadcrumb */}
      <button
        onClick={() => navigate('/')}
        className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
        title="Go to Home"
      >
        <Home className="w-4 h-4" />
        <span>Home</span>
      </button>

      {/* Separator */}
      <ChevronRight className="w-4 h-4 text-gray-600" />

      {/* Dynamic breadcrumbs */}
      {items.map((item, index) => (
        <React.Fragment key={index}>
          {index > 0 && <ChevronRight className="w-4 h-4 text-gray-600" />}
          
          {item.path && item.path !== location.pathname ? (
            <button
              onClick={() => handleBreadcrumbClick(item)}
              className="flex items-center gap-1 text-gray-400 hover:text-red-400 transition-colors"
              title={`Go to ${item.label}`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </button>
          ) : (
            <span className="flex items-center gap-1 text-red-400 font-medium">
              {item.icon && <item.icon className="w-4 h-4" />}
              <span>{item.label}</span>
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
