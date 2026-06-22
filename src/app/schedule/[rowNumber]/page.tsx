import { getScheduleRows } from '@/lib/sheets';
import ScheduleForm from '@/components/ScheduleForm';
import { notFound } from 'next/navigation';

type Props = { params: Promise<{ rowNumber: string }> };

export default async function EditSchedulePage({ params }: Props) {
  const { rowNumber } = await params;
  const rn = parseInt(rowNumber);
  const rows = await getScheduleRows();
  const row = rows.find(r => r.rowNumber === rn);
  if (!row) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa lịch học</h1>
        <p className="text-gray-500 text-sm mt-1">ID Buổi học: <span className="font-mono">{row.idBuoiHoc}</span></p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ScheduleForm
          mode="edit"
          rowNumber={rn}
          initial={{
            idKhoaHoc: row.idKhoaHoc,
            idBuoiHoc: row.idBuoiHoc,
            idBuoiHocChiTiet: row.idBuoiHocChiTiet,
            idCaHoc: row.idCaHoc,
            ghiChuCaHoc: row.ghiChuCaHoc,
            ngayHoc: row.ngayHoc,
            hocPhan: row.hocPhan,
            noiDungHoc: row.noiDungHoc,
            tinhChat: row.tinhChat,
            giaoVien: row.giaoVien,
            hocVien: row.hocVien,
            hocVienDangKy: row.hocVienDangKy,
            meetLink: row.meetLink,
          }}
        />
      </div>
    </div>
  );
}
