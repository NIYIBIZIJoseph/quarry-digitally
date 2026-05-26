import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken, hasPermission } from '@/lib/auth';
import { enforceBranchIsolation } from '@/lib/branch';

function generateTicketNumber() {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TKT-${yyyy}${mm}${dd}-${random}`;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // GET tickets
  if (req.method === 'GET') {
    if (!(await hasPermission(user.userId, 'support:view'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { whereClause, params } = enforceBranchIsolation(user, 'st', 'branch_id');
    const query = `
      SELECT st.*
      FROM support_tickets st
      WHERE st.deleted_at IS NULL ${whereClause}
      ORDER BY st.created_at DESC
    `;
    const result = await pool.query(query, params);
    return res.status(200).json(result.rows);
  }

  // POST create ticket (supports both contact‑form and internal)
  if (req.method === 'POST') {
    if (!(await hasPermission(user.userId, 'support:create'))) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Accept both naming styles
    const user_name = req.body.user_name || req.body.name;
    const phone = req.body.phone;
    const subject = req.body.subject || req.body.title;
    const message = req.body.message || req.body.description;
    const priority = req.body.priority || 'medium';

    if (!subject || !message) {
      return res.status(400).json({ error: 'Subject and message required' });
    }

    const ticketNumber = generateTicketNumber();
    let branchId = user.branchId;
    // Use permission check instead of hardcoded role
    if (await hasPermission(user.userId, 'branch:switch')) {
      branchId = req.body.branch_id || branchId;
    }

    // Fetch staff name for internal tickets (if no user_name provided)
    let staffName = null;
    if (!user_name) {
      const userRes = await pool.query('SELECT full_name FROM users WHERE id = $1', [user.userId]);
      staffName = userRes.rows[0]?.full_name || 'Staff';
    }

    const finalUserName = user_name || staffName || 'Anonymous';

    const result = await pool.query(
      `INSERT INTO support_tickets 
       (ticket_number, user_name, phone, subject, message, priority, status, branch_id, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 'open', $7, $8, NOW()) RETURNING *`,
      [ticketNumber, finalUserName, phone || null, subject, message, priority, branchId, user.userId]
    );
    return res.status(201).json(result.rows[0]);
  }

  res.status(405).json({ error: 'Method not allowed' });
}