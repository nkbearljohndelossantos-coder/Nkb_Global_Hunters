import { v4 as uuidv4 } from 'uuid';
import { execute } from '../db/index.js';

export async function logAudit({ userId, action, entityType, entityId, details, ipAddress }) {
  try {
    const id = uuidv4();
    await execute(
      'INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [
        id,
        userId || null,
        action,
        entityType,
        entityId || null,
        typeof details === 'object' ? JSON.stringify(details) : (details || null),
        ipAddress || null
      ]
    );
  } catch (err) {
    console.error('[Audit Log Error]', err.message);
  }
}
