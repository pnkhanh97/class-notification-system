import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

function cell(row: string[], i: number) {
  return i >= 0 && i < row.length ? String(row[i] ?? '').trim() : '';
}

// Trả về smart defaults từ Schedule dựa trên idKhoaHoc
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const idKhoaHoc = searchParams.get('idKhoaHoc') ?? '';

    const data = await getSheetData('Schedule');
    if (data.length < 2) return NextResponse.json({});

    const h = data[0];
    const rows = data.slice(1);

    const idxKhoa   = h.indexOf('ID Khoá học');
    const idxHocPhan  = h.indexOf('Học phần');
    const idxGiaoVien = h.indexOf('Giáo viên');
    const idxTinhChat = h.indexOf('ID Tính chất');
    const idxNoiDung  = h.indexOf('Nội dung học');
    const idxDoiTuong = h.indexOf('Đối tượng học');
    const idxDiaChi   = h.indexOf('ID Địa chỉ');
    const idxQuyMo    = h.indexOf('ID Quy mô');

    // Tìm row đầu tiên cùng ID Khoá học có giá trị
    const pick = (colIdx: number) => {
      const found = rows.find(r => cell(r, idxKhoa) === idKhoaHoc && cell(r, colIdx));
      return found ? cell(found, colIdx) : '';
    };

    return NextResponse.json({
      hocPhan:   pick(idxHocPhan),
      giaoVien:  pick(idxGiaoVien),
      tinhChat:  pick(idxTinhChat),
      noiDungHoc: pick(idxNoiDung),
      doiTuongHoc: pick(idxDoiTuong),
      diaChi:    pick(idxDiaChi),
      quyMo:     pick(idxQuyMo),
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
