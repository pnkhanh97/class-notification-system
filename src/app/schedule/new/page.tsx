import ScheduleForm from '@/components/ScheduleForm';

export default function NewSchedulePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Thêm lịch học mới</h1>
        <p className="text-gray-500 text-sm mt-1">Điền thông tin và lưu vào Google Sheet</p>
      </div>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <ScheduleForm mode="create" />
      </div>
    </div>
  );
}
