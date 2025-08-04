class WebSocketClient {
    constructor(url = 'ws://localhost:8098') {
        this.url = url;
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
        this.isConnected = false;
        this.listeners = new Map();
        this.connectionStatus = document.getElementById('connectionStatus');
        
        this.connect();
    }

    connect() {
        try {
            this.updateStatus('connecting', 'Connecting...');
            console.log('🔌 Attempting WebSocket connection to:', this.url);
            
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = (event) => {
                console.log('✅ WebSocket connected successfully');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                this.updateStatus('connected', 'Connected');
                this.emit('connected', event);
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    console.log('📨 WebSocket message received:', data);
                    
                    // Handle different message types
                    switch(data.type) {
                        case 'reload':
                            console.log('🔄 Reload message received, reloading page...');
                            this.handleReload(data);
                            break;
                        case 'connected':
                            console.log('🎉 WebSocket connection confirmed:', data.clientId);
                            this.emit('welcome', data);
                            break;
                        case 'pong':
                            console.log('🏓 Pong received');
                            this.emit('pong', data);
                            break;
                        default:
                            this.emit('message', data);
                    }
                } catch (error) {
                    console.error('❌ Error parsing WebSocket message:', error);
                    // Check for Chrome extension errors
                    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                        console.log('Chrome extension error handled:', chrome.runtime.lastError.message);
                    }
                }
            };
            
            this.ws.onclose = (event) => {
                console.log(`🔌 WebSocket connection closed (${event.code}):`, event.reason);
                this.isConnected = false;
                this.updateStatus('disconnected', 'Disconnected');
                
                // Attempt to reconnect
                if (this.reconnectAttempts < this.maxReconnectAttempts) {
                    this.reconnectAttempts++;
                    console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
                    setTimeout(() => this.connect(), this.reconnectDelay * this.reconnectAttempts);
                } else {
                    console.error('❌ Max reconnection attempts reached');
                    this.updateStatus('disconnected', 'Connection Failed');
                }
                
                this.emit('disconnected', event);
            };
            
            this.ws.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
                this.updateStatus('disconnected', 'Connection Error');
                
                // Handle Chrome extension errors gracefully
                if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                    console.log('Chrome extension WebSocket error handled:', chrome.runtime.lastError.message);
                }
                
                this.emit('error', error);
            };
            
        } catch (error) {
            console.error('❌ Failed to create WebSocket connection:', error);
            this.updateStatus('disconnected', 'Connection Failed');
            
            // Handle Chrome extension errors
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                console.log('Chrome extension connection error handled:', chrome.runtime.lastError.message);
            }
        }
    }

    handleReload(data) {
        console.log('🔄 Processing reload request:', data);
        
        // Show reload notification
        this.showReloadNotification(data);
        
        // Reload page after a short delay
        setTimeout(() => {
            try {
                window.location.reload();
            } catch (error) {
                console.error('Error reloading page:', error);
                // Fallback reload method
                window.location.href = window.location.href;
            }
        }, 1000);
    }

    showReloadNotification(data) {
        // Create temporary notification
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 50px;
            right: 10px;
            background: #4CAF50;
            color: white;
            padding: 10px 15px;
            border-radius: 4px;
            font-weight: bold;
            z-index: 10000;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
        `;
        notification.textContent = `🔄 ${data.message || 'Reloading...'}`;
        
        document.body.appendChild(notification);
        
        // Remove notification after delay
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 2000);
    }

    updateStatus(status, text) {
        if (this.connectionStatus) {
            this.connectionStatus.className = `connection-status ws-${status}`;
            this.connectionStatus.textContent = text;
        }
    }

    send(data) {
        try {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                const message = typeof data === 'string' ? data : JSON.stringify(data);
                this.ws.send(message);
                console.log('📤 Message sent:', data);
                return true;
            } else {
                console.warn('⚠️ WebSocket not connected, cannot send message');
                return false;
            }
        } catch (error) {
            console.error('❌ Error sending WebSocket message:', error);
            
            // Handle Chrome extension errors
            if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                console.log('Chrome extension send error handled:', chrome.runtime.lastError.message);
            }
            
            return false;
        }
    }

    ping() {
        return this.send({
            type: 'ping',
            timestamp: new Date().toISOString()
        });
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in ${event} listener:`, error);
                }
            });
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}

// Initialize WebSocket client
const wsClient = new WebSocketClient();

// Global access for debugging
window.wsClient = wsClient;

// Example usage and testing
wsClient.on('connected', () => {
    console.log('🎉 App received WebSocket connected event');
    
    // Send a test ping
    setTimeout(() => {
        wsClient.ping();
    }, 1000);
});

wsClient.on('welcome', (data) => {
    console.log('👋 Welcome message:', data);
});

wsClient.on('pong', (data) => {
    console.log('🏓 Pong response:', data);
});

// Test reload functionality (for development)
window.testReload = () => {
    fetch('/api/__reload__', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            reason: 'Manual test reload',
            source: 'Browser Console'
        })
    })
    .then(response => response.json())
    .then(data => console.log('Reload test result:', data))
    .catch(error => console.error('Reload test error:', error));
};

console.log('🔄 WebSocket client initialized. Use testReload() to test live-reload functionality.');