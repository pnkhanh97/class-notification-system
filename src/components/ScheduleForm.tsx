'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SingleSelect from './SingleSelect';
import MultiSelect from './MultiSelect';

type Option = { value: string; label: string; level?: string };
type CourseMeta = { maNganh: string; maKhoa: string; khuVuc: string };

type Options = {
  facets: Option[];
  shifts: Option[];
  address: Option[];
  courses: Option[];
  courseMeta: Record<string, CourseMeta>;
  staff: Option[];        // có field level
  staffFull?: Option[];   // alias
  levels: Option[];
  hocPhan: Option[];
  lessonsMap: Record<string, string[]>;
};

type FormData = {
  idKhoaHoc: string;
  idBuoiHoc: string;
  idBuoiHocChiTiet: string;   // auto-computed
  ngayHoc: string;
  idNganh: string;            // auto from idKhoaHoc
  hocPhan: string;            // smart default
  noiDungHoc: string;
  maKhoa: string;             // auto from idKhoaHoc
  idCaHoc: string;
  ghiChuCaHoc: string;
  idQuyMo: string;            // auto from idKhoaHoc → khuVuc
  giaoVien: string;           // smart default
  doiTuongHoc: string;        // multi-select Level
  hocVien: string;
  hocVienDangKy: string;
  idTinhChat: string;         // smart default
  idDiaChi: string;
  meetLink: string;
};

type Props = {
  initial?: Partial<FormData>;
  rowNumber?: number;
  mode: 'create' | 'edit';
};

const EMPTY: FormData = {
  idKhoaHoc: '', idBuoiHoc: '', idBuoiHocChiTiet: '',
  ngayHoc: '', idNganh: '', hocPhan: '', noiDungHoc: '',
  maKhoa: '', idCaHoc: '', ghiChuCaHoc: '', idQuyMo: '',
  giaoVien: '', doiTuongHoc: '', hocVien: '', hocVienDangKy: '',
  idTinhChat: '', idDiaChi: '', meetLink: '',
};

