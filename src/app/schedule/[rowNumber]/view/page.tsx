'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

type Row = {
  rowNumber: number;
  idKhoaHoc: string; idBuoiHoc: string; idBuoiHocChiTiet: string;
  ngayHoc: string; idNganh: string; hocPhan: string; noiDungHoc: string;
  maKhoa: string; idCaHoc: string; ghiChuCaHoc: string; idQuyMo: string;
  giaoVien: string; doiTuongHoc: string; hocVien: string; hocVienDangKy: string;
  idTinhChat: string; idDiaChi: string; meetLink: string; emailSent: string;
};

type Option = { value: string; label: string; level?: string };
type Opts = {
  facets: Option[]; shifts: Option[]; address: Option[];
  staff: Option[]; courseMeta: Record<string, { maNganh: string; maKhoa: string; khuVuc: string }>;
};

function toMap(opts: Option[]): Record<string, string> {
  const m: Record<string, string> = {};
  opts.forEach(o => { m[o.value] = o.label; });
  return m;
}

function resolveList(raw: string, map: Record<string, string>) {
  if (!raw) return '';
  return raw.split(',').map(s => s.trim()).filter(Boolean)
    .map(id => map[id] ?? id).join(', ');
}

function InfoRow({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="grid grid-cols-[180px_1fr] gap-3 py-3 border-b border-gray-100 last:border-0">
      <dt className="text-sm font-semibold text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 whitespace-pre-line">{value}</dd>
    </div>
  );
}

export default function ViewSchedulePage() {
  const { rowNumber } = useParams<{ rowNumber: string }>();
  const [row, setRow] = useState<Row | null>(null);
  const [opts, setOpts] = useState<Opts | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([fetch('/api/schedule'), fetch('/api/options')])
      .then(([r1, r2]) => Promise.all([r1.json(), r2.json()]))
      .then(([scheduleData, optsData]) => {
        const found = scheduleData.rows?.find((r: Row) => r.rowNumber === parseInt(rowNumber));
        if (!found) { setError('Không tìm thấy buổi học'); return; }
        setRow(found);
        setOpts(optsData);
      })
      .catch(err => setError(String(err)));
  }, [rowNumber]);

  if (error) return <p className="text-red-600 text-sm">{error}</p>;
  if (!row || !opts) return <p className="text-gray-400 text-sm">Đang tải...</p>;

  const facetMap   = toMap(opts.facets);
  const shiftMap   = toMap(opts.shifts);
  const addressMap = toMap(opts.address);
  const staffMap   = toMap(opts.staff);

  const sections = [
    {
      title: 'Thông tin khoá học',
      fields: [
        { label: 'ID Khoá học', value: row.idKhoaHoc },
        { label: 'ID Ngành',    value: row.idNganh },
        { label: 'Mã khoá',    value: row.maKhoa },
      ],
    },
    {
      title: 'Thông tin buổi học',
      fields: [
        { label: 'ID Buổi học',          value: row.idBuoiHoc },
        { label: 'ID Buổi học Chi tiết', value: row.idBuoiHocChiTiet },
        { label: 'Tính chất',            value: facetMap[row.idTinhChat] ?? row.idTinhChat },
        { label: 'Ca học',               value: shiftMap[row.idCaHoc] ?? row.idCaHoc },
        { label: 'Ghi chú ca học',       value: row.ghiChuCaHoc },
        { label: 'Ngày học',             value: row.ngayHoc },
        { label: 'ID Quy mô',            value: row.idQuyMo },
        { label: 'Địa chỉ',            value: addressMap[row.idDiaChi] ?? row.idDiaChi },
      ],
    },
    {
      title: 'Nội dung',
      fields: [
        { label: 'Học phần',     value: row.hocPhan },
        { label: 'Nội dung học', value: row.noiDungHoc },
      ],
    },
    {
      title: 'Người tham gia',
      fields: [
        { label: 'Giáo viên',           value: resolveList(row.giaoVien, staffMap) },
        { label: 'Đối tượng học',       value: row.doiTuongHoc },
        { label: 'Học viên',            value: resolveList(row.hocVien, staffMap) },
        { label: 'Học viên đã đăng ký', value: resolveList(row.hocVienDangKy, staffMap) },
      ],
    },
    {
      title: 'Liên kết & Trạng thái',
      fields: [
        { label: 'MeetLink',     value: row.meetLink },
        { label: 'Email đã gửi', value: row.emailSent },
      ],
    },
  ];

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">
            <Link href="/" className="hover:text-[#03A680]">Dashboard</Link>
            {' / '}Chi tiết buổi học
          </p>
          <h1 className="text-2xl font-bold text-gray-900 font-mono">
            {row.idBuoiHocChiTiet || row.idBuoiHoc}
          </h1>
        </div>
        <Link href={`/schedule/${rowNumber}`}
          className="bg-[#03A680] hover:bg-[#028a6a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Chỉnh sửa
        </Link>
      </div>

      {row.meetLink && (
        <a href={row.meetLink} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 px-4 py-2 rounded-lg text-sm font-medium hover:bg-teal-100 transition-colors">
          Tham gia Google Meet →
        </a>
      )}

      {sections.map(section => {
        const visible = section.fields.filter(f => f.value);
        if (!visible.length) return null;
        return (
          <div key={section.title} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-sm font-semibold text-gray-700">{section.title}</h2>
            </div>
            <dl className="px-5">
              {section.fields.map(f => <InfoRow key={f.label} label={f.label} value={f.value} />)}
            </dl>
          </div>
        );
      })}

      <Link href="/" className="inline-block text-sm text-gray-400 hover:text-gray-600 transition-colors">
        ← Quay lại Dashboard
      </Link>
    </div>
  );
}
