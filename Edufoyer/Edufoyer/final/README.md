# Login App with Backend Integration

A complete full-stack login application with React frontend and Node.js backend.

## Features

- 🔐 Secure user authentication with JWT
- 📝 User registration and login
- 🎨 Beautiful, responsive UI with Tailwind CSS
- 🛡️ Protected routes and authentication state management
- 📊 Dashboard with user data
- 🔄 Real-time authentication status

## Project Structure

```
final/
├── src/
│   ├── components/
│   │   ├── LoginModal.jsx    # Login/Register form
│   │   └── Dashboard.jsx     # Protected dashboard
│   ├── services/
│   │   └── authService.js    # API service for authentication
│   ├── App.jsx              # Main app with routing
│   └── main.jsx            # Entry point
└── backend/                 # Backend API (separate directory)
```

## Quick Start

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd final
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loginapp
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
NODE_ENV=development
```

4. Start MongoDB (if running locally)

5. Start the backend server:
```bash
npm run dev
```

The backend will be available at `http://localhost:5000`

## Usage

1. **Start both servers** (frontend and backend)
2. **Open** `http://localhost:5173` in your browser
3. **Register** a new account or **login** with existing credentials
4. **Access** the protected dashboard after successful authentication

## Authentication Flow

1. User enters credentials on login page
2. Frontend sends request to backend API
3. Backend validates credentials and returns JWT token
4. Frontend stores token and redirects to dashboard
5. Dashboard fetches user data using stored token
6. User can logout, which clears the token

## API Integration

The frontend uses the `authService` to communicate with the backend:

- `authService.login(email, password)` - User login
- `authService.register(name, email, password)` - User registration
- `authService.getProfile()` - Get user profile
- `authService.logout()` - User logout
- `authService.isAuthenticated()` - Check auth status

## Security Features

- JWT token-based authentication
- Password hashing with bcrypt
- Protected routes
- Token expiration handling
- Input validation
- CORS configuration

## Technologies Used

### Frontend
- React 18
- React Router DOM
- Tailwind CSS
- Lucide React (icons)
- Recharts (charts)

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- CORS
- Helmet
- Express Rate Limit

## Development

### Frontend Development
```bash
cd final
npm run dev
```

### Backend Development
```bash
cd backend
npm run dev
```

### Building for Production
```bash
# Frontend
cd final
npm run build

# Backend
cd backend
npm start
```

## Environment Variables

### Frontend
No environment variables required for development.

### Backend
Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/loginapp
JWT_SECRET=your_super_secret_jwt_key_here_change_this_in_production
NODE_ENV=development
```

## Troubleshooting

### Common Issues

1. **CORS errors**: Ensure backend is running on port 5000
2. **Authentication fails**: Check if JWT_SECRET is set in backend
3. **Database connection**: Ensure MongoDB is running
4. **Port conflicts**: Change ports in respective config files

### Debug Mode

Enable debug logging by setting `NODE_ENV=development` in the backend `.env` file.

## Production Deployment

1. Set up production MongoDB instance
2. Configure environment variables
3. Build frontend: `npm run build`
4. Deploy backend to your preferred platform
5. Update CORS origins in backend configuration
6. Use HTTPS in production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - feel free to use this project for learning and development.