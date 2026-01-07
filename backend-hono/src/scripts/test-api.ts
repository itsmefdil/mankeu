import { db } from '../lib/db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import * as dotenv from 'dotenv';
import { sign } from 'hono/jwt';

dotenv.config();

const API_URL = 'http://localhost:8888';

const run = async () => {
    console.log('🧪 Testing API endpoints...');

    // 1. Get a test user
    const [user] = await db.select().from(users).limit(1);
    if (!user) {
        console.error('❌ No users found in DB');
        process.exit(1);
    }
    console.log(`👤 Using user: ${user.email} (ID: ${user.id})`);

    // 2. Generate Token
    const exp = Math.floor(Date.now() / 1000) + 60 * 60;
    const token = await sign({ sub: String(user.id), exp }, process.env.SECRET_KEY || 'secret');
    console.log(`🔑 Token generated`);

    // 3. Test Transactions Endpoint (With Trailing Slash)
    console.log(`\n📡 Requesting: ${API_URL}/api/v1/transactions/`);
    try {
        const res = await fetch(`${API_URL}/api/v1/transactions/`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`📝 Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json() as any[];
            console.log(`✅ Success! Received ${data.length} transactions`);
            if (data.length > 0) {
                console.log('Sample:', data[0]);
            }
        } else {
            console.log('❌ Failed:', await res.text());
        }
    } catch (e) {
        console.error('❌ Network error:', e);
    }

    // 4. Test Transactions Endpoint (Without Trailing Slash)
    console.log(`\n📡 Requesting: ${API_URL}/api/v1/transactions`);
    try {
        const res = await fetch(`${API_URL}/api/v1/transactions`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        console.log(`📝 Status: ${res.status} ${res.statusText}`);
        if (res.ok) {
            const data = await res.json() as any[];
            console.log(`✅ Success! Received ${data.length} transactions`);
        } else {
            console.log('❌ Failed:', await res.text());
        }
    } catch (e) {
        console.error('❌ Network error:', e);
    }

    process.exit(0);
};

run();
