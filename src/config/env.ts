/// <reference types="vite/client" />

/**
 * Central accessor untuk environment variables.
 * Semua service adapter wajib menggunakan konstanta dari file ini,
 * bukan import langsung dari import.meta.env.
 */

/** Base URL API backend, tanpa trailing slash */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string ?? 'http://localhost:8000';

/** Versi API (misal: "v1") */
export const API_VERSION = import.meta.env.VITE_API_VERSION as string ?? 'v1';

/** Prefix lengkap untuk semua endpoint (contoh: /api/v1) */
export const API_PREFIX = `/api/${API_VERSION}`;

/** Nama aplikasi */
export const APP_NAME = import.meta.env.VITE_APP_NAME as string ?? 'Portal Bendahara';

/**
 * Mode operasi aplikasi:
 * - "mock"  → gunakan data dummy in-memory (default, Phase 1-5)
 * - "live"  → gunakan API backend nyata
 */
export const APP_MODE = (import.meta.env.VITE_APP_MODE as string ?? 'mock') as 'mock' | 'live';

/** Helper: apakah saat ini menggunakan API nyata? */
export const IS_LIVE = APP_MODE === 'live';
