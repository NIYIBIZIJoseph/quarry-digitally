import pool from '../db';

const WINDOW_MINUTES = 15;
const MAX_REQUESTS = 5;
const MAX_VERIFY_ATTEMPTS = 3;
const LOCKOUT_MINUTES = 30;

export async function checkOTPRateLimit(identifier: string, ip: string, type: 'request' | 'verify') {
  // Check lockout (after 3 failed verifies in last LOCKOUT_MINUTES)
  const lockoutRes = await pool.query(
    `SELECT MAX(created_at) as last_fail FROM otp_attempts
     WHERE identifier = $1 AND ip_address = $2 AND attempt_type = 'verify' AND success = false
     AND created_at > NOW() - INTERVAL '${LOCKOUT_MINUTES} minutes'`,
    [identifier, ip]
  );
  if (lockoutRes.rows[0]?.last_fail) {
    const lastFail = new Date(lockoutRes.rows[0].last_fail);
    const lockoutUntil = new Date(lastFail.getTime() + LOCKOUT_MINUTES * 60 * 1000);
    if (lockoutUntil > new Date()) {
      return { allowed: false, lockoutUntil };
    }
  }

  const limit = type === 'request' ? MAX_REQUESTS : MAX_VERIFY_ATTEMPTS;
  const countRes = await pool.query(
    `SELECT COUNT(*) FROM otp_attempts
     WHERE identifier = $1 AND ip_address = $2 AND attempt_type = $3
     AND created_at > NOW() - INTERVAL '${WINDOW_MINUTES} minutes'`,
    [identifier, ip, type]
  );
  if (parseInt(countRes.rows[0].count) >= limit) {
    return { allowed: false, waitSeconds: WINDOW_MINUTES * 60 };
  }
  return { allowed: true };
}

export async function recordOTPAttempt(identifier: string, ip: string, type: 'request' | 'verify', success: boolean) {
  await pool.query(
    `INSERT INTO otp_attempts (identifier, ip_address, attempt_type, success) VALUES ($1, $2, $3, $4)`,
    [identifier, ip, type, success]
  );
}