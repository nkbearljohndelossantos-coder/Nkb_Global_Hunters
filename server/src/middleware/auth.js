import jwt from 'jsonwebtoken';
import { getOne } from '../db/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nkb_global_hunter_super_secure_jwt_secret_key_2026_default';

export function generateToken(user) {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

export async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Verify user is still active in database
    const user = await getOne(
      'SELECT u.id, u.username, u.email, u.full_name, u.role_id, u.is_active, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [decoded.id]
    );

    if (!user || user.is_active !== 1) {
      return res.status(403).json({ error: 'User account is deactivated or no longer exists.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session token.' });
  }
}

export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    // Admin has superuser privileges across all roles
    if (req.user.role_id === 'role_admin' || req.user.role_name === 'Administrator') {
      return next();
    }

    const hasRole = allowedRoles.some(
      r => req.user.role_id === r || req.user.role_name === r
    );

    if (!hasRole) {
      return res.status(403).json({
        error: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}
