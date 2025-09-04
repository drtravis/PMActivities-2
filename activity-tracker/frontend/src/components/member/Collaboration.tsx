'use client';

import { useState, useEffect } from 'react';
import { useAuthStore } from '@/lib/store';
import { projectsAPI, activitiesAPI } from '@/lib/api';

interface Comment {
  id: string;
  author: string;
  authorRole: 'member' | 'pm' | 'admin';
  content: string;
  timestamp: string;
  activityId: string;
  activityTitle: string;
  mentions: string[];
  attachments: string[];
  replies: Comment[];
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'member' | 'pm' | 'admin';
  avatar: string;
  status: 'online' | 'away' | 'offline';
  skills: string[];
}

interface SharedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedBy: string;
  uploadedAt: string;
  activityId?: string;
  activityTitle?: string;
  url: string;
}

interface CollaborationProps {
  selectedProject?: any;
}

export function Collaboration({ selectedProject }: CollaborationProps) {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'comments' | 'team' | 'files'>('comments');
  const [newComment, setNewComment] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('all');
  const [mentionSuggestions, setMentionSuggestions] = useState<TeamMember[]>([]);
  const [showMentions, setShowMentions] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [comments, setComments] = useState<Comment[]>([]);



  const [sharedFiles, setSharedFiles] = useState<SharedFile[]>([]);

  // Load team members and activities when component mounts or project changes
  useEffect(() => {
    const loadData = async () => {
      if (!selectedProject || !user) return;

      setLoading(true);
      try {
        // Load team members
        const members = await projectsAPI.getMembers(selectedProject.id);
        const formattedMembers: TeamMember[] = (members || []).map((member: any) => ({
          id: member.id,
          name: member.name,
          email: member.email,
          role: member.role || 'member',
          avatar: member.name.split(' ').map((n: string) => n[0]).join('').toUpperCase(),
          status: 'online', // Default status
          skills: [] // Could be extended later
        }));
        setTeamMembers(formattedMembers);
        setMentionSuggestions(formattedMembers);

        // Load activities
        const projectActivities = await activitiesAPI.getAll({ projectId: selectedProject.id });
        const formattedActivities = [
          { id: 'all', title: 'All Activities' },
          ...(projectActivities || []).map((activity: any) => ({
            id: activity.id,
            title: activity.title
          }))
        ];
        setActivities(formattedActivities);
      } catch (error) {
        console.error('Failed to load collaboration data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [selectedProject, user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-400';
      default: return 'bg-gray-400';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'pm': return 'bg-blue-100 text-blue-800';
      case 'member': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'pdf': return '📄';
      case 'figma': return '🎨';
      case 'markdown': return '📝';
      case 'image': return '🖼️';
      case 'document': return '📋';
      default: return '📎';
    }
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleCommentSubmit = () => {
    if (!newComment.trim() || !user) return;

    const comment: Comment = {
      id: Date.now().toString(),
      author: user.name,
      authorRole: user.role as 'member' | 'pm' | 'admin',
      content: newComment,
      timestamp: new Date().toISOString(),
      activityId: selectedActivity === 'all' ? '1' : selectedActivity,
      activityTitle: activities.find(a => a.id === selectedActivity)?.title || '',
      mentions: [],
      attachments: [],
      replies: []
    };

    setComments(prev => [comment, ...prev]);
    setNewComment('');
  };

  const handleMention = (member: TeamMember) => {
    const mentionText = `@${member.email.split('@')[0]} `;
    setNewComment(prev => prev + mentionText);
    setShowMentions(false);
  };

  const filteredComments = selectedActivity === 'all' 
    ? comments 
    : comments.filter(comment => comment.activityId === selectedActivity);

  const filteredFiles = selectedActivity === 'all'
    ? sharedFiles
    : sharedFiles.filter(file => file.activityId === selectedActivity);

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500">Loading collaboration data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Team Collaboration</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedActivity}
            onChange={(e) => setSelectedActivity(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {activities.map(activity => (
              <option key={activity.id} value={activity.id}>{activity.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'comments', label: 'Comments & Discussions', icon: '💬', count: filteredComments.length },
            { id: 'team', label: 'Team Members', icon: '👥', count: teamMembers.length },
            { id: 'files', label: 'Shared Files', icon: '📎', count: filteredFiles.length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
              <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                activeTab === tab.id 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'bg-gray-100 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Comments Tab */}
      {activeTab === 'comments' && (
        <div className="space-y-6">
          {/* New Comment Form */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {user?.name.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share your thoughts, ask questions, or mention team members with @..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={() => setShowMentions(!showMentions)}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      @ Mention
                    </button>
                    <button className="text-sm text-blue-600 hover:text-blue-700">
                      📎 Attach File
                    </button>
                  </div>
                  <button
                    onClick={handleCommentSubmit}
                    disabled={!newComment.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Post Comment
                  </button>
                </div>

                {/* Mention Suggestions */}
                {showMentions && (
                  <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-lg">
                    {teamMembers.map(member => (
                      <button
                        key={member.id}
                        onClick={() => handleMention(member)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                      >
                        <div className="w-6 h-6 bg-gray-500 rounded-full flex items-center justify-center text-white text-xs">
                          {member.avatar}
                        </div>
                        <span className="text-sm">{member.name}</span>
                        <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                          {member.role}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Comments List */}
          <div className="space-y-4">
            {filteredComments.map(comment => (
              <div key={comment.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-gray-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {comment.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <span className="font-medium text-gray-900">{comment.author}</span>
                      <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(comment.authorRole)}`}>
                        {comment.authorRole}
                      </span>
                      <span className="text-sm text-gray-500">
                        {new Date(comment.timestamp).toLocaleString()}
                      </span>
                    </div>
                    
                    <p className="text-gray-700 mb-2">{comment.content}</p>
                    
                    {comment.activityTitle && (
                      <div className="text-sm text-blue-600 mb-2">
                        📋 {comment.activityTitle}
                      </div>
                    )}

                    {comment.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2">
                        {comment.attachments.map(attachment => (
                          <span key={attachment} className="inline-flex items-center px-2 py-1 bg-gray-100 text-gray-700 text-sm rounded">
                            📎 {attachment}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <button className="hover:text-blue-600">👍 Like</button>
                      <button className="hover:text-blue-600">💬 Reply</button>
                      <button className="hover:text-blue-600">🔗 Share</button>
                    </div>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="mt-4 pl-4 border-l-2 border-gray-200 space-y-3">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="flex items-start space-x-3">
                            <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs">
                              {reply.author.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="font-medium text-gray-900 text-sm">{reply.author}</span>
                                <span className="text-xs text-gray-500">
                                  {new Date(reply.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <p className="text-gray-700 text-sm">{reply.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Team Members Tab */}
      {activeTab === 'team' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {teamMembers.map(member => (
            <div key={member.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center space-x-3 mb-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gray-500 rounded-full flex items-center justify-center text-white font-medium">
                    {member.avatar}
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(member.status)}`}></div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{member.name}</h3>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${getRoleColor(member.role)}`}>
                  {member.role}
                </span>
              </div>
              
              <div className="mb-3">
                <span className="text-sm font-medium text-gray-700">Skills:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {member.skills.map(skill => (
                    <span key={skill} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="flex-1 px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                  💬 Message
                </button>
                <button className="px-3 py-2 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                  👁️ Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Shared Files Tab */}
      {activeTab === 'files' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {filteredFiles.length} files shared
            </div>
            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
              📎 Upload File
            </button>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="divide-y divide-gray-200">
              {filteredFiles.map(file => (
                <div key={file.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getFileIcon(file.type)}</span>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{file.name}</h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>Uploaded by {file.uploadedBy}</span>
                        <span>{formatFileSize(file.size)}</span>
                        <span>{new Date(file.uploadedAt).toLocaleDateString()}</span>
                      </div>
                      {file.activityTitle && (
                        <div className="text-sm text-blue-600 mt-1">
                          📋 {file.activityTitle}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                        Download
                      </button>
                      <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700">
                        Preview
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
