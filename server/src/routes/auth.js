import express from 'express';
import bcrypt from 'bcryptjs';
import { getOne, execute } from '../db/index.js';
import { generateToken, authenticateToken } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  try {
    const user = await getOne(
      `SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.role_id, u.is_active, r.name as role_name
       FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE LOWER(u.email) = LOWER($1)`,
      [email.trim()]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    if (user.is_active !== 1) {
      return res.status(403).json({ error: 'Account is deactivated. Contact the system administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Update last login
    await execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);

    const token = generateToken(user);

    await logAudit({
      userId: user.id,
      action: 'USER_LOGIN',
      entityType: 'auth',
      entityId: user.id,
      ipAddress: req.ip
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.full_name,
        roleId: user.role_id,
        roleName: user.role_name
      }
    });
  } catch (err) {
    console.error('[Login Error]', err);
    res.status(500).json({ error: 'Internal authentication error.' });
  }
});

router.get('/me', authenticateToken, async (req, res) => {
  res.json({ user: req.user });
});

export default router;
