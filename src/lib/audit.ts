import pool from './db';

export async function logAudit({
  userId,
  action,
  targetType,
  targetId,
  oldData,
  newData,
  ipAddress,
  userAgent,
}: {
  userId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  oldData?: any;
  newData?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const client = await pool.connect();
  try {
    await client.query(
      `INSERT INTO audit_logs (user_id, action, target_type, target_id, old_data, new_data, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        userId,
        action,
        targetType || null,
        targetId || null,
        oldData ? JSON.stringify(oldData) : null,
        newData ? JSON.stringify(newData) : null,
        ipAddress || null,
        userAgent || null,
      ]
    );
  } finally {
    client.release();
  }
}