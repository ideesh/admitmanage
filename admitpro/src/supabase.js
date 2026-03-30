

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://erwoamyobgubboyfnldw.supabase.co'
const SUPABASE_KEY = 'sb_publishable_Ba99wmnyhTurXTC1mQ0y4w_AF_kZW4W'


export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)