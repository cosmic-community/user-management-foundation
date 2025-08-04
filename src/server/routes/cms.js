const express = require('express');
const { createBucketClient } = require('@cosmicjs/sdk');
const bcrypt = require('bcryptjs');
const router = express.Router();

// Initialize Cosmic client
const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG,
  readKey: process.env.COSMIC_READ_KEY,
  writeKey: process.env.COSMIC_WRITE_KEY
});

// Helper function to handle Chrome extension errors
const handleChromeError = (res, operation) => {
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
    console.log(`Chrome extension error in ${operation}:`, chrome.runtime.lastError.message);
    return res.status(200).json({ 
      status: 'handled', 
      error: 'chrome_extension_error',
      operation 
    });
  }
  return null;
};

// Get all user profiles
router.get('/users', async (req, res) => {
  try {
    // Check for Chrome extension errors
    const chromeError = handleChromeError(res, 'get-users');
    if (chromeError) return chromeError;

    const { objects: users } = await cosmic.objects
      .find({ type: 'user-profiles' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);

    res.json({
      success: true,
      data: users || [],
      count: users ? users.length : 0
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    
    // Handle 404 errors (no objects found)
    if (error.status === 404) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get user by ID or slug
router.get('/users/:identifier', async (req, res) => {
  try {
    const chromeError = handleChromeError(res, 'get-user');
    if (chromeError) return chromeError;

    const { identifier } = req.params;
    
    // Try to find by slug first, then by ID
    let user;
    try {
      const { object } = await cosmic.objects
        .findOne({ type: 'user-profiles', slug: identifier })
        .props(['id', 'title', 'slug', 'metadata'])
        .depth(1);
      user = object;
    } catch (slugError) {
      if (slugError.status === 404) {
        // Try by ID
        try {
          const { object } = await cosmic.objects
            .findOne({ type: 'user-profiles', id: identifier })
            .props(['id', 'title', 'slug', 'metadata'])
            .depth(1);
          user = object;
        } catch (idError) {
          if (idError.status === 404) {
            return res.status(404).json({
              success: false,
              error: 'User not found'
            });
          }
          throw idError;
        }
      } else {
        throw slugError;
      }
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get authentication logs
router.get('/auth-logs', async (req, res) => {
  try {
    const chromeError = handleChromeError(res, 'get-auth-logs');
    if (chromeError) return chromeError;

    const { limit = 50, skip = 0 } = req.query;

    const { objects: logs } = await cosmic.objects
      .find({ type: 'authentication-logs' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1)
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    res.json({
      success: true,
      data: logs || [],
      count: logs ? logs.length : 0
    });
  } catch (error) {
    console.error('Error fetching auth logs:', error);
    
    if (error.status === 404) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch authentication logs',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get user sessions
router.get('/sessions', async (req, res) => {
  try {
    const chromeError = handleChromeError(res, 'get-sessions');
    if (chromeError) return chromeError;

    const { active_only } = req.query;
    
    let query = { type: 'user-sessions' };
    if (active_only === 'true') {
      query['metadata.is_active'] = true;
    }

    const { objects: sessions } = await cosmic.objects
      .find(query)
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);

    res.json({
      success: true,
      data: sessions || [],
      count: sessions ? sessions.length : 0
    });
  } catch (error) {
    console.error('Error fetching sessions:', error);
    
    if (error.status === 404) {
      return res.json({
        success: true,
        data: [],
        count: 0
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sessions',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get user preferences
router.get('/preferences/:userId', async (req, res) => {
  try {
    const chromeError = handleChromeError(res, 'get-preferences');
    if (chromeError) return chromeError;

    const { userId } = req.params;

    const { objects: preferences } = await cosmic.objects
      .find({ 
        type: 'user-preferences',
        'metadata.user': userId
      })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);

    res.json({
      success: true,
      data: preferences && preferences.length > 0 ? preferences[0] : null
    });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    
    if (error.status === 404) {
      return res.json({
        success: true,
        data: null
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user preferences',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Create new user (signup)
router.post('/users', async (req, res) => {
  try {
    const chromeError = handleChromeError(res, 'create-user');
    if (chromeError) return chromeError;

    const { first_name, last_name, email, username, phone, password } = req.body;

    // Validate required fields
    if (!first_name || !last_name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: first_name, last_name, email, password'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user profile object
    const userPayload = {
      title: `${first_name} ${last_name}`,
      type: 'user-profiles',
      status: 'published',
      metadata: {
        first_name,
        last_name,
        email,
        username: username || '',
        phone: phone || '',
        bio: '',
        date_joined: new Date().toISOString().split('T')[0],
        is_active: true,
        email_verified: false,
        profile_visibility: {
          key: 'public',
          value: 'Public'
        }
      }
    };

    const { object: newUser } = await cosmic.objects.insertOne(userPayload);

    // Log the signup
    await cosmic.objects.insertOne({
      title: `New User Registration - ${first_name} ${last_name}`,
      type: 'authentication-logs',
      status: 'published',
      metadata: {
        user: newUser.id,
        action_type: {
          key: 'email_verification',
          value: 'Email Verification'
        },
        timestamp: new Date().toISOString().split('T')[0],
        ip_address: req.ip || '127.0.0.1',
        device_info: req.get('User-Agent') || 'Unknown',
        success: true
      }
    });

    res.status(201).json({
      success: true,
      data: {
        id: newUser.id,
        slug: newUser.slug,
        title: newUser.title,
        metadata: newUser.metadata
      },
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Create authentication log
router.post('/auth-logs', async (req, res) => {
  try {
    const chromeError = handleChromeError(res, 'create-auth-log');
    if (chromeError) return chromeError;

    const { user_id, action_type, success, failure_reason, device_info } = req.body;

    const logPayload = {
      title: `${action_type} - ${success ? 'Success' : 'Failed'}`,
      type: 'authentication-logs',
      status: 'published',
      metadata: {
        user: user_id || '',
        action_type: {
          key: action_type.toLowerCase().replace(' ', '_'),
          value: action_type
        },
        timestamp: new Date().toISOString().split('T')[0],
        ip_address: req.ip || '127.0.0.1',
        device_info: device_info || req.get('User-Agent') || 'Unknown',
        success: Boolean(success),
        failure_reason: failure_reason || ''
      }
    };

    const { object: newLog } = await cosmic.objects.insertOne(logPayload);

    res.status(201).json({
      success: true,
      data: newLog,
      message: 'Authentication log created successfully'
    });
  } catch (error) {
    console.error('Error creating auth log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create authentication log',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

module.exports = router;