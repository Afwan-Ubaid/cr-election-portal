import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { password } = body as { password?: string };

    const expectedPassword = process.env.ADMIN_PASSWORD || 'cr_admin_2026';

    if (password === expectedPassword) {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Incorrect admin password. Access denied.' }, { status: 401 });
  } catch (err) {
    console.error('Admin login error:', err);
    return NextResponse.json({ error: 'Internal server error processing login.' }, { status: 500 });
  }
}
