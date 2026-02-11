import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jhqzrbvsyvyhsyfkqvow.supabase.co'
const supabaseKey = 'sb_publishable_0HX0Eg-vfkoaNW4mlIQyMA_jWlwdtE9'

export const supabase = createClient(supabaseUrl, supabaseKey)