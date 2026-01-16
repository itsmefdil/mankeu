import { Router } from 'express';
import { db } from '../lib/db';
import { debts, debtPayments } from '../db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = Router();

// Validation schemas
const debtSchema = z.object({
    type: z.enum(['payable', 'receivable']),
    person_name: z.string().min(1),
    description: z.string().optional().nullable(),
    amount: z.union([z.string(), z.number()]),
    due_date: z.string().optional().nullable(),
});

const paymentSchema = z.object({
    amount: z.union([z.string(), z.number()]),
    payment_date: z.string(),
    notes: z.string().optional().nullable(),
});

router.use(authMiddleware);

// GET all debts
router.get('/', async (req, res) => {
    const userId = Number(req.user.sub);
    const type = req.query.type as string | undefined;

    let query = db.select()
        .from(debts)
        .where(eq(debts.userId, userId))
        .orderBy(desc(debts.createdAt));

    const result = await query;

    // Filter by type if provided
    const filteredResult = type
        ? result.filter(d => d.type === type)
        : result;

    const formattedResult = filteredResult.map(d => ({
        id: d.id,
        user_id: d.userId,
        type: d.type,
        person_name: d.personName,
        description: d.description,
        amount: Number(d.amount),
        remaining_amount: Number(d.remainingAmount),
        due_date: d.dueDate,
        is_paid: d.isPaid,
        created_at: d.createdAt
    }));

    res.json(formattedResult);
});

// GET single debt with payments
router.get('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [debt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)));

    if (!debt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }

    // Get payments
    const payments = await db.select()
        .from(debtPayments)
        .where(eq(debtPayments.debtId, id))
        .orderBy(desc(debtPayments.paymentDate));

    const formattedPayments = payments.map(p => ({
        id: p.id,
        debt_id: p.debtId,
        amount: Number(p.amount),
        payment_date: p.paymentDate,
        notes: p.notes,
        created_at: p.createdAt
    }));

    res.json({
        id: debt.id,
        user_id: debt.userId,
        type: debt.type,
        person_name: debt.personName,
        description: debt.description,
        amount: Number(debt.amount),
        remaining_amount: Number(debt.remainingAmount),
        due_date: debt.dueDate,
        is_paid: debt.isPaid,
        created_at: debt.createdAt,
        payments: formattedPayments
    });
});

// POST create new debt
router.post('/', validate(debtSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const body = req.body;

    const amount = Number(body.amount);

    const [newDebt] = await db.insert(debts).values({
        userId,
        type: body.type,
        personName: body.person_name,
        description: body.description,
        amount: String(amount),
        remainingAmount: String(amount), // Initially same as amount
        dueDate: body.due_date || null,
        isPaid: false,
    }).returning();

    if (!newDebt) {
        return res.status(500).json({ detail: 'Failed to create debt' });
    }

    res.json({
        id: newDebt.id,
        user_id: newDebt.userId,
        type: newDebt.type,
        person_name: newDebt.personName,
        description: newDebt.description,
        amount: Number(newDebt.amount),
        remaining_amount: Number(newDebt.remainingAmount),
        due_date: newDebt.dueDate,
        is_paid: newDebt.isPaid,
        created_at: newDebt.createdAt
    });
});

// PUT update debt
router.put('/:id', validate(debtSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);
    const body = req.body;

    const [existingDebt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)));

    if (!existingDebt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }

    // Calculate new remaining amount based on amount change
    const oldAmount = Number(existingDebt.amount);
    const newAmount = Number(body.amount);
    const paidSoFar = oldAmount - Number(existingDebt.remainingAmount);
    const newRemainingAmount = Math.max(0, newAmount - paidSoFar);

    const [updatedDebt] = await db.update(debts)
        .set({
            type: body.type,
            personName: body.person_name,
            description: body.description,
            amount: String(newAmount),
            remainingAmount: String(newRemainingAmount),
            dueDate: body.due_date || null,
            isPaid: newRemainingAmount <= 0,
        })
        .where(eq(debts.id, id))
        .returning();

    if (!updatedDebt) {
        return res.status(500).json({ detail: 'Failed to update debt' });
    }

    res.json({
        id: updatedDebt.id,
        user_id: updatedDebt.userId,
        type: updatedDebt.type,
        person_name: updatedDebt.personName,
        description: updatedDebt.description,
        amount: Number(updatedDebt.amount),
        remaining_amount: Number(updatedDebt.remainingAmount),
        due_date: updatedDebt.dueDate,
        is_paid: updatedDebt.isPaid,
        created_at: updatedDebt.createdAt
    });
});

