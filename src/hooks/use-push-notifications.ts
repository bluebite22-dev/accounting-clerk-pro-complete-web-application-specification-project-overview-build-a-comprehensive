"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/auth-store";

interface PushNotificationState {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  loading: boolean;
  error: string | null;
}

interface PushNotificationActions {
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  requestPermission: () => Promise<NotificationPermission>;
}

export function usePushNotifications(): PushNotificationState & PushNotificationActions {
  const [state, setState] = useState<PushNotificationState>({
    supported: false,
    permission: "default" as NotificationPermission,
    subscribed: false,
    loading: true,
    error: null,
  });

  const { user } = useAuthStore();

  // Check if push is supported
  useEffect(() => {
    const isSupported = "serviceWorker" in navigator && "PushManager" in window;
    
    let permission: NotificationPermission = "default";
    if (isSupported && typeof Notification !== "undefined" && Notification.permission) {
      permission = Notification.permission;
    }

    setState((prev) => ({
      ...prev,
      supported: isSupported,
      permission,
      loading: false,
    }));

    if (isSupported && user?.id) {
      checkSubscription();
    }
  }, [user?.id]);

  // Register service worker
  const registerServiceWorker = useCallback(async (): Promise<ServiceWorkerRegistration | null> => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("[Push] Service Worker registered:", registration);
      
      // Wait for the service worker to be ready
      await navigator.serviceWorker.ready;
      
      return registration;
    } catch (error) {
      console.error("[Push] Service Worker registration failed:", error);
      setState((prev) => ({
        ...prev,
        error: "Service Worker registration failed",
      }));
      return null;
    }
  }, []);

  // Check existing subscription
  const checkSubscription = useCallback(async () => {
    if (!user?.id) return;

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      
      setState((prev) => ({
        ...prev,
        subscribed: !!subscription,
      }));
    } catch (error) {
      console.error("[Push] Error checking subscription:", error);
    }
  }, [user?.id]);

  // Subscribe to push notifications
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.supported || !user?.id) {
      setState((prev) => ({ ...prev, error: "Push notifications not supported" }));
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Get VAPID public key
      const vapidResponse = await fetch("/api/push");
      const { publicKey } = await vapidResponse.json();

      // Request permission
      const permission = await Notification.requestPermission();
      
      if (permission !== "granted") {
        setState((prev) => ({
          ...prev,
          permission,
          loading: false,
          error: "Permission denied",
        }));
        return false;
      }

      // Register service worker
      const registration = await registerServiceWorker();
      if (!registration) {
        return false;
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as any,
      });

      // Send subscription to server
      const response = await fetch("/api/push", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          subscription: subscription.toJSON(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save subscription");
      }

      // Sync with service worker
      await navigator.serviceWorker.ready;

      setState((prev) => ({
        ...prev,
        permission: "granted",
        subscribed: true,
        loading: false,
      }));

      return true;
    } catch (error) {
      console.error("[Push] Subscription error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Subscription failed",
      }));
      return false;
    }
  }, [state.supported, user?.id, registerServiceWorker]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!user?.id) {
      return false;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();

      if (subscription) {
        await subscription.unsubscribe();

        // Notify server
        await fetch(`/api/push?userId=${user.id}`, {
          method: "DELETE",
        });
      }

      setState((prev) => ({
        ...prev,
        subscribed: false,
        loading: false,
      }));

      return true;
    } catch (error) {
      console.error("[Push] Unsubscribe error:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Unsubscribe failed",
      }));
      return false;
    }
  }, [user?.id]);

  // Request permission again
  const requestPermission = useCallback(async (): Promise<NotificationPermission> => {
    try {
      const permission = await Notification.requestPermission();
      setState((prev) => ({ ...prev, permission }));
      return permission;
    } catch (error) {
      console.error("[Push] Permission request error:", error);
      return "denied";
    }
  }, []);

  return {
    ...state,
    subscribe,
    unsubscribe,
    requestPermission,
  };
}

// Helper function to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Hook for listening to push notifications in the app
export function usePushListener(
  onNotification: (notification: Notification & { data?: any }) => void
) {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "PUSH_NOTIFICATION") {
        onNotification(event.data.notification);
      }
    };

    navigator.serviceWorker.addEventListener("message", handleMessage);

    return () => {
      navigator.serviceWorker.removeEventListener("message", handleMessage);
    };
  }, [onNotification]);
}

// Hook for checking online status
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    // Use requestAnimationFrame to defer the synchronous setState
    const initOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };
    
    // Schedule initialization
    const timer = requestAnimationFrame(initOnlineStatus);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      cancelAnimationFrame(timer);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return isOnline;
}

// Hook for requesting background sync
export function useBackgroundSync(tag: string) {
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestSync = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      // @ts-expect-error - sync may not be available in all browsers
      if (registration.sync) {
        // @ts-expect-error - sync may not be available in all browsers
        await registration.sync.register(tag);
        setSyncing(true);
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sync registration failed");
    }
  }, [tag]);

  return { syncing, error, requestSync };
}
