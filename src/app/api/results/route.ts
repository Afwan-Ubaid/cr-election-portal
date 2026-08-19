import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pollId = searchParams.get('poll_id') || 'd8f8e0fa-9867-4279-b1d5-2ee6bf35ff88';

    const client = await pool.connect();
    try {
      // 1. Fetch the poll status
      const pollRes = await client.query('SELECT title, is_active FROM polls WHERE id = $1', [pollId]);
      if (pollRes.rows.length === 0) {
        return NextResponse.json({ error: 'Election poll not found' }, { status: 404 });
      }
      const poll = pollRes.rows[0];

      // 2. Fetch candidate vote counts
      const candQuery = `
        SELECT 
          c.id, 
          c.name, 
          c.manifesto,
          c.avatar_id, 
          COUNT(v.id)::int as vote_count
        FROM candidates c
        LEFT JOIN votes v ON c.id = v.candidate_id
        WHERE c.poll_id = $1
        GROUP BY c.id
        ORDER BY vote_count DESC, c.name ASC
      `;
      const candRes = await client.query(candQuery, [pollId]);

      // 3. Fetch total votes
      const totalRes = await client.query('SELECT COUNT(*)::int as total FROM votes WHERE poll_id = $1', [pollId]);
      const totalVotes = totalRes.rows[0].total;

      // 4. Fetch audit summary
      const auditQuery = `
        SELECT 
          action, 
          COUNT(*)::int as count 
        FROM audit_log 
        WHERE poll_id = $1 
        GROUP BY action
      `;
      const auditRes = await client.query(auditQuery, [pollId]);
      
      const auditSummary = {
        success: totalVotes, // Correctly display active valid votes
        duplicates: 0,
        invalidRolls: 0,
        totalAttempts: 0
      };

      let rawSuccessCount = 0;
      let rawDuplicatesCount = 0;
      let suspectAttempts = 0;

      auditRes.rows.forEach(row => {
        const action = row.action;
        auditSummary.totalAttempts += row.count;

        if (action === 'vote_success') {
          rawSuccessCount = row.count;
        } else if (action === 'vote_attempt_duplicate') {
          rawDuplicatesCount = row.count;
        } else if (action === 'vote_attempt_invalid_roll') {
          auditSummary.invalidRolls = row.count;
        } else if (
          action.startsWith('SUSPECT_') || 
          action.startsWith('DEVICE_LOCKDOWN') || 
          action === 'ADMIN_RESET_VOTE'
        ) {
          suspectAttempts += row.count;
        }
      });

      // Blocked duplicates / fraudulent attempts = (raw duplicates from log) + (votes that were success but deleted/reset) + (suspect login/visiting attempts)
      const deletedSuccessVotes = Math.max(0, rawSuccessCount - totalVotes);
      auditSummary.duplicates = rawDuplicatesCount + deletedSuccessVotes + suspectAttempts;

      // 5. Query duplicate device detections: check if same device_id is linked to > 1 roll_no
      const deviceCheckQuery = `
        SELECT 
          device_id, 
          COUNT(DISTINCT roll_no)::int as vote_count, 
          string_agg(roll_no, ', ') as roll_numbers
        FROM votes
        WHERE poll_id = $1 AND device_id != 'unknown'
        GROUP BY device_id
        HAVING COUNT(DISTINCT roll_no) > 1
        ORDER BY vote_count DESC
      `;
      const deviceRes = await client.query(deviceCheckQuery, [pollId]);

      return NextResponse.json({
        poll: {
          id: pollId,
          title: poll.title,
          is_active: poll.is_active
        },
        candidates: candRes.rows,
        totalVotes,
        auditSummary,
        flaggedDevices: deviceRes.rows
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Failed to retrieve results:', err);
    return NextResponse.json({ error: 'Internal server error fetching results.' }, { status: 500 });
  }
}
