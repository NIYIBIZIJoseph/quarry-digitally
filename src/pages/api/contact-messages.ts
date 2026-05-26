// src/pages/api/contact-messages.ts (public – no auth)
import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    return res.status(200).json(result.rows);
  }
  if (req.method === 'POST') {
    const { name, email, subject, message } = req.body;
    if (!name || !message) return res.status(400).json({ error: 'Name and message required' });
    await pool.query('INSERT INTO contact_messages (name, email, subject, message) VALUES ($1,$2,$3,$4)', [name, email, subject, message]);
    return res.status(201).json({ success: true });
  }
  res.status(405).end();
}