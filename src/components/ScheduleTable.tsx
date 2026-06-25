'use client';

import { useState } from 'react';

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

type Props = {
  rows: ScheduleRow[];
  shiftsMap: Record<string, string>; // key: Ca học value, label: Ca học - Giờ học
  onSendEmail: (rowNumbers: number[]) => Promise<void>;
  onRefresh: () => void;
};

export default function ScheduleTable({ rows, shiftsMap, onSendEmail, onRefresh }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [sending, setSending] = useState(false);
  const [sendAll, setSendAllLoading] = useState(false);
  const [filter, setFilter] = useState('');

  const filtered = rows.filter(r => {
    const q = filter.toLowerCase();
    return (
      !q ||
      r.idBuoiHoc.toLowerCase().includes(q) ||
      r.ngayHoc.toLowerCase().includes(q) ||
      r.noiDungHoc.toLowerCase().includes(q) ||
      r.giaoVien.toLowerCase().includes(q) ||
      r.hocVien.toLowerCase().includes(q)
    );
  });

  const toggleRow = (rn: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(rn) ? next.delete(rn) : next.add(rn);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(r => r.rowNumber)));
    }
  };

  const handleSendSelected = async () => {
    if (!selected.size) return;
    setSending(true);
    try {
      await onSendEmail(Array.from(selected));
      setSelected(new Set());
      onRefresh();
    } finally {
      setSending(false);
    }
  };

  const handleSendAll = async () => {
    setSendAllLoading(true);
    try {
      await onSendEmail([]);
      onRefresh();
    } finally {
      setSendAllLoading(false);
    }
  };

  const unsent = rows.filter(r => !r.emailSent).length;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <input
          type="text"
          placeholder="Tìm kiếm buổi học, giáo viên, học viên..."
          value={filter}
          onChange={e => setFilter(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-72 focus:outline-none focus:ring-2 focus:ring-[#03A680]"
        />
        <div className="flex gap-2">
          {selected.size > 0 && (
            <button
              onClick={handleSendSelected}
              disabled={sending}
              className="bg-[#03A680] hover:bg-[#028a6a] disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
            >
              {sending ? 'Đang gửi...' : `Gửi email (${selected.size} buổi)`}
            </button>
          )}
          <button
            onClick={handleSendAll}
            disabled={sendAll || unsent === 0}
            className="bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-sm px-4 py-2 rounded-lg transition-colors"
          >
            {sendAll ? 'Đang gửi...' : `Gửi tất cả chưa gửi (${unsent})`}
          </button>
          <button
            onClick={onRefresh}
            className="border border-gray-300 text-gray-600 hover:bg-gray-100 text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Làm mới
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-3 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={filtered.length > 0 && selected.size === filtered.length}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">ID Buổi học Chi tiết</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Ca học</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Nội dung</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Giáo viên</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Học viên</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Meet</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-3 py-3 text-left font-semibold text-gray-700"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-8 text-center text-gray-400">Không có dữ liệu</td>
              </tr>
            )}
            {filtered.map(row => (
              <tr key={row.rowNumber} className={`hover:bg-gray-50 transition-colors ${selected.has(row.rowNumber) ? 'bg-teal-50' : ''}`}>
                <td className="px-3 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(row.rowNumber)}
                    onChange={() => toggleRow(row.rowNumber)}
                    className="rounded"
                  />
                </td>
                <td className="px-3 py-3 font-mono text-xs">
                  <a href={`/schedule/${row.rowNumber}/view`}
                     className="text-[#03A680] hover:underline">
                    {row.idBuoiHocChiTiet || row.idBuoiHoc}
                  </a>
                </td>
                <td className="px-3 py-3 text-xs text-gray-600">
                  {row.idCaHoc ? ((shiftsMap ?? {})[row.idCaHoc] ?? row.idCaHoc) : '—'}
                </td>
                <td className="px-3 py-3 max-w-[200px] truncate text-gray-800">{row.noiDungHoc}</td>
                <td className="px-3 py-3 text-xs text-gray-600">{row.giaoVien}</td>
                <td className="px-3 py-3 text-xs text-gray-600">
                  {[row.hocVien, row.hocVienDangKy]
                    .flatMap(v => (v ? v.split(',').map(s => s.trim()) : []))
                    .filter((v, i, a) => v && a.indexOf(v) === i)
                    .join(', ')}
                </td>
                <td className="px-3 py-3">
                  {row.meetLink ? (
                    <a href={row.meetLink} target="_blank" rel="noopener noreferrer"
                       className="text-[#03A680] hover:underline text-xs">Link</a>
                  ) : (
                    <span className="text-gray-300 text-xs">—</span>
                  )}
                </td>
                <td className="px-3 py-3">
                  {row.emailSent ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 rounded-full px-2 py-0.5">
                      ✓ Đã gửi
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-700 bg-amber-50 rounded-full px-2 py-0.5">
                      Chưa gửi
                    </span>
                  )}
                </td>
                <td className="px-3 py-3">
                  <a href={`/schedule/${row.rowNumber}`}
                     className="text-xs text-gray-500 hover:text-[#03A680] transition-colors">
                    Sửa
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
