// middleware/auth.js

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
    
    if (!token) {
        // Check for user ID in header as fallback
        const userId = req.headers['x-user-id'];
        if (userId) {
            req.user = { id: userId };
            return next();
        }
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    try {
        // Validate base64 format first
        if (!/^[A-Za-z0-9+/=]+$/.test(token)) {
            console.error('Token is not valid base64:', token);
            return res.status(403).json({ error: 'Invalid token format' });
        }
        
        // Decode our simple base64 token
        const decodedString = Buffer.from(token, 'base64').toString('utf8');
        console.log('Decoded token string:', decodedString);
        
        const decoded = JSON.parse(decodedString);
        if (decoded && decoded.userId) {
            req.user = { 
                id: decoded.userId,
                username: decoded.username 
            };
            next();
        } else {
            console.error('Invalid token structure:', decoded);
            res.status(403).json({ error: 'Invalid token structure' });
        }
    } catch (error) {
        console.error('Token decode error:', error.message);
        console.error('Raw token received:', token);
        res.status(403).json({ error: 'Invalid token: ' + error.message });
    }
};

module.exports = { authenticateToken };