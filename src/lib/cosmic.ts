import { createBucketClient } from '@cosmicjs/sdk';
import { 
  UserProfile, 
  UserPreferences, 
  UserSession, 
  AuthenticationLog,
  CosmicResponse,
  CosmicSingleResponse
} from '@/src/types/user';

// Initialize Cosmic client for read operations
const cosmic = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  apiEnvironment: "staging"
});

// Initialize Cosmic client for write operations (server-side only)
const cosmicWrite = createBucketClient({
  bucketSlug: process.env.COSMIC_BUCKET_SLUG as string,
  readKey: process.env.COSMIC_READ_KEY as string,
  writeKey: process.env.COSMIC_WRITE_KEY as string,
  apiEnvironment: "staging"
});

// User Profile functions
export async function getUserProfiles(): Promise<UserProfile[]> {
  try {
    const response = await cosmic.objects
      .find({ type: 'user-profiles' })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.objects as UserProfile[];
  } catch (error: any) {
    if (error?.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function getUserProfileBySlug(slug: string): Promise<UserProfile | null> {
  try {
    const response = await cosmic.objects
      .findOne({ type: 'user-profiles', slug })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.object as UserProfile;
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getUserProfileByEmail(email: string): Promise<UserProfile | null> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'user-profiles',
        'metadata.email': email
      })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.objects.length > 0 ? response.objects[0] as UserProfile : null;
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

export async function getUserProfileByUsername(username: string): Promise<UserProfile | null> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'user-profiles',
        'metadata.username': username
      })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.objects.length > 0 ? response.objects[0] as UserProfile : null;
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

// User Preferences functions
export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'user-preferences',
        'metadata.user': userId
      })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.objects.length > 0 ? response.objects[0] as UserPreferences : null;
  } catch (error: any) {
    if (error?.status === 404) {
      return null;
    }
    throw error;
  }
}

// User Session functions
export async function getUserSessions(userId: string): Promise<UserSession[]> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'user-sessions',
        'metadata.user': userId
      })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.objects as UserSession[];
  } catch (error: any) {
    if (error?.status === 404) {
      return [];
    }
    throw error;
  }
}

export async function getActiveUserSessions(userId: string): Promise<UserSession[]> {
  try {
    const response = await cosmic.objects
      .find({ 
        type: 'user-sessions',
        'metadata.user': userId,
        'metadata.is_active': true
      })
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.objects as UserSession[];
  } catch (error: any) {
    if (error?.status === 404) {
      return [];
    }
    throw error;
  }
}

// Authentication Log functions
export async function getAuthenticationLogs(userId?: string): Promise<AuthenticationLog[]> {
  try {
    const query: any = { type: 'authentication-logs' };
    if (userId) {
      query['metadata.user'] = userId;
    }

    const response = await cosmic.objects
      .find(query)
      .props(['id', 'title', 'slug', 'metadata'])
      .depth(1);
    
    return response.objects as AuthenticationLog[];
  } catch (error: any) {
    if (error?.status === 404) {
      return [];
    }
    throw error;
  }
}

// Server-side write operations
export async function createUserSession(sessionData: {
  title: string;
  user: string;
  session_token: string;
  device_info?: string;
  ip_address: string;
  login_timestamp: string;
  expires_at: string;
  is_active: boolean;
}): Promise<UserSession> {
  const response = await cosmicWrite.objects.insertOne({
    title: sessionData.title,
    type: 'user-sessions',
    metadata: {
      user: sessionData.user,
      session_token: sessionData.session_token,
      device_info: sessionData.device_info,
      ip_address: sessionData.ip_address,
      login_timestamp: sessionData.login_timestamp,
      expires_at: sessionData.expires_at,
      is_active: sessionData.is_active,
    },
    status: 'published'
  });
  
  return response.object as UserSession;
}

export async function updateUserSession(sessionId: string, updates: {
  is_active?: boolean;
  expires_at?: string;
}): Promise<UserSession> {
  const response = await cosmicWrite.objects.updateOne(sessionId, {
    metadata: updates
  });
  
  return response.object as UserSession;
}

export { cosmic, cosmicWrite };