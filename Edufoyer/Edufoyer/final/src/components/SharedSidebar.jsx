import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { X } from 'lucide-react';

const SharedSidebar = ({
  items,
  onClose,
  showCloseButton = false,
  className = '',
  belowNav = null,
  footer = null,
}) => {
  const navigate = useNavigate();

  return (
    <div className={`w-64 bg-white dark:bg-gray-800 border-r border-gray-100 dark:border-gray-700 transition-colors duration-300 flex flex-col h-screen ${className}`.trim()}>
      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="p-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center hover:opacity-80 transition-opacity">
            <h1 className="text-xl font-bold italic text-blue-600 dark:text-blue-400 transition-colors duration-300 flex items-center">
              EDU
              <span className="inline-flex items-center justify-center mx-0.5 w-6 h-6 bg-orange-500 rounded-lg shrink-0">
                <span className="text-white font-bold text-sm">F</span>
              </span>
              OYER
            </h1>
          </Link>
          {showCloseButton && (
            <button
              onClick={onClose}
              className="lg:hidden text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className="mt-6 overflow-x-hidden">
          {items.map((item, index) => (
            <div
              key={index}
              onClick={() => {
                if (item.onClick) {
                  item.onClick();
                } else if (item.path) {
                  navigate(item.path);
                }
              }}
              className={`flex items-center px-5 py-4 cursor-pointer relative transition-colors duration-300 min-w-0 font-extrabold ${
                item.active
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700'
              } ${
                item.label === 'Logout'
                  ? 'text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
                  : ''
              }`}
            >
              <item.icon className="w-5 h-5 mr-3 flex-shrink-0" strokeWidth={2.75} />
              <span className="truncate min-w-0">{item.label}</span>
              {item.badge && (
                <span className="ml-auto bg-blue-500 dark:bg-blue-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0">
                  {item.badge}
                </span>
              )}
            </div>
          ))}
        </nav>
        {belowNav}
      </div>
      {footer ? (
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800">
          {footer}
        </div>
      ) : null}
    </div>
  );
};

export default SharedSidebar;
