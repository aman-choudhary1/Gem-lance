import { useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Bookmark toggle with consistent UX: prompts anonymous users to sign in and surfaces API errors
 * as toasts instead of blocking browser alerts or silent unhandled rejections.
 */
export function useSaveAuction() {
  const { user, savedAuctionIds, toggleSave } = useAuth();
  const { showToast } = useToast();

  const toggle = useCallback(
    async (auctionId: string): Promise<void> => {
      if (!user) {
        showToast({
          type: 'info',
          title: 'Sign in to save auctions',
          message: 'Create a free account to build a watchlist and get alerts.',
          actionUrl: '/login',
          actionLabel: 'Sign in'
        });
        return;
      }
      try {
        const nowSaved = await toggleSave(auctionId);
        showToast({
          type: 'success',
          title: nowSaved ? 'Saved to watchlist' : 'Removed from watchlist',
          message: nowSaved ? 'You can find it under Saved.' : 'The auction was removed from your watchlist.',
          actionUrl: nowSaved ? '/saved' : undefined,
          actionLabel: nowSaved ? 'View saved' : undefined,
          duration: 3500
        });
      } catch (err: any) {
        showToast({
          type: 'error',
          title: 'Could not update watchlist',
          message: err?.response?.data?.error?.message || err?.message || 'Please try again.'
        });
      }
    },
    [user, toggleSave, showToast]
  );

  return { toggle, isSaved: (id: string) => savedAuctionIds.has(id) };
}
