import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const result = await pool.query('SELECT id, phone, full_name, role FROM users LIMIT 10');
  res.status(200).json(result.rows);
}