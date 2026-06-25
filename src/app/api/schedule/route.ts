import { NextResponse } from 'next/server';
import { getScheduleRows, appendRow } from '@/lib/sheets';
import { SCHEDULE_SHEET } from '@/lib/constants';

// Thứ tự cột trong Sheet Schedule:
// STT | ID Khoá học | ID Buổi học | ID Buổi học Chi tiết | Thời gian học |
// ID Ngành | Học phần | Nội dung học | Mã khoá | ID Ca học |
// Ghi chú ca học | ID Quy mô | Giáo viên | Đối tượng học |
// Học viên | Học viên đã đăng ký | ID Tính chất | ID Địa chỉ | MeetLink |
// ParticipantsProcessed | CalendarEventID | EmailSent | Ngày tạo

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

    const existing = await getScheduleRows();
    const stt = existing.length + 1;

    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

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
      '',  // ParticipantsProcessed
      '',  // CalendarEventID
      '',  // EmailSent
      now, // Ngày tạo
    ];

    await appendRow(SCHEDULE_SHEET, values);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
