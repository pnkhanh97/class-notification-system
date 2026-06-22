import { NextResponse } from 'next/server';
import { getScheduleRows, getStaffMap, getCourseMap, markEmailSent } from '@/lib/sheets';
import { buildSubject, buildHtmlEmail, buildPlainEmail, sendMail } from '@/lib/email';
import { parseEnumList, unique, normalizeEmail } from '@/lib/schedule-utils';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // rowNumbers: number[] — nếu trống thì gửi tất cả chưa gửi
    const targetRows: number[] = body.rowNumbers ?? [];

    const [scheduleRows, staffMap, courseMap] = await Promise.all([
      getScheduleRows(),
      getStaffMap(),
      getCourseMap(),
    ]);

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
        const isInviteOnly = !!row.idBuoiHocChiTiet && row.idBuoiHocChiTiet.endsWith('-0');

        const mailData = {
          idKhoaHoc: row.idKhoaHoc,
          tenKhoaHoc: courseLabel,
          idBuoiHoc: row.idBuoiHoc,
          idBuoiHocChiTiet: row.idBuoiHocChiTiet,
          idCaHoc: row.idCaHoc,
          ghiChuCaHoc: row.ghiChuCaHoc,
          thoiGianHoc: row.ngayHoc,
          hocPhan: row.hocPhan,
          noiDungHoc: row.noiDungHoc,
          tinhChat: row.tinhChat,
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
