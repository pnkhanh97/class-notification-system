import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

function cell(row: string[], i: number) {
  return i >= 0 && i < row.length ? String(row[i] ?? '').trim() : '';
}

// CONCATENATE([ID Khoá học], "-", RIGHT("00" & (COUNT(...) + 1), 2), "-", [ID Tính chất])
// COUNT = số row trong Schedule có cùng ID Khoá học VÀ cùng ID Tính chất
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idKhoaHoc  = searchParams.get('idKhoaHoc')  ?? '';
    const idTinhChat = searchParams.get('idTinhChat') ?? '';

    if (!idKhoaHoc || !idTinhChat) {
      return NextResponse.json({ idBuoiHoc: '' });
    }

    const data = await getSheetData('Schedule');
    if (data.length < 2) {
      return NextResponse.json({ idBuoiHoc: `${idKhoaHoc}-01-${idTinhChat}` });
    }

    const h = data[0];
    const rows = data.slice(1);
    const idxKhoa     = h.indexOf('ID Khoá học');
    const idxTinhChat = h.indexOf('ID Tính chất');

    const count = new Set(
      rows
        .filter(r => cell(r, idxKhoa) === idKhoaHoc && cell(r, idxTinhChat) === idTinhChat)
        .map(r => cell(r, h.indexOf('ID Buổi học')))
        .filter(Boolean)
    ).size;

    const seq = String(count + 1).padStart(2, '0');
    const idBuoiHoc = `${idKhoaHoc}-${seq}-${idTinhChat}`;

    return NextResponse.json({ idBuoiHoc });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
