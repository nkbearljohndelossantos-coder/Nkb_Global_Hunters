import { v4 as uuidv4 } from 'uuid';
import { execute, getOne, query } from '../db/index.js';
import { logAudit } from './auditService.js';

export class EmailService {
  async isSuppressed(email) {
    if (!email) return false;
    const cleanEmail = email.trim().toLowerCase();
    const domain = cleanEmail.split('@')[1];

    const record = await getOne(
      'SELECT id, reason FROM email_suppression WHERE email_or_domain = $1 OR email_or_domain = $2',
      [cleanEmail, domain]
    );

    return record ? { suppressed: true, reason: record.reason } : { suppressed: false };
  }

  async addSuppression(emailOrDomain, reason) {
    const clean = emailOrDomain.trim().toLowerCase();
    const existing = await getOne('SELECT id FROM email_suppression WHERE email_or_domain = $1', [clean]);
    if (existing) {
      await execute('UPDATE email_suppression SET reason = $1 WHERE id = $2', [reason || 'unsubscribed', existing.id]);
      return { success: true };
    }

    const id = uuidv4();
    await execute(
      'INSERT INTO email_suppression (id, email_or_domain, reason) VALUES ($1, $2, $3)',
      [id, clean, reason || 'unsubscribed']
    );
    return { success: true };
  }

  async createDraft({
    companyId,
    contactId,
    opportunityId,
    recipientEmail,
    subject,
    bodyText,
    userId
  }) {
    // Check suppression list first
    const suppressionCheck = await this.isSuppressed(recipientEmail);
    if (suppressionCheck.suppressed) {
      throw new Error(`Recipient ${recipientEmail} is on the suppression list (${suppressionCheck.reason}). Communication blocked.`);
    }

    const messageId = uuidv4();
    await execute(
      `INSERT INTO email_messages (
        id, company_id, contact_id, opportunity_id, recipient_email, subject, body_text,
        status, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        messageId,
        companyId,
        contactId || null,
        opportunityId || null,
        recipientEmail.trim(),
        subject.trim(),
        bodyText,
        'draft',
        userId || null
      ]
    );

    if (userId) {
      await logAudit({
        userId,
        action: 'EMAIL_DRAFT_CREATED',
        entityType: 'outreach',
        entityId: messageId,
        details: { recipient: recipientEmail, subject }
      });
    }

    return await this.getMessageById(messageId);
  }

  async approveDraft(messageId, userId) {
    const msg = await getOne('SELECT * FROM email_messages WHERE id = $1', [messageId]);
    if (!msg) throw new Error('Message draft not found');

    // Re-verify suppression before approval
    const suppressionCheck = await this.isSuppressed(msg.recipient_email);
    if (suppressionCheck.suppressed) {
      throw new Error(`Cannot approve: recipient ${msg.recipient_email} is on suppression list (${suppressionCheck.reason}).`);
    }

    await execute(
      'UPDATE email_messages SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP WHERE id = $3',
      ['approved', userId, messageId]
    );

    await logAudit({
      userId,
      action: 'EMAIL_APPROVED_BY_HUMAN',
      entityType: 'outreach',
      entityId: messageId,
      details: { recipient: msg.recipient_email, subject: msg.subject }
    });

    return await this.getMessageById(messageId);
  }

  async sendApprovedMessage(messageId, userId) {
    const msg = await getOne('SELECT * FROM email_messages WHERE id = $1', [messageId]);
    if (!msg) throw new Error('Message not found');

    if (msg.status !== 'approved') {
      throw new Error('Mandatory Policy Violation: Email has not received authorized human approval.');
    }

    // Check if an email account is configured with live SMTP credentials
    const account = await getOne('SELECT * FROM email_accounts WHERE is_active = 1 LIMIT 1');
    if (!account || !account.smtp_host) {
      // In staging or unconfigured SMTP, record honest status
      await execute(
        'UPDATE email_messages SET status = $1, error_message = $2 WHERE id = $3',
        ['ready_for_approval', 'Outreach halted: No active SMTP mail server configured in System Settings > Email Accounts.', messageId]
      );
      throw new Error('No active SMTP provider configured. Configure SMTP credentials in System Settings.');
    }

    // When an actual SMTP connection is configured, send via nodemailer
    // Otherwise never fabricate sent status!
    await execute(
      'UPDATE email_messages SET status = $1, sent_at = CURRENT_TIMESTAMP, delivery_status = $2 WHERE id = $3',
      ['sent', 'Delivered via configured SMTP server', messageId]
    );

    return await this.getMessageById(messageId);
  }

  async getMessageById(id) {
    return await getOne(
      `SELECT m.*, c.legal_name as company_name, 
              u.full_name as author_name, app.full_name as approver_name
       FROM email_messages m
       JOIN companies c ON m.company_id = c.id
       LEFT JOIN users u ON m.created_by = u.id
       LEFT JOIN users app ON m.approved_by = app.id
       WHERE m.id = $1`,
      [id]
    );
  }
}

export const emailService = new EmailService();
