import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  const ticketId = parseInt(id as string);
  if (isNaN(ticketId)) return res.status(400).json({ error: 'Invalid ticket ID' });

  const { whereClause, params: branchParams } = enforceBranchIsolation(user, 'st', 'branch_id');

  // Check ticket exists & accessible
  const ticketRes = await pool.query(
    `SELECT * FROM support_tickets st WHERE st.id = $${branchParams.length + 1} AND st.deleted_at IS NULL ${whereClause}`,
    [...branchParams, ticketId]
  );
  if (ticketRes.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });

  // GET ticket details
  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'support:view'))) return res.status(403).json({ error: 'Forbidden' });

    const replies = await pool.query(
      `SELECT * FROM support_replies WHERE ticket_id = $1 ORDER BY created_at ASC`,
      [ticketId]
    );
    return res.status(200).json({ ticket: ticketRes.rows[0], replies: replies.rows });
  }

  // POST reply
  if (req.method === 'POST') {
    if (!(await hasPermission(user.userId, 'support:reply'))) return res.status(403).json({ error: 'Forbidden' });
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message required' });

    await pool.query(
      `INSERT INTO support_replies (ticket_id, sender_name, sender_role, message, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [ticketId, user.phone, user.role, message]
    );
    await pool.query(`UPDATE support_tickets SET updated_at = NOW() WHERE id = $1`, [ticketId]);
    return res.status(201).json({ success: true });
  }

  // PUT update status/priority
  if (req.method === 'PUT') {
    if (!(await hasPermission(user.userId, 'support:manage'))) return res.status(403).json({ error: 'Forbidden' });
    const { status, priority, assigned_to } = req.body;
    await pool.query(
      `UPDATE support_tickets SET status = COALESCE($1, status), priority = COALESCE($2, priority),
       assigned_to = COALESCE($3, assigned_to), updated_at = NOW() WHERE id = $4`,
      [status, priority, assigned_to, ticketId]
    );
    return res.status(200).json({ success: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
}