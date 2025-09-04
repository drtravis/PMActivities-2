import React from 'react';

interface PriorityBadgeProps {
  priority: 'low' | 'medium' | 'high' | 'urgent';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'filled' | 'outlined';
  className?: string;
}

/**
 * Standardized priority badge component for consistent priority display
 * Used across all task boards and activity interfaces
 */
export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ 
  priority, 
  size = 'md', 
  variant = 'outlined',
  className = '' 
}) => {
  const getPriorityConfig = (priority: string, variant: string) => {
    const baseConfigs = {
      low: {
        label: 'Low',
        color: 'blue',
      },
      medium: {
        label: 'Medium',
        color: 'purple',
      },
      high: {
        label: 'High',
        color: 'red',
      },
      urgent: {
        label: 'Urgent',
        color: 'red',
      },
    };

    const config = baseConfigs[priority as keyof typeof baseConfigs] || baseConfigs.medium;
    
    if (variant === 'filled') {
      const filledClasses = {
        blue: 'bg-blue-600 text-white border-blue-600',
        purple: 'bg-purple-600 text-white border-purple-600',
        red: 'bg-red-600 text-white border-red-600',
      };
      return {
        ...config,
        className: filledClasses[config.color as keyof typeof filledClasses],
      };
    } else {
      const outlinedClasses = {
        blue: 'bg-blue-50 text-blue-700 border-blue-300',
        purple: 'bg-purple-50 text-purple-700 border-purple-300',
        red: 'bg-red-50 text-red-700 border-red-300',
      };
      return {
        ...config,
        className: outlinedClasses[config.color as keyof typeof outlinedClasses],
      };
    }
  };

  const getSizeClasses = (size: string) => {
    const sizes = {
      xs: 'px-1.5 py-0.5 text-xs',
      sm: 'px-2 py-0.5 text-xs',
      md: 'px-2 py-1 text-xs',
      lg: 'px-3 py-1.5 text-sm',
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const config = getPriorityConfig(priority, variant);
  const sizeClasses = getSizeClasses(size);

  return (
    <span 
      className={`inline-flex items-center rounded border font-medium ${config.className} ${sizeClasses} ${className}`}
    >
      {config.label}
    </span>
  );
};

export default PriorityBadge;
