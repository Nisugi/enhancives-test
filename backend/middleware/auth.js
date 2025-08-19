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
        // Decode our simple base64 token
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());
        if (decoded && decoded.userId) {
            req.user = { id: decoded.userId };
            next();
        } else {
            res.status(403).json({ error: 'Invalid token' });
        }
    } catch (error) {
        res.status(403).json({ error: 'Invalid token' });
    }
};

module.exports = { authenticateToken };