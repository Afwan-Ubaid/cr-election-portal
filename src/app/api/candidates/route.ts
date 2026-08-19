import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

// 1. GET: Fetch candidates
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pollId = searchParams.get('poll_id') || 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88';

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT id, name, manifesto, avatar_id, created_at FROM candidates WHERE poll_id = $1 ORDER BY created_at ASC',
        [pollId]
      );
      return NextResponse.json({ candidates: res.rows });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to fetch candidates:', err);
    return NextResponse.json({ error: 'Failed to fetch candidates' }, { status: 500 });
  }
}

// 2. POST: Add candidate
export async function POST(req: NextRequest) {
  try {
    const deviceKey = req.headers.get('x-admin-device-key');
    const expectedDeviceKey = process.env.ADMIN_DEVICE_KEY || 'afwan_browser_secret_2026';
    const adminEmail = req.headers.get('x-admin-email');
    const adminPassword = req.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD || 'cr_admin_2026';

    if (deviceKey !== expectedDeviceKey || adminEmail !== 'afwanubaid9@gmail.com' || adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
    }

    const body = await req.json();
    const { poll_id, name, manifesto, avatar_id } = body as {
      poll_id: string;
      name: string;
      manifesto: string;
      avatar_id: string;
    };

    if (!name || name.trim() === '') {
      return NextResponse.json({ error: 'Candidate name is required' }, { status: 400 });
    }

    const targetPollId = poll_id || 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88';
    const targetAvatar = avatar_id || 'avatar1';

    const client = await pool.connect();
    try {
      const res = await client.query(
        `INSERT INTO candidates (poll_id, name, manifesto, avatar_id)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, manifesto, avatar_id, created_at`,
        [targetPollId, name.trim(), manifesto?.trim() || '', targetAvatar]
      );
      return NextResponse.json({ success: true, candidate: res.rows[0] });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to add candidate:', err);
    return NextResponse.json({ error: 'Failed to add candidate' }, { status: 500 });
  }
}

// 3. DELETE: Remove candidate
export async function DELETE(req: NextRequest) {
  try {
    const deviceKey = req.headers.get('x-admin-device-key');
    const expectedDeviceKey = process.env.ADMIN_DEVICE_KEY || 'afwan_browser_secret_2026';
    const adminEmail = req.headers.get('x-admin-email');
    const adminPassword = req.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD || 'cr_admin_2026';

    if (deviceKey !== expectedDeviceKey || adminEmail !== 'afwanubaid9@gmail.com' || adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Candidate ID is required' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      const res = await client.query('DELETE FROM candidates WHERE id = $1 RETURNING name', [id]);
      if (res.rowCount === 0) {
        return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, message: `Successfully deleted candidate ${res.rows[0].name}.` });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to delete candidate:', err);
    return NextResponse.json({ error: 'Failed to delete candidate' }, { status: 500 });
  }
}
