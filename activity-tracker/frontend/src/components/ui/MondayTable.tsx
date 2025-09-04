import React from 'react';

interface Column {
  key: string;
  label: string;
  width?: string; // e.g., 'col-span-3'
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
}

interface MondayTableProps {
  columns: Column[];
  children: React.ReactNode;
  className?: string;
  showCheckboxes?: boolean;
  onSelectAll?: (selected: boolean) => void;
  allSelected?: boolean;
}

/**
 * Standardized Monday.com-style table component
 * Provides consistent table structure across all task boards
 */
export const MondayTable: React.FC<MondayTableProps> = ({
  columns,
  children,
  className = '',
  showCheckboxes = true,
  onSelectAll,
  allSelected = false,
}) => {
  // Use a fixed 12-column grid for predictable layout; cell widths use Tailwind col-span classes
  return (
    <div className={`bg-white border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {/* Table Header */}
      <div className="bg-gray-50 border-b border-gray-200">
        <div className={`grid grid-cols-12 gap-0 divide-x divide-gray-200 px-3 py-2 items-center text-[11px] sm:text-xs font-medium text-gray-600 tracking-wide min-h-[36px]`}>
          {showCheckboxes && (
            <div className="col-span-1 flex items-center justify-center">
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(e) => onSelectAll?.(e.target.checked)}
                className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
            </div>
          )}

          {columns?.map((column) => (
            <div
              key={column.key}
              className={`${column.width || 'col-span-1'} px-1.5 flex items-center ${
                column.align === 'center' ? 'justify-center' :
                column.align === 'right' ? 'justify-end' : 'justify-start'
              }` + ' whitespace-normal break-words leading-snug'}
            >
              <span className="text-[11px] sm:text-xs leading-tight">{column.label}</span>
              {column.sortable && (
                <svg className="w-2.5 h-2.5 ml-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Table Body */}
      <div className="divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
};

interface MondayTableRowProps {
  children: React.ReactNode;
  selected?: boolean;
  onSelect?: (selected: boolean) => void;
  className?: string;
  showCheckbox?: boolean;
}

export const MondayTableRow: React.FC<MondayTableRowProps> = ({
  children,
  selected = false,
  onSelect,
  className = '',
  showCheckbox = true,
}) => {
  return (
    <div className={`grid grid-cols-12 gap-0 px-3 py-1.5 border-b border-gray-100 hover:bg-gray-50 transition-colors duration-150 min-h-[32px] ${className}`}>
      {showCheckbox && (
        <div className="col-span-1 flex items-center justify-center border-r border-gray-200">
          <input
            type="checkbox"
            checked={selected}
            onChange={(e) => onSelect?.(e.target.checked)}
            className="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
        </div>
      )}
      {children}
    </div>
  );
};

interface MondayTableCellProps {
  children: React.ReactNode;
  width?: string; // e.g., 'col-span-3'
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export const MondayTableCell: React.FC<MondayTableCellProps> = ({
  children,
  width = 'col-span-1',
  align = 'left',
  className = '',
}) => {
  return (
    <div className={`${width} flex items-center px-1.5 border-r border-gray-200 text-sm ${
      align === 'center' ? 'justify-center' :
      align === 'right' ? 'justify-end' : 'justify-start'
    } ${className}`}>
      {children}
    </div>
  );
};

export default MondayTable;
