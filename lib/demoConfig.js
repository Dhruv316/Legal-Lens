// ============================================================
// LEGAL LENS — DEMO MODE SWITCH
// ============================================================
// When true: the main tabs (Dashboard, Check Compliance,
// Seller Verification, Products, Entities, Rewards) render instantly
// from local cached data — no backend calls are made.
//
// When false: every tab falls back to the original real
// backend-driven behavior. Nothing about the real backend
// integration is removed — this is purely a UI-layer switch.
// ============================================================
export const DEMO_MODE = true;

export const DEMO_USER = {
  userId: 1,
  role: 'consumer',
  name: 'Dhruv',
};

export const APP_NAME = 'LEGAL LENS';
export const APP_VERSION = 'v2.6 LEGAL LENS';
