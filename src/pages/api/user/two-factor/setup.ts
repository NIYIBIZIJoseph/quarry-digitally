import type { NextApiRequest, NextApiResponse } from 'next';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { verifyToken } from '@/lib/auth';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const user = verifyToken(req);
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  const secret = speakeasy.generateSecret({ length: 20, name: `HENG YUN (${user.phone})`, issuer: 'HENG YUN' });
  if (!secret.otpauth_url) {
    return res.status(500).json({ error: 'Failed to generate OTP auth URL' });
  }
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  res.status(200).json({
    secret: secret.base32,
    otpauth_url: secret.otpauth_url,
    qrCode,
  });
}