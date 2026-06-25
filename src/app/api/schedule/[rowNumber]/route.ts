import { NextResponse } from 'next/server';
import { getScheduleRows, getSheetData, updateRow } from '@/lib/sheets';
import { SCHEDULE_SHEET } from '@/lib/constants';

export async function PUT(req: Request, { params }: { params: Promise<{ rowNumber: string }> }) {
  try {
    const { rowNumber } = await params;
    const rn = parseInt(rowNumber);
    const body = await req.json();

    const rows = await getScheduleRows();
    const existing = rows.find(r => r.rowNumber === rn);
    const stt = rn - 1; // row 2 = STT 1

    const values = [
      stt,
      body.idKhoaHoc        ?? '',
      body.idBuoiHoc        ?? '',
      body.idBuoiHocChiTiet ?? '',
      body.ngayHoc          ?? '',
      body.idNganh          ?? '',
      body.hocPhan          ?? '',
      body.noiDungHoc       ?? '',
      body.maKhoa           ?? '',
      body.idCaHoc          ?? '',
      body.ghiChuCaHoc      ?? '',
      body.idQuyMo          ?? '',
      body.giaoVien         ?? '',
      body.doiTuongHoc      ?? '',
      body.hocVien          ?? '',
      body.hocVienDangKy    ?? '',
      body.idTinhChat       ?? '',
      body.idDiaChi         ?? '',
      body.meetLink         ?? '',
      '',  // ParticipantsProcessed — giữ nguyên
      existing?.emailSent ?? '',
    ];

    await updateRow(SCHEDULE_SHEET, rn, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
