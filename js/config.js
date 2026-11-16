// 1) Paste the Web App URL from Google Apps Script (Deploy > Manage deployments) between the quotes. See SETUP-GUIDE.md.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwYoI6mTH92-u3BKbq9zxwhngo5HDQU4YNW_9zjv1d3R2Ahv6S8USvLlv_XRpoZXDZaKg/exec';
// 2) AI features (Gemini runs inside Apps Script). Set to true after you have saved GEMINI_API_KEY there.
window.AI_ENABLED = false;
window.API_OK = !APPS_SCRIPT_URL.includes('PASTE_YOUR');
