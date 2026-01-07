import { Hono } from 'hono';
import { logger } from 'hono/logger';
import { cors } from 'hono/cors';
import auth from './routes/auth';
import categories from './routes/categories';
import transactions from './routes/transactions';
import budgets from './routes/budgets';
import users from './routes/users';
import fixedExpenses from './routes/fixed-expenses';
import debts from './routes/debts';
import incomes from './routes/incomes';
import savings from './routes/savings';
import health from './routes/health';

export const app = new Hono();

app.use('*', logger());
app.use('*', cors());

// Default home route
app.get('/', (c) => {
    return c.json({ message: 'Welcome to Mankeu API (Hono)' });
});

// Define all routes
const routes = {
    '/auth': auth,
    '/categories': categories,
    '/transactions': transactions,
    '/budgets': budgets,
    '/users': users,
    '/fixed-expenses': fixedExpenses,
    '/debts': debts,
    '/incomes': incomes,
    '/savings': savings,
    '/health': health,
};

// Group all API routes
const api = new Hono();

// Mount routes normally
Object.entries(routes).forEach(([path, route]) => {
    api.route(path, route);
    // Mount with trailing slash to avoid 301 redirects which some clients don't handle well
    api.route(path + '/', route);
});

// Mount with configurable prefix
const apiPrefix = process.env.API_PREFIX || '/api/v1';
app.route(apiPrefix, api);

// Optional: Mount at root for backward compatibility if configured
if (process.env.API_ROOT_FALLBACK === 'true') {
    // Mount root routes similarly
    Object.entries(routes).forEach(([path, route]) => {
        app.route(path, route);
        app.route(path + '/', route);
    });
    console.log('🔄 API Root Fallback enabled: Routes also mounted at /');
}

console.log(`🚀 API mounted at ${apiPrefix}`);

export default {
    port: process.env.PORT || 8888,
    fetch: app.fetch,
};