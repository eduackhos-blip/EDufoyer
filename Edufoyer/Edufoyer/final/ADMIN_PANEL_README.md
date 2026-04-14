# Admin Panel - Solver Onboarding

## Overview
The Admin Panel allows administrators to onboard new solvers by email with their subject specialities. When a solver is onboarded, they receive an onboarding email with temporary login credentials.

## Features

### 1. Admin Panel Access
- **Route**: `/admin/panel`
- **Access**: Only users with `role: 'admin'` can access
- **Authentication**: Requires valid JWT token and admin role

### 2. Solver Onboarding Form
The admin panel includes a comprehensive form with the following fields:

- **Email Address** (required): Valid email for the solver
- **Full Name** (required): Display name for the solver
- **Subject Specialities** (required): Array of subjects the solver can help with
  - Can add multiple specialities
  - Each speciality is a text field
  - At least one speciality is required
- **Experience Level** (optional): beginner, intermediate, advanced, expert
- **Bio** (optional): Brief description of expertise

### 3. Backend API Endpoint
- **Route**: `POST /api/auth/admin/onboard-solver`
- **Authentication**: Requires admin middleware
- **Validation**: Comprehensive input validation using express-validator

### 4. Email Onboarding
When a solver is successfully onboarded:
- A new user account is created with `isSolver: true`
- A solver profile is created with the specified specialities
- An onboarding email is sent with:
  - Welcome message
  - Subject specialities
  - Temporary login credentials (email + generated password)
  - Security reminder to change password

## Technical Implementation

### Backend Components

1. **Admin Middleware** (`backend/middleware/auth.js`)
   - `requireAdmin`: Ensures only admin users can access admin routes
   - Validates JWT token and checks user role

2. **Admin Route** (`backend/routes/auth.js`)
   - `POST /admin/onboard-solver`: Main onboarding endpoint
   - Input validation and sanitization
   - User and solver profile creation
   - Email sending with onboarding details

3. **Email Service** (`backend/utils/email.js`)
   - Sends HTML and text versions of onboarding emails
   - Includes temporary credentials and security instructions

### Frontend Components

1. **AdminPanel Component** (`final/src/components/AdminPanel.jsx`)
   - Complete onboarding form with validation
   - Dynamic speciality fields (add/remove)
   - Admin access control
   - Success/error message handling

2. **Auth Service** (`final/src/services/authService.js`)
   - `onboardSolver()`: API call to backend onboarding endpoint
   - Handles authentication and error responses

3. **Dashboard Integration** (`final/src/components/Dashboard.jsx`)
   - Admin panel link appears in sidebar for admin users
   - Role-based navigation menu

## Usage

### For Administrators

1. **Access Admin Panel**
   - Login with admin account
   - Navigate to Dashboard
   - Click "Admin Panel" in sidebar (only visible to admins)

2. **Onboard a Solver**
   - Fill in solver details:
     - Email address
     - Full name
     - Subject specialities (add multiple if needed)
     - Experience level
     - Bio (optional)
   - Click "Onboard Solver"
   - System creates account and sends onboarding email

3. **Solver Receives**
   - Onboarding email with welcome message
   - Temporary login credentials
   - Instructions to change password
   - Information about their subject specialities

### For New Solvers

1. **Receive Onboarding Email**
   - Check email for welcome message
   - Note temporary credentials
   - Click login link or go to login page

2. **First Login**
   - Use provided email and temporary password
   - System will prompt to change password
   - Access solver dashboard to start helping students

## Security Features

- **Admin-only access**: Middleware ensures only admins can onboard solvers
- **Input validation**: All form inputs are validated and sanitized
- **Temporary passwords**: Generated secure temporary passwords
- **Email verification**: Admin-onboarded users are pre-verified
- **Role-based access**: UI elements only visible to appropriate users

## Error Handling

- **Validation errors**: Clear error messages for invalid inputs
- **Network errors**: Graceful handling of API failures
- **Access denied**: Proper redirects for non-admin users
- **Email failures**: Logged but don't prevent account creation

## Future Enhancements

- Bulk solver onboarding (CSV upload)
- Solver management (view, edit, deactivate)
- Onboarding email templates customization
- Solver performance metrics
- Subject speciality management
- Automated solver assignment based on specialities
























