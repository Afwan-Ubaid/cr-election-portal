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
  try {
    const body = await req.json();
    const { device_id, roll_no, email, action_prefix } = body as {
      device_id: string;
      roll_no?: string;
      email?: string;
      action_prefix: string;
    };

    if (!device_id) {
      return NextResponse.json({ success: false, error: 'Missing device ID' }, { status: 400 });
    }

    const cleanDevice = device_id.trim();
    const cleanRoll = roll_no?.trim().toLowerCase() || 'unknown';
    const cleanEmail = email?.trim().toLowerCase() || 'unknown';
    const cleanActionPrefix = action_prefix?.trim() || 'SUSPECT_VISIT';

    const client = await pool.connect();
    try {
      // 1. Check if device is flagged (has cast > 1 votes OR is the known suspect device)
      let isFlagged = cleanDevice === '6de7e80a-cdad-4b92-9eb2-76a2c1af6b96';

      if (!isFlagged) {
        const flagCheckRes = await client.query(
          'SELECT COUNT(DISTINCT roll_no)::int as vote_count FROM votes WHERE device_id = $1',
          [cleanDevice]
        );
        const voteCount = flagCheckRes.rows[0]?.vote_count || 0;
        if (voteCount > 1) {
          isFlagged = true;
        }
      }

      // 2. If the device is flagged, log the raw IP and User-Agent to the audit log
      if (isFlagged) {
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
        const ua = req.headers.get('user-agent') ?? 'unknown';
        const ipHash = hashIp(ip);

        const actionString = `${cleanActionPrefix} | IP: ${ip} | Device: ${ua}`;
        const defaultPollId = 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88';

        await client.query(
          `INSERT INTO audit_log (poll_id, roll_no, email, ip_hash, device_id, action, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [defaultPollId, cleanRoll, cleanEmail, ipHash, cleanDevice, actionString]
        );

        console.log(`[ALERT] Flagged device activity tracked: Device=${cleanDevice}, IP=${ip}, UserAgent=${ua}`);
        return NextResponse.json({ success: true, flagged: true });
      }

      return NextResponse.json({ success: true, flagged: false });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to run suspect tracker:', err);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
