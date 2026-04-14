import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import livekitService from '../services/livekitService';
import { LiveKitRoom, VideoConference } from '@livekit/components-react';
import '@livekit/components-styles';

const LIVEKIT_URL = import.meta.env.VITE_LIVEKIT_URL || 'wss://your-project.livekit.cloud';

const JoinPyqRoom = () => {
  const { roomName } = useParams();
  const [token, setToken] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchToken = async () => {
      try {
        setLoading(true);
        const res = await livekitService.tokenByRoom(decodeURIComponent(roomName));
        if (!res?.success || !res?.token) throw new Error(res?.message || 'Token error');
        setToken(res.token);
      } catch (e) {
        setError(e.message || 'Failed to join room');
      } finally {
        setLoading(false);
      }
    };
    if (roomName) fetchToken();
  }, [roomName]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-gray-600">Joining...</div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-red-600">{error}</div>;
  if (!token) return null;

  return (
    <div data-lk-theme="default" className="h-screen bg-black">
      <LiveKitRoom
        token={token}
        serverUrl={LIVEKIT_URL}
        connectOptions={{ autoSubscribe: true }}
        audio
        video
        className="h-full"
      >
        <VideoConference />
      </LiveKitRoom>
    </div>
  );
};

export default JoinPyqRoom;



