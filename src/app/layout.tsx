import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ABC Academy – Hệ thống đào tạo',
  description: 'Quản lý lịch học và gửi email tự động',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <nav className="bg-[#03A680] shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center h-14 gap-6">
            <a href="/" className="text-white font-bold text-lg tracking-tight">ABC Academy</a>
            <a href="/" className="text-white/80 hover:text-white text-sm transition-colors">Dashboard</a>
            <a href="/schedule/new" className="text-white/80 hover:text-white text-sm transition-colors">+ Thêm lịch học</a>
          </div>
        </nav>
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </body>
    </html>
  );
}
