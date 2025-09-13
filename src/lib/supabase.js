import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://inklaylneesgvhxragxx.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlua2xheWxuZWVzZ3ZoeHJhZ3h4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDMzMDIsImV4cCI6MjA3MzA3OTMwMn0.YwRt-tp6c4bLrCJXYkgmHRFEUco6A9SvAh8visY4FEc'

export const supabase = createClient(supabaseUrl, supabaseKey)

