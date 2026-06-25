import nodemailer from 'nodemailer';
import { REGISTRATION_FORM_URL } from './constants';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export type MailData = {
  idKhoaHoc: string;
  tenKhoaHoc: string;
  idBuoiHoc: string;
  idBuoiHocChiTiet: string;
  idCaHoc: string;
  ghiChuCaHoc: string;
  thoiGianHoc: string;
  hocPhan: string;
  noiDungHoc: string;
  tinhChat: string;
  giaoVienNames: string[];
  hocVienNames: string[];
  meetLink: string;
  isInviteOnly: boolean;
};

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function multilineToHtml(value: string): string {
  return escapeHtml(value).replace(/\n/g, '<br>');
}

function enumToHtml(value: string): string {
  return value
    .split(',')
    .map(s => escapeHtml(s.trim()))
    .filter(Boolean)
    .join('<br>');
}

function enumToText(value: string): string {
  return value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => '- ' + s)
    .join('\n');
}

export function buildSubject(data: MailData): string {
  const id = data.isInviteOnly ? data.idBuoiHoc : data.idBuoiHocChiTiet;
  const parts = [id, data.noiDungHoc].filter(Boolean);
  return '[ABC Academy] ' + (parts.join(' - ') || 'Thông tin buổi học');
}

export function buildHtmlEmail(data: MailData): string {
  function row(label: string, value: string): string {
    if (!value) return '';
    return `<tr>
      <td style="padding:10px 12px;border:1px solid #d9e7e4;background:#f4fbfa;width:30%;min-width:90px;max-width:140px;font-weight:700;color:#0f172a;word-break:break-word;vertical-align:top;">${escapeHtml(label)}</td>
      <td style="padding:10px 12px;border:1px solid #d9e7e4;color:#0f172a;word-break:break-word;vertical-align:top;">${value}</td>
    </tr>`;
  }

  const meetSection = data.meetLink
    ? `<div style="text-align:center;margin:32px 0 20px 0;">
        <a href="${escapeHtml(data.meetLink)}" target="_blank"
           style="display:inline-block;background:#03A680;color:#ffffff;text-decoration:none;padding:14px 26px;border-radius:10px;font-weight:700;font-size:15px;">
           Tham gia Google Meet
        </a>
      </div>`
    : `<div style="text-align:center;margin:32px 0 20px 0;color:#64748b;font-size:14px;"><i>Meeting link chưa được tạo</i></div>`;

  const formDangKyCell = `<a href="${escapeHtml(REGISTRATION_FORM_URL)}" target="_blank"
    style="color:#03A680;text-decoration:none;font-weight:700;">Click vào đây để đăng ký buổi học</a>`;

  const idBuoiHocRow = data.isInviteOnly
    ? row('ID Buổi học', escapeHtml(data.idBuoiHoc))
    : row('ID Buổi học chi tiết', escapeHtml(data.idBuoiHocChiTiet));

  const caHocRow = !data.isInviteOnly && data.idCaHoc ? row('Ca học', escapeHtml(data.idCaHoc)) : '';
  const ghiChuRow = !data.isInviteOnly && data.ghiChuCaHoc ? row('Ghi chú ca học', multilineToHtml(data.ghiChuCaHoc)) : '';
  const formRow = data.isInviteOnly ? row('Link form đăng ký học', formDangKyCell) : '';

  return `<div style="margin:0;padding:24px;background:#f3f7f6;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #dce9e6;border-radius:16px;overflow:hidden;">
    <div style="background:#03A680;padding:28px 32px;">
      <div style="font-size:24px;font-weight:700;color:#ffffff;">ABC Academy</div>
      <div style="font-size:14px;color:#eafffb;margin-top:6px;">Thông tin buổi học</div>
    </div>
    <div style="padding:32px;">
      <p style="margin:0 0 16px 0;color:#0f172a;font-size:15px;">Xin chào Anh/Chị,</p>
      <p style="margin:0 0 24px 0;color:#334155;font-size:15px;line-height:1.6;">Dưới đây là thông tin buổi học:</p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        ${row('ID Khoá học', escapeHtml(data.tenKhoaHoc))}
        ${idBuoiHocRow}
        ${row('Thời gian học', multilineToHtml(data.thoiGianHoc))}
        ${row('Học phần', escapeHtml(data.hocPhan))}
        ${caHocRow}
        ${ghiChuRow}
        ${row('Nội dung học', enumToHtml(data.noiDungHoc))}
        ${row('Tính chất', escapeHtml(data.tinhChat))}
        ${data.giaoVienNames.length ? row('Giáo viên', escapeHtml(data.giaoVienNames.join(', '))) : ''}
        ${data.isInviteOnly ? row('Form đăng ký ca học', `<a href="${escapeHtml(REGISTRATION_FORM_URL)}" target="_blank" style="color:#03A680;text-decoration:none;font-weight:700;">Đăng ký tại đây</a>`) : ''}
        ${data.hocVienNames.length ? row('Học viên', escapeHtml(data.hocVienNames.join(', '))) : ''}
      </table>
      ${meetSection}
      <p style="margin:20px 0 0 0;color:#64748b;font-size:13px;line-height:1.6;">Email này được gửi tự động từ hệ thống đào tạo.</p>
    </div>
  </div>
</div>`;
}

export function buildPlainEmail(data: MailData): string {
  const lines = [
    'Xin chào,',
    '',
    'Dưới đây là thông tin buổi học:',
    data.tenKhoaHoc ? 'ID Khoá học: ' + data.tenKhoaHoc : '',
    data.isInviteOnly
      ? 'ID Buổi học: ' + data.idBuoiHoc
      : 'ID Buổi học chi tiết: ' + data.idBuoiHocChiTiet,
    'Thời gian học: ' + data.thoiGianHoc,
    data.hocPhan ? 'Học phần: ' + data.hocPhan : '',
    !data.isInviteOnly && data.idCaHoc ? 'Ca học: ' + data.idCaHoc : '',
    !data.isInviteOnly && data.ghiChuCaHoc ? 'Ghi chú ca học: ' + data.ghiChuCaHoc : '',
    'Nội dung học:',
    enumToText(data.noiDungHoc),
    data.tinhChat ? 'Tính chất: ' + data.tinhChat : '',
    data.giaoVienNames.length ? 'Giáo viên: ' + data.giaoVienNames.join(', ') : '',
    data.hocVienNames.length ? 'Học viên: ' + data.hocVienNames.join(', ') : '',
    '',
  ];

  if (data.isInviteOnly) lines.push('Đăng ký buổi học: ' + REGISTRATION_FORM_URL);
  lines.push(data.meetLink ? 'Tham gia Google Meet: ' + data.meetLink : 'Meeting link chưa được tạo');
  lines.push('', 'Trân trọng.', 'Hệ thống đào tạo');

  return lines.filter(Boolean).join('\n');
}

export async function sendMail(to: string[], subject: string, html: string, text: string): Promise<void> {
  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'Hệ thống đào tạo'}" <${process.env.SMTP_USER}>`,
    to: to.join(','),
    subject,
    html,
    text,
  });
}
