import { getUserProfiles } from '@/lib/cosmic';
import { UserProfile } from '@/types/user';

export default async function HomePage() {
  let users: UserProfile[] = [];
  let error: string | null = null;

  try {
    users = await getUserProfiles();
  } catch (err) {
    error = 'Failed to load user profiles';
    console.error('Error loading users:', err);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            User Management Foundation
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            A comprehensive user management system built with Next.js and Cosmic CMS,
            featuring user profiles, preferences, sessions, and authentication logging.
          </p>
          
          {/* Sign Up Call to Action */}
          <div className="mt-6">
            <a
              href="/signup"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              Try the Sign Up Feature
              <span className="ml-2">→</span>
            </a>
            <p className="mt-2 text-sm text-gray-500">
              Experience the complete user registration flow
            </p>
          </div>
        </div>

        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-800">{error}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 rounded-lg p-3">
                <span className="text-2xl">👤</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-3">
                User Profiles
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Manage user profiles with personal information, avatars, and account settings.
            </p>
            <div className="text-sm text-gray-500">
              {users.length} active {users.length === 1 ? 'profile' : 'profiles'}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-green-100 rounded-lg p-3">
                <span className="text-2xl">⚙️</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-3">
                User Preferences
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Customize theme preferences, notifications, privacy settings, and localization.
            </p>
            <div className="text-sm text-gray-500">
              Personalized settings
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 rounded-lg p-3">
                <span className="text-2xl">🔐</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-3">
                User Sessions
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Track active user sessions with device information and session management.
            </p>
            <div className="text-sm text-gray-500">
              Session tracking
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-orange-100 rounded-lg p-3">
                <span className="text-2xl">📋</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-3">
                Authentication Logs
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Monitor authentication events including logins, failures, and security events.
            </p>
            <div className="text-sm text-gray-500">
              Security monitoring
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 rounded-lg p-3">
                <span className="text-2xl">🚀</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-3">
                Next.js 15
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Built with the latest Next.js features including App Router and Server Components.
            </p>
            <div className="text-sm text-gray-500">
              Modern architecture
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center mb-4">
              <div className="bg-pink-100 rounded-lg p-3">
                <span className="text-2xl">🌐</span>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 ml-3">
                Cosmic CMS
              </h2>
            </div>
            <p className="text-gray-600 mb-4">
              Powered by Cosmic CMS for flexible content management and user data storage.
            </p>
            <div className="text-sm text-gray-500">
              Headless CMS
            </div>
          </div>
        </div>

        {/* Sign Up Feature Highlight */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-8 mb-12 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">
              ✨ New: User Registration System
            </h3>
            <p className="text-lg mb-6 text-blue-100">
              Complete sign-up functionality with form validation, password hashing, 
              and automatic user profile creation in Cosmic CMS.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">🔒 Secure</div>
                <div className="text-blue-100">
                  Passwords are hashed with bcrypt and stored securely
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">✅ Validated</div>
                <div className="text-blue-100">
                  Comprehensive form validation with real-time feedback
                </div>
              </div>
              <div className="bg-white/10 rounded-lg p-4">
                <div className="font-semibold mb-2">📊 Tracked</div>
                <div className="text-blue-100">
                  All registration attempts are logged for security
                </div>
              </div>
            </div>
          </div>
        </div>

        {users.length > 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent User Profiles
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    {user.metadata.avatar?.imgix_url ? (
                      <img
                        src={`${user.metadata.avatar.imgix_url}?w=80&h=80&fit=crop&auto=format,compress`}
                        alt={`${user.metadata.first_name} ${user.metadata.last_name}`}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                        <span className="text-gray-600 font-medium">
                          {user.metadata.first_name?.charAt(0)}
                          {user.metadata.last_name?.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {user.metadata.first_name} {user.metadata.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {user.metadata.email}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                        user.metadata.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {user.metadata.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="mt-12 text-center">
          <p className="text-gray-500 text-sm">
            User Management Foundation • Built with Next.js and Cosmic CMS
          </p>
        </div>
      </div>
    </main>
  );
}