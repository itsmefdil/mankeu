# Mankeu - Personal Finance Management

Mankeu is a modern, feature-rich personal finance management application designed to help you track your income, expenses, budgets, and financial goals with ease. Built with a focus on user experience and visual aesthetics, it offers a premium, intuitive interface for managing your personal finances.

## features

- **📊 Interactive Dashboard**: Get a real-time overview of your financial health with cash flow trends, expense breakdowns, and budget status.
- **💰 Transaction Tracking**: Easily record and categorize income and expenses.
- **📉 Analytics**: Visualise your spending habits with detailed charts and graphs.
- **🎯 Budget & Goals**: Set monthly budgets and financial goals to stay on track.
- **🏷️ Category Management**: Customize categories to fit your specific needs.
- **🌓 Dark Mode**: Fully supported dark mode for a comfortable viewing experience.

## Screenshots

### Dashboard
![Dashboard](assets/images/dashboard.png)
*Get a comprehensive overview of your financial health with interactive charts and real-time statistics*

### Transactions
![Transactions](assets/images/transactions.png)
*Track all your income and expenses with detailed categorization and filtering options*

### Categories
![Categories](assets/images/categories.png)
*Manage and customize your transaction categories to fit your needs*

### Budget & Goals
![Budget & Goals](assets/images/budget-goals.png)
*Set and monitor your monthly budgets and financial goals*

## Mobile Screenshots

<div style="display: flex; flex-wrap: wrap; gap: 10px; justify-content: center;">
  <img src="assets/images/mobile-dashboard.png" alt="Mobile Dashboard" width="200" />
  <img src="assets/images/mobile-transactions.png" alt="Mobile Transactions" width="200" />
  <img src="assets/images/mobile-categories.png" alt="Mobile Categories" width="200" />
  <img src="assets/images/mobile-budget&goals.png" alt="Mobile Budget & Goals" width="200" />
  <img src="assets/images/mobile-analytics.png" alt="Mobile Analytics" width="200" />
</div>


## Tech Stack

### Frontend
- **Framework**: React (Vite)
- **Styling**: TailwindCSS, Vanilla CSS (for custom animations/effects)
- **Icons**: Lucide React
- **Charts**: Recharts
- **State Management**: Zustand (Auth/Theme), TanStack Query (Data types)

### Backend
- **Framework**: FastAPI (Python)
- **Database**: MySQL
- **ORM**: SQLAlchemy
- **Data Validation**: Pydantic

## Getting Started

### 🚀 Quick Try
For those who prefer to use a hosted server instead of setting up their own backend, you can use the following URL:
**https://api-finance.noma.my.id**

### Prerequisites
- **Runtime**: [Bun](https://bun.sh) (v1.0+)
- **Python Tooling**: [uv](https://github.com/astral-sh/uv) (v0.1+)
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
The backend uses **FastAPI** and manages dependencies with **uv**.

```bash
cd backend

# Create virtual environment and install dependencies
uv venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
uv sync

# Configure Environment
cp .env.example .env
# [Action Required] Edit .env with your MySQL credentials

# Run Migrations & Start Server
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
*Backend API Docs: `http://localhost:8000/docs`*

#### 3. Frontend Setup
The frontend uses **React (Vite)** and **Bun**.

```bash
cd frontend

# Install dependencies
bun install

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
