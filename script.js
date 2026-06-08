// script.js
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase-config.js';

if (SUPABASE_URL.includes("your-project-id") || SUPABASE_ANON_KEY.includes("your-anon-key")) {
    console.error("❌ STOP! You are still using the placeholder template keys. Please update your supabase-config.js file with your actual Supabase dashboard credentials.");
    alert("Database connection error: Placeholder keys detected.");
} else {
    // Initialize your Supabase client safely!
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}