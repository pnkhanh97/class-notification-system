'use client';

import { useState, useRef, useEffect } from 'react';

type Option = { value: string; label: string };

type Props = {
  value: string;       // comma-separated StaffIDs
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  allowPaste?: boolean; // hiện ô paste ID ngoài danh sách
};

export default function MultiSelect({ value, onChange, options, placeholder, allowPaste }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [pasteOpen, setPasteOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = value ? value.split(',').map(s => s.trim()).filter(Boolean) : [];

  const toggle = (v: string) => {
    const next = selected.includes(v)
      ? selected.filter(x => x !== v)
      : [...selected, v];
    onChange(next.join(', '));
  };

  const filtered = options.filter(o =>
    !search || o.label.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const selectedLabels = selected.map(v => {
    const o = options.find(x => x.value === v);
    return o ? o.label : v;
  });

  const applyPaste = () => {
    const ids = pasteText
      .split(/[,\n]+/)
      .map(s => s.trim())
      .filter(Boolean);
    const merged = Array.from(new Set([...selected, ...ids]));
    onChange(merged.join(', '));
    setPasteText('');
    setPasteOpen(false);
  };

  return (
    <div className="space-y-1">
      <div className="relative" ref={ref}>
        <div
          onClick={() => setOpen(o => !o)}
          className="w-full min-h-[38px] border border-gray-300 rounded-lg px-3 py-2 text-sm cursor-pointer flex flex-wrap gap-1 focus-within:ring-2 focus-within:ring-[#03A680] bg-white"
        >
          {selected.length === 0 && (
            <span className="text-gray-400">{placeholder || '-- Chọn --'}</span>
          )}
          {selectedLabels.map((label, i) => (
            <span key={selected[i]}
              className="inline-flex items-center gap-1 bg-teal-50 text-teal-800 rounded px-2 py-0.5 text-xs font-medium">
              {label}
              <button
                type="button"
                onClick={e => { e.stopPropagation(); toggle(selected[i]); }}
                className="hover:text-red-500 leading-none"
              >×</button>
            </span>
          ))}
        </div>

        {open && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 flex flex-col">
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Tìm kiếm..."
                className="w-full text-sm px-2 py-1 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-[#03A680]"
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 && (
                <div className="px-3 py-2 text-sm text-gray-400">Không tìm thấy</div>
              )}
              {filtered.map(o => (
                <div
                  key={o.value}
                  onClick={() => toggle(o.value)}
                  className={`px-3 py-2 text-sm cursor-pointer flex items-center gap-2 hover:bg-gray-50 ${selected.includes(o.value) ? 'bg-teal-50' : ''}`}
                >
                  <input
                    type="checkbox"
                    readOnly
                    checked={selected.includes(o.value)}
                    className="rounded accent-[#03A680]"
                  />
                  {o.label}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {allowPaste && (
        <div>
          {!pasteOpen ? (
            <button
              type="button"
              onClick={() => setPasteOpen(true)}
              className="text-xs text-[#03A680] hover:underline"
            >
              + Paste danh sách ID
            </button>
          ) : (
            <div className="border border-gray-200 rounded-lg p-2 bg-gray-50 space-y-2">
              <p className="text-xs text-gray-500">Dán danh sách ID (cách nhau bằng dấu phẩy hoặc xuống dòng):</p>
              <textarea
                autoFocus
                rows={2}
                value={pasteText}
                onChange={e => setPasteText(e.target.value)}
                placeholder="VD: 008-AR-DN, 017-DS-DN, 085-MK-DN"
                className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-[#03A680] resize-none"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={applyPaste}
                  disabled={!pasteText.trim()}
                  className="text-xs bg-[#03A680] text-white px-3 py-1 rounded hover:bg-[#028a6a] disabled:opacity-50"
                >
                  Thêm vào danh sách
                </button>
                <button
                  type="button"
                  onClick={() => { setPasteOpen(false); setPasteText(''); }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Huỷ
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
