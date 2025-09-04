'use client';

import React, { useState, useEffect } from 'react';
import { tasksAPI } from '@/lib/api';
import { useStatus } from '@/contexts/StatusContext';


interface Activity {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: 'low' | 'medium' | 'high' | 'urgent' | null | undefined;
  category: string;
  startDate: string;
  endDate: string;
  progress: number;
  estimatedHours: number;
  actualHours: number;
  tags: string[];
  comments: number;
  attachments: number;
  lastUpdated: string;
  taskId?: string;
  createdBy?: { name: string };
  updatedBy?: { name: string };
  projectId?: string;
  projectName?: string;
}

interface Comment {
  id: string;
  body: string;
  author: { name: string; id: string };
  createdAt: string;
  updatedAt: string;
}

interface ActivityLogEntry {
  id: string;
  changeType: 'created' | 'status_changed' | 'priority_changed' | 'assigned' | 'updated' | 'commented' | 'file_uploaded';
  description: string;
  changes?: Array<{ field: string; oldValue: any; newValue: any }>;
  actor: { name: string; id: string };
  createdAt: string;
}

interface FileAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: { name: string; id: string };
  createdAt: string;
  downloadUrl?: string;
}

interface TaskDetailsModalProps {
  activity: Activity;
  isOpen: boolean;
  onClose: () => void;
  onUpdate?: (activity: Activity) => void;
}

const TaskDetailsModal: React.FC<TaskDetailsModalProps> = ({
  activity,
  isOpen,
  onClose,
  onUpdate,
}) => {
  const [activeTab, setActiveTab] = useState<'updates' | 'files' | 'activity'>('updates');
  const [newComment, setNewComment] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLogEntry[]>([]);
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Load data when modal opens
  useEffect(() => {
    if (isOpen && activity?.taskId) {
      loadComments();
      loadActivityLog();
      loadFiles();
    }
  }, [isOpen, activity?.taskId]);

  const loadComments = async () => {
    if (!activity?.taskId) return;
    try {
      setLoading(true);
      const data = await tasksAPI.getComments(activity.taskId);
      setComments(data);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadActivityLog = async () => {
    if (!activity?.taskId) return;
    try {
      const data = await tasksAPI.getHistory(activity.taskId);
      setActivityLog(data);
    } catch (error) {
      console.error('Failed to load activity log:', error);
    }
  };

  const loadFiles = async () => {
    if (!activity?.taskId) return;
    try {
      const data = await tasksAPI.getAttachments(activity.taskId);
      setFiles(data);
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !activity?.taskId) return;

    try {
      const newCommentData = await tasksAPI.addComment(activity.taskId, newComment);
      setComments(prev => [newCommentData, ...prev]);
      setNewComment('');
      loadActivityLog(); // Refresh activity log
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0 || !activity?.taskId) return;

    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const uploadedFile = await tasksAPI.uploadAttachment(activity.taskId, file);
        setFiles(prev => [uploadedFile, ...prev]);
      }
      loadActivityLog(); // Refresh activity log
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return '1 day ago';
    return date.toLocaleDateString();
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'created': return '✨';
      case 'status_changed': return '🔄';
      case 'priority_changed': return '⚡';
      case 'assigned': return '👤';
      case 'commented': return '💬';
      case 'file_uploaded': return '📎';
      default: return '📝';
    }
  };

  if (!isOpen || !activity) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h2 className="text-xl font-semibold text-gray-900">{activity.title}</h2>
            <span className="text-sm text-gray-500">
              in → <span className="text-blue-600">{activity.projectName || 'Unknown Project Board'}</span>
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('updates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'updates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v9a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Updates
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'files'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              Files
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === 'activity'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Activity Log
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden p-6">
          {/* Updates Tab */}
          {activeTab === 'updates' && (
            <div className="h-full flex flex-col space-y-4">
              {/* Update Input */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    U
                  </div>
                  <div className="flex-1">
                    <textarea
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Share progress, mention a teammate, or upload a file to get things moving"
                      className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={3}
                    />
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center space-x-4">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          📧 Update via email
                        </button>
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          💬 Give feedback
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </button>
                        <label className="text-gray-400 hover:text-gray-600 cursor-pointer">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                          </svg>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileUpload}
                            className="hidden"
                            disabled={uploading}
                          />
                        </label>
                        <button className="text-gray-400 hover:text-gray-600">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </button>
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Update
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comments List */}
              <div className="flex-1 overflow-y-auto space-y-4">
                {loading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 mt-2">Loading updates...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No updates yet. Be the first to share progress!</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600 text-sm font-medium">
                        {comment.author.name.charAt(0)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{comment.author.name}</span>
                            <span className="text-sm text-gray-500">{formatTimestamp(comment.createdAt)}</span>
                          </div>
                          <p className="text-gray-700">{comment.body}</p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Files Tab */}
          {activeTab === 'files' && (
            <div className="h-full flex flex-col space-y-4">
              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <label className="cursor-pointer">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="mt-4">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  </div>
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={uploading}
                  />
                </label>
                {uploading && (
                  <div className="mt-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-sm text-gray-500 mt-2">Uploading files...</p>
                  </div>
                )}
              </div>

              {/* Files List */}
              <div className="flex-1 overflow-y-auto">
                {files.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No files uploaded yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {files.map((file) => (
                      <div key={file.id} className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{file.fileName}</p>
                            <p className="text-sm text-gray-500">
                              {formatFileSize(file.fileSize)} • Uploaded by {file.uploadedBy.name} • {formatTimestamp(file.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {file.downloadUrl && (
                            <a
                              href={file.downloadUrl}
                              download={file.fileName}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div className="h-full overflow-y-auto">
              {activityLog.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No activity recorded yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activityLog.map((entry) => (
                    <div key={entry.id} className="flex items-start space-x-3">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-sm">
                        {getChangeTypeIcon(entry.changeType)}
                      </div>
                      <div className="flex-1">
                        <div className="bg-white border border-gray-200 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-gray-900">{entry.actor.name}</span>
                            <span className="text-sm text-gray-500">{formatTimestamp(entry.createdAt)}</span>
                          </div>
                          <p className="text-gray-700 mb-2">{entry.description}</p>
                          {entry.changes && entry.changes.length > 0 && (
                            <div className="bg-gray-50 rounded p-2 text-sm">
                              {entry.changes.map((change, index) => (
                                <div key={index} className="text-gray-600">
                                  <span className="font-medium">{change.field}:</span>
                                  <span className="text-red-600 line-through ml-1">{change.oldValue}</span>
                                  <span className="mx-2">→</span>
                                  <span className="text-green-600">{change.newValue}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
