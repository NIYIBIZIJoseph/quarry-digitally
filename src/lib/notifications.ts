import pool from './db';

interface NotificationData {
  userId: number;
  title: string;
  message: string;
  type?: string;
  priority?: 'high' | 'medium' | 'low';
  link?: string;
}

export async function createNotification(data: NotificationData) {
  const { userId, title, message, type = 'system', priority = 'medium', link } = data;
  
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, link, created_at, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), false)`,
      [userId, title, message, type, priority, link]
    );
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
}

export async function createNotificationForRole(role: string, title: string, message: string, type = 'system', priority = 'medium') {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, created_at, is_read)
       SELECT id, $1, $2, $3, $4, NOW(), false
       FROM users WHERE role = $5`,
      [title, message, type, priority, role]
    );
  } catch (error) {
    console.error('Failed to create role notification:', error);
  }
}

export async function createNotificationForAllAdmins(title: string, message: string, type = 'system', priority = 'medium') {
  try {
    await pool.query(
      `INSERT INTO notifications (user_id, title, message, type, priority, created_at, is_read)
       SELECT id, $1, $2, $3, $4, NOW(), false
       FROM users WHERE role IN ('superadmin', 'admin')`,
      [title, message, type, priority]
    );
  } catch (error) {
    console.error('Failed to create admin notification:', error);
  }
}