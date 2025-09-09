# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Node.js/Express.js backend API for a ToDo center application with user authentication. The project uses MongoDB for data persistence and implements JWT-based authentication with rate limiting and security middleware.

## Development Commands

- **Start development server**: `npm run dev` (uses node --watch for auto-restart)
- **Start production server**: `npm start`
- **Run tests**: `npm test` (uses Jest with Supertest for API testing)

## Architecture

### Core Structure
- `api/index.js` - Main Express application entry point
- `api/config/database.js` - MongoDB connection configuration
- `api/models/` - Mongoose schemas (User, BlacklistedToken, LoginAttempt)
- `api/controllers/` - Business logic controllers (AuthController, UserController)
- `api/routes/` - Express route definitions (login, register, userRoutes)
- `api/middleware/` - Custom middleware (auth, users, validateRequest)
- `api/utils/` - Utility functions (jwt)

### Database
- MongoDB Atlas connection via mongoose
- Connection string stored in `.env` as `MONGO_URI`
- Database name: `task-manager`

### Authentication System
- JWT token-based authentication
- Token blacklisting for logout functionality
- Login attempt tracking for security
- Rate limiting implementation
- Password hashing with bcryptjs

### API Endpoints
- `POST /api/auth/register` - User registration with validation
- `POST /api/auth/login` - User authentication
- Base route `/` returns "Server is running"

### Testing
- Jest testing framework with Supertest for HTTP assertion
- Test database cleanup between tests
- Comprehensive API route testing including validation scenarios
- Test files: `test/api.routes.test.js`, `test/test-us1-register.js`, `test/test-us2-login.js`

### Security Features
- CORS enabled
- Request validation with express-validator
- JWT token management
- Password encryption
- Rate limiting for API endpoints

### Environment Configuration
- Development: Uses `node --watch` for auto-restart
- Production: Standard node server
- Environment variables managed via dotenv
- MongoDB connection requires `MONGO_URI` environment variable