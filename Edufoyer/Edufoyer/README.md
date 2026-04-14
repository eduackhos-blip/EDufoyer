# Comprehensive Doubt Management System

A full-stack application for managing doubts, connecting students with solvers, and providing real-time video sessions for doubt resolution.

## 🚀 Features

### Core Functionality
- **User Authentication & Authorization** - Secure login/registration with JWT
- **Profile Management** - User onboarding with subject specialization
- **Doubt Management** - Create, view, and manage doubts
- **Solver System** - Accept and solve doubts based on specialization
- **Real-time Notifications** - Email and in-app notifications
- **Video Sessions** - LiveKit integration for real-time doubt solving
- **Status Tracking** - Comprehensive doubt and resolution status management

### Advanced Features
- **Smart Matching** - Automatic solver assignment based on subject expertise
- **Rating System** - Feedback and rating for solvers
- **File Uploads** - Image attachments for doubts
- **Real-time Updates** - Live status updates and notifications
- **Responsive Design** - Mobile-friendly interface

## 🏗️ Architecture

### Backend (Node.js/Express)
- **Authentication** - JWT-based auth with bcrypt password hashing
- **Database** - MongoDB with Mongoose ODM
- **API Routes** - RESTful API endpoints
- **Real-time** - Socket.io for live updates
- **Video** - LiveKit integration for video sessions
- **Email** - Nodemailer for notifications

### Frontend (React/Vite)
- **Routing** - React Router DOM
- **State Management** - React hooks and context
- **UI Components** - Custom components with Tailwind CSS
- **Real-time** - Socket.io client integration
- **Video** - LiveKit React components

## 📁 Project Structure

```
finaln/
├── backend/
│   ├── actions/           # Business logic
│   │   ├── doubt/        # Doubt-related actions
│   │   ├── solver/       # Solver-related actions
│   │   ├── profile/      # Profile management
│   │   └── notification/ # Notification system
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── middleware/       # Custom middleware
│   ├── utils/            # Utility functions
│   └── server.js         # Main server file
├── final/                # Frontend React app
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── services/     # API services
│   │   ├── utils/        # Utility functions
│   │   └── App.jsx       # Main app component
│   └── package.json
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   ```bash
   cp env.example .env
   ```
   Edit `.env` with your configuration:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/doubt-system
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=http://localhost:5173
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=your-app-password
   LIVEKIT_URL=wss://your-livekit-server.com
   LIVEKIT_API_KEY=your-livekit-api-key
   LIVEKIT_API_SECRET=your-livekit-api-secret
   ```

4. **Start the server**
   ```bash
   npm start
   # or for development
   npm run dev
   ```

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd final
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Database Models

#### User Model
- Basic user information
- Authentication data
- Profile completion status

#### Profile Model
- Mobile number
- Strong subject specialization
- University and course information

#### Doubt Model
- Subject and description
- Status tracking (open, assigned, resolved, closed)
- Image attachments
- Rating system

#### Solver Model
- Specialization areas
- Performance metrics
- Rating and solved count

#### Notification Model
- Real-time notifications
- Email integration
- Status tracking

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

#### Doubts
- `POST /api/doubts/create` - Create new doubt
- `GET /api/doubts/my-doubts` - Get user's doubts
- `GET /api/doubts/all` - Get all doubts
- `GET /api/doubts/:id` - Get specific doubt

#### Solver
- `POST /api/solver/accept-doubt` - Accept doubt assignment
- `GET /api/solver/assigned-doubts` - Get assigned doubts
- `GET /api/solver/available-doubts` - Get available doubts

#### Profile
- `POST /api/profile/create` - Create user profile
- `GET /api/profile` - Get user profile

#### Notifications
- `GET /api/notifications` - Get user notifications
- `PATCH /api/notifications/mark-read` - Mark all as read
- `PATCH /api/notifications/:id/read` - Mark specific as read

#### LiveKit
- `POST /api/livekit/generate-token` - Generate video session token

## 🎯 Usage

### For Students
1. **Register/Login** - Create account or login
2. **Complete Profile** - Set up specialization and preferences
3. **Ask Doubts** - Create doubts with descriptions and images
4. **Track Progress** - Monitor doubt status and solutions
5. **Join Sessions** - Participate in real-time video sessions
6. **Provide Feedback** - Rate and comment on solutions

### For Solvers
1. **Complete Profile** - Set specialization areas
2. **Browse Available Doubts** - Find doubts matching expertise
3. **Accept Assignments** - Take on doubt solving
4. **Conduct Sessions** - Join video sessions with students
5. **Track Performance** - Monitor ratings and solved count

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Password Hashing** - bcrypt for password security
- **Rate Limiting** - API rate limiting protection
- **CORS Configuration** - Cross-origin request security
- **Input Validation** - Zod schema validation
- **Helmet Security** - Security headers

## 📱 Real-time Features

### Notifications
- Email notifications for new assignments
- In-app notification system
- Real-time status updates

### Video Sessions
- LiveKit integration for video calls
- Screen sharing capabilities
- Chat functionality during sessions

## 🚀 Deployment

### Backend Deployment
1. Set up MongoDB database
2. Configure environment variables
3. Deploy to cloud platform (Heroku, AWS, etc.)
4. Set up email service (SendGrid, etc.)
5. Configure LiveKit service

### Frontend Deployment
1. Build the application
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Configure environment variables
4. Set up domain and SSL

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

## 🔄 Updates

### Recent Updates
- Added comprehensive doubt management system
- Integrated LiveKit for video sessions
- Implemented real-time notifications
- Added solver matching algorithm
- Enhanced UI with modern design

### Planned Features
- Mobile app development
- Advanced analytics dashboard
- AI-powered doubt categorization
- Multi-language support
- Advanced video features

---

**Built with ❤️ for better education and doubt resolution**
