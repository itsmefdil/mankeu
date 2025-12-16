# UI/UX Design System - Mankeu

## 1. Philosophies & Aesthetics
The design of **Mankeu** focuses on a **Premium, Modern, and Fluid** user experience. It moves away from generic "admin panel" looks to a consumer-grade financial application that feels alive and polished.

### Core Principles
- **Vibrant & Harmonious**: Use of rich, deep colors for finance/trust, combined with vibrant accents for actions.
- **Glassmorphism & Depth**: Subtle utilization of blurs, shadows, and layering to create hierarchy without clutter.
- **Micro-Interactions**: Every action (click, toggle, hover) should have immediate visual feedback.
- **Mobile-First but Desktop-Rich**: The interface should feel native on mobile (Capacitor) while expanding elegantly on desktop.
- **Dark Mode First**: While supporting light mode, the primary identity is a sleek, high-contrast dark mode.

---

## 2. Color Palette & Typography

### Colors (HSL Based)
We define our colors using CSS variables for easy theming and dark mode switching.

**Primary (Brand)**
- `primary`: `hsl(250, 95%, 65%)` (Vibrant Purple/Indigo - Trust & Modernity)
- `primary-foreground`: `hsl(0, 0%, 100%)`

**Secondary (Accents)**
- `success`: `hsl(150, 80%, 40%)` (Growth, Income)
- `danger`: `hsl(0, 85%, 60%)` (Expense, Debt)
- `warning`: `hsl(35, 90%, 55%)` (Limits, Alerts)

**Neutrals (Backgrounds & Surface)**
- `background`: `hsl(220, 20%, 10%)` (Deep Blue-Black for Dark Mode)
- `surface`: `hsl(220, 15%, 16%)` (Card/Container background)
- `surface-hover`: `hsl(220, 15%, 20%)`
- `border`: `hsl(220, 15%, 25%)`

### Typography
**Font Family**: `Inter` (UI/Text) and `Outfit` (Headings/Numbers) for a clean, modern geometric look.

- **H1 (Page Titles)**: 24px - 32px, Bold, `Outfit`
- **H2 (Section Headers)**: 18px - 22px, SemiBold, `Outfit`
- **Body**: 14px - 16px, Regular/Medium, `Inter`
- **Numbers/Currency**: Monospaced features enabled in `Outfit` for tabular alignment.

---

## 3. Layout & Navigation

### Global Structure
- **Desktop**:
  - **Sidebar Navigation**: Collapsible, icons with labels, glassmorphism effect.
  - **Top Bar**: User profile, global search, date range picker, notifications.
  - **Main Content**: Centered view, max-width constrained for readability (e.g., `max-w-7xl`).

- **Mobile (App View)**:
  - **Bottom Navigation Bar**: Fixed at bottom (Home, Transactions, Budget, Profile).
  - **Floating Action Button (FAB)**: Central accented button for "Add Transaction" (Quick Action).
  - **Header**: Minimalist, showing current page title or context actions.

---

## 4. Components & Design System (Shadcn/UI Extended)

All components are built on **Shadcn/UI** tailored with our theme.

### Atoms
- **Buttons**:
  - `default`: Solid primary color, slight shadow, scale on click.
  - `ghost`: Transparent with hover background, used for secondary actions.
  - `outline`: Thin border, subtle hover glow.
- **Inputs**: Rounded-md, focus ring with primary color, error states with red border/text.
- **Cards**: `bg-surface`, `rounded-xl`, `border-border`, subtle `shadow-lg` (or specialized financial card styles).
- **Badges/Chips**: Rounded-full, soft pastel backgrounds for categories (e.g., `bg-green-500/20 text-green-400`).

### Molecules (Financial Specific)
- **Transaction Item**:
  - Left: Icon (Category) in a rounded square container.
  - Center: Title & Date (gray text).
  - Right: Amount (Red for expense, Green for income).
  - Action: Swipe-to-delete (Mobile) or Hover actions (Desktop).
- **Budget Progress Bar**:
  - Label (Category Name).
  - Progress track (Gray), Fill (Color coded based on usage %).
  - "Left to spend" text indicator.
- **Summary Card**:
  - Icon, Label (Total Balance, Income, Expense).
  - Large currency value.
  - Trend indicator (e.g., "↑ 12% vs last month").

---

## 5. Key Pages & UX Flow

### 1. Dashboard (Home)
**Goal**: Quick snapshot of financial health.
- **Header**: Greeting & Month Selector.
- **Hero Section**:
  - **Total Balance Card**: Prominent display.
  - **Monthly Summary**: Mini charts for Income vs Expense.
- **Recent Transactions**: List of last 5 items.
- **Budget Status**: Carousel or stacked list of critical budgets (those nearing 100%).

### 2. Transactions
**Goal**: Detailed history and management.
- **Filters**: Date Range, Category, Type (Income/Expense).
- **View Modes**: List view (default) and Calendar view.
- **Add/Edit Modal**:
  - Clean form with type toggle (Expense/Income).
  - Category selector with icons.
  - Amount input (large font).
  - Date picker & Note field.

### 3. Budgeting & Planning
**Goal**: Set limits and track fixed expenses.
- **Monthly Budgets**:
  - Grid of cards showing `Spent / Limit`.
  - Color-coded progress bars (Green < 50%, Yellow < 80%, Red > 90%).
- **Fixed Expenses**:
  - List of recurring bills.
  - "Paid" toggle switch for the current month.

### 4. Goals & Savings
**Goal**: Motivation for saving.
- **Savings Cards**:
  - Target Amount vs Current Amount.
  - Circular progress ring.
  - "Add Money" quick button.

### 5. Analytics/Reports
**Goal**: Deep dive into spending habits.
- **Charts**:
  - **Pie Chart**: Spending by Category.
  - **Bar Chart**: Monthly spending comparison (Last 6 months).
  - **Line Chart**: Net worth trend.
- **Insights**: Text highlights (e.g., "You spent 20% more on Food this month").

---

## 6. Interactions & Animations

### Micro-Animations (Framer Motion)
- **Page Transitions**: Subtle fade-in + slide-up (`y: 10 -> 0`, `opacity: 0 -> 1`).
- **List Items**: Staggered entrance when loading lists.
- **Buttons**: `scale: 0.95` on tap/click.
- **Charts**: Draw animations on load.

### Feedback
- **Loading**: Skeleton screens (shimmer effect) instead of spinners for content.
- **Toasts**: Non-intrusive notifications (bottom-right desktop, top mobile) for success/error.
- **Empty States**: Custom illustrations/icons when no data is available, with a call-to-action button.

---

## 7. Icons
Using **Lucide React** for consistency.
- **Dashboard**: `LayoutDashboard`
- **Transactions**: `ArrowRightLeft` or `Receipt`
- **Wallet/Accounts**: `Wallet`
- **Budget**: `PiggyBank` or `ChartPie`
- **Settings**: `Settings`
- **Add**: `PlusCircle`

---

## 8. Mobile Considerations (Capacitor)
- **Safe Areas**: Ensure padding respects notch and home indicator.
- **Haptics**: Trigger haptic feedback on significant actions (e.g., saving a transaction, deleting item).
- **Gestures**: Swipe-back navigation, Swipe-to-action on lists.
