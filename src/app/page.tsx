'use client';

import { useEffect, useState, useCallback } from 'react';
import ScheduleTable from '@/components/ScheduleTable';

type ScheduleRow = {
  rowNumber: number;
  idKhoaHoc: string;
  idBuoiHoc: string;
  idBuoiHocChiTiet: string;
  idCaHoc: string;
  ngayHoc: string;
  noiDungHoc: string;
  giaoVien: string;
  hocVien: string;
  hocVienDangKy: string;
  meetLink: string;
  emailSent: string;
};

type SendResult = {
  rowNumber: number;
  status: string;
  recipients?: string[];
  error?: string;
};

export default function DashboardPage() {
  const [rows, setRows] = useState<ScheduleRow[]>([]);
  const [shiftsMap, setShiftsMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const fetchRows = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [scheduleRes, optsRes] = await Promise.all([
        fetch('/api/schedule'),
        fetch('/api/options'),
      ]);
      const scheduleData = await scheduleRes.json();
      const optsData = await optsRes.json();
      if (!scheduleRes.ok) throw new Error(scheduleData.error);
      setRows(scheduleData.rows);
      // shifts: [{ value: "1", label: "Ca 1 - 08-10:00" }, ...]
      const map: Record<string, string> = {};
      (optsData.shifts ?? []).forEach((s: { value: string; label: string }) => {
        map[s.value] = s.label;
      });
      setShiftsMap(map);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRows(); }, [fetchRows]);

  const handleSendEmail = async (rowNumbers: number[]) => {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rowNumbers }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const results: SendResult[] = data.results ?? [];
    const sent = results.filter(r => r.status === 'sent').length;
    const errors = results.filter(r => r.status === 'error').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    let msg = `Đã gửi ${sent} email.`;
    if (skipped) msg += ` Bỏ qua ${skipped} (không có email).`;
    if (errors) msg += ` Lỗi ${errors} buổi.`;
    setToast(msg);
    setTimeout(() => setToast(''), 5000);
    await fetchRows();
  };

  const total = rows.length;
  const sent = rows.filter(r => r.emailSent).length;
  const unsent = total - sent;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard lịch học</h1>
          <p className="text-gray-500 text-sm mt-1">Quản lý và gửi email thông báo buổi học</p>
        </div>
        <a href="/schedule/new"
          className="bg-[#03A680] hover:bg-[#028a6a] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + Thêm lịch học
        </a>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Tổng buổi học', value: total, color: 'text-gray-900' },
          { label: 'Đã gửi email', value: sent, color: 'text-green-700' },
          { label: 'Chưa gửi', value: unsent, color: 'text-amber-700' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-gray-200 p-4">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-sm text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}

      {loading && <p className="text-gray-400 text-sm">Đang tải dữ liệu...</p>}
      {error && <p className="text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      {!loading && !error && (
        <ScheduleTable rows={rows} shiftsMap={shiftsMap} onSendEmail={handleSendEmail} onRefresh={fetchRows} />
      )}
    </div>
  );
}
