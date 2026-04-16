import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "VOTRE_URL_SUPABASE";
const supabaseKey = "VOTRE_ANON_KEY";

export const supabase = createClient(supabaseUrl, supabaseKey);