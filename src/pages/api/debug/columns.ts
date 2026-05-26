import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    res.status(200).json({ columns: columns.rows.map((c: any) => c.column_name) });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
}