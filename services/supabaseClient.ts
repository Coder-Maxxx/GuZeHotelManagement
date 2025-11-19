
import { createClient } from '@supabase/supabase-js';

// Credentials extracted from your request
// In a production environment, these should be in environment variables
const SUPABASE_URL = 'https://xygxzqouypunlhgqosut.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5Z3h6cW91eXB1bmxoZ3Fvc3V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NTIwMTMsImV4cCI6MjA3OTEyODAxM30.yzhfeazqWBof1By_PRr_5AXj5eXibFWWatSqsXa0e0k';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
