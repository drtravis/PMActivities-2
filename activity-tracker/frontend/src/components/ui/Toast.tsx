import React from 'react';

export interface ToastProps {
  title?: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}

export function Toast({ title, message, type = 'info' }: ToastProps) {
  const colors = {
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    info: 'bg-blue-50 text-blue-800 border-blue-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  } as const;

  return (
    <div className={`fixed top-4 right-4 z-50 border rounded-md px-4 py-3 shadow ${colors[type]}`}>
      {title && <div className="font-semibold mb-1">{title}</div>}
      <div className="text-sm">{message}</div>
    </div>
  );
}

