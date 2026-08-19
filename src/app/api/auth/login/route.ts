import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

function isValidRoll(roll: string) {
  return /^[Ll]\d{6}$/.test(roll);
}

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
    const { roll_no, email, device_id } = body as {
      roll_no: string;
      email: string;
      device_id: string;
    };

    const cleanRoll = roll_no?.trim().toLowerCase();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanDevice = device_id?.trim();

    if (!cleanRoll || !isValidRoll(cleanRoll)) {
      return NextResponse.json({ error: 'Invalid Roll Number format.' }, { status: 400 });
    }
    if (!cleanEmail || cleanEmail !== `${cleanRoll}@lhr.nu.edu.pk`) {
      return NextResponse.json({ error: 'Credential mismatch.' }, { status: 400 });
    }
    if (!cleanDevice) {
      return NextResponse.json({ error: 'Missing Device ID.' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      // 1. Check if the device is already locked down
      const lockCheck = await client.query(
        'SELECT reason FROM locked_devices WHERE device_id = $1',
        [cleanDevice]
      );
      if (lockCheck.rows.length > 0) {
        return NextResponse.json(
          { locked: true, error: `This device is locked down: ${lockCheck.rows[0].reason}` },
          { status: 403 }
        );
      }

      // 2. Strict check: Has this device already voted or registered a successful vote under a different roll number?
      const checkDiffRollQuery = `
        SELECT DISTINCT roll_no 
        FROM (
          SELECT roll_no FROM votes WHERE device_id = $1 AND roll_no != 'unknown'
          UNION
          SELECT roll_no FROM audit_log WHERE device_id = $1 AND action = 'vote_success' AND roll_no != 'unknown'
        ) AS used_rolls
        WHERE roll_no != $2
        LIMIT 1
      `;
      const diffRollRes = await client.query(checkDiffRollQuery, [cleanDevice, cleanRoll]);

      if (diffRollRes.rows.length > 0) {
        const existingRoll = diffRollRes.rows[0].roll_no;
        const lockReason = `Locked down due to attempt to use multiple roll numbers on the same device. (Attempted: ${cleanRoll.toUpperCase()}, Existing: ${existingRoll.toUpperCase()})`;

        // Permanent lockdown
        await client.query(
          `INSERT INTO locked_devices (device_id, reason, roll_no, attempted_roll_no)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (device_id) DO UPDATE SET reason = EXCLUDED.reason`,
          [cleanDevice, lockReason, existingRoll, cleanRoll]
        );

        // Audit log entry
        const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? null;
        const ipHash = hashIp(ip);
        const actionMessage = `DEVICE_LOCKDOWN | Attempted Roll: ${cleanRoll.toUpperCase()} | Existing Roll: ${existingRoll.toUpperCase()} | Reason: Multi-Voter Signature detected on same device.`;
        
        await client.query(
          `INSERT INTO audit_log (poll_id, roll_no, email, ip_hash, device_id, action, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          ['d8f8e0fa-9867-4279-b1d5-2ee6bf35ff88', cleanRoll, cleanEmail, ipHash, cleanDevice, actionMessage]
        );

        return NextResponse.json(
          { locked: true, error: `🚨 DEVICE LOCKDOWN: Your device has been permanently locked down due to suspicious multi-voter activities. This incident has been logged and reported.` },
          { status: 403 }
        );
      }

      // Check if roll number is eligible
      const voterCheck = await client.query('SELECT roll_no FROM eligible_voters WHERE roll_no = $1', [cleanRoll]);
      if (voterCheck.rows.length === 0) {
        return NextResponse.json(
          { error: `Roll Number '${cleanRoll.toUpperCase()}' is not on the official class voter list.` },
          { status: 403 }
        );
      }

      return NextResponse.json({ success: true });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Login authentication error:', err);
    return NextResponse.json({ error: 'Internal server error processing login.' }, { status: 500 });
  }
}
