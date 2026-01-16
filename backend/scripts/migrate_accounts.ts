
import { db } from '../src/lib/db';
import { users, accounts, transactions, savingTransactions, categories } from '../src/db/schema';
import { eq, isNull, and } from 'drizzle-orm';

async function migrate() {
    console.log('Starting migration...');
    const allUsers = await db.select().from(users);

    for (const user of allUsers) {
        console.log(`Processing user: ${user.name} (${user.id})`);

        // 1. Create Default Cash Account if not exists
        let cashAccount: any;
        const existingAccounts = await db.select().from(accounts)
            .where(and(eq(accounts.userId, user.id), eq(accounts.isDefault, true)));

        if (existingAccounts.length > 0) {
            cashAccount = existingAccounts[0];
            console.log(`  Found default Cash account: ${cashAccount.id}`);
        } else {
            const newAccounts = await db.insert(accounts).values({
                userId: user.id,
                name: 'Dompet Tunai',
                type: 'cash',
                isDefault: true,
                balance: '0',
            }).returning();
            cashAccount = newAccounts[0];
            console.log(`  Created default Cash account: ${cashAccount.id}`);
        }

        // 2. Link Transactions to Cash Account
        const userTransactions = await db.select().from(transactions)
            .where(and(eq(transactions.userId, user.id), isNull(transactions.accountId)));

        if (userTransactions.length > 0) {
            await db.update(transactions)
                .set({ accountId: cashAccount.id })
                .where(and(eq(transactions.userId, user.id), isNull(transactions.accountId)));
            console.log(`  Updated ${userTransactions.length} transactions.`);
        }

        // 3. Link Saving Transactions to Cash Account
        // Find all savings for this user
        const userSavings = await db.query.savings.findMany({
            where: (savings, { eq }) => eq(savings.userId, user.id),
            with: {
                transactions: true
            }
        });

        let savingTxCount = 0;
        let savingBalanceImpact = 0;

        for (const saving of userSavings) {
            const orphanTx = await db.select().from(savingTransactions)
                .where(and(eq(savingTransactions.savingId, saving.id), isNull(savingTransactions.accountId)));

            if (orphanTx.length > 0) {
                await db.update(savingTransactions)
                    .set({ accountId: cashAccount.id })
                    .where(and(eq(savingTransactions.savingId, saving.id), isNull(savingTransactions.accountId)));

                savingTxCount += orphanTx.length;

                // Calculate impact
                for (const tx of orphanTx) {
                    if (tx.type === 'deposit') {
                        savingBalanceImpact -= Number(tx.amount); // Cash decreases
                    } else {
                        savingBalanceImpact += Number(tx.amount); // Cash increases
                    }
                }
            }
        }
        console.log(`  Updated ${savingTxCount} saving transactions.`);

        // 4. Calculate Balance
        // Get all transactions for this user (now linked to cashAccount)
        const allTx = await db.select({
            amount: transactions.amount,
            categoryType: categories.type
        })
            .from(transactions)
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .where(eq(transactions.accountId, cashAccount.id));

        let balance = 0;
        for (const tx of allTx) {
            if (tx.categoryType === 'income') {
                balance += Number(tx.amount);
            } else {
                balance -= Number(tx.amount);
            }
        }

        balance += savingBalanceImpact;

        console.log(`  Calculated Cash Balance: ${balance}`);
        await db.update(accounts)
            .set({ balance: String(balance) })
            .where(eq(accounts.id, cashAccount.id));
    }

    console.log('Migration complete.');
    process.exit(0);
}

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});
