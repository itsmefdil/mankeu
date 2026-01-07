import { pgTable, text, serial, numeric, timestamp, date, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const categoryTypeEnum = pgEnum('category_type', ['expense', 'income', 'saving']);

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
}));

// Categories
export const categories = pgTable('categories', {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    type: categoryTypeEnum('type').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const categoriesRelations = relations(categories, ({ many }) => ({
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

export const savingsRelations = relations(savings, ({ one }) => ({
    user: one(users, {
        fields: [savings.userId],
        references: [users.id],
    }),
}));

// Transactions
export const transactions = pgTable('transactions', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
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

// Incomes
export const incomes = pgTable('incomes', {
    id: serial('id').primaryKey(),
    userId: integer('user_id').references(() => users.id).notNull(),
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
