import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://tizillbipsqgdpejagjc.supabase.co";
const supabaseKey = "sb_publishable_ZYE_Oz72RuNAfxp9SGaZ_W_xuV2SgbzKEY";

export const supabase = createClient(supabaseUrl, supabaseKey);