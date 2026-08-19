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
    const { poll_id, roll_no, email, candidate_id, device_id } = body as {
      poll_id: string;
      roll_no: string;
      email: string;
      candidate_id: string;
      device_id: string;
    };

    // Sanitize inputs
    const cleanRoll = roll_no?.trim().toLowerCase();
    const cleanEmail = email?.trim().toLowerCase();
    const cleanDevice = device_id?.trim() || 'unknown';

    // 1. Basic formatting checks
    if (!cleanRoll || !isValidRoll(cleanRoll)) {
      return NextResponse.json({ error: 'Invalid Roll Number format. Use L followed by 6 digits (e.g. L253100).' }, { status: 400 });
    }
    if (!cleanEmail) {
      return NextResponse.json({ error: 'Email address is required.' }, { status: 400 });
    }
    if (!poll_id || !candidate_id) {
      return NextResponse.json({ error: 'Missing election selection details.' }, { status: 400 });
    }

    // 2. Strict Match Constraint: roll number and email MUST match exactly (same ID)
    const expectedEmail = `${cleanRoll}@lhr.nu.edu.pk`;
    if (cleanEmail !== expectedEmail) {
      return NextResponse.json({ 
        error: `Credential mismatch! Your email must be exactly: ${expectedEmail}` 
      }, { status: 400 });
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? null;
    const ipHash = hashIp(ip);

    const client = await pool.connect();
    try {
      // 0. Check if device is locked down
      const lockCheck = await client.query('SELECT reason FROM locked_devices WHERE device_id = $1', [cleanDevice]);
      if (lockCheck.rows.length > 0) {
        return NextResponse.json({ 
          error: `🚨 DEVICE LOCKDOWN: This device has been permanently locked down due to suspicious activities.` 
        }, { status: 403 });
      }

      // 3. Strict Voter List Check (Checks if roll number is in the pre-seeded classroom list)
      const voterCheck = await client.query('SELECT roll_no FROM eligible_voters WHERE roll_no = $1', [cleanRoll]);
      if (voterCheck.rows.length === 0) {
        // Log unauthorized attempt to audit table
        await client.query(
          `INSERT INTO audit_log (poll_id, roll_no, email, ip_hash, device_id, action, created_at)
           VALUES ($1, $2, $3, $4, $5, 'vote_attempt_invalid_roll', NOW())`,
          [poll_id, cleanRoll, cleanEmail, ipHash, cleanDevice]
        );
        return NextResponse.json({ 
          error: `Roll Number '${cleanRoll.toUpperCase()}' is not on the official class voter list. Access denied.` 
        }, { status: 403 });
      }

      // 4. Verify poll is active
      const pollRes = await client.query('SELECT is_active FROM polls WHERE id = $1', [poll_id]);
      if (pollRes.rows.length === 0) {
        return NextResponse.json({ error: 'Election poll not found.' }, { status: 404 });
      }
      if (!pollRes.rows[0].is_active) {
        return NextResponse.json({ error: 'Voting is currently closed for this election.' }, { status: 403 });
      }

      // 5. Verify candidate belongs to the poll
      const candRes = await client.query(
        'SELECT id, name FROM candidates WHERE id = $1 AND poll_id = $2',
        [candidate_id, poll_id]
      );
      if (candRes.rows.length === 0) {
        return NextResponse.json({ error: 'Selected candidate does not exist in this election.' }, { status: 400 });
      }

      // 6. Insert vote with device_id tracking
      const insertSql = `
        INSERT INTO votes (poll_id, roll_no, candidate_id, email, device_id)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (poll_id, roll_no) DO NOTHING
      `;
      const insRes = await client.query(insertSql, [poll_id, cleanRoll, candidate_id, cleanEmail, cleanDevice]);

      const alreadyVoted = insRes.rowCount === 0;

      // 7. Write to audit logs
      await client.query(
        `INSERT INTO audit_log (poll_id, roll_no, email, ip_hash, device_id, action, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [poll_id, cleanRoll, cleanEmail, ipHash, cleanDevice, alreadyVoted ? 'vote_attempt_duplicate' : 'vote_success']
      );

      if (alreadyVoted) {
        // Query who they previously voted for
        const existingVoteRes = await client.query(`
          SELECT c.name 
          FROM votes v 
          JOIN candidates c ON v.candidate_id = c.id 
          WHERE v.poll_id = $1 AND v.roll_no = $2
        `, [poll_id, cleanRoll]);

        const votedFor = existingVoteRes.rows[0]?.name || 'a candidate';

        return NextResponse.json(
          { 
            error: `You have already voted in this election.`, 
            already_voted: true,
            voted_for: votedFor
          },
          { status: 409 }
        );
      }

      return NextResponse.json({ success: true, message: `Successfully voted for ${candRes.rows[0].name}!` });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Submission error:', err);
    return NextResponse.json({ error: 'Internal server error processing your vote.' }, { status: 500 });
  }
}
