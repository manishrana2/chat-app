"use client";

import { useEffect, useState } from "react";

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
}

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>("denied");
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Initialize audio context for notification sound
    if (typeof window !== "undefined" && !audioContext) {
      const initAudio = () => {
        const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
        setAudioContext(ctx);
      };
      
      try {
        initAudio();
      } catch (e) {
        console.warn("AudioContext not available:", e);
      }
    }

    // Request notification permission
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission !== "granted" && Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          setPermission(perm);
        });
      } else {
        setPermission(Notification.permission);
      }
    }
  }, [audioContext]);

  /**
   * Play notification sound
   */
  const playNotificationSound = () => {
    if (!audioContext) return;

    try {
      const ctx = audioContext;
      const now = ctx.currentTime;
      const duration = 0.5;

      // Create a simple beep sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      // Notification sound: two quick beeps
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.setValueAtTime(1200, now + 0.1);
      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);

      // Second beep
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.frequency.setValueAtTime(1000, now + 0.2);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.35);
    } catch (e) {
      console.warn("Failed to play notification sound:", e);
    }
  };

  /**
   * Send browser notification
   */
  const sendNotification = async (options: NotificationOptions) => {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return;
    }

    if (Notification.permission !== "granted") {
      console.warn("Notification permission not granted");
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || "/icon.png",
        badge: options.badge,
        tag: options.tag,
        vibrate: [200, 100, 200],
        requireInteraction: false,
      });

      // Play sound
      playNotificationSound();

      // Close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Focus app when notification clicked
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (e) {
      console.error("Failed to send notification:", e);
    }
  };

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      console.warn("Browser does not support notifications");
      return false;
    }

    if (Notification.permission === "granted") {
      return true;
    }

    if (Notification.permission !== "denied") {
      try {
        const perm = await Notification.requestPermission();
        setPermission(perm);
        return perm === "granted";
      } catch (e) {
        console.error("Failed to request notification permission:", e);
        return false;
      }
    }

    return false;
  };

  return {
    sendNotification,
    requestPermission,
    permission,
    canNotify: permission === "granted",
  };
}
