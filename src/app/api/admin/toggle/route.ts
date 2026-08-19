import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const adminPassword = req.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD || 'cr_admin_2026';
    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
    }
    const body = await req.json();
    const { poll_id, is_active } = body as {
      poll_id: string;
      is_active: boolean;
    };

    const targetPollId = poll_id || 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88';

    const client = await pool.connect();
    try {
      const res = await client.query(
        'UPDATE polls SET is_active = $1 WHERE id = $2 RETURNING id, title, is_active',
        [is_active, targetPollId]
      );

      if (res.rowCount === 0) {
        return NextResponse.json({ error: 'Election poll not found' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        poll: res.rows[0],
        message: `Election is now ${is_active ? 'OPEN' : 'FROZEN/CLOSED'}.`
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to toggle poll status:', err);
    return NextResponse.json({ error: 'Failed to update election status' }, { status: 500 });
  }
}
