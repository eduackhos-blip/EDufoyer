import { Server as SocketIOServer } from 'socket.io';
import Solver from './models/Solver.js';

let ioInstance = null;

export function initSocket(httpServer) {
  if (ioInstance) return ioInstance;
  
  ioInstance = new SocketIOServer(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173', 'https://edufoyer.com', 'http://edufoyer.com'],
      credentials: true,
      methods: ['GET', 'POST']
    },
    // Optimizations for scalability (15k users)
    pingTimeout: 60000, // Increased timeout for stability
    pingInterval: 25000, // Increased interval to reduce overhead
    maxHttpBufferSize: 1e6, // 1MB max buffer
    allowEIO3: true,
    transports: ['websocket', 'polling'], // Allow both transports
    upgradeTimeout: 10000, // Faster upgrade
    allowUpgrades: true,
    perMessageDeflate: true, // Enable compression
    connectTimeout: 45000 // Connection timeout
  });

  // Connection handling with better error management
  ioInstance.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);
    
    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id}, reason: ${reason}`);
    });
    
    // Register solver with enhanced error handling and caching
    socket.on('registerSolver', async ({ userId, subjects = [] }) => {
      try {
        if (userId) {
          socket.join(`solver:${userId}`);
          console.log(`Solver registered: ${userId}`);
        }
        
        let subjectList = Array.isArray(subjects) ? subjects : [];
        
        // Optimize: Only query database if no subjects provided
        if ((!subjectList || subjectList.length === 0) && userId) {
          try {
            const solverDoc = await Solver.findOne({ user_id: userId })
              .select('specialities')
              .lean(); // Use lean() for faster query
            
            if (solverDoc?.specialities?.length) {
              subjectList = solverDoc.specialities;
            }
          } catch (dbError) {
            console.error('Database error during solver registration:', dbError);
            // Continue with empty subject list
          }
        }
        
        // Optimize: Batch join rooms
        const roomJoins = subjectList.map((s) => `subject:${String(s).toLowerCase()}`);
        roomJoins.forEach((room) => {
          socket.join(room);
        });
        
        socket.emit('registrationSuccess', { 
          message: 'Successfully registered as solver',
          subjects: subjectList 
        });
        
      } catch (error) {
        console.error('Solver registration error:', error);
        socket.emit('registrationError', { 
          message: 'Failed to register as solver' 
        });
      }
    });
    
    // Heartbeat to keep connection alive
    socket.on('ping', () => {
      socket.emit('pong');
    });
    
    // Handle client errors gracefully
    socket.on('clientError', (error) => {
      console.error(`Client error from ${socket.id}:`, error);
    });
  });

  // Handle server errors
  ioInstance.on('error', (error) => {
    console.error('Socket.IO server error:', error);
  });

  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error('Socket.IO not initialized. Call initSocket(server) first.');
  }
  return ioInstance;
}


