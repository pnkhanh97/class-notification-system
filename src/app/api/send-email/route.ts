import { NextResponse } from 'next/server';
import { getScheduleRows, getStaffMap, getCourseMap, markEmailSent, getSheetData } from '@/lib/sheets';
import { buildSubject, buildHtmlEmail, buildPlainEmail, sendMail } from '@/lib/email';
import { parseEnumList, unique, normalizeEmail } from '@/lib/schedule-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // rowNumbers: number[] — nếu trống thì gửi tất cả chưa gửi
    const targetRows: number[] = body.rowNumbers ?? [];

    const [scheduleRows, staffMap, courseMap, facetsData, shiftsData] = await Promise.all([
      getScheduleRows(),
      getStaffMap(),
      getCourseMap(),
      getSheetData('facets'),
      getSheetData('shifts'),
    ]);

    // Map: Mã tính chất → Tính chất (VD: "A" → "Lý thuyết")
    const facetMap: Record<string, string> = {};
    if (facetsData.length > 1) {
      const h = facetsData[0];
      const maIdx  = h.indexOf('Mã tính chất');
      const tenIdx = h.indexOf('Tính chất');
      facetsData.slice(1).forEach(row => {
        const ma  = String(row[maIdx]  ?? '').trim();
        const ten = String(row[tenIdx] ?? '').trim();
        if (ma) facetMap[ma] = ten;
      });
    }

    // Map: Ca học key → Ca học - Giờ học (VD: "1" → "Ca 1 - 08-10:00")
    const shiftMap: Record<string, string> = {};
    if (shiftsData.length > 1) {
      const h = shiftsData[0];
      const keyIdx   = h.indexOf('Ca học');
      const labelIdx = h.indexOf('Ca học - Giờ học');
      shiftsData.slice(1).forEach(row => {
        const key   = String(row[keyIdx]   ?? '').trim();
        const label = String(row[labelIdx] ?? '').trim();
        if (key) shiftMap[key] = label;
      });
    }

    const toProcess = scheduleRows.filter(r => {
      if (!r.idBuoiHoc) return false;
      if (targetRows.length > 0) return targetRows.includes(r.rowNumber);
      return !r.emailSent; // gửi tất cả chưa gửi
    });

    const results: { rowNumber: number; status: string; recipients?: string[]; error?: string }[] = [];

    for (const row of toProcess) {
      try {
        const giaoVienIds = parseEnumList(row.giaoVien);
        const hocVienIds = unique([...parseEnumList(row.hocVien), ...parseEnumList(row.hocVienDangKy)]);
        const allIds = unique([...giaoVienIds, ...hocVienIds]);

        const recipients = unique(
          allIds.map(id => normalizeEmail(staffMap[id]?.email ?? '')).filter(Boolean)
        );

        if (!recipients.length) {
          results.push({ rowNumber: row.rowNumber, status: 'skipped', error: 'Không có email hợp lệ' });
          continue;
        }

        const courseLabel = courseMap[row.idKhoaHoc]?.courseLabel ?? row.idKhoaHoc;
        const isInviteOnly = !row.idCaHoc;

        const mailData = {
          idKhoaHoc: row.idKhoaHoc,
          tenKhoaHoc: courseLabel,
          idBuoiHoc: row.idBuoiHoc,
          idBuoiHocChiTiet: row.idBuoiHocChiTiet,
          idCaHoc: shiftMap[row.idCaHoc] ?? row.idCaHoc,
          ghiChuCaHoc: row.ghiChuCaHoc,
          thoiGianHoc: row.ngayHoc,
          hocPhan: row.hocPhan,
          noiDungHoc: row.noiDungHoc,
          tinhChat: facetMap[row.idTinhChat] ?? row.idTinhChat,
          giaoVienNames: giaoVienIds.map(id => staffMap[id]?.staffName ?? id).filter(Boolean),
          hocVienNames: hocVienIds.map(id => staffMap[id]?.staffName ?? id).filter(Boolean),
          meetLink: row.meetLink,
          isInviteOnly,
        };

        await sendMail(recipients, buildSubject(mailData), buildHtmlEmail(mailData), buildPlainEmail(mailData));
        await markEmailSent(row.rowNumber);

        results.push({ rowNumber: row.rowNumber, status: 'sent', recipients });
      } catch (err) {
        results.push({ rowNumber: row.rowNumber, status: 'error', error: String(err) });
      }
    }

    return NextResponse.json({ results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
