import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { query, getOne, execute } from '../db/index.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';
import { logAudit } from '../services/auditService.js';

const router = express.Router();

// List users (Admin & Sales Manager)
router.get('/', authenticateToken, requireRole('role_admin', 'role_sales_manager', 'Administrator', 'Sales Manager'), async (req, res) => {
  try {
    const users = await query(
      `SELECT u.id, u.username, u.email, u.full_name, u.role_id, u.is_active, u.last_login_at, u.created_at,
              r.name as role_name, r.description as role_description
       FROM users u
       JOIN roles r ON u.role_id = r.id
       ORDER BY u.created_at ASC`
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

// List roles
router.get('/roles', authenticateToken, async (req, res) => {
  try {
    const roles = await query('SELECT * FROM roles ORDER BY name ASC');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve roles.' });
  }
});

// Create user (Admin only)
router.post('/', authenticateToken, requireRole('role_admin', 'Administrator'), async (req, res) => {
  const { username, email, password, fullName, roleId } = req.body;

  if (!username || !email || !password || !fullName || !roleId) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const existing = await getOne('SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($2)', [email, username]);
    if (existing) {
      return res.status(400).json({ error: 'A user with this email or username already exists.' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();

    await execute(
      `INSERT INTO users (id, username, email, password_hash, full_name, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [id, username.trim(), email.trim().toLowerCase(), passwordHash, fullName.trim(), roleId, 1]
    );

    await logAudit({
      userId: req.user.id,
      action: 'USER_CREATED',
      entityType: 'user',
      entityId: id,
      details: { username, email, roleId }
    });

    const created = await getOne(
      'SELECT u.id, u.username, u.email, u.full_name, u.role_id, r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = $1',
      [id]
    );
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user account.' });
  }
});

// Toggle active status (Admin only)
router.patch('/:id/status', authenticateToken, requireRole('role_admin', 'Administrator'), async (req, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  if (id === req.user.id) {
    return res.status(400).json({ error: 'Cannot deactivate your own administrator account.' });
  }

  try {
    await execute('UPDATE users SET is_active = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [isActive ? 1 : 0, id]);

    await logAudit({
      userId: req.user.id,
      action: isActive ? 'USER_ACTIVATED' : 'USER_DEACTIVATED',
      entityType: 'user',
      entityId: id
    });

    res.json({ success: true, isActive: !!isActive });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user status.' });
  }
});

export default router;
