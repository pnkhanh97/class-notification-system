import { NextResponse } from 'next/server';
import { getScheduleRows, appendRow } from '@/lib/sheets';
import { SCHEDULE_SHEET } from '@/lib/constants';

export async function GET() {
  try {
    const rows = await getScheduleRows();
    return NextResponse.json({ rows });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const values = [
      body.idKhoaHoc ?? '',
      body.idBuoiHoc ?? '',
      body.idBuoiHocChiTiet ?? '',
      body.idCaHoc ?? '',
      body.ghiChuCaHoc ?? '',
      body.ngayHoc ?? '',
      body.hocPhan ?? '',
      body.noiDungHoc ?? '',
      body.tinhChat ?? '',
      body.giaoVien ?? '',
      body.hocVien ?? '',
      body.hocVienDangKy ?? '',
      body.meetLink ?? '',
      '', // EmailSent — trống khi tạo mới
    ];
    await appendRow(SCHEDULE_SHEET, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
