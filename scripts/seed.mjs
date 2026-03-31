import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env manually to avoid dependencies
const envPath = new URL('../.env', import.meta.url);
let envConfig = {};

try {
  const envFile = fs.readFileSync(envPath, 'utf-8');
  envConfig = envFile
    .split('\n')
    .filter(line => line.trim() !== '' && !line.startsWith('#'))
    .reduce((acc, line) => {
      const [key, ...values] = line.split('=');
      if (key) {
        acc[key.trim()] = values.join('=').trim().replace(/^['"]|['"]$/g, '');
      }
      return acc;
    }, {});
} catch (e) {
  console.error("Could not find .env file at the root. Make sure you run this script from the project root.");
  process.exit(1);
}

const supabaseUrl = envConfig.VITE_SUPABASE_URL;
const serviceRoleKey = envConfig.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("\x1b[31m%s\x1b[0m", "Missing SUPABASE_SERVICE_ROLE_KEY!");
  console.error("To seed users, you must bypass security constraints. Plase grab your Service Role Key from the Supabase Dashboard -> Project Settings -> API, and add it to your .env file as SUPABASE_SERVICE_ROLE_KEY=ey...\n");
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

async function seedTestUsers() {
  console.log("Seeding Evaluation Credentials...");

  // 1. Seed standard Subscriber
  const { data: user1, error: err1 } = await supabaseAdmin.auth.admin.createUser({
    email: 'final_subscriber@example.com',
    password: 'password123',
    email_confirm: true,
  });
  
  if (user1?.user) {
    console.log("✅ Standard Subscriber seeded:");
    console.log("   Email: final_subscriber@example.com | Pass: password123");
  } else if (err1?.message.includes("already registered")) {
    console.log("⚡ Subscriber already exists!");
  } else {
    console.error("Subscriber seed error:", err1?.message);
  }

  // 2. Seed Admin User
  const { data: user2, error: err2 } = await supabaseAdmin.auth.admin.createUser({
    email: 'super_admin@example.com',
    password: 'password123',
    email_confirm: true,
  });

  if (user2?.user) {
    // Manually override the role to 'admin' using the service_role key
    await supabaseAdmin
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', user2.user.id);
      
    console.log("✅ Secure Administrator seeded:");
    console.log("   Email: super_admin@example.com | Pass: password123");
  } else if (err2?.message.includes("already registered")) {
    console.log("⚡ Admin already exists!");
  } else {
    console.error("Admin seed error:", err2?.message);
  }
}

seedTestUsers();
