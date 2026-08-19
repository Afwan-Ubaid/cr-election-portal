import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function hashIp(ip?: string | null) {
  if (!ip) return 'unknown';
  let h = 0;
  for (let i = 0; i < ip.length; i++) {
    h = (h << 5) - h + ip.charCodeAt(i);
  }
  return String(h);
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? null;
  const ipHash = hashIp(ip);

  try {
    const deviceKey = req.headers.get('x-admin-device-key');
    const expectedDeviceKey = process.env.ADMIN_DEVICE_KEY || 'afwan_browser_secret_2026';

    if (deviceKey !== expectedDeviceKey) {
      return NextResponse.json({ error: 'Unauthorized browser device signature. Access denied.' }, { status: 403 });
    }

    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    const expectedPassword = process.env.ADMIN_PASSWORD || 'cr_admin_2026';

    const client = await pool.connect();
    try {
      // Check if IP is blocked due to excessive failed attempts
      const failedRes = await client.query(
        `SELECT COUNT(*)::int as count FROM audit_log
         WHERE ip_hash = $1 
           AND action = 'ADMIN_LOGIN_FAILED' 
           AND created_at > NOW() - INTERVAL '15 minutes'`,
        [ipHash]
      );
      
      const failedCount = failedRes.rows[0]?.count || 0;
      if (failedCount >= 5) {
        return NextResponse.json(
          { error: 'Too many failed login attempts. This IP has been temporarily blocked for 15 minutes.' },
          { status: 429 }
        );
      }

      if (email === 'afwanubaid9@gmail.com' && password === expectedPassword) {
        return NextResponse.json({ success: true });
      }

      // Log failed attempt to audit log
      await client.query(
        `INSERT INTO audit_log (poll_id, roll_no, email, ip_hash, device_id, action, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88', 
          'unknown', 
          email || 'unknown', 
          ipHash, 
          'unknown', 
          'ADMIN_LOGIN_FAILED'
        ]
      );

      return NextResponse.json({ error: 'Incorrect admin credentials. Access denied.' }, { status: 401 });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Internal server error processing login.' }, { status: 500 });
  }
}
