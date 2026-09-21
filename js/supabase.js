/**
 * ============================================================================
 * STUDENT ACADEMIC MANAGEMENT SYSTEM (SAMS)
 * Supabase Client Configuration & Shared Utilities
 * ============================================================================
 * 
 * Instructions for User:
 * Replace SUPABASE_URL and SUPABASE_ANON_KEY with your project credentials:
 * 1. Open your Supabase project (https://supabase.com/dashboard)
 * 2. Go to Project Settings -> API
 * 3. Copy "Project URL" and "anon / public" Key
 * 4. Paste them below.
 * 
 * IMPORTANT: NEVER expose the service_role key here. Only use anon public key!
 */

// Helper to normalize Supabase URL (handles dashboard URLs automatically)
function normalizeSupabaseUrl(url) {
  if (!url) return '';
  url = url.trim();
  // If user pasted dashboard link: https://supabase.com/dashboard/project/<project_id>
  const match = url.match(/supabase\.com\/dashboard\/project\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `https://${match[1]}.supabase.co`;
  }
  // Ensure starts with https://
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  // Remove trailing slash
  return url.replace(/\/+$/, '');
}

const RAW_SUPABASE_URL = "https://mlqnhinrjphghjpoozpk.supabase.co"; // Auto-corrected from dashboard URL
const RAW_SUPABASE_ANON_KEY = "sb_publishable_dEmgxdL2WIPZbOnnnhF6_A_Y6qjP9Ir"; // Paste your anon (eyJ...) key here

// Allow saving credentials via browser if running demo before hardcoding
const savedUrl = localStorage.getItem('sams_supabase_url');
const savedKey = localStorage.getItem('sams_supabase_anon_key');

const activeUrl = normalizeSupabaseUrl(savedUrl || RAW_SUPABASE_URL);
const activeKey = (savedKey || RAW_SUPABASE_ANON_KEY).trim();

const isConfigured = activeUrl && !activeUrl.includes('placeholder-project') && activeKey && activeKey !== 'YOUR_SUPABASE_ANON_KEY';

let supabaseClient = null;

if (window.supabase && isConfigured) {
  try {
    supabaseClient = window.supabase.createClient(activeUrl, activeKey);
    console.log("✅ Supabase client initialized with URL:", activeUrl);
  } catch (err) {
    console.error("❌ Failed to initialize Supabase client:", err);
  }
}

/**
 * Toast Notification Utility
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️';
  toast.innerHTML = `<span>${icon}</span> <span>${message}</span>`;
  
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

/**
 * Theme Management (Light / Dark mode stored in localStorage)
 */
function initTheme() {
  const savedTheme = localStorage.getItem('sams_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('sams_theme', newTheme);
  updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
  const toggleBtns = document.querySelectorAll('.theme-toggle-btn');
  toggleBtns.forEach(btn => {
    if (btn) {
      btn.innerHTML = theme === 'dark' ? '☀️ Light' : '🌙 Dark';
    }
  });
}

// Check database configuration banner
function checkSupabaseConfigBanner() {
  if (!isConfigured) {
    const banner = document.createElement('div');
    banner.style.cssText = `
      background: #fef3c7; color: #92400e; border-bottom: 2px solid #f59e0b;
      padding: 10px 18px; font-size: 0.85rem; display: flex; align-items: center;
      justify-content: space-between; position: sticky; top: 0; z-index: 9999;
    `;
    banner.innerHTML = `
      <div>
        <strong>Notice:</strong> Supabase keys not set in <code>js/supabase.js</code>. 
        Running in <strong>Interactive Demo Mode</strong> with pre-populated sample database.
      </div>
      <div style="display: flex; gap: 8px;">
        <button onclick="promptSupabaseConfig()" class="btn btn-sm btn-primary" style="padding: 4px 8px; font-size: 0.75rem;">Set Supabase Keys</button>
        <button onclick="this.parentElement.parentElement.remove()" style="background:none; border:none; cursor:pointer; font-weight:bold; color: #92400e;">✕</button>
      </div>
    `;
    document.body.prepend(banner);
  }
}

function promptSupabaseConfig() {
  const url = prompt("Enter your Supabase Project URL (e.g., https://xyz.supabase.co):", savedUrl || "");
  if (url === null) return;
  const key = prompt("Enter your Supabase Public Anon Key:", savedKey || "");
  if (key === null) return;

  if (url && key) {
    localStorage.setItem('sams_supabase_url', url.trim());
    localStorage.setItem('sams_supabase_anon_key', key.trim());
    showToast("Supabase credentials saved! Reloading...", "success");
    setTimeout(() => window.location.reload(), 1000);
  }
}

// Run on page load
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  checkSupabaseConfigBanner();
});
