import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoose from 'mongoose';

const app = express();

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  }
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Simple in-memory storage for testing
const users = [
  {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8X8Qj2K', // password123
    role: 'user',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const doubts = [];

// Simple JWT-like token generation
const generateSimpleToken = (userId) => {
  return `demo-token-${userId}-${Date.now()}`;
};

// Simple authentication middleware
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token required'
      });
    }

    if (!token.startsWith('demo-token-')) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    const userId = parseInt(token.split('-')[2]);
    const user = users.find(u => u.id === userId);

    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or inactive user'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
};

// Auth routes
app.post('/api/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    const user = users.find(u => u.email === email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (password !== 'password123') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const token = generateSimpleToken(user.id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
});

app.post('/api/auth/register', (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required'
      });
    }

    const existingUser = users.find(u => u.email === email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    const newUser = {
      id: users.length + 1,
      name,
      email,
      password: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J/8X8Qj2K',
      role: 'user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    users.push(newUser);
    const token = generateSimpleToken(newUser.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
});

app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role
      }
    }
  });
});

// Doubt routes
app.post('/api/doubts/create', authenticateToken, (req, res) => {
  try {
    const { title, subject, category, description, imagePath, tags } = req.body;

    if (!title || !subject || !category || !description) {
      return res.status(400).json({
        success: false,
        message: 'Title, subject, category, and description are required'
      });
    }

    const newDoubt = {
      id: doubts.length + 1,
      title,
      subject,
      category,
      description,
      imagePath: imagePath || null,
      status: 'pending',
      priority: 'medium',
      asker: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      solver: null,
      answers: [],
      tags: tags || [],
      views: 0,
      upvotes: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    doubts.push(newDoubt);

    res.status(201).json({
      success: true,
      message: 'Doubt created successfully',
      data: {
        doubt: newDoubt
      }
    });

  } catch (error) {
    console.error('Create doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating doubt'
    });
  }
});

app.get('/api/doubts/my-doubts', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, status, subject } = req.query;
    const skip = (page - 1) * limit;

    let userDoubts = doubts.filter(d => d.asker.id === req.user.id && d.isActive);

    if (status) {
      userDoubts = userDoubts.filter(d => d.status === status);
    }
    if (subject) {
      userDoubts = userDoubts.filter(d => d.subject === subject);
    }

    // Sort by creation date (newest first)
    userDoubts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginatedDoubts = userDoubts.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        doubts: paginatedDoubts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(userDoubts.length / limit),
          totalDoubts: userDoubts.length,
          hasNext: page * limit < userDoubts.length,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get my doubts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doubts'
    });
  }
});

app.get('/api/doubts/all', authenticateToken, (req, res) => {
  try {
    const { page = 1, limit = 10, status, subject, category } = req.query;
    const skip = (page - 1) * limit;

    let allDoubts = doubts.filter(d => d.isActive);

    if (status) {
      allDoubts = allDoubts.filter(d => d.status === status);
    }
    if (subject) {
      allDoubts = allDoubts.filter(d => d.subject === subject);
    }
    if (category) {
      allDoubts = allDoubts.filter(d => d.category === category);
    }

    // Sort by creation date (newest first)
    allDoubts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginatedDoubts = allDoubts.slice(skip, skip + parseInt(limit));

    res.json({
      success: true,
      data: {
        doubts: paginatedDoubts,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(allDoubts.length / limit),
          totalDoubts: allDoubts.length,
          hasNext: page * limit < allDoubts.length,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get all doubts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doubts'
    });
  }
});

app.get('/api/doubts/:id', authenticateToken, (req, res) => {
  try {
    const doubt = doubts.find(d => d.id === parseInt(req.params.id));

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    // Increment views
    doubt.views += 1;

    res.json({
      success: true,
      data: {
        doubt
      }
    });

  } catch (error) {
    console.error('Get doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching doubt'
    });
  }
});

app.post('/api/doubts/:id/answer', authenticateToken, (req, res) => {
  try {
    const { answer } = req.body;
    const doubt = doubts.find(d => d.id === parseInt(req.params.id));

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    if (doubt.asker.id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot answer your own doubt'
      });
    }

    const newAnswer = {
      id: doubt.answers.length + 1,
      solver: {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      },
      answer,
      isAccepted: false,
      createdAt: new Date()
    };

    doubt.answers.push(newAnswer);

    if (doubt.status === 'pending') {
      doubt.status = 'answered';
      doubt.solver = {
        id: req.user.id,
        name: req.user.name,
        email: req.user.email
      };
    }

    res.json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        doubt
      }
    });

  } catch (error) {
    console.error('Answer doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while submitting answer'
    });
  }
});

app.post('/api/doubts/:id/accept-answer/:answerId', authenticateToken, (req, res) => {
  try {
    const doubt = doubts.find(d => d.id === parseInt(req.params.id));

    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    if (doubt.asker.id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the asker can accept answers'
      });
    }

    const answer = doubt.answers.find(a => a.id === parseInt(req.params.answerId));
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    answer.isAccepted = true;
    doubt.status = 'resolved';

    res.json({
      success: true,
      message: 'Answer accepted successfully',
      data: {
        doubt
      }
    });

  } catch (error) {
    console.error('Accept answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while accepting answer'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Global error handler:', error);
  
  res.status(error.status || 500).json({
    success: false,
    message: error.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Auth API: http://localhost:${PORT}/api/auth`);
  console.log(`❓ Doubts API: http://localhost:${PORT}/api/doubts`);
  console.log(`\n📝 Test credentials:`);
  console.log(`   Email: test@example.com`);
  console.log(`   Password: password123`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Promise Rejection:', err);
  process.exit(1);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});
