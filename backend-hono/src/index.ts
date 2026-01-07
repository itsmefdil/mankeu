import express from 'express';
import cors from 'cors';
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

export const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Request Logger
app.use((req, res, next) => {
    console.log(`[Incoming] ${req.method} ${req.path}`);
    next();
});

// Default home route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Mankeu API (Express)' });
});

// Define all routes
const apiPrefix = process.env.API_PREFIX || '/api/v1';
const router = express.Router();

router.use('/auth', auth);
router.use('/categories', categories);
router.use('/transactions', transactions);
router.use('/budgets', budgets);
router.use('/users', users);
router.use('/fixed-expenses', fixedExpenses);
router.use('/debts', debts);
router.use('/incomes', incomes);
router.use('/savings', savings);
router.use('/health', health);

// Mount API
app.use(apiPrefix, router);

// API Root Fallback
if (process.env.API_ROOT_FALLBACK === 'true') {
    app.use('/', router);
    console.log('🔄 API Root Fallback enabled: Routes also mounted at /');
}

console.log(`🚀 API mounted at ${apiPrefix}`);

// 404 Handler
app.use((req, res) => {
    res.status(404).json({
        message: 'Not Found',
        path: req.path,
        method: req.method
    });
});

// Start server if not running in various serverless environments
if (!process.env.VERCEL) {
    const port = process.env.PORT || 8000;
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
}

export default app;