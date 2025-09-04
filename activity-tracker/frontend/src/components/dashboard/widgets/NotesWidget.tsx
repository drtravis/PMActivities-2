import React, { useState, useEffect } from 'react';
import { BaseWidget } from './BaseWidget';
import { DashboardWidget } from '@/lib/dashboardStore';

interface NotesWidgetProps {
  widget: DashboardWidget;
  onEdit?: () => void;
  onRemove?: () => void;
}

export const NotesWidget: React.FC<NotesWidgetProps> = ({ widget, onEdit, onRemove }) => {
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    // Load notes from localStorage
    const savedNotes = localStorage.getItem(`notes-${widget.id}`);
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, [widget.id]);

  const saveNotes = (newNotes: string) => {
    localStorage.setItem(`notes-${widget.id}`, newNotes);
    setLastSaved(new Date());
  };

  const handleNotesChange = (value: string) => {
    setNotes(value);
    // Auto-save after 1 second of inactivity
    const timer = setTimeout(() => {
      saveNotes(value);
    }, 1000);

    return () => clearTimeout(timer);
  };

  return (
    <BaseWidget widget={widget} onEdit={onEdit} onRemove={onRemove}>
      <div className="h-full flex flex-col">
        {isEditing ? (
          <div className="flex-1 flex flex-col">
            <textarea
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Write your notes here..."
              className="flex-1 w-full p-2 text-sm border border-gray-200 rounded resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              autoFocus
            />
            <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
              <div className="text-xs text-gray-500">
                {lastSaved && `Saved ${lastSaved.toLocaleTimeString()}`}
              </div>
              <button
                onClick={() => setIsEditing(false)}
                className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-150"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {notes ? (
              <div
                onClick={() => setIsEditing(true)}
                className="flex-1 p-2 text-sm text-gray-700 whitespace-pre-wrap cursor-text hover:bg-gray-50 rounded transition-colors duration-150"
              >
                {notes}
              </div>
            ) : (
              <div
                onClick={() => setIsEditing(true)}
                className="flex-1 flex items-center justify-center text-gray-400 cursor-pointer hover:text-gray-600 transition-colors duration-150"
              >
                <div className="text-center">
                  <svg className="w-8 h-8 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <p className="text-sm">Click to add notes</p>
                </div>
              </div>
            )}
            
            {notes && (
              <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  {lastSaved && `Last saved ${lastSaved.toLocaleTimeString()}`}
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-2 py-1 text-xs text-blue-600 hover:text-blue-800 transition-colors duration-150"
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </BaseWidget>
  );
};