// DELETE debt
router.delete('/:id', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [debt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)));

    if (!debt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }

    // Delete all payments first
    await db.delete(debtPayments).where(eq(debtPayments.debtId, id));

    // Delete the debt
    await db.delete(debts).where(eq(debts.id, id));

    res.json({
        id: debt.id,
        user_id: debt.userId,
        type: debt.type,
        person_name: debt.personName,
        description: debt.description,
        amount: Number(debt.amount),
        remaining_amount: Number(debt.remainingAmount),
        due_date: debt.dueDate,
        is_paid: debt.isPaid,
        created_at: debt.createdAt
    });
});

// POST add payment to debt
router.post('/:id/payments', validate(paymentSchema), async (req, res) => {
    const userId = Number(req.user.sub);
    const debtId = Number(req.params.id);
    const body = req.body;

    // Verify debt exists and belongs to user
    const [debt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, debtId), eq(debts.userId, userId)));

    if (!debt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }

    const paymentAmount = Number(body.amount);

    // Create payment
    const [newPayment] = await db.insert(debtPayments).values({
        debtId,
        amount: String(paymentAmount),
        paymentDate: body.payment_date,
        notes: body.notes,
    }).returning();

    // Update remaining amount
    const newRemainingAmount = Math.max(0, Number(debt.remainingAmount) - paymentAmount);

    await db.update(debts)
        .set({
            remainingAmount: String(newRemainingAmount),
            isPaid: newRemainingAmount <= 0,
        })
        .where(eq(debts.id, debtId));

    if (!newPayment) {
        return res.status(500).json({ detail: 'Failed to add payment' });
    }

    res.json({
        id: newPayment.id,
        debt_id: newPayment.debtId,
        amount: Number(newPayment.amount),
        payment_date: newPayment.paymentDate,
        notes: newPayment.notes,
        created_at: newPayment.createdAt
    });
});

// GET payments for a debt
router.get('/:id/payments', async (req, res) => {
    const userId = Number(req.user.sub);
    const debtId = Number(req.params.id);

    // Verify debt exists and belongs to user
    const [debt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, debtId), eq(debts.userId, userId)));

    if (!debt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }

    const payments = await db.select()
        .from(debtPayments)
        .where(eq(debtPayments.debtId, debtId))
        .orderBy(desc(debtPayments.paymentDate));

    const formattedPayments = payments.map(p => ({
        id: p.id,
        debt_id: p.debtId,
        amount: Number(p.amount),
        payment_date: p.paymentDate,
        notes: p.notes,
        created_at: p.createdAt
    }));

    res.json(formattedPayments);
});

// DELETE payment
router.delete('/:id/payments/:paymentId', async (req, res) => {
    const userId = Number(req.user.sub);
    const debtId = Number(req.params.id);
    const paymentId = Number(req.params.paymentId);

    // Verify debt exists and belongs to user
    const [debt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, debtId), eq(debts.userId, userId)));

    if (!debt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }

    const [payment] = await db.select()
        .from(debtPayments)
        .where(and(eq(debtPayments.id, paymentId), eq(debtPayments.debtId, debtId)));

    if (!payment) {
        return res.status(404).json({ detail: 'Payment not found' });
    }

    // Delete payment
    await db.delete(debtPayments).where(eq(debtPayments.id, paymentId));

    // Restore remaining amount
    const newRemainingAmount = Number(debt.remainingAmount) + Number(payment.amount);

    await db.update(debts)
        .set({
            remainingAmount: String(Math.min(newRemainingAmount, Number(debt.amount))),
            isPaid: false,
        })
        .where(eq(debts.id, debtId));

    res.json({
        id: payment.id,
        debt_id: payment.debtId,
        amount: Number(payment.amount),
        payment_date: payment.paymentDate,
        notes: payment.notes,
        created_at: payment.createdAt
    });
});

// PATCH mark debt as paid/unpaid
router.patch('/:id/toggle-paid', async (req, res) => {
    const userId = Number(req.user.sub);
    const id = Number(req.params.id);

    const [debt] = await db.select()
        .from(debts)
        .where(and(eq(debts.id, id), eq(debts.userId, userId)));

    if (!debt) {
        return res.status(404).json({ detail: 'Debt not found' });
    }

    const newIsPaid = !debt.isPaid;
    const newRemainingAmount = newIsPaid ? 0 : Number(debt.amount);

    const [updatedDebt] = await db.update(debts)
        .set({
            isPaid: newIsPaid,
            remainingAmount: String(newRemainingAmount),
        })
        .where(eq(debts.id, id))
        .returning();

    res.json({
        id: updatedDebt.id,
        user_id: updatedDebt.userId,
        type: updatedDebt.type,
        person_name: updatedDebt.personName,
        description: updatedDebt.description,
        amount: Number(updatedDebt.amount),
        remaining_amount: Number(updatedDebt.remainingAmount),
        due_date: updatedDebt.dueDate,
        is_paid: updatedDebt.isPaid,
        created_at: updatedDebt.createdAt
    });
});

export default router;
