/**
 * Config.js - API & System Config
 */
const SUPABASE_URL = "https://nkofqdsnxswwphavsxff.supabase.co"; 
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rb2ZxZHNueHN3d3BoYXZzeGZmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg4NDk2MTcsImV4cCI6MjEwNDQyNTYxN30.SIP29QIw-MWq4_i3iW9TDZ5hRDI4Vt7u99bO-hm2QG8"; 

// 🔑 LIFF ID
const LIFF_ID = "2011660540-tgrqnS6s"; 

// 🔑 Gemini API Key
const GEMINI_API_KEY = "AQ.Ab8RN6IuIf4QZKSxwcBp5ap8d_6SNc5_fzj02ynhtG2sNwBTOA"; 

// สร้างออบเจกต์ CONFIG สำหรับโมดูลอื่นๆ เรียกใช้
const CONFIG = {
    LINE: {
        LIFF_ID: LIFF_ID
    }
};

// ตรวจสอบการโหลด Supabase SDK
let _supabase = null;
if (typeof supabase !== 'undefined' && supabase.createClient) {
    _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
} else {
    console.error("Supabase SDK is not loaded!");
}