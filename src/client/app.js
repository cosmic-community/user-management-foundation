const { useState, useEffect, createElement } = React;

// API utility with Chrome extension error handling
const api = {
    baseURL: 'http://localhost:3000/api',
    
    async request(endpoint, options = {}) {
        try {
            // Check for Chrome extension errors before making request
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                console.log('Chrome extension error detected before API request:', chrome.runtime.lastError.message);
            }
            
            const url = `${this.baseURL}${endpoint}`;
            const config = {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            };
            
            console.log(`🌐 API Request: ${config.method || 'GET'} ${url}`);
            
            const response = await fetch(url, config);
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }
            
            return data;
        } catch (error) {
            console.error('API Request Error:', error);
            
            // Handle Chrome extension errors
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                console.log('Chrome extension error in API request:', chrome.runtime.lastError.message);
            }
            
            throw error;
        }
    },
    
    // CMS endpoints
    getUsers: () => api.request('/cms/users'),
    getUser: (id) => api.request(`/cms/users/${id}`),
    createUser: (userData) => api.request('/cms/users', { method: 'POST', body: JSON.stringify(userData) }),
    getAuthLogs: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return api.request(`/cms/auth-logs${query ? '?' + query : ''}`);
    },
    getSessions: (activeOnly = false) => api.request(`/cms/sessions${activeOnly ? '?active_only=true' : ''}`),
    getUserPreferences: (userId) => api.request(`/cms/preferences/${userId}`),
    createAuthLog: (logData) => api.request('/cms/auth-logs', { method: 'POST', body: JSON.stringify(logData) })
};

