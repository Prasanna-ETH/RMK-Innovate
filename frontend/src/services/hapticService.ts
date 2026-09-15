import type { HapticPattern } from '../types/perception';

type HapticListener = (pattern: HapticPattern, activeMotors: { left: boolean; center: boolean; right: boolean }) => void;

class HapticService {
  private listeners: Set<HapticListener> = new Set();
  private isSimulationEnabled: boolean = true;
  private activeState = { left: false, center: false, right: false };
  private clearTimer: number | null = null;

  public setSimulationEnabled(enabled: boolean): void {
    this.isSimulationEnabled = enabled;
  }

  public subscribe(listener: HapticListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public triggerPattern(pattern: HapticPattern): void {
    if (!this.isSimulationEnabled || pattern === 'NONE') return;

    if (this.clearTimer) {
      window.clearTimeout(this.clearTimer);
    }

    let left = false;
    let center = false;
    let right = false;
    let vibPattern: number[] = [100];

    switch (pattern) {
      case 'LEFT_PULSE':
        left = true;
        vibPattern = [150, 50, 150];
        break;
      case 'RIGHT_PULSE':
        right = true;
        vibPattern = [150, 50, 150];
        break;
      case 'CENTER_PULSE':
        center = true;
        vibPattern = [200];
        break;
      case 'DOUBLE_PULSE':
        left = true;
        right = true;
        vibPattern = [100, 50, 100];
        break;
      case 'RAPID_ALERT':
        left = true;
        center = true;
        right = true;
        vibPattern = [80, 40, 80, 40, 80];
        break;
    }

    this.activeState = { left, center, right };
    this.notify(pattern, this.activeState);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(vibPattern);
      } catch {
        // Safe fallback
      }
    }

    this.clearTimer = window.setTimeout(() => {
      this.activeState = { left: false, center: false, right: false };
      this.notify('NONE', this.activeState);
    }, 600);
  }

  private notify(pattern: HapticPattern, activeMotors: { left: boolean; center: boolean; right: boolean }): void {
    this.listeners.forEach((l) => l(pattern, activeMotors));
  }
}

export const hapticService = new HapticService();
