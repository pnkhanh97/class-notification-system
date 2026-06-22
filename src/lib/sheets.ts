import { google } from 'googleapis';
import { SCHEDULE_SHEET, STAFF_SHEET, COURSES_SHEET } from './constants';

function getAuth() {
  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

function getSheetsClient() {
  return google.sheets({ version: 'v4', auth: getAuth() });
}

const SPREADSHEET_ID = process.env.GOOGLE_SPREADSHEET_ID!;

export async function getSheetData(sheetName: string): Promise<string[][]> {
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
  });
  return (res.data.values as string[][]) || [];
}

export async function appendRow(sheetName: string, values: unknown[]): Promise<void> {
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: sheetName,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

export async function updateCell(
  sheetName: string,
  rowNumber: number,
  colNumber: number,
  value: unknown
): Promise<void> {
  const sheets = getSheetsClient();
  const col = columnToLetter(colNumber);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!${col}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [[value]] },
  });
}

export async function updateRow(
  sheetName: string,
  rowNumber: number,
  values: unknown[]
): Promise<void> {
  const sheets = getSheetsClient();
  const endCol = columnToLetter(values.length);
  await sheets.spreadsheets.values.update({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A${rowNumber}:${endCol}${rowNumber}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [values] },
  });
}

function columnToLetter(col: number): string {
  let letter = '';
  while (col > 0) {
    const mod = (col - 1) % 26;
    letter = String.fromCharCode(65 + mod) + letter;
    col = Math.floor((col - 1) / 26);
  }
  return letter;
}

export type ScheduleRow = {
  rowNumber: number;
  idKhoaHoc: string;
  idBuoiHoc: string;
  idBuoiHocChiTiet: string;
  idCaHoc: string;
  ghiChuCaHoc: string;
  ngayHoc: string;
  hocPhan: string;
  noiDungHoc: string;
  tinhChat: string;
  giaoVien: string;
  hocVien: string;
  hocVienDangKy: string;
  meetLink: string;
  emailSent: string;
};

export type StaffRow = {
  staffId: string;
  staffName: string;
  email: string;
};

export type CourseRow = {
  rowKey: string;
  courseLabel: string;
};

function idxOf(headers: string[], name: string): number {
  return headers.indexOf(name);
}

function cell(row: string[], idx: number): string {
  return idx >= 0 && idx < row.length ? String(row[idx] ?? '').trim() : '';
}

export async function getScheduleRows(): Promise<ScheduleRow[]> {
  const data = await getSheetData(SCHEDULE_SHEET);
  if (data.length < 2) return [];
  const h = data[0];
  return data.slice(1).map((row, i) => ({
    rowNumber: i + 2,
    idKhoaHoc: cell(row, idxOf(h, 'ID Khoá học')),
    idBuoiHoc: cell(row, idxOf(h, 'ID Buổi học')),
    idBuoiHocChiTiet: cell(row, idxOf(h, 'ID Buổi học Chi tiết')),
    idCaHoc: cell(row, idxOf(h, 'ID Ca học')),
    ghiChuCaHoc: cell(row, idxOf(h, 'Ghi chú ca học')),
    ngayHoc: cell(row, idxOf(h, 'Ngày học')),
    hocPhan: cell(row, idxOf(h, 'Học phần')),
    noiDungHoc: cell(row, idxOf(h, 'Nội dung học')),
    tinhChat: cell(row, idxOf(h, 'Tính chất')),
    giaoVien: cell(row, idxOf(h, 'Giáo viên')),
    hocVien: cell(row, idxOf(h, 'Học viên')),
    hocVienDangKy: cell(row, idxOf(h, 'Học viên đã đăng ký')),
    meetLink: cell(row, idxOf(h, 'MeetLink')),
    emailSent: cell(row, idxOf(h, 'EmailSent')),
  }));
}

export async function getScheduleHeaders(): Promise<string[]> {
  const data = await getSheetData(SCHEDULE_SHEET);
  return data[0] || [];
}

export async function getStaffMap(): Promise<Record<string, StaffRow>> {
  const data = await getSheetData(STAFF_SHEET);
  if (data.length < 2) return {};
  const h = data[0];
  const map: Record<string, StaffRow> = {};
  data.slice(1).forEach(row => {
    const id = cell(row, idxOf(h, 'StaffID'));
    if (id) {
      map[id] = {
        staffId: id,
        staffName: cell(row, idxOf(h, 'Staff')),
        email: cell(row, idxOf(h, 'Email')),
      };
    }
  });
  return map;
}

export async function getCourseMap(): Promise<Record<string, CourseRow>> {
  const data = await getSheetData(COURSES_SHEET);
  if (data.length < 2) return {};
  const h = data[0];
  const map: Record<string, CourseRow> = {};
  data.slice(1).forEach(row => {
    const key = cell(row, idxOf(h, 'Rowkey'));
    if (key) {
      map[key] = {
        rowKey: key,
        courseLabel: cell(row, idxOf(h, 'ID Khoá học')),
      };
    }
  });
  return map;
}

export async function markEmailSent(rowNumber: number): Promise<void> {
  const headers = await getScheduleHeaders();
  const col = headers.indexOf('EmailSent') + 1;
  if (col > 0) {
    const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });
    await updateCell(SCHEDULE_SHEET, rowNumber, col, now);
  }
}
