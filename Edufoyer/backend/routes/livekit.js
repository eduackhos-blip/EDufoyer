import express from 'express';
import { protect } from '../middleware/auth.js';
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import SolverDoubts from '../models/SolverDoubts.js';
import Doubt from '../models/Doubt.js';

const router = express.Router();

// @route   POST /api/livekit/generate-token
// @desc    Generate LiveKit token for doubt session
// @access  Private
router.post('/generate-token', protect, async (req, res) => {
  try {
    console.log('LiveKit token generation request:', { doubtId: req.body.doubtId, userId: req.user.id });
    
    const { doubtId } = req.body;
    const userId = req.user.id;

    if (!doubtId) {
      console.log('Missing doubtId in request');
      return res.status(400).json({ success: false, message: 'Doubt ID is required' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit configuration error' });
    }

    // Optimize: Use lean() and select only needed fields for faster queries
    const assignment = await SolverDoubts.findOne({ doubt_id: doubtId })
      .select('solver_id livekit_room_name resolution_status')
      .lean();

    if (!assignment || !assignment.livekit_room_name) {
      return res.status(404).json({ success: false, message: 'Session not found or not scheduled' });
    }

    const doubt = await Doubt.findById(doubtId)
      .select('doubter_id status')
      .lean();
    
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    // Block rejoin if session already completed/rated/resolved
    if (doubt.status === 'resolved' || assignment.resolution_status === 'session_completed') {
      return res.status(403).json({ success: false, message: 'Session already completed. Rejoining is not allowed.' });
    }

    // Check if the current user is either the student or the assigned solver
    const solverIdStr = assignment.solver_id?.toString?.() || String(assignment.solver_id);
    const doubterIdStr = doubt.doubter_id?.toString?.() || String(doubt.doubter_id);
    if (userId.toString() !== solverIdStr && userId.toString() !== doubterIdStr) {
      return res.status(403).json({ success: false, message: 'Not authorized for this session' });
    }

    // Optimize: Create Access Token with faster settings
    const at = new AccessToken(apiKey, apiSecret, {
      identity: userId,
      name: req.user.name || req.user.email || 'Participant',
      ttl: 3600, // 1 hour token lifetime for faster generation
    });

    // Define permissions
    at.addGrant({
      room: assignment.livekit_room_name,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Optimize: Use synchronous token generation for faster response
    const token = at.toJwt();

    const responseData = {
      success: true,
      token: token,
      roomName: assignment.livekit_room_name,
    };
    
    console.log('LiveKit token generated successfully:', { 
      roomName: assignment.livekit_room_name, 
      tokenLength: token.length 
    });
    
    res.status(200).json(responseData);
  } catch (error) {
    console.error('Error generating LiveKit token:', error);
    res.status(500).json({ success: false, message: 'Failed to generate session token' });
  }
});

// @route   POST /api/livekit/schedule-room
// @desc    Create/schedule a LiveKit room for PYQ or custom sessions
// @access  Private
router.post('/schedule-room', protect, async (req, res) => {
  try {
    const { roomBase = 'pyq', scheduledAt, maxParticipants = 2 } = req.body || {};

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || 'https://remote-opgy8hh4.livekit.cloud';

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit configuration error' });
    }

    // Build a unique room name; include user id for traceability
    const when = scheduledAt ? new Date(scheduledAt).getTime() : Date.now();
    const safeBase = String(roomBase).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 40) || 'pyq';
    const roomName = `${safeBase}-${req.user.id}-${when}`;

    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    const roomOptions = {
      name: roomName,
      emptyTimeout: 60,
      maxParticipants: Math.max(2, Math.min(50, Number(maxParticipants) || 2)),
    };

    try {
      await roomService.createRoom(roomOptions);
    } catch (e) {
      if (!String(e?.message || '').includes('already exists')) {
        throw e;
      }
    }

    return res.status(200).json({
      success: true,
      data: {
        roomName,
        scheduledAt: scheduledAt || new Date().toISOString(),
        maxParticipants: roomOptions.maxParticipants,
      }
    });
  } catch (error) {
    console.error('Error scheduling LiveKit room:', error);
    return res.status(500).json({ success: false, message: 'Failed to schedule room' });
  }
});

// @route   POST /api/livekit/token-by-room
// @desc    Generate a LiveKit token for an arbitrary room name
// @access  Private
router.post('/token-by-room', protect, async (req, res) => {
  try {
    const { roomName } = req.body || {};
    if (!roomName) {
      return res.status(400).json({ success: false, message: 'roomName is required' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit configuration error' });
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity: req.user.id,
      name: req.user.name || req.user.email || 'Participant',
    });

    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();
    return res.status(200).json({ success: true, token, roomName });
  } catch (error) {
    console.error('Error generating token by room:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate token' });
  }
});

// @route   POST /api/livekit/generate-token-email
// @desc    Generate LiveKit token for email-based session join (no auth required)
// @access  Public
router.post('/generate-token-email', async (req, res) => {
  try {
    console.log('LiveKit email token generation request:', { doubtId: req.body.doubtId });
    
    const { doubtId } = req.body;

    if (!doubtId) {
      console.log('Missing doubtId in request');
      return res.status(400).json({ success: false, message: 'Doubt ID is required' });
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ success: false, message: 'LiveKit configuration error' });
    }

    // Find the doubt to get room information
    const doubt = await Doubt.findById(doubtId).select('_id subject status roomName').lean();
    
    if (!doubt) {
      console.log('Doubt not found:', doubtId);
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    if (doubt.status !== 'awaiting_solver' && doubt.status !== 'in_progress') {
      console.log('Doubt not available for session:', doubt.status);
      return res.status(400).json({ success: false, message: 'Doubt session is not available' });
    }

    // Generate room name
    const roomName = doubt.roomName || `doubt-session-${doubtId}`;
    
    // Create access token
    const at = new AccessToken(apiKey, apiSecret, {
      identity: `email-join-${Date.now()}`,
      name: 'Email Join User',
      ttl: 3600 // 1 hour
    });

    // Grant permissions
    at.addGrant({
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    // Generate token
    const token = at.toJwt();

    console.log('Email token generated successfully for room:', roomName);

    res.json({
      success: true,
      token,
      roomName,
      message: 'Token generated successfully for email join'
    });

  } catch (error) {
    console.error('Email token generation error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate email token' });
  }
});

export default router;