const EMPTY_OPTS: Options = {
  facets: [], shifts: [], address: [], courses: [],
  courseMeta: {}, staff: [], levels: [], hocPhan: [], lessonsMap: {},
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {hint && <span className="ml-2 text-xs font-normal text-gray-400">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function ReadOnly({ value, placeholder }: { value: string; placeholder?: string }) {
  return (
    <div className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-600 min-h-[38px]">
      {value || <span className="text-gray-300">{placeholder ?? '—'}</span>}
    </div>
  );
}

const inputCls = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#03A680]';

export default function ScheduleForm({ initial, rowNumber, mode }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormData>({ ...EMPTY, ...initial });
  const [opts, setOpts] = useState<Options>(EMPTY_OPTS);
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  const [loadingId, setLoadingId] = useState(false);
  const [buoiHocMode, setBuoiHocMode] = useState<'auto' | 'lookup'>('auto');
  const [existingIds, setExistingIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Load dropdown options
  useEffect(() => {
    fetch('/api/options').then(r => r.json()).then(d => {
      if (d.courses) setOpts(d);
    });
  }, []);

  // Auto-compute ID Buổi học Chi tiết khi idBuoiHoc hoặc idCaHoc thay đổi
  useEffect(() => {
    const caVal = form.idCaHoc || '';
    const computed = form.idBuoiHoc
      ? form.idBuoiHoc + (caVal ? caVal : '0')
      : '';
    setForm(prev => ({ ...prev, idBuoiHocChiTiet: computed }));
  }, [form.idBuoiHoc, form.idCaHoc]);

  // Auto-compute idNganh, maKhoa, idQuyMo khi idKhoaHoc thay đổi
  useEffect(() => {
    const meta = opts.courseMeta[form.idKhoaHoc];
    if (meta) {
      setForm(prev => ({
        ...prev,
        idNganh: meta.maNganh,
        maKhoa: meta.maKhoa,
        idQuyMo: meta.khuVuc,
      }));
    }
  }, [form.idKhoaHoc, opts.courseMeta]);

  // Auto-compute ID Buổi học khi idKhoaHoc + idTinhChat đều có giá trị (chỉ create mode)
  const computeBuoiHoc = useCallback(async (idKhoaHoc: string, idTinhChat: string) => {
    if (!idKhoaHoc || !idTinhChat || mode === 'edit') return;
    setLoadingId(true);
    try {
      const res = await fetch(
        `/api/compute-buoi-hoc?idKhoaHoc=${encodeURIComponent(idKhoaHoc)}&idTinhChat=${encodeURIComponent(idTinhChat)}`
      );
      const d = await res.json();
      if (d.idBuoiHoc) setForm(prev => ({ ...prev, idBuoiHoc: d.idBuoiHoc }));
    } finally {
      setLoadingId(false);
    }
  }, [mode]);

  // Fetch smart defaults khi idKhoaHoc thay đổi (chỉ create mode)
  const fetchDefaults = useCallback(async (idKhoaHoc: string) => {
    if (!idKhoaHoc || mode === 'edit') return;
    setLoadingDefaults(true);
    try {
      const res = await fetch(`/api/defaults?idKhoaHoc=${encodeURIComponent(idKhoaHoc)}`);
      const d = await res.json();
      setForm(prev => ({
        ...prev,
        hocPhan:     d.hocPhan     || prev.hocPhan,
        giaoVien:    d.giaoVien    || prev.giaoVien,
        idTinhChat:  d.tinhChat    || prev.idTinhChat,
        noiDungHoc:  d.noiDungHoc  || prev.noiDungHoc,
        doiTuongHoc: d.doiTuongHoc || prev.doiTuongHoc,
        idDiaChi:    d.diaChi      || prev.idDiaChi,
      }));
    } finally {
      setLoadingDefaults(false);
    }
  }, [mode]);

  const set = (key: keyof FormData) => (val: string) =>
    setForm(prev => ({ ...prev, [key]: val }));

  const setE = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    set(key)(e.target.value);

  const handleKhoaHocChange = (val: string) => {
    set('idKhoaHoc')(val);
    fetchDefaults(val);
    if (form.idTinhChat) computeBuoiHoc(val, form.idTinhChat);
  };

  const handleTinhChatChange = (val: string) => {
    set('idTinhChat')(val);
    if (form.idKhoaHoc) computeBuoiHoc(form.idKhoaHoc, val);
  };

  const fetchExistingIds = useCallback(async (idKhoaHoc: string) => {
    const url = idKhoaHoc
      ? `/api/buoi-hoc-list?idKhoaHoc=${encodeURIComponent(idKhoaHoc)}`
      : '/api/buoi-hoc-list';
    const res = await fetch(url);
    const d = await res.json();
    setExistingIds(d.ids ?? []);
  }, []);

  const handleBuoiHocModeChange = (mode: 'auto' | 'lookup') => {
    setBuoiHocMode(mode);
    if (mode === 'lookup') {
      fetchExistingIds(''); // lấy toàn bộ, không lọc theo khoá học
    } else {
      // Quay về auto → tính lại
      if (form.idKhoaHoc && form.idTinhChat) computeBuoiHoc(form.idKhoaHoc, form.idTinhChat);
    }
  };

  const handleDoiTuongChange = (val: string) => {
    // Khi đổi Đối tượng học → clear Học viên vì danh sách hợp lệ thay đổi
    setForm(prev => ({ ...prev, doiTuongHoc: val, hocVien: '' }));
  };

  const handleHocPhanChange = (val: string) => {
    // Khi đổi Học phần → clear Nội dung học vì options thay đổi
    setForm(prev => ({ ...prev, hocPhan: val, noiDungHoc: '' }));
  };

  // Lọc staff theo Đối tượng học đã chọn
  const selectedLevels = form.doiTuongHoc
    ? form.doiTuongHoc.split(',').map(s => s.trim()).filter(Boolean)
    : [];

  // staff options cần Level từ sheet — ta cần lưu thêm level vào option
  // opts.staff hiện tại chỉ có value/label, cần thêm level để filter
  // Giải pháp: filter qua opts.staffFull nếu có, fallback toàn bộ
  const hocVienOpts: Option[] = selectedLevels.length === 0
    ? opts.staff
    : opts.staff.filter(s => selectedLevels.includes(s.level ?? ''));

  const noiDungOpts: Option[] = form.hocPhan
    ? (opts.lessonsMap[form.hocPhan] ?? []).map(v => ({ value: v, label: v }))
    : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.idBuoiHoc.trim()) { setError('ID Buổi học là bắt buộc'); return; }
    setSaving(true);
    setError('');
    try {
      const url = mode === 'create' ? '/api/schedule' : `/api/schedule/${rowNumber}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
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

      {/* === Khoá học === */}
      <Field label="ID Khoá học">
        <SingleSelect value={form.idKhoaHoc} onChange={handleKhoaHocChange}
          options={opts.courses} placeholder="-- Chọn khoá học --" />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="ID Ngành" hint="tự động">
          <ReadOnly value={form.idNganh} placeholder="Chọn khoá học trước" />
        </Field>
        <Field label="Mã khoá" hint="tự động">
          <ReadOnly value={form.maKhoa} placeholder="Chọn khoá học trước" />
        </Field>
      </div>

      {/* === Buổi học === */}
      <Field label="ID Tính chất" hint={loadingDefaults ? 'đang tải...' : 'smart default'}>
        <SingleSelect value={form.idTinhChat} onChange={handleTinhChatChange}
          options={opts.facets} placeholder="-- Chọn tính chất --" />
      </Field>

      <Field label="ID Buổi học">
        {mode === 'edit' ? (
          <input type="text" value={form.idBuoiHoc} onChange={setE('idBuoiHoc')} className={inputCls} />
        ) : (
          <div className="space-y-2">
            {/* Toggle */}
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
              {(['auto', 'lookup'] as const).map(m => (
                <button key={m} type="button"
                  onClick={() => handleBuoiHocModeChange(m)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                    buoiHocMode === m
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}>
                  {m === 'auto' ? 'Tự động' : 'Chọn có sẵn'}
                </button>
              ))}
            </div>

            {buoiHocMode === 'auto' ? (
              <ReadOnly
                value={loadingId ? 'Đang tính...' : form.idBuoiHoc}
                placeholder="Chọn Khoá học + Tính chất trước"
              />
            ) : (
              <SingleSelect
                value={form.idBuoiHoc}
                onChange={set('idBuoiHoc')}
                options={existingIds.map(id => ({ value: id, label: id }))}
                placeholder={existingIds.length ? '-- Chọn ID Buổi học --' : 'Không có dữ liệu'}
              />
            )}
          </div>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="ID Ca học">
          <SingleSelect value={form.idCaHoc} onChange={set('idCaHoc')}
            options={opts.shifts} placeholder="-- Không có ca --" />
        </Field>
        <Field label="ID Buổi học Chi tiết" hint="tự động">
          <ReadOnly value={form.idBuoiHocChiTiet} placeholder="Điền ID Buổi học trước" />
        </Field>
      </div>

      <Field label="Ghi chú ca học">
        <textarea value={form.ghiChuCaHoc} onChange={setE('ghiChuCaHoc')} rows={2} className={inputCls} />
      </Field>

      <Field label="Ngày học">
        <textarea value={form.ngayHoc} onChange={setE('ngayHoc')} rows={3}
          placeholder={'VD: 08:00 - 10:00\n25/06/2026'} className={inputCls} />
      </Field>

      {/* === Nội dung === */}
      <Field label="Học phần" hint={loadingDefaults ? 'đang tải...' : 'smart default'}>
        <SingleSelect value={form.hocPhan} onChange={handleHocPhanChange}
          options={opts.hocPhan} placeholder="-- Chọn học phần --" />
      </Field>

      <Field label="Nội dung học" hint={!form.hocPhan ? 'chọn Học phần trước' : `${noiDungOpts.length} tuỳ chọn`}>
        {form.hocPhan ? (
          <MultiSelect value={form.noiDungHoc} onChange={set('noiDungHoc')}
            options={noiDungOpts} placeholder="-- Chọn nội dung học --" />
        ) : (
          <ReadOnly value="" placeholder="Chọn Học phần trước" />
        )}
      </Field>

      {/* === Người tham gia === */}
      <Field label="Giáo viên" hint={loadingDefaults ? 'đang tải...' : 'smart default'}>
        <MultiSelect value={form.giaoVien} onChange={set('giaoVien')}
          options={opts.staff} placeholder="-- Chọn giáo viên --" />
      </Field>

      <Field label="Đối tượng học" hint="multi-select">
        <MultiSelect value={form.doiTuongHoc} onChange={handleDoiTuongChange}
          options={opts.levels} placeholder="-- Chọn đối tượng --" />
      </Field>

      <Field label="Học viên" hint={selectedLevels.length ? `lọc theo ${selectedLevels.join(', ')}` : 'toàn bộ staff'}>
        <MultiSelect value={form.hocVien} onChange={set('hocVien')}
          options={hocVienOpts} placeholder="-- Chọn học viên --" />
      </Field>

      <Field label="Học viên đã đăng ký">
        <MultiSelect value={form.hocVienDangKy} onChange={set('hocVienDangKy')}
          options={opts.staff} placeholder="-- Chọn học viên đã đăng ký --" />
      </Field>

      {/* === Địa điểm & Meet === */}
      <div className="grid grid-cols-2 gap-4">
        <Field label="ID Quy mô" hint="tự động từ khoá học">
          <ReadOnly value={form.idQuyMo} placeholder="Chọn khoá học trước" />
        </Field>
        <Field label="ID Địa chỉ" hint={loadingDefaults ? 'đang tải...' : 'smart default'}>
          <SingleSelect value={form.idDiaChi} onChange={set('idDiaChi')}
            options={opts.address} placeholder="-- Chọn địa chỉ --" />
        </Field>
      </div>

      <Field label="MeetLink">
        <input type="text" value={form.meetLink} onChange={setE('meetLink')}
          placeholder="https://meet.google.com/..." className={inputCls} />
      </Field>

      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="submit" disabled={saving}
          className="bg-[#03A680] hover:bg-[#028a6a] disabled:opacity-50 text-white px-6 py-2 rounded-lg text-sm font-medium transition-colors">
          {saving ? 'Đang lưu...' : mode === 'create' ? 'Tạo lịch học' : 'Lưu thay đổi'}
        </button>
        <button type="button" onClick={() => router.push('/')}
          className="border border-gray-300 text-gray-600 hover:bg-gray-100 px-6 py-2 rounded-lg text-sm transition-colors">
          Huỷ
        </button>
      </div>
    </form>
  );
}
