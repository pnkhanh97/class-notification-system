'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type FormData = {
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
};

type Props = {
  initial?: Partial<FormData>;
  rowNumber?: number;
  mode: 'create' | 'edit';
};

const EMPTY: FormData = {
  idKhoaHoc: '',
  idBuoiHoc: '',
  idBuoiHocChiTiet: '',
  idCaHoc: '',
  ghiChuCaHoc: '',
  ngayHoc: '',
  hocPhan: '',
  noiDungHoc: '',
  tinhChat: '',
  giaoVien: '',
  hocVien: '',
  hocVienDangKy: '',
  meetLink: '',
};

type FieldConfig = {
  key: keyof FormData;
  label: string;
  multiline?: boolean;
  placeholder?: string;
};

const FIELDS: FieldConfig[] = [
  { key: 'idKhoaHoc', label: 'ID Khoá học', placeholder: 'VD: K001' },
  { key: 'idBuoiHoc', label: 'ID Buổi học *', placeholder: 'VD: B001' },
  { key: 'idBuoiHocChiTiet', label: 'ID Buổi học Chi tiết', placeholder: 'VD: B001-C0 hoặc B001-C1' },
  { key: 'idCaHoc', label: 'ID Ca học', placeholder: 'VD: CA1' },
  { key: 'ghiChuCaHoc', label: 'Ghi chú ca học', multiline: true },
  { key: 'ngayHoc', label: 'Ngày học', multiline: true, placeholder: 'VD: 08:00 - 10:00\n25/06/2026' },
  { key: 'hocPhan', label: 'Học phần' },
  { key: 'noiDungHoc', label: 'Nội dung học', placeholder: 'Phân cách bằng dấu phẩy' },
  { key: 'tinhChat', label: 'Tính chất', placeholder: 'VD: Online, Offline' },
  { key: 'giaoVien', label: 'Giáo viên (StaffID)', placeholder: 'VD: GV001, GV002' },
  { key: 'hocVien', label: 'Học viên (StaffID)', placeholder: 'VD: HV001, HV002' },
  { key: 'hocVienDangKy', label: 'Học viên đã đăng ký', placeholder: 'VD: HV003, HV004' },
  { key: 'meetLink', label: 'MeetLink', placeholder: 'https://meet.google.com/...' },
];

export default function ScheduleForm({ initial, rowNumber, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idBuoiHoc.trim()) { setError('ID Buổi học là bắt buộc'); return; }
    setSaving(true);
    setError('');
    try {
      const url = mode === 'create' ? '/api/schedule' : `/api/schedule/${rowNumber}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      if (!res.ok) throw new Error(await res.text());
      router.push('/');
      router.refresh();
    } catch (err) {
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-w-2xl">
      {FIELDS.map(f => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1">{f.label}</label>
          {f.multiline ? (
            <textarea
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              rows={3}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680] resize-y"
            />
          ) : (
            <input
              type="text"
              value={form[f.key]}
              onChange={set(f.key)}
              placeholder={f.placeholder}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]"
            />
          )}
        </div>
      ))}

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving}
          className="bg-[#03A680] hover:bg-[#028a6a] disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo lịch học' : 'Lưu thay đổi'}
        </button>
        <button
          type="button"
          onClick={() => router.push('/')}
          className="border border-gray-300 text-gray-600 hover:bg-gray-100 px-6 py-2 rounded-lg text-sm transition-colors"
        >
          Huỷ
        </button>
      </div>
    </form>
  );
}
