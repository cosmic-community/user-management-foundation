const express = require('express');
const router = express.Router();

// Reload endpoint that notifies all WebSocket clients
router.post('/__reload__', (req, res) => {
  try {
    console.log('🔄 Reload request received');
    
    const reloadData = {
      reason: req.body.reason || 'Manual reload triggered',
      source: req.body.source || 'API',
      timestamp: new Date().toISOString()
    };

    // Broadcast to all connected WebSocket clients
    if (global.broadcastReload) {
      const result = global.broadcastReload(reloadData);
      
      res.json({
        success: true,
        message: 'Reload notification sent to all connected clients',
        stats: result,
        data: reloadData
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'WebSocket server not available',
        message: 'Reload functionality is not active'
      });
    }
  } catch (error) {
    console.error('Error in reload endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send reload notification',
      details: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
});

// Get reload endpoint (for testing)
router.get('/__reload__', (req, res) => {
  try {
    const reloadData = {
      reason: 'Test reload via GET request',
      source: 'GET_API',
      timestamp: new Date().toISOString()
    };

    if (global.broadcastReload) {
      const result = global.broadcastReload(reloadData);
      
      res.json({
        success: true,
        message: 'Test reload notification sent',
        stats: result,
        data: reloadData
      });
    } else {
      res.status(503).json({
        success: false,
        error: 'WebSocket server not available'
      });
    }
  } catch (error) {
    console.error('Error in GET reload endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test reload notification'
    });
  }
});

module.exports = router;