# User Management Foundation

![App Preview](https://imgix.cosmicjs.com/d47c69c0-6ed8-11f0-a051-23c10f41277a-photo-1472099645785-5658abf4ff4e-1754053800356.jpg?w=1200&h=300&fit=crop&auto=format,compress)

A complete user management foundation built with Next.js 15 and Cosmic CMS. This application provides everything needed for user registration, authentication, profile management, and session tracking - the perfect starting point for any service requiring robust user management functionality.

## Features

- **Complete Authentication System** - Secure user registration, login, logout with JWT session management
- **User Profile Management** - Comprehensive user profiles with avatars, bio, contact information
- **User Preferences** - Theme settings, notification preferences, privacy controls, language/timezone
- **Session Management** - Active session tracking with device info and IP monitoring
- **Authentication Logging** - Detailed security logs of all authentication events
- **Admin Dashboard** - System overview with user statistics and activity monitoring
- **Responsive Design** - Mobile-first design that works on all devices
- **Privacy Controls** - Granular user privacy settings and data visibility options
- **Real-time Updates** - Live session status and user activity tracking

## Clone this Bucket and Code Repository

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Bucket and Code Repository](https://img.shields.io/badge/Clone%20this%20Bucket-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmic-staging.com/projects/new?clone_bucket=688cbba6493dfbee52e8bb31&clone_repository=688cbee7493dfbee52e8bb4c)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> "I want to create the basic structure of a site that has everything necessary to allow users to sign up, get authenticated, log in and out, and have their information stored on the back end. Basically the perfect user management functionality. The idea is to build this so that others can clone it and then build around it with whatever service or site they want to have people sign up for"

### Code Generation Prompt

> I want to create the basic structure of a site that has everything necessary to allow users to sign up, get authenticated, log in and out, and have their information stored on the back end. Basically, the perfect user management functionality. The idea is to build this so that others can clone it and then build around it with whatever service or site they want to have people sign up for.

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## Technologies Used

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first CSS framework
- **Cosmic CMS** - Headless CMS for user data management
- **JWT** - Secure token-based authentication
- **bcrypt** - Password hashing and security

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- A Cosmic account and bucket

### Installation

1. Clone this repository
2. Install dependencies:
   ```bash
   bun install
   ```

3. Set up environment variables:
   ```env
   COSMIC_BUCKET_SLUG=your-bucket-slug
   COSMIC_READ_KEY=your-read-key
   COSMIC_WRITE_KEY=your-write-key
   JWT_SECRET=your-jwt-secret-minimum-32-characters
   ```

4. Run the development server:
   ```bash
   bun dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Cosmic SDK Examples

### Fetching User Profiles
```typescript
import { cosmic } from '@/lib/cosmic'

// Get all users
const users = await cosmic.objects
  .find({ type: 'user-profiles' })
  .props(['id', 'title', 'slug', 'metadata'])

// Get user by email
const user = await cosmic.objects
  .findOne({ 
    type: 'user-profiles',
    'metadata.email': 'user@example.com'
  })
  .depth(1)
```

### Creating Authentication Logs
```typescript
// Log authentication event
await cosmic.objects.insertOne({
  type: 'authentication-logs',
  title: `Login Success - ${user.title}`,
  metadata: {
    user: user.id,
    action_type: 'login_success',
    timestamp: new Date().toISOString(),
    ip_address: '192.168.1.100',
    device_info: 'Chrome 120.0.0.0 on Windows 10',
    success: true,
    failure_reason: ''
  }
})
```

### Managing User Sessions
```typescript
// Create new session
await cosmic.objects.insertOne({
  type: 'user-sessions',
  title: `${user.title} - Chrome Session`,
  metadata: {
    user: user.id,
    session_token: generateSessionToken(),
    device_info: req.headers['user-agent'],
    ip_address: getClientIP(req),
    login_timestamp: new Date().toISOString(),
    expires_at: getExpirationDate(),
    is_active: true
  }
})
```

## Cosmic CMS Integration

This application uses four main content types in Cosmic:

1. **User Profiles** - Core user information (name, email, avatar, bio)
2. **User Preferences** - User settings (theme, notifications, privacy)
3. **User Sessions** - Active session tracking
4. **Authentication Logs** - Security event logging

All content types are interconnected through object relationships, allowing for comprehensive user management and tracking.

## Deployment Options

### Vercel (Recommended)
1. Connect your repository to Vercel
2. Add environment variables in the Vercel dashboard
3. Deploy automatically on git pushes

### Netlify
1. Connect your repository to Netlify
2. Set build command: `bun run build`
3. Set publish directory: `.next`
4. Add environment variables in Netlify dashboard

### Environment Variables for Production
Make sure to set these in your hosting platform:
- `COSMIC_BUCKET_SLUG`
- `COSMIC_READ_KEY` 
- `COSMIC_WRITE_KEY`
- `JWT_SECRET`

<!-- README_END -->