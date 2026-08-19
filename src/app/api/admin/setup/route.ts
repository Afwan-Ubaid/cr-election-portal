import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(req: NextRequest) {
  try {
    const adminPassword = req.headers.get('x-admin-password');
    const expectedPassword = process.env.ADMIN_PASSWORD || 'cr_admin_2026';
    if (adminPassword !== expectedPassword) {
      return NextResponse.json({ error: 'Unauthorized admin access.' }, { status: 401 });
    }
    const sqlPath = path.join(process.cwd(), 'init.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    const client = await pool.connect();
    try {
      // 1. Force drop all tables to guarantee a complete clean state
      await client.query(`
        DROP TABLE IF EXISTS audit_log CASCADE;
        DROP TABLE IF EXISTS votes CASCADE;
        DROP TABLE IF EXISTS candidates CASCADE;
        DROP TABLE IF EXISTS eligible_voters CASCADE;
        DROP TABLE IF EXISTS polls CASCADE;
      `);

      // 2. Re-create and seed tables from init.sql
      await client.query(sqlContent);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Database tables successfully recreated. All vote logs cleared, and candidates reset to zero.' 
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Database setup failed:', err);
    return NextResponse.json({ error: 'Failed to reset and initialize database', details: (err as Error).message }, { status: 500 });
  }
}
