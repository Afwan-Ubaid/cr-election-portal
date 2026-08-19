import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('device_id');

    if (!deviceId) {
      return NextResponse.json({ locked: false });
    }

    const client = await pool.connect();
    try {
      const res = await client.query(
        'SELECT reason FROM locked_devices WHERE device_id = $1',
        [deviceId]
      );
      if (res.rows.length > 0) {
        return NextResponse.json({ locked: true, message: res.rows[0].reason });
      }
      return NextResponse.json({ locked: false });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to check lockdown status:', err);
    return NextResponse.json({ error: 'Internal server error checking lockdown.' }, { status: 500 });
  }
}
