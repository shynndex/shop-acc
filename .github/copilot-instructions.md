# Copilot Instructions for LoginVIP

## Project Overview

**LoginVIP** is a Node.js/Express authentication system with JWT-based session management backed by MongoDB.

- **Backend**: Express server at [backend/src/server.js](../backend/src/server.js) (port 5001)
- **Frontend**: Empty placeholder (not implemented)
- **Runtime**: ES modules (`"type": "module"` in package.json)

## Architecture & Data Flow

### Authentication Flow

1. **Sign Up** → Hash password with bcrypt → Store User in MongoDB
2. **Sign In** → Verify credentials → Create JWT (30m TTL) + refresh token → Store Session with expiry → Set httpOnly cookie
3. **Protected Routes** → Extract JWT from `Authorization: Bearer <token>` header → Verify with `ACCESS_TOKEN_SECRET` → Attach user to `req.user`
4. **Sign Out** → Delete Session by refresh token → Clear cookie

**Key Files**:

- [authController.js](../backend/src/controllers/authController.js) - Core logic (signUp, signIn, signOut)
- [authMiddleware.js](../backend/src/middlewares/authMiddleware.js) - JWT verification via `protectedRoute` middleware
- [User.js](../backend/src/models/User.js) & [Session.js](../backend/src/models/Session.js) - Data models

### Security Patterns

- Passwords stored as `hashedPassword` using bcrypt (10 rounds)
- JWT access tokens: 30 minutes validity
- Refresh tokens: 14 days, stored as hex in Session collection
- MongoDB TTL index auto-deletes expired sessions
- Cookies: httpOnly + secure + sameSite=none

## Development Workflow

### Local Setup

```bash
# Install dependencies (from backend/)
npm install

# Environment variables (.env)
MONGODB_CONNECTIONSTRING=mongodb://...
ACCESS_TOKEN_SECRET=<your-secret>
PORT=5001

# Run
npm run dev      # Watch mode (nodemon)
npm start        # Production mode
npm test         # Not configured
```

**Current Issues**: Terminal shows `Exit Code: 1` - check `.env` file exists and MongoDB connection string is valid.

## Code Conventions & Patterns

### Route Structure

- **Public routes** (no auth required): `/api/auth/*`
- **Protected routes** (JWT required): `/api/users/*`
- Pattern: `protectedRoute` middleware injected after auth routes in server.js, before user routes

### Response Format

All endpoints return JSON:

```javascript
{ message: "Description", accessToken: "..." }  // Success
{ message: "Error description" }                  // Error
```

Status codes: 201 (created), 400 (validation), 401 (auth failed), 403 (token invalid), 409 (conflict), 500 (server error)

### Database Queries

- All models use Mongoose with ES module syntax (`import/export`)
- User lookups strip password: `.select("-hashedPassword")`
- Session auto-cleanup via TTL index; no manual deletion needed

### Middleware Pattern

Middleware functions follow Express convention:

```javascript
export const middlewareName = (req, res, next) => {
  // Modify req, then call next() or return res
};
```

## When Adding Features

1. **New API Endpoint**: Create route in [routes/](../backend/src/routes/), logic in [controllers/](../backend/src/controllers/)
2. **Database Changes**: Update model in [models/](../backend/src/models/), consider Mongoose migration tools if schema evolves
3. **Protected Endpoints**: Use `protectedRoute` middleware; access user via `req.user._id`
4. **Error Handling**: Wrap in try-catch, return consistent JSON with status codes
5. **Environment Variables**: Add to `.env`, import via `process.env.VARIABLE_NAME`

## Dependencies

- **express** (5.2.1): Web framework
- **mongoose** (9.0.2): MongoDB ODM
- **jsonwebtoken** (9.0.3): JWT creation/verification
- **bcrypt/bcryptjs** (6.0.0 / 3.0.3): Password hashing
- **cookie-parser** (1.4.7): Cookie middleware
- **cors** (2.8.5): CORS support
- **dotenv** (17.2.3): Environment loading
- **nodemon**: Dev-only for watch mode
