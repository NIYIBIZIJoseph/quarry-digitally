import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '@/lib/db';

interface TableRow {
  table_name: string;
}

interface ColumnRow {
  column_name: string;
  data_type: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const tablesResult = await pool.query<TableRow>(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    const usersColsResult = await pool.query<ColumnRow>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    let otpTable: string | null = null;
    let otpCols: { column_name: string }[] = [];
    for (const tbl of ['otp_codes', 'otp_store', 'otp_verifications', 'otp']) {
      const exists = await pool.query<{ exists: boolean }>(
        `SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = $1)`,
        [tbl]
      );
      if (exists.rows[0].exists) {
        otpTable = tbl;
        const cols = await pool.query<{ column_name: string }>(
          `SELECT column_name FROM information_schema.columns WHERE table_name = $1`,
          [tbl]
        );
        otpCols = cols.rows;
        break;
      }
    }

    const branchesColsResult = await pool.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'branches'`
    );

    res.status(200).json({
      tables: tablesResult.rows.map((row: TableRow) => row.table_name),
      usersColumns: usersColsResult.rows,
      otpTable,
      otpColumns: otpCols.map((col: { column_name: string }) => col.column_name),
      branchesColumns: branchesColsResult.rows.map((col: { column_name: string }) => col.column_name),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: String(err) });
  }
}