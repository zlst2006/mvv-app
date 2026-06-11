import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './storage/database/shared/schema';

async function seed() {
  const client = postgres(process.env.DATABASE_URL || '');
  const db = drizzle(client, { schema });

  const settings = [
    { key: 'admin_password', value: 'admin888' },
    { key: 'force_disable_anonymous', value: 'false' },
    { key: 'force_disable_realname', value: 'false' },
  ];
  for (const s of settings) {
    await db.insert(schema.mvvSettings).values(s).onConflictDoNothing();
  }
  console.log('✅ 默认设置已插入');
  await client.end();
}

seed().catch(e => { console.error(e); process.exit(1); });