import React, { useState } from 'react';
import { UserAvatar } from './UserAvatar';

interface MondayHeaderActionsProps {
  userInitials?: string;
  memberCount?: number;
  onInvite?: () => void;
  className?: string;
  simplified?: boolean;
  onNewItem?: () => void;
  onSearch?: (query: string) => void;
}

/**
 * Standardized Monday.com-style header actions
 * Used in Monday.com layout headers for consistent action buttons
 */
export const MondayHeaderActions: React.FC<MondayHeaderActionsProps> = ({
  userInitials = 'U',
  memberCount = 1,
  onInvite,
  className = '',
  simplified = false,
  onNewItem,
  onSearch,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  // Simplified version for My Activities - only New Item and Search
  if (simplified) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        {/* New Item Button */}
        <button
          onClick={onNewItem}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-150 text-xs font-medium"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span>New Item</span>
        </button>

        {/* Search Input */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
            <svg className="h-3.5 w-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              onSearch?.(e.target.value);
            }}
            className="block w-48 pl-8 pr-2.5 py-1.5 border border-gray-300 rounded-md leading-4 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 text-xs"
          />
        </div>
      </div>
    );
  }

  // Full version with all buttons
  return (
    <div className={`flex items-center space-x-4 ${className}`}>
      <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors duration-150">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <span>Enhance</span>
      </button>

      <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors duration-150">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span>Integrate</span>
      </button>

      <button className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:bg-gray-100 rounded transition-colors duration-150">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>Automate</span>
      </button>

      <UserAvatar name={userInitials} size="md" />

      <button
        onClick={onInvite}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-150"
      >
        Invite / {memberCount}
      </button>
    </div>
  );
};

export default MondayHeaderActions;
