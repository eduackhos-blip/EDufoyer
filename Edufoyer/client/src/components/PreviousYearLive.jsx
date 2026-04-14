import React, { useState } from 'react';
import { Calendar, Users, Video, Clock, CheckCircle, ArrowLeft } from 'lucide-react';
import livekitService from '../services/livekitService';
import { useNavigate } from 'react-router-dom';

const PreviousYearLive = () => {
  const navigate = useNavigate();
  const [paperName, setPaperName] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [participants, setParticipants] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [roomInfo, setRoomInfo] = useState(null);

  const handleSchedule = async (e) => {
    e.preventDefault();
    setError(null);
    if (!paperName) {
      setError('Please enter/select a previous year paper');
      return;
    }
    if (!scheduledAt) {
      setError('Please select a date and time');
      return;
    }
    try {
      setLoading(true);
      const res = await livekitService.scheduleRoom({
        roomBase: `pyq-${paperName.replace(/\s+/g, '-').toLowerCase()}`,
        scheduledAt,
        maxParticipants: participants,
      });
      if (!res?.success) {
        throw new Error(res?.message || 'Failed to schedule');
      }
      setRoomInfo(res.data);
    } catch (err) {
      setError(err.message || 'Failed to schedule');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = () => {
    if (roomInfo?.roomName) {
      navigate(`/dashboard/pyq/${encodeURIComponent(roomInfo.roomName)}`);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>
      </div>
      
      <h1 className="text-2xl font-semibold mb-6 flex items-center gap-2">
        <Video className="w-6 h-6 text-green-600" />
        Live Previous Year Solution
      </h1>

      {/* Coming Soon Badge */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-3 bg-gradient-to-r from-green-100 to-emerald-100 border-4 border-green-500 px-8 py-4 rounded-2xl shadow-2xl">
          <Clock className="w-8 h-8 text-green-600 animate-pulse" />
          <span className="text-3xl font-bold text-green-800">Coming Soon</span>
        </div>
      </div>

      <form onSubmit={handleSchedule} className="space-y-5 bg-white rounded-lg p-5 shadow">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Previous Year Paper</label>
          <input
            type="text"
            placeholder="e.g., JEE Main 2022 Shift 1"
            value={paperName}
            onChange={(e) => setPaperName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Select Date & Time
          </label>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
            <Users className="w-4 h-4" /> Number of Participants
          </label>
          <select
            value={participants}
            onChange={(e) => setParticipants(Number(e.target.value))}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value={2}>2</option>
            <option value={3}>3</option>
            <option value={4}>4</option>
            <option value={5}>5</option>
            <option value={10}>10</option>
          </select>
        </div>

        {error && (
          <div className="text-red-600 text-sm">{error}</div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-70 flex items-center gap-2"
        >
          <Clock className="w-4 h-4" />
          {loading ? 'Scheduling...' : 'Schedule Session'}
        </button>
      </form>

      {roomInfo && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
            <CheckCircle className="w-5 h-5" /> Scheduled Successfully
          </div>
          <div className="text-sm text-green-900">Room: <span className="font-mono">{roomInfo.roomName}</span></div>
          <div className="text-sm text-green-900">Time: {new Date(roomInfo.scheduledAt).toLocaleString()}</div>
          <div className="text-sm text-green-900 mb-3">Max Participants: {roomInfo.maxParticipants}</div>
          <button
            onClick={handleJoin}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Join Now
          </button>
        </div>
      )}
    </div>
  );
};

export default PreviousYearLive;


