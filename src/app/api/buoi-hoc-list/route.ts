import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idKhoaHoc = searchParams.get('idKhoaHoc') ?? '';

    const data = await getSheetData('Schedule');
    if (data.length < 2) return NextResponse.json({ ids: [] });

    const h = data[0];
    const idxKhoa    = h.indexOf('ID Khoá học');
    const idxBuoiHoc = h.indexOf('ID Buổi học');

    const ids = Array.from(new Set(
      data.slice(1)
        .filter(r => {
          const khoa = String(r[idxKhoa] ?? '').trim();
          const id   = String(r[idxBuoiHoc] ?? '').trim();
          return id && (!idKhoaHoc || khoa === idKhoaHoc);
        })
        .map(r => String(r[idxBuoiHoc]).trim())
    ));

    return NextResponse.json({ ids });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
