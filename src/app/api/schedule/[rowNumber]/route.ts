import { NextResponse } from 'next/server';
import { getScheduleRows, updateRow } from '@/lib/sheets';
import { SCHEDULE_SHEET } from '@/lib/constants';

export async function PUT(req: Request, { params }: { params: Promise<{ rowNumber: string }> }) {
  try {
    const { rowNumber } = await params;
    const rn = parseInt(rowNumber);
    const body = await req.json();

    // Fetch current row to preserve EmailSent
    const rows = await getScheduleRows();
    const existing = rows.find(r => r.rowNumber === rn);

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
      existing?.emailSent ?? '',
    ];
    await updateRow(SCHEDULE_SHEET, rn, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
