import React from 'react';

interface UserAvatarProps {
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  imageUrl?: string;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Standardized user avatar component for consistent user display
 * Used across all interfaces for showing user information
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({ 
  name, 
  size = 'md', 
  imageUrl,
  className = '',
  showTooltip = false
}) => {
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getSizeClasses = (size: string) => {
    const sizes = {
      xs: 'w-4 h-4 text-[8px]',
      sm: 'w-6 h-6 text-[9px]',
      md: 'w-8 h-8 text-xs',
      lg: 'w-10 h-10 text-sm',
      xl: 'w-12 h-12 text-base',
    };
    return sizes[size as keyof typeof sizes] || sizes.md;
  };

  const sizeClasses = getSizeClasses(size);
  const initials = getUserInitials(name);

  const avatarElement = (
    <div 
      className={`${sizeClasses} rounded-full bg-gray-300 flex items-center justify-center font-medium text-gray-700 ${className}`}
      title={showTooltip ? name : undefined}
    >
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={name}
          className="w-full h-full rounded-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  return avatarElement;
};

export default UserAvatar;
