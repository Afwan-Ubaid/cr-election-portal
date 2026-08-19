import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    // 1. Password verification check
    const adminPassword = req.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD || 'cr_admin_2026';
    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
    }

    const body = await req.json();
    const { roll_no } = body as { roll_no: string };

    if (!roll_no) {
      return NextResponse.json({ error: 'Missing Roll Number' }, { status: 400 });
    }

    const cleanRoll = roll_no.trim().toLowerCase();
    const defaultPollId = 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88';

    const client = await pool.connect();
    try {
      // 2. Begin transaction
      await client.query('BEGIN');

      // Check if vote exists
      const voteCheck = await client.query(
        'SELECT email, device_id FROM votes WHERE poll_id = $1 AND roll_no = $2',
        [defaultPollId, cleanRoll]
      );

      if (voteCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: `No active vote found for roll number ${roll_no.toUpperCase()}.` }, { status: 404 });
      }

      const { email, device_id } = voteCheck.rows[0];

      // Delete the vote
      await client.query(
        'DELETE FROM votes WHERE poll_id = $1 AND roll_no = $2',
        [defaultPollId, cleanRoll]
      );

      // Log the deletion to audit logs
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? req.headers.get('x-real-ip') ?? 'unknown';
      // simple hash for admin ip
      let h = 0;
      for (let i = 0; i < ip.length; i++) {
        h = (h << 5) - h + ip.charCodeAt(i);
      }
      const ipHash = String(h);

      await client.query(
        `INSERT INTO audit_log (poll_id, roll_no, email, ip_hash, device_id, action, created_at)
         VALUES ($1, $2, $3, $4, $5, 'ADMIN_RESET_VOTE', NOW())`,
        [defaultPollId, cleanRoll, email, ipHash, device_id]
      );

      await client.query('COMMIT');
      return NextResponse.json({ 
        success: true, 
        message: `Successfully deleted vote for ${roll_no.toUpperCase()}. They can now vote again.` 
      });
    } catch (dbErr) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to delete vote:', err);
    return NextResponse.json({ error: 'Internal server error deleting vote.' }, { status: 500 });
  }
}
