import React from 'react';
import { useStatus } from '@/contexts/StatusContext';

interface StatusPillProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string; // Optional override for displayed text
  type?: 'activity' | 'task' | 'approval';
}

/**
 * Standardized status pill component for consistent status display
 * Used across all task boards and activity interfaces
 */
export const StatusPill: React.FC<StatusPillProps> = ({
  status,
  size = 'md',
  className = '',
  label,
  type = 'activity'
}) => {
  const { getStatusDisplayName, getStatusColor, loading } = useStatus();

  const displayLabel = label || getStatusDisplayName(status, type);
  const statusColor = getStatusColor(status, type);

  // Convert hex color to Tailwind-compatible background and text colors
  const getColorClasses = (hexColor: string) => {
    // For now, use a neutral style with the hex color as background
    // In a production app, you might want to create a more sophisticated color mapping
    return {
      backgroundColor: hexColor + '20', // Add transparency
      color: hexColor,
      borderColor: hexColor + '40'
    };
  };

  const colorStyles = getColorClasses(statusColor);

  const getSizeClasses = (size: string) => {
    const sizes = {
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const sizeClasses = getSizeClasses(size);

  if (loading) {
    return (
      <span className={`inline-flex items-center rounded-full border font-medium bg-gray-100 text-gray-600 border-gray-200 ${sizeClasses} ${className}`}>
        Loading...
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${sizeClasses} ${className}`}
      style={{
        backgroundColor: colorStyles.backgroundColor,
        color: colorStyles.color,
        borderColor: colorStyles.borderColor
      }}
    >
      {displayLabel}
    </span>
  );
};

export default StatusPill;
