# ToDo Center - Backend API

Backend API for the ToDo Center task management application. Built with Node.js, Express.js and MongoDB, it implements secure JWT authentication and complete user and task management functionalities.

## Table of Contents

- [Project Description](#project-description)
- [Technologies](#technologies)
- [Installation](#installation)
- [Development Commands](#development-commands)
- [Architecture](#architecture)
- [API Endpoints](#api-endpoints)
- [Registration Flow (US-1)](#registration-flow-us-1)
- [Authentication and Security](#authentication-and-security)
- [Testing](#testing)
- [Environment Variables](#environment-variables)
- [API Documentation](#api-documentation)

## Project Description

This is the backend of the ToDo Center application, which provides a RESTful API for user and task management. It implements registration, authentication, task management functionalities and advanced security features such as rate limiting and login attempt control.

## 🛠 Technologies

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web framework for Node.js
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **bcryptjs** - Password encryption
- **jsonwebtoken** - JWT authentication
- **express-validator** - Data validation
- **express-rate-limit** - Rate limiting
- **Jest** - Testing framework
- **Supertest** - HTTP API testing
- **Swagger** - Automatic API documentation

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/michaelRS2002/ToDo-center_back.git
   cd ToDo-center_back
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

4. **Configure database**
   - Create account on MongoDB Atlas
   - Get connection string
   - Add `MONGO_URI` to `.env` file

## Development Commands

```bash
# Development with auto-restart
npm run dev

# Production
npm start

# Run tests
npm test

# Run tests in watch mode
npm run test:watch

# Linting (if configured)
npm run lint
```

## Architecture

### Project Structure
```
api/
├── config/
│   ├── database.js      # MongoDB configuration
│   └── swagger.js       # Swagger configuration
├── controllers/
│   ├── AuthController.js    # Authentication logic
│   ├── UserController.js    # User management
│   └── TaskController.js    # Task management
├── middleware/
│   ├── auth.js          # Authentication middleware
│   ├── users.js         # User middleware
│   └── validateRequest.js   # Request validation
├── models/
│   ├── User.js          # User schema
│   ├── Task.js          # Task schema
│   ├── BlacklistedToken.js  # Revoked tokens
│   └── LoginAttempt.js  # Login attempt control
├── routes/
│   ├── authRoutes.js    # Authentication routes
│   ├── userRoutes.js    # User routes
│   ├── taskRoutes.js    # Task routes
│   └── passwordResetRoutes.js  # Password recovery
├── utils/
│   └── jwt.js           # JWT utilities
└── index.js             # Main entry point
```

### Database
- **MongoDB Atlas** - Cloud database
- **Database**: `task-manager`
- **Connection**: Mongoose ODM
- **Automatic timestamps**: `createdAt` and `updatedAt` in ISO-8601 format

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile
- `DELETE /api/users/profile` - Delete account

### Tasks
- `GET /api/tasks` - List user tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Password Recovery
- `POST /api/password-reset/request` - Request password reset
- `POST /api/password-reset/reset` - Reset password

## Registration Flow (US-1)

### Implemented Acceptance Criteria

#### 1. **Form Display**
The `POST /api/auth/register` endpoint accepts the following required fields:
- **nombres**: 2-50 characters, required text
- **apellidos**: 2-50 characters, required text  
- **edad**: Integer ≥ 13 years
- **correo**: Valid RFC 5322 format, unique in system
- **contrasena**: ≥ 8 characters, must contain:
  - At least 1 uppercase letter
  - At least 1 lowercase letter  
  - At least 1 number
  - At least 1 special character (@$!%*?&#)
- **confirmarContrasena**: Must match password

#### 2. **Real-time Validation**
- Validations implemented with `express-validator`
- Specific error messages for each field
- Password confirmation validation
- Email format verification

#### 3. **Successful Submission**
- HTTP 201 response with new user ID
- Password hashed with bcrypt (minimum 12 salt rounds)
- Automatic `createdAt` timestamp in ISO-8601 format

```json
// Successful response
{
  "success": true,
  "message": "Account created successfully",
  "data": {
    "id": "user_id",
    "nombres": "Juan",
    "apellidos": "Pérez",
    "edad": 25,
    "correo": "juan@email.com",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 4. **Error Handling**
- **409 Conflict**: Email already registered
- **400 Bad Request**: Validation errors
- **500 Internal Server Error**: Generic server errors

#### 5. **Secure Persistence**
- Passwords hashed with bcrypt (12 salt rounds)
- Automatic timestamps with Mongoose
- Validations at schema and controller level

### Usage Example

```bash
# Successful registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "nombres": "Juan",
    "apellidos": "Pérez", 
    "edad": 25,
    "correo": "juan@email.com",
    "contrasena": "MiPassword123!",
    "confirmarContrasena": "MiPassword123!"
  }'
```

## Authentication and Security

### Security Features
- **JWT Tokens**: Stateless authentication
- **Bcrypt**: Password hashing with 12 salt rounds
- **Rate Limiting**: Login attempt control per IP
- **Account Locking**: Temporary blocking after failed attempts
- **CORS**: Configured for cross-origin requests
- **Input Validation**: Comprehensive validation with express-validator

### Login Attempt Control
- Maximum 5 failed attempts per account
- Temporary 10-minute blocking
- Rate limiting per IP
- Attempt logging for auditing

### JWT Tokens
- Configurable expiration
- Minimal payload for security
- Blacklisting for logout

## Testing

### Testing Framework
- **Jest**: Main framework
- **Supertest**: HTTP endpoint testing
- **Automatic cleanup**: Database cleaned between tests

### Test Files
- `test/api.routes.test.js` - Main API tests
- `test/test-us1-register.js` - Registration-specific tests
- `test/test-us2-login.js` - Login-specific tests

### Run Tests
```bash
# All tests
npm test

# Tests in watch mode
npm run test:watch

# Tests with coverage
npm run test:coverage
```

### US-1 Test Cases
- ✅ Successful registration with valid data
- ✅ Duplicate email validation (409 Conflict)
- ✅ Required field validation
- ✅ Password format validation
- ✅ Password confirmation validation
- ✅ Minimum age validation
- ✅ Server error handling

## Environment Variables

```env
# Database
MONGO_URI=mongodbURL

# JWT
JWT_SECRET=jwt_secret
JWT_EXPIRES_IN=2h

# Server
PORT=3000
NODE_ENV=development

# Email (for password recovery)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

## API Documentation

Complete API documentation is available via Swagger UI:

- **Development**: `http://localhost:3000/....`
- **Production**: `https://your-domain.com/....`

### Documentation Features
- Automatically generated with Swagger
- Request and response examples
- Validation schemas
- Interactive testing from browser

## Deployment

### Local Development
```bash
npm run dev
# Server at http://localhost:3000
# Documentation at http://localhost:3000/...
```

### Production
The project is configured for deployment on:
- **Backend**: Render, Heroku, or similar
- **Database**: MongoDB Atlas
- **Environment variables**: Configure on deployment platform

### Deployment Verification
- ✅ Root endpoint responds: `GET /`
- ✅ Documentation accessible: `GET /...`
- ✅ Health check: Database connected
- ✅ Environment variables configured

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the project
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add: AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Create Pull Request

**Thanks for using ToDo Center! 🎉**