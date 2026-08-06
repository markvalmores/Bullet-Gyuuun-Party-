/**
 * Web Vibration API Helper
 * Provides crisp tactile haptic feedback for taps, note hits, fever mode, and shop interactions.
 */

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'double' | 'fever') => {
  if (typeof window === 'undefined' || !('vibrate' in navigator)) return;

  try {
    switch (type) {
      case 'light':
        navigator.vibrate(12);
        break;
      case 'medium':
        navigator.vibrate(25);
        break;
      case 'heavy':
        navigator.vibrate(45);
        break;
      case 'double':
        navigator.vibrate([15, 30, 15]);
        break;
      case 'fever':
        navigator.vibrate([30, 20, 30, 20, 50]);
        break;
      default:
        navigator.vibrate(15);
    }
  } catch (e) {
    // Vibration API may fail or be restricted by browser settings
  }
};
