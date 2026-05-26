import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { id, status, admin_notes } = req.body;
  if (!id || !status) {
    return res.status(400).json({ message: 'Order ID and status required' });
  }

  try {
    // Start transaction
    await pool.query('BEGIN');

    // Get current order details (lock the order row)
    const orderResult = await pool.query(
      'SELECT product_id, quantity, status FROM orders WHERE id = $1 FOR UPDATE',
      [id]
    );
    if (orderResult.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ message: 'Order not found' });
    }
    const order = orderResult.rows[0];
    const currentStatus = order.status;

    // Validate transition
    const validTransitions: Record<string, string[]> = {
      pending: ['approved'],
      approved: ['delivered'],
      delivered: [],
    };
    if (!validTransitions[currentStatus]?.includes(status)) {
      await pool.query('ROLLBACK');
      return res.status(400).json({ message: `Invalid transition: ${currentStatus} → ${status}` });
    }

    // Update order status and timestamps
    let updateQuery = 'UPDATE orders SET status = $1';
    const params: any[] = [status];
    if (admin_notes !== undefined) {
      updateQuery += ', admin_notes = $2';
      params.push(admin_notes);
    }
    if (status === 'approved' && currentStatus !== 'approved') {
      updateQuery += ', approved_at = NOW()';
    }
    if (status === 'delivered' && currentStatus !== 'delivered') {
      updateQuery += ', delivered_at = NOW()';
    }
    updateQuery += ' WHERE id = $' + (params.length + 1);
    params.push(id);
    await pool.query(updateQuery, params);

    // If moving to approved or delivered, reduce stock
    if ((status === 'approved' || status === 'delivered') && currentStatus !== 'approved' && currentStatus !== 'delivered') {
      // Lock the product row for update (prevents race conditions)
      const productLock = await pool.query(
        'SELECT stock_quantity FROM products WHERE id = $1 FOR UPDATE',
        [order.product_id]
      );
      if (productLock.rows.length === 0) {
        throw new Error('Product not found');
      }
      const oldStock = productLock.rows[0].stock_quantity;
      const newStock = oldStock - order.quantity;
      if (newStock < 0) {
        throw new Error('Insufficient stock');
      }
      // Update product stock
      await pool.query(
        'UPDATE products SET stock_quantity = $1 WHERE id = $2',
        [newStock, order.product_id]
      );
      // Log stock change
      await pool.query(
        `INSERT INTO stock_logs (product_id, changed_by, old_quantity, new_quantity, reason)
         VALUES ($1, $2, $3, $4, $5)`,
        [order.product_id, 1, oldStock, newStock, `Order #${id} ${status}`]
      );
    }

    await pool.query('COMMIT');
    return res.status(200).json({ message: 'Order updated successfully' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error(error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({ message: errorMessage });
  }
}
