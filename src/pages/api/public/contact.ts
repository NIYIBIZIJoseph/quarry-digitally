import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { user_name, phone, subject, message } = req.body;
  if (!user_name || !message) {
    return res.status(400).json({ error: 'Name and message are required' });
  }

  try {
    // Insert into contact_messages (table already exists)
  await pool.query(
  `INSERT INTO contact_messages (name, phone, subject, message) VALUES ($1, $2, $3, $4)`,
  [user_name, phone || null, subject || null, message]
);

    // Auto-create ticket
    const date = new Date();
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const ticketNumber = `TKT-${yyyy}${mm}${dd}-${random}`;

    await pool.query(
      `INSERT INTO support_tickets (ticket_number, user_name, phone, subject, message, status, priority)
       VALUES ($1, $2, $3, $4, $5, 'open', 'medium')`,
      [ticketNumber, user_name, phone || null, subject || 'Contact form', message]
    );

    return res.status(201).json({ success: true });
  } catch (err: any) {
    console.error(err);
    return res.status(500).json({ error: 'Database error: ' + err.message });
  }
}