import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const { id } = req.query;
  if (!id || isNaN(Number(id))) {
    return res.status(400).json({ message: 'Invalid worker ID' });
  }

  if (req.method === 'GET') {
    try {
      const result = await pool.query(
        'SELECT * FROM worker_documents WHERE worker_id = $1 ORDER BY uploaded_at DESC',
        [id]
      );
      return res.status(200).json(result.rows);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to fetch documents' });
    }
  }

  if (req.method === 'POST') {
    const { type, title, file_url } = req.body;
    if (!type || !file_url) {
      return res.status(400).json({ message: 'Type and file URL required' });
    }
    try {
      const result = await pool.query(
        `INSERT INTO worker_documents (worker_id, type, title, file_url)
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [id, type, title || null, file_url]
      );
      return res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to add document' });
    }
  }

  if (req.method === 'DELETE') {
    const { docId } = req.body;
    if (!docId) {
      return res.status(400).json({ message: 'Document ID required' });
    }
    try {
      await pool.query('DELETE FROM worker_documents WHERE id = $1 AND worker_id = $2', [docId, id]);
      return res.status(200).json({ message: 'Document deleted' });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to delete document' });
    }
  }

  res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
  res.status(405).end(`Method ${req.method} Not Allowed`);
}