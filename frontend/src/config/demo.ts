/**
 * One-click demo accounts exist only in development builds (`vite dev`).
 * In production builds `import.meta.env.DEV` is statically `false`, so these credentials and
 * the demo buttons are stripped from the bundle entirely.
 */
type DemoRole = 'ADMIN' | 'BUYER';

const DEMO_ACCOUNTS: Record<DemoRole, { email: string; password: string }> | null = import.meta.env.DEV
  ? {
      ADMIN: { email: 'admin@auctionlens.io', password: 'AdminPassword@2026' },
      BUYER: { email: 'buyer@auctionlens.io', password: 'BuyerPassword@2026' }
    }
  : null;

export const demoLoginEnabled = DEMO_ACCOUNTS !== null;

export function getDemoAccount(role: DemoRole) {
  return DEMO_ACCOUNTS?.[role] ?? null;
}
