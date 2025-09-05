'use client';

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useStatus } from '@/contexts/StatusContext';

interface StatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
  size?: 'xs' | 'sm' | 'md';
  type?: 'activity' | 'task' | 'approval';
}

const StatusDropdown: React.FC<StatusDropdownProps> = ({
  value,
  onChange,
  size = 'sm',
  type = 'activity'
}) => {
  const { getActiveStatusOptions, getStatusColor, getStatusDisplayName, loading } = useStatus();
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  let statusOptions = getActiveStatusOptions(type).map(opt => ({
    value: opt.value,
    label: opt.label,
    color: opt.color,
    bgColor: 'bg-gray-50',
    hoverColor: 'hover:bg-gray-100'
  }));

  // Fallback options if no status options are available
  if (statusOptions.length === 0) {
    console.log('StatusDropdown: No status options found, using fallback');
    statusOptions = [
      { value: 'Not Started', label: 'Not Started', color: '#6B7280', bgColor: 'bg-gray-50', hoverColor: 'hover:bg-gray-100' },
      { value: 'Working on it', label: 'Working on it', color: '#3B82F6', bgColor: 'bg-gray-50', hoverColor: 'hover:bg-gray-100' },
      { value: 'Stuck', label: 'Stuck', color: '#EF4444', bgColor: 'bg-gray-50', hoverColor: 'hover:bg-gray-100' },
      { value: 'Done', label: 'Done', color: '#10B981', bgColor: 'bg-gray-50', hoverColor: 'hover:bg-gray-100' }
    ];
  }

  console.log('StatusDropdown: Final statusOptions for', type, ':', statusOptions);

  const currentStatus = statusOptions.find(option => option.value === value) || {
    value,
    label: getStatusDisplayName(value, type),
    color: getStatusColor(value, type),
    bgColor: 'bg-gray-50',
    hoverColor: 'hover:bg-gray-100'
  };

  console.log('StatusDropdown: currentStatus:', currentStatus, 'value:', value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node) &&
          buttonRef.current && !buttonRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Update dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + window.scrollY + 4,
        left: rect.left + window.scrollX,
        width: rect.width
      });
    }
  }, [isOpen]);

  const handleStatusChange = (newStatus: string) => {
    onChange(newStatus);
    setIsOpen(false);
  };

  const getSizeClasses = (size: string) => {
    const sizes = {
      xs: 'px-1.5 py-0.5 text-xs min-w-[70px] max-w-[90px]',
      sm: 'px-2 py-1 text-xs min-w-[90px] max-w-[110px]',
      md: 'px-3 py-2 text-sm min-w-[110px] max-w-[130px]',
    };
    return sizes[size as keyof typeof sizes] || sizes.sm;
  };

  const sizeClasses = getSizeClasses(size);

  const DropdownMenu = () => (
    <div
      ref={dropdownRef}
      className="bg-white border border-gray-200 rounded-md shadow-lg min-w-[110px] overflow-hidden"
      style={{
        position: 'fixed',
        top: dropdownPosition.top,
        left: dropdownPosition.left,
        minWidth: Math.max(dropdownPosition.width, 110),
        zIndex: 9999
      }}
    >
      {statusOptions.map((option) => (
        <button
          key={option.value}
          onClick={() => handleStatusChange(option.value)}
          className={`
            w-full text-left px-2 py-1 text-xs
            flex items-center space-x-1.5
            hover:bg-gray-50 transition-colors duration-150
            ${value === option.value ? 'bg-blue-50' : ''}
          `}
        >
          {/* Status Color Indicator */}
          <div
            className="w-2.5 h-2.5 rounded border flex-shrink-0"
            style={{ backgroundColor: option.color, borderColor: option.color }}
          ></div>

          {/* Status Label */}
          <span className="font-medium text-gray-800 truncate">
            {option.label}
          </span>

          {/* Check mark for current selection */}
          {value === option.value && (
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="text-blue-600 ml-auto flex-shrink-0"
            >
              <path d="M20 6L9 17l-5-5"/>
            </svg>
          )}
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className={`${getSizeClasses(size)} bg-gray-100 rounded border border-gray-300 flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-500"></div>
      </div>
    );
  }

  return (
    <>
      {/* Current Status Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          ${currentStatus?.bgColor} ${currentStatus?.hoverColor}
          ${sizeClasses}
          font-medium rounded border border-gray-300 transition-all duration-200
          flex items-center justify-between
          focus:outline-none focus:ring-1 focus:ring-blue-500 focus:ring-opacity-50
          truncate text-gray-800
        `}
      >
        <span className="font-medium truncate text-xs leading-tight text-gray-800">{currentStatus?.label}</span>
        <svg
          width="8"
          height="8"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className={`ml-1 text-gray-800 transition-transform duration-200 flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        >
          <path d="M6 9l6 6 6-6"/>
        </svg>
      </button>

      {/* Portal-based Dropdown Menu */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <DropdownMenu />,
        document.body
      )}
    </>
  );
};

export default StatusDropdown;
