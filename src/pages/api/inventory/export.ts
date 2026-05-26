import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { format } = req.query;

  try {
    const result = await pool.query(`
      SELECT p.name, c.name as category, p.stock_quantity, p.reorder_level, p.price, p.is_active
      FROM products p
      JOIN categories c ON p.category_id = c.id
      ORDER BY p.name
    `);
    const products = result.rows;

    if (format === 'csv') {
      let csv = 'Name,Category,Stock (m³),Reorder Level (m³),Price (RWF),Active\n';
      for (const p of products) {
        csv += `${p.name},${p.category},${p.stock_quantity},${p.reorder_level},${p.price},${p.is_active ? 'Yes' : 'No'}\n`;
      }
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory.csv');
      return res.status(200).send(csv);
    } else {
      // Simple HTML report
      let html = '<!DOCTYPE html><html><head><title>Inventory Report</title></head><body>';
      html += '<h1>Inventory Report</h1>';
      html += '<table border="1" cellpadding="8"><thead><tr><th>Name</th><th>Category</th><th>Stock (m³)</th><th>Reorder Level</th><th>Price (RWF)</th><th>Active</th></tr></thead><tbody>';
      for (const p of products) {
        html += `<tr><td>${p.name}</td><td>${p.category}</td><td>${p.stock_quantity}</td><td>${p.reorder_level}</td><td>${p.price}</td><td>${p.is_active ? 'Yes' : 'No'}</td></tr>`;
      }
      html += '</tbody></table></body></html>';
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('Content-Disposition', 'attachment; filename=inventory.html');
      return res.status(200).send(html);
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Export failed' });
  }
}
