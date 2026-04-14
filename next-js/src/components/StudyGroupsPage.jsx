import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Calendar,
  Clock,
  MapPin,
  Star,
  Crown,
  Shield,
  Settings,
  MessageCircle,
  Video,
  BookOpen,
  Loader2,
  X,
  Check,
  Lock,
  Globe,
  UserPlus,
  MoreVertical
} from 'lucide-react';
import socialService from '../services/socialService';

const StudyGroupsPage = () => {
  const [studyGroups, setStudyGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showJoinGroup, setShowJoinGroup] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [newGroup, setNewGroup] = useState({
    name: '',
    description: '',
    subject: '',
    maxMembers: 50,
    isPrivate: false,
    rules: [],
    studySchedule: {
      frequency: 'weekly',
      days: [],
      time: '',
      timezone: 'UTC'
    }
  });
  const [joinCode, setJoinCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 
    'Computer Science', 'Engineering', 'Literature', 'History',
    'Data Science', 'Artificial Intelligence', 'Business', 
    'Economics', 'Psychology', 'Sociology'
  ];

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  useEffect(() => {
    loadStudyGroups();
  }, []);

  const loadStudyGroups = async () => {
    try {
      setIsLoading(true);
      const response = await socialService.getStudyGroups(1, 20, { subject: selectedSubject === 'all' ? null : selectedSubject });
      setStudyGroups(response.studyGroups);
      
      // Load user's groups (this would be a separate API call)
      setMyGroups([]);
    } catch (error) {
      console.error('Error loading study groups:', error);
      // Fallback to sample data
      const sampleGroups = [
        {
          _id: 1,
          name: 'Advanced Calculus Study Group',
          description: 'Deep dive into calculus concepts and problem solving',
          subject: 'Mathematics',
          creator: { name: 'Dr. Sarah Wilson', avatar: 'https://via.placeholder.com/40' },
          members: [
            { user: { name: 'John Doe', avatar: 'https://via.placeholder.com/40' }, role: 'admin' },
            { user: { name: 'Jane Smith', avatar: 'https://via.placeholder.com/40' }, role: 'member' },
            { user: { name: 'Mike Johnson', avatar: 'https://via.placeholder.com/40' }, role: 'member' }
          ],
          maxMembers: 20,
          isPrivate: false,
          studySchedule: {
            frequency: 'weekly',
            days: ['monday', 'wednesday', 'friday'],
            time: '19:00',
            timezone: 'UTC'
          },
          tags: ['calculus', 'mathematics', 'advanced'],
          lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
          isActive: true
        },
        {
          _id: 2,
          name: 'Physics Problem Solvers',
          description: 'Collaborative physics problem solving and concept discussions',
          subject: 'Physics',
          creator: { name: 'Prof. Alex Chen', avatar: 'https://via.placeholder.com/40' },
          members: [
            { user: { name: 'Alice Brown', avatar: 'https://via.placeholder.com/40' }, role: 'admin' },
            { user: { name: 'Bob Wilson', avatar: 'https://via.placeholder.com/40' }, role: 'moderator' },
            { user: { name: 'Carol Davis', avatar: 'https://via.placeholder.com/40' }, role: 'member' }
          ],
          maxMembers: 15,
          isPrivate: true,
          inviteCode: 'PHYS2024',
          studySchedule: {
            frequency: 'bi-weekly',
            days: ['tuesday', 'thursday'],
            time: '18:30',
            timezone: 'UTC'
          },
          tags: ['physics', 'problems', 'collaboration'],
          lastActivity: new Date(Date.now() - 1 * 60 * 60 * 1000),
          isActive: true
        }
      ];
      setStudyGroups(sampleGroups);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroup.name.trim() || !newGroup.subject) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setIsCreating(true);
      const response = await socialService.createStudyGroup(newGroup);
      setStudyGroups([response.data, ...studyGroups]);
      setNewGroup({
        name: '',
        description: '',
        subject: '',
        maxMembers: 50,
        isPrivate: false,
        rules: [],
        studySchedule: {
          frequency: 'weekly',
          days: [],
          time: '',
          timezone: 'UTC'
        }
      });
      setShowCreateGroup(false);
    } catch (error) {
      console.error('Error creating study group:', error);
      alert('Failed to create study group. Please try again.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async (groupId, inviteCode = null) => {
    try {
      setIsJoining(true);
      await socialService.joinStudyGroup(groupId, inviteCode);
      alert('Successfully joined the study group!');
      loadStudyGroups(); // Reload groups
    } catch (error) {
      console.error('Error joining study group:', error);
      alert('Failed to join study group. Please check the invite code.');
    } finally {
      setIsJoining(false);
    }
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Crown className="w-4 h-4 text-yellow-500" />;
      case 'moderator':
        return <Shield className="w-4 h-4 text-blue-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatSchedule = (schedule) => {
    if (!schedule) return 'No schedule set';
    
    const dayNames = {
      monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', 
      thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun'
    };
    
    const days = schedule.days?.map(day => dayNames[day]).join(', ') || 'No days set';
    const time = schedule.time || 'No time set';
    const frequency = schedule.frequency || 'weekly';
    
    return `${frequency} • ${days} • ${time}`;
  };

  const filteredGroups = studyGroups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         group.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesSubject = selectedSubject === 'all' || group.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading study groups...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-green-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Study Groups</h1>
              <p className="text-gray-600">Join collaborative learning communities</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowJoinGroup(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              Join Group
            </button>
            <button
              onClick={() => setShowCreateGroup(true)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Group
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search study groups..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Create Study Group</h3>
              <button
                onClick={() => setShowCreateGroup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Group Name *
                </label>
                <input
                  type="text"
                  value={newGroup.name}
                  onChange={(e) => setNewGroup({...newGroup, name: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Enter group name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject *
                </label>
                <select
                  value={newGroup.subject}
                  onChange={(e) => setNewGroup({...newGroup, subject: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="">Select Subject</option>
                  {subjects.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newGroup.description}
                  onChange={(e) => setNewGroup({...newGroup, description: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  rows={3}
                  placeholder="Describe your study group"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Members
                  </label>
                  <input
                    type="number"
                    value={newGroup.maxMembers}
                    onChange={(e) => setNewGroup({...newGroup, maxMembers: parseInt(e.target.value)})}
                    className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    min="2"
                    max="100"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Privacy
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={!newGroup.isPrivate}
                        onChange={() => setNewGroup({...newGroup, isPrivate: false})}
                        className="mr-2"
                      />
                      <Globe className="w-4 h-4 mr-1" />
                      Public
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        checked={newGroup.isPrivate}
                        onChange={() => setNewGroup({...newGroup, isPrivate: true})}
                        className="mr-2"
                      />
                      <Lock className="w-4 h-4 mr-1" />
                      Private
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Study Schedule
                </label>
                <div className="space-y-3">
                  <div className="flex gap-4">
                    <select
                      value={newGroup.studySchedule.frequency}
                      onChange={(e) => setNewGroup({
                        ...newGroup, 
                        studySchedule: {...newGroup.studySchedule, frequency: e.target.value}
                      })}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="bi-weekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                    </select>
                    <input
                      type="time"
                      value={newGroup.studySchedule.time}
                      onChange={(e) => setNewGroup({
                        ...newGroup, 
                        studySchedule: {...newGroup.studySchedule, time: e.target.value}
                      })}
                      className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">Study Days</label>
                    <div className="flex flex-wrap gap-2">
                      {days.map(day => (
                        <label key={day} className="flex items-center">
                          <input
                            type="checkbox"
                            checked={newGroup.studySchedule.days.includes(day)}
                            onChange={(e) => {
                              const days = newGroup.studySchedule.days;
                              if (e.target.checked) {
                                setNewGroup({
                                  ...newGroup,
                                  studySchedule: {...newGroup.studySchedule, days: [...days, day]}
                                });
                              } else {
                                setNewGroup({
                                  ...newGroup,
                                  studySchedule: {...newGroup.studySchedule, days: days.filter(d => d !== day)}
                                });
                              }
                            }}
                            className="mr-1"
                          />
                          <span className="text-sm capitalize">{day}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateGroup(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={isCreating}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Group'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Join Group Modal */}
      {showJoinGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Join Study Group</h3>
              <button
                onClick={() => setShowJoinGroup(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Invite Code (for private groups)
                </label>
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter invite code"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowJoinGroup(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // This would join a specific group by ID
                  setShowJoinGroup(false);
                }}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Join Group
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Study Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map(group => (
          <div key={group._id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
            {/* Group Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800">{group.name}</h3>
                    <p className="text-sm text-gray-500">{group.subject}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  {group.isPrivate ? (
                    <Lock className="w-4 h-4 text-gray-400" />
                  ) : (
                    <Globe className="w-4 h-4 text-gray-400" />
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4">{group.description}</p>

              {/* Group Stats */}
              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>{group.members.length}/{group.maxMembers}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatSchedule(group.studySchedule)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  <span>Active</span>
                </div>
              </div>
            </div>

            {/* Group Members */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-medium text-gray-800">Members</h4>
                <span className="text-sm text-gray-500">{group.members.length} members</span>
              </div>
              
              <div className="flex -space-x-2 mb-4">
                {group.members.slice(0, 4).map((member, index) => (
                  <img
                    key={index}
                    src={member.user.avatar || 'https://via.placeholder.com/40'}
                    alt={member.user.name}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                ))}
                {group.members.length > 4 && (
                  <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium">
                    +{group.members.length - 4}
                  </div>
                )}
              </div>

              {/* Group Tags */}
              {group.tags && group.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-4">
                  {group.tags.map((tag, index) => (
                    <span key={index} className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded-full">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Group Actions */}
              <div className="flex gap-2">
                <button
                  onClick={() => handleJoinGroup(group._id, group.inviteCode)}
                  disabled={isJoining}
                  className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1"
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Check className="w-4 h-4" />
                  )}
                  Join Group
                </button>
                <button className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4" />
                </button>
                <button className="bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredGroups.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-600 mb-2">No study groups found</h3>
          <p className="text-gray-500 mb-4">Try adjusting your search or create a new group</p>
          <button
            onClick={() => setShowCreateGroup(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
          >
            Create Study Group
          </button>
        </div>
      )}
    </div>
  );
};

export default StudyGroupsPage;




