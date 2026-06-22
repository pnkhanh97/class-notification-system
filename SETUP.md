# Hướng dẫn cài đặt

## 1. Tạo Google Service Account

1. Vào https://console.cloud.google.com → chọn hoặc tạo project mới
2. **APIs & Services → Enable APIs** → bật **Google Sheets API**
3. **APIs & Services → Credentials → Create Credentials → Service Account**
   - Đặt tên bất kỳ, nhấn Create
   - Skip bước grant role, nhấn Done
4. Click vào service account vừa tạo → tab **Keys → Add Key → JSON**
   - File JSON tải về chứa `client_email` và `private_key`

5. **Chia sẻ Google Sheet với service account:**
   - Mở Google Sheet → Share → Paste email service account (`...@....iam.gserviceaccount.com`)
   - Cấp quyền **Editor**

## 2. Tạo Gmail App Password

1. Vào https://myaccount.google.com/security
2. Bật **2-Step Verification** (nếu chưa bật)
3. **App passwords** → Tạo password cho "Mail"
4. Copy password 16 ký tự

## 3. Cấu hình .env.local

Copy file `.env.local.example` thành `.env.local` và điền:

```env
GOOGLE_SPREADSHEET_ID=   # Lấy từ URL sheet: .../spreadsheets/d/[ID]/edit
GOOGLE_SERVICE_ACCOUNT_EMAIL=   # client_email trong file JSON
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
# Paste nguyên nội dung private_key từ file JSON, bọc trong dấu ""

SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password_16chars
EMAIL_FROM_NAME=Hệ thống đào tạo
```

## 4. Chạy local

```bash
npm run dev
# Mở http://localhost:3000
```

## 5. Deploy lên Vercel

```bash
npm install -g vercel
vercel
# Làm theo hướng dẫn, sau đó vào Vercel Dashboard → Settings → Environment Variables
# Thêm tất cả biến trong .env.local
```

## Cấu trúc Google Sheet yêu cầu

### Sheet "Schedule" — các cột cần có:
| Cột | Bắt buộc |
|-----|----------|
| ID Khoá học | |
| ID Buổi học | ✓ |
| ID Buổi học Chi tiết | |
| ID Ca học | |
| Ghi chú ca học | |
| Ngày học | ✓ |
| Học phần | |
| Nội dung học | |
| Tính chất | |
| Giáo viên | ✓ |
| Học viên | ✓ |
| Học viên đã đăng ký | |
| MeetLink | ✓ |
| EmailSent | ✓ |

### Sheet "staff":
| StaffID | Staff | Email |

### Sheet "courseID_Input":
| Rowkey | ID Khoá học |