// Main App Component
function App() {
    const [activeTab, setActiveTab] = useState('users');
    const [users, setUsers] = useState([]);
    const [authLogs, setAuthLogs] = useState([]);
    const [sessions, setSessions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [wsStatus, setWsStatus] = useState('connecting');

    // WebSocket event handlers
    useEffect(() => {
        if (window.wsClient) {
            window.wsClient.on('connected', () => setWsStatus('connected'));
            window.wsClient.on('disconnected', () => setWsStatus('disconnected'));
            window.wsClient.on('error', () => setWsStatus('error'));
        }
    }, []);

    // Load initial data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Load all data in parallel
            const [usersData, logsData, sessionsData] = await Promise.all([
                api.getUsers().catch(err => ({ success: false, error: err.message, data: [] })),
                api.getAuthLogs({ limit: 20 }).catch(err => ({ success: false, error: err.message, data: [] })),
                api.getSessions().catch(err => ({ success: false, error: err.message, data: [] }))
            ]);
            
            setUsers(usersData.data || []);
            setAuthLogs(logsData.data || []);
            setSessions(sessionsData.data || []);
            
        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const triggerReload = async () => {
        try {
            await api.request('/__reload__', { 
                method: 'POST',
                body: JSON.stringify({
                    reason: 'Manual reload from UI',
                    source: 'React App'
                })
            });
        } catch (error) {
            console.error('Error triggering reload:', error);
        }
    };

    if (loading) {
        return createElement('div', { className: 'container' },
            createElement('div', { className: 'content' },
                createElement('div', { className: 'loading' }, '🔄 Loading data from CMS...')
            )
        );
    }

    return createElement('div', { className: 'container' },
        // Header
        createElement('div', { className: 'header' },
            createElement('h1', null, '👥 User Management Foundation'),
            createElement('p', null, 'Full-stack application with Express API, WebSocket live-reload, and React frontend'),
            createElement('button', { 
                className: 'btn', 
                onClick: loadData 
            }, '🔄 Refresh Data'),
            createElement('button', { 
                className: 'btn', 
                onClick: triggerReload 
            }, '⚡ Test Live Reload'),
            createElement('span', { 
                style: { 
                    marginLeft: '10px', 
                    padding: '5px 10px', 
                    borderRadius: '4px',
                    fontSize: '12px',
                    background: wsStatus === 'connected' ? '#4CAF50' : '#f44336',
                    color: 'white'
                }
            }, `WebSocket: ${wsStatus}`)
        ),

        // Error display
        error && createElement('div', { className: 'error' },
            `❌ Error: ${error}`
        ),

        // Tabs
        createElement('div', { className: 'tabs' },
            createElement('button', {
                className: `tab ${activeTab === 'users' ? 'active' : ''}`,
                onClick: () => setActiveTab('users')
            }, `👥 Users (${users.length})`),
            createElement('button', {
                className: `tab ${activeTab === 'logs' ? 'active' : ''}`,
                onClick: () => setActiveTab('logs')
            }, `📋 Auth Logs (${authLogs.length})`),
            createElement('button', {
                className: `tab ${activeTab === 'sessions' ? 'active' : ''}`,
                onClick: () => setActiveTab('sessions')
            }, `🔐 Sessions (${sessions.length})`)
        ),

        // Content based on active tab
        createElement('div', { className: 'content' },
            activeTab === 'users' && createElement(UsersTab, { users }),
            activeTab === 'logs' && createElement(AuthLogsTab, { logs: authLogs }),
            activeTab === 'sessions' && createElement(SessionsTab, { sessions })
        )
    );
}

// Users Tab Component
function UsersTab({ users }) {
    if (users.length === 0) {
        return createElement('div', { className: 'loading' },
            '👤 No users found or unable to load user data'
        );
    }

    return createElement('div', null,
        createElement('h2', null, '👥 User Profiles'),
        users.map(user => 
            createElement('div', { key: user.id, className: 'user-card' },
                user.metadata?.avatar?.imgix_url && createElement('img', {
                    src: `${user.metadata.avatar.imgix_url}?w=100&h=100&fit=crop&auto=format,compress`,
                    alt: user.title,
                    className: 'user-avatar'
                }),
                createElement('div', { className: 'user-info' },
                    createElement('h3', null, user.title),
                    createElement('p', null, 
                        createElement('span', {
                            className: `status-indicator ${user.metadata?.is_active ? 'status-active' : 'status-inactive'}`
                        }),
                        `${user.metadata?.email || 'No email'} • ${user.metadata?.username || 'No username'}`
                    ),
                    user.metadata?.bio && createElement('p', null, user.metadata.bio),
                    createElement('p', { style: { fontSize: '12px', color: '#999' } },
                        `Joined: ${user.metadata?.date_joined || 'Unknown'} • Last Login: ${user.metadata?.last_login || 'Never'}`
                    )
                ),
                createElement('div', { className: 'clear' })
            )
        )
    );
}

// Auth Logs Tab Component
function AuthLogsTab({ logs }) {
    if (logs.length === 0) {
        return createElement('div', { className: 'loading' },
            '📋 No authentication logs found'
        );
    }

    return createElement('div', null,
        createElement('h2', null, '📋 Authentication Logs'),
        logs.map(log => 
            createElement('div', { 
                key: log.id, 
                className: `log-entry ${log.metadata?.success ? 'log-success' : 'log-failed'}`
            },
                createElement('div', { className: 'timestamp' }, log.metadata?.timestamp || 'Unknown time'),
                createElement('h4', null, log.title),
                createElement('p', null, 
                    `User: ${log.metadata?.user?.title || 'Unknown'} • IP: ${log.metadata?.ip_address || 'Unknown'}`
                ),
                createElement('p', null, 
                    `Device: ${log.metadata?.device_info || 'Unknown'}`
                ),
                log.metadata?.failure_reason && createElement('p', { style: { color: '#c33', fontWeight: 'bold' } },
                    `Reason: ${log.metadata.failure_reason}`
                )
            )
        )
    );
}

// Sessions Tab Component
function SessionsTab({ sessions }) {
    if (sessions.length === 0) {
        return createElement('div', { className: 'loading' },
            '🔐 No active sessions found'
        );
    }

    return createElement('div', null,
        createElement('h2', null, '🔐 User Sessions'),
        sessions.map(session => 
            createElement('div', { key: session.id, className: 'user-card' },
                createElement('h3', null, session.title),
                createElement('p', null,
                    createElement('span', {
                        className: `status-indicator ${session.metadata?.is_active ? 'status-active' : 'status-inactive'}`
                    }),
                    `${session.metadata?.is_active ? 'Active' : 'Inactive'} Session`
                ),
                createElement('p', null, 
                    `User: ${session.metadata?.user?.title || 'Unknown'}`
                ),
                createElement('p', null, 
                    `Device: ${session.metadata?.device_info || 'Unknown'} • IP: ${session.metadata?.ip_address || 'Unknown'}`
                ),
                createElement('p', { style: { fontSize: '12px', color: '#666' } },
                    `Login: ${session.metadata?.login_timestamp || 'Unknown'} • Expires: ${session.metadata?.expires_at || 'Unknown'}`
                )
            )
        )
    );
}

// Render the app
ReactDOM.render(createElement(App), document.getElementById('root'));

console.log('🚀 React app initialized and connected to CMS API');