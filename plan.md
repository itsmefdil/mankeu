# Database Design – Financial Plan Website

Dokumen ini berisi rancangan database untuk website pencatatan keuangan pribadi  
berdasarkan file **Financial Plan 2025 (PDF/Excel)**.

## Tujuan
- Mencatat transaksi harian
- Mengelola kategori pengeluaran & pemasukan
- Mengatur anggaran bulanan
- Menampilkan laporan & grafik keuangan
- Mudah dikembangkan (API / Dashboard)

---

## 1. Entity Overview

Entitas utama dalam sistem:
- User
- Transactions (pengeluaran & pemasukan harian)
- Categories
- Monthly Budgets
- Fixed Expenses
- Debts (Paylater / Kartu Kredit)
- Incomes
- Savings

---

## 2. Table: `users`

Digunakan jika sistem mendukung multi-user.

| Field | Type | Description |
|------|------|-------------|
| id | BIGINT (PK) | ID user |
| name | VARCHAR(100) | Nama user |
| email | VARCHAR(100) | Email |
| created_at | TIMESTAMP | Waktu dibuat |

---

## 3. Table: `categories`

Kategori transaksi.

| Field | Type | Description |
|------|------|-------------|
| id | BIGINT (PK) | ID kategori |
| name | VARCHAR(50) | Nama kategori (Makanan, Bensin, dll) |
| type | ENUM | expense / income / saving |
| created_at | TIMESTAMP | Waktu dibuat |

Contoh data:
- Makanan → expense
- Bensin → expense
- Gaji → income
- Tabungan → saving

---

## 4. Table: `transactions`

Tabel inti untuk pencatatan harian.

| Field | Type | Description |
|------|------|-------------|
| id | BIGINT (PK) | ID transaksi |
| user_id | BIGINT (FK) | Relasi ke users |
| category_id | BIGINT (FK) | Relasi ke categories |
| name | VARCHAR(100) | Nama transaksi |
| transaction_date | DATE | Tanggal transaksi |
| amount | DECIMAL(15,2) | Nominal |
| notes | TEXT | Catatan |
| created_at | TIMESTAMP | Waktu dibuat |

Contoh:
- Makan | 2025-12-01 | 65.000
- Tokped | 2025-12-01 | 886.000

---

## 5. Table: `monthly_budgets`

Preset anggaran bulanan per kategori.

| Field | Type | Description |
|------|------|-------------|
| id | BIGINT (PK) | ID |
| user_id | BIGINT (FK) | User |
| category_id | BIGINT (FK) | Kategori |
| month | INT | Bulan (1–12) |
| year | INT | Tahun |
| budget_amount | DECIMAL(15,2) | Anggaran |
| created_at | TIMESTAMP | Waktu dibuat |

Contoh:
- Makanan → 1.000.000
- Bensin → 150.000

---

## 6. Table: `fixed_expenses`

Pengeluaran wajib bulanan.

| Field | Type | Description |
|------|------|-------------|
| id | BIGINT (PK) | ID |
| user_id | BIGINT (FK) | User |
| name | VARCHAR(100) | Nama (Kost, Internet) |
| amount | DECIMAL(15,2) | Nominal |
| due_day | INT | Tanggal jatuh tempo |
| created_at | TIMESTAMP | Waktu dibuat |

---

## 7. Table: `debts`

Hutang, Paylater, Kartu Kredit.

| Field | Type | Description |
|------|------|-------------|
| id | BIGINT (PK) | ID |
| user_id | BIGINT (FK) | User |
| name | VARCHAR(100) | Nama hutang |
| amount | DECIMAL(15,2) | Nominal |
| status | ENUM | unpaid / paid |
| due_date | DATE | Jatuh tempo |
| created_at | TIMESTAMP | Waktu dibuat |

---

## 8. Table: `incomes`

Pendapatan user.

| Field | Type | Description |
|------|------|-------------|
| id | BIGINT (PK) | ID |
| user_id | BIGINT (FK) | User |
| source | VARCHAR(100) | Sumber pendapatan |
| amount | DECIMAL(15,2) | Nominal |
| income_date | DATE | Tanggal |
| created_at | TIMESTAMP | Waktu dibuat |

---

## 9. Table: `savings`

Pencatatan tabungan.

| Field | Type | Description |
|------|------|-------------|
| id | BIGINT (PK) | ID |
| user_id | BIGINT (FK) | User |
| name | VARCHAR(100) | Nama tabungan |
| amount | DECIMAL(15,2) | Nominal |
| saving_date | DATE | Tanggal |
| created_at | TIMESTAMP | Waktu dibuat |

---

## 10. Relationship Overview

users
├── transactions
├── incomes
├── savings
├── debts
├── fixed_expenses
└── monthly_budgets → categories

---

## 11. Notes for Development

- Semua nominal menggunakan `DECIMAL` (aman untuk keuangan)
- Transaksi harian & bulanan dipisah
- Bisa dengan mudah:
  - Buat grafik bulanan
  - Hitung sisa gaji
  - Bandingkan budget vs realisasi
- Cocok untuk REST API / GraphQL

---

## 12. Recommended Stack

- Backend: FastAPI / Flask / Laravel
- Database: MySQL / PostgreSQL
- Frontend: Tailwind + HTMX / React
- Chart: Chart.js / ECharts

---

END OF DOCUMENT
