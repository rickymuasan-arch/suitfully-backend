// Simple admin authentication middleware
// This can be expanded later with JWT

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'suitfully2026';

exports.verifyAdmin = (req, res, next) => {
  const token = req.headers.authorization;
  
  if (!token || token !== `Bearer ${ADMIN_PASSWORD}`) {
    return res.status(401).json({ error: 'Unauthorized access' });
  }
  
  next();
};