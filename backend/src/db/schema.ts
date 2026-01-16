import { pgTable, text, serial, numeric, timestamp, date, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoryTypeEnum = pgEnum('category_type', ['expense', 'income', 'saving']);
export const debtTypeEnum = pgEnum('debt_type', ['payable', 'receivable']);

// Users
export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    hashedPassword: text('hashed_password').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
    picture: text('picture'),
    givenName: text('given_name'),
    familyName: text('family_name'),
    locale: text('locale'),
    currency: text('currency').default('IDR'),
});

export const usersRelations = relations(users, ({ many }) => ({
    transactions: many(transactions),
    incomes: many(incomes),
    savings: many(savings),
    monthlyBudgets: many(monthlyBudgets),
    debts: many(debts),
}));

// Categories
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    type: categoryTypeEnum('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const categoriesRelations = relations(categories, ({ one, many }) => ({
    user: one(users, {
        fields: [categories.userId],
        references: [users.id],
    }),
    transactions: many(transactions),
    monthlyBudgets: many(monthlyBudgets),
}));

// Savings (Goals)
export const savings = pgTable('savings', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    savingDate: date('saving_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const savingsRelations = relations(savings, ({ one, many }) => ({
    user: one(users, {
        fields: [savings.userId],
        references: [users.id],
    }),
    transactions: many(savingTransactions),
}));

// Saving Transaction Type
export const savingTransactionTypeEnum = pgEnum('saving_transaction_type', ['deposit', 'withdraw']);

// Saving Transactions (History of deposits/withdrawals)
export const savingTransactions = pgTable('saving_transactions', {
    id: serial('id').primaryKey(),
    savingId: integer('saving_id').references(() => savings.id).notNull(),
    accountId: integer('account_id').references(() => accounts.id),
    type: savingTransactionTypeEnum('type').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    notes: text('notes'),
    transactionDate: date('transaction_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const savingTransactionsRelations = relations(savingTransactions, ({ one }) => ({
    saving: one(savings, {
        fields: [savingTransactions.savingId],
        references: [savings.id],
    }),
    account: one(accounts, {
        fields: [savingTransactions.accountId],
        references: [accounts.id],
    }),
}));

// Transactions
export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    accountId: integer('account_id').references(() => accounts.id),
    categoryId: integer('category_id').references(() => categories.id).notNull(),
    name: text('name').notNull(),
    transactionDate: date('transaction_date').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    notes: text('notes'),
    goalId: integer('goal_id').references(() => savings.id),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const transactionsRelations = relations(transactions, ({ one }) => ({
    user: one(users, {
        fields: [transactions.userId],
        references: [users.id],
    }),
    account: one(accounts, {
        fields: [transactions.accountId],
        references: [accounts.id],
    }),
    category: one(categories, {
        fields: [transactions.categoryId],
        references: [categories.id],
    }),
    goal: one(savings, {
        fields: [transactions.goalId],
        references: [savings.id],
    }),
}));

// Monthly Budgets
export const monthlyBudgets = pgTable('monthly_budgets', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    categoryId: integer('category_id').references(() => categories.id).notNull(),
    month: integer('month').notNull(),
    year: integer('year').notNull(),
    budgetAmount: numeric('budget_amount', { precision: 15, scale: 2 }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const monthlyBudgetsRelations = relations(monthlyBudgets, ({ one }) => ({
    user: one(users, {
        fields: [monthlyBudgets.userId],
        references: [users.id],
    }),
    category: one(categories, {
        fields: [monthlyBudgets.categoryId],
        references: [categories.id],
    }),
}));

// Accounts (Wallets/Banks)
export const accounts = pgTable('accounts', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    name: text('name').notNull(),
    type: text('type').default('cash').notNull(), // cash, bank, ewallet
    balance: numeric('balance', { precision: 15, scale: 2 }).default('0').notNull(),
    isDefault: boolean('is_default').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const accountsRelations = relations(accounts, ({ one, many }) => ({
    user: one(users, {
        fields: [accounts.userId],
        references: [users.id],
    }),
    transactions: many(transactions),
    transfersFrom: many(transfers, { relationName: 'transferFrom' }),
    transfersTo: many(transfers, { relationName: 'transferTo' }),
}));

// Transfers
export const transfers = pgTable('transfers', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    fromAccountId: integer('from_account_id').references(() => accounts.id).notNull(),
    toAccountId: integer('to_account_id').references(() => accounts.id).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    notes: text('notes'),
    date: date('date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const transfersRelations = relations(transfers, ({ one }) => ({
    user: one(users, {
        fields: [transfers.userId],
        references: [users.id],
    }),
    fromAccount: one(accounts, {
        fields: [transfers.fromAccountId],
        references: [accounts.id],
        relationName: 'transferFrom',
    }),
    toAccount: one(accounts, {
        fields: [transfers.toAccountId],
        references: [accounts.id],
        relationName: 'transferTo',
    }),
}));

// Incomes
export const incomes = pgTable('incomes', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    accountId: integer('account_id').references(() => accounts.id),
    source: text('source').notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    incomeDate: date('income_date').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const incomesRelations = relations(incomes, ({ one }) => ({
    user: one(users, {
        fields: [incomes.userId],
        references: [users.id],
    }),
}));

// Debts (Hutang/Piutang)
export const debts = pgTable('debts', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
    type: debtTypeEnum('type').notNull(), // payable = hutang, receivable = piutang
    personName: text('person_name').notNull(),
    description: text('description'),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    remainingAmount: numeric('remaining_amount', { precision: 15, scale: 2 }).notNull(),
    dueDate: date('due_date'),
    isPaid: boolean('is_paid').default(false).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const debtsRelations = relations(debts, ({ one, many }) => ({
    user: one(users, {
        fields: [debts.userId],
        references: [users.id],
    }),
    payments: many(debtPayments),
}));

// Debt Payments (Pembayaran Cicilan)
export const debtPayments = pgTable('debt_payments', {
    id: serial('id').primaryKey(),
    debtId: integer('debt_id').references(() => debts.id).notNull(),
    amount: numeric('amount', { precision: 15, scale: 2 }).notNull(),
    paymentDate: date('payment_date').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
    debt: one(debts, {
        fields: [debtPayments.debtId],
        references: [debts.id],
    }),
}));
