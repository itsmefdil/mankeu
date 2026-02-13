# Mankeu - Personal Finance Management

Mankeu is a modern, feature-rich personal finance management application designed to help you track your income, expenses, budgets, and financial goals with ease. Built with a focus on user experience and visual aesthetics, it offers a premium, intuitive interface for managing your personal finances.

## features

- **📊 Interactive Dashboard**: Get a real-time overview of your financial health with cash flow trends, expense breakdowns, and budget status.
- **💰 Transaction Tracking**: Easily record and categorize income and expenses.
- **📉 Analytics**: Visualise your spending habits with detailed charts and graphs.
- **🎯 Budget & Goals**: Set monthly budgets and financial goals to stay on track.
- **🏷️ Category Management**: Customize categories to fit your specific needs.
- **🔐 Secure Authentication**: Google Login (GIS) support and secure session management.
- **📱 Mobile Optimized**: Responsive design for a seamless experience on all devices.
- **🔌 Flexible Database Connection**: Support for both standard fields and Connection URI strings.
- **🌓 Dark Mode**: Fully supported dark mode for a comfortable viewing experience.

## Screenshots

| Dashboard | Transactions |
| :---: | :---: |
| ![Dashboard](assets/images/dashboard.jpg) | ![Transactions](assets/images/transactions.jpg) |
| **Savings & Goals** | **Accounts** |
| ![Savings](assets/images/saving.jpg) | ![Accounts](assets/images/account.jpg) |
| **Debts** | |
| ![Debts](assets/images/debt.jpg) | |


## Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: TailwindCSS, Vanilla CSS (for custom animations/effects)
- **Icons**: Lucide React
- **Charts**: Recharts
- **Authentication**: Google Identity Services (GIS)
- **State Management**: Zustand (Auth/Theme), TanStack Query (Data Sync)

### Backend
- **Runtime**: [Bun](https://bun.sh)
- **Framework**: Express (TypeScript)
- **Database**: MySQL
- **ORM**: Drizzle ORM
- **Validation**: Zod


## Getting Started

### 🚀 Quick Try
For those who prefer to use a hosted server instead of setting up their own backend, you can use the following URL:
**[https://api-finance.noma.my.id](https://api-finance.noma.my.id)**

### Prerequisites
- **Runtime**: [Bun](https://bun.sh) (v1.0+)
- **Database**: MySQL Server
- **Android Support**: Java SDK 21 (for building APKs)

---

### 🛠️ Development (Local Setup)

#### 1. Clone the repository
```bash
git clone https://github.com/itsmefdil/mankeu.git
cd mankeu
```

#### 2. Backend Setup
The backend is built with **Express** and runs on **Bun**.

```bash
cd backend

# Install dependencies
bun install

# Configure Environment
cp .env.example .env
```

#### 3. Key Generation & Configuration
You need to generate secure keys for the application.

```bash
# Generate a random 32-byte hex string for SECRET_KEY and ENCRYPTION_KEY
openssl rand -hex 32
```

Edit your `.env` file and update the following:
- `MYSQL_DATABASE_URL`: Your MySQL connection string (e.g., `mysql+asyncmy://user:pass@localhost:3306/mankeu`)
- `SECRET_KEY`: The generated hex string from above.
- `ENCRYPTION_KEY`: Another generated hex string (must be 32 bytes hex).

#### 4. Run Migrations & Start Server

```bash
# Push database schema changes
bun run db:migrate

# Start the development server
bun dev
```
*Backend API URL: `http://localhost:8000`*

#### 5. Frontend Setup
The frontend uses **React (Vite)** and **Bun**.

```bash
cd frontend

# Install dependencies
bun install

# Configure Environment
cp .env.example .env
# [Action Required] Edit .env and set VITE_GOOGLE_CLIENT_ID

# Start Development Server
bun dev
```
*Frontend URL: `http://localhost:5173`*

---

### 🐳 Deployment (Docker)

Easily deploy the full stack (Frontend, Backend, Database) using Docker Compose.

```bash
# From the project root
docker compose up -d --build
```

**Services:**
- **Frontend**: `http://localhost:3088`
- **Backend**: `http://localhost:8088` (Internal port 8000)
- **Database**: `mankeu_db` (Internal port 3306)

*Note: Data is persisted in the `db_data` volume.*

---

### 📱 Android Build

You can build the Android APK without Android Studio using the provided CLI tools.

#### 1. Setup Environment
Ensure you have **Java 21** installed and the Android Command Line Tools set up.
> See [ANDROID_BUILD.md](ANDROID_BUILD.md) for detailed environment setup instructions.

#### 2. Build APK
Use the helper script to sync the frontend and build the debug APK.

```bash
# Make the script executable
chmod +x build-android.sh

# Run the build script
./build-android.sh
```

**Output:**
The APK will be generated at:
`frontend/android/app/build/outputs/apk/debug/app-debug.apk`

## License

This project is licensed under the MIT License.
