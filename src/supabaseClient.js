import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://safanjclehfrwrujcnoa.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNhZmFuamNsZWhmcndydWpjbm9hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ1ODkyMjgsImV4cCI6MjA2MDE2NTIyOH0.YATXcUY4W8GQSMXW9Lqc4n2BckZtpO8AjZwrT7s5_sU';
export const supabase = createClient(supabaseUrl, supabaseKey);
