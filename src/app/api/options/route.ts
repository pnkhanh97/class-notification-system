import { NextResponse } from 'next/server';
import { getSheetData } from '@/lib/sheets';

function cell(row: string[], i: number) {
  return i >= 0 && i < row.length ? String(row[i] ?? '').trim() : '';
}

async function readSheet(sheetName: string) {
  const data = await getSheetData(sheetName);
  if (data.length < 2) return { headers: [] as string[], rows: [] as string[][] };
  return { headers: data[0], rows: data.slice(1) };
}

export async function GET() {
  try {
    const [facets, shifts, address, courseRaw, staffRaw, lessonsRaw] = await Promise.all([
      readSheet('facets'),
      readSheet('shifts'),
      readSheet('address'),
      readSheet('courseID_Input'),
      readSheet('staff'),
      readSheet('lessons'),
    ]);

    // facets → single-select Tính chất
    const facetOpts = facets.rows.map(r => {
      const h = facets.headers;
      return {
        value: cell(r, h.indexOf('Mã tính chất')),
        label: cell(r, h.indexOf('Mã tính chất - Tính chất')),
      };
    }).filter(o => o.value);

    // shifts → single-select Ca học
    const shiftOpts = shifts.rows.map(r => {
      const h = shifts.headers;
      return {
        value: cell(r, h.indexOf('Ca học')),
        label: cell(r, h.indexOf('Ca học - Giờ học')),
      };
    }).filter(o => o.value);

    // address → single-select
    const addressOpts = address.rows.map(r => {
      const h = address.headers;
      return {
        value: cell(r, h.indexOf('Mã địa chỉ')),
        label: cell(r, h.indexOf('Địa chỉ')) || cell(r, h.indexOf('Mã địa chỉ')),
      };
    }).filter(o => o.value);

    // courseID_Input → single-select + lookup map
    const h = courseRaw.headers;
    const courseOpts = courseRaw.rows.map(r => ({
      value: cell(r, h.indexOf('ID Khoá học')),
      label: cell(r, h.indexOf('ID Khoá học')),
    })).filter(o => o.value);

    // lookup map: idKhoaHoc → { maNganh, maKhoa, khuVuc }
    const courseMeta: Record<string, { maNganh: string; maKhoa: string; khuVuc: string }> = {};
    courseRaw.rows.forEach(r => {
      const id = cell(r, h.indexOf('ID Khoá học'));
      if (id) {
        courseMeta[id] = {
          maNganh: cell(r, h.indexOf('Mã ngành')),
          maKhoa: cell(r, h.indexOf('Mã khoá học')),
          khuVuc: cell(r, h.indexOf('Khu vực')),
        };
      }
    });

    // staff → multi-select Giáo viên / Học viên (kèm level để filter Học viên)
    const hs = staffRaw.headers;
    const staffOpts = staffRaw.rows.map(r => ({
      value: cell(r, hs.indexOf('StaffID')),
      label: `${cell(r, hs.indexOf('StaffID'))} – ${cell(r, hs.indexOf('Staff'))}`,
      level: cell(r, hs.indexOf('Level')),
    })).filter(o => o.value);

    // Đối tượng học → unique Level values from staff
    const levelIdx = hs.indexOf('Level');
    const levels = Array.from(
      new Set(staffRaw.rows.map(r => cell(r, levelIdx)).filter(Boolean))
    ).sort();
    const levelOpts = levels.map(l => ({ value: l, label: l }));

    // lessons → unique Học phần + map Học phần → Nội dung học[]
    const hlIdx  = lessonsRaw.headers.indexOf('Học phần');
    const ndIdx  = lessonsRaw.headers.indexOf('Nội dung học');
    const hocPhanOpts = Array.from(
      new Set(lessonsRaw.rows.map(r => cell(r, hlIdx)).filter(Boolean))
    ).map(v => ({ value: v, label: v }));

    const lessonsMap: Record<string, string[]> = {};
    lessonsRaw.rows.forEach(r => {
      const hp = cell(r, hlIdx);
      const nd = cell(r, ndIdx);
      if (hp && nd) {
        if (!lessonsMap[hp]) lessonsMap[hp] = [];
        if (!lessonsMap[hp].includes(nd)) lessonsMap[hp].push(nd);
      }
    });

    return NextResponse.json({ facets: facetOpts, shifts: shiftOpts, address: addressOpts, courses: courseOpts, courseMeta, staff: staffOpts, levels: levelOpts, hocPhan: hocPhanOpts, lessonsMap });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
