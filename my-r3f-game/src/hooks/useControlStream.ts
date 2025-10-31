import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Type declaration for Vite environment variables
declare global {
  interface ImportMeta {
    env: {
      VITE_WS_URL?: string;
      VITE_API_BASE_URL?: string;
      DEV?: boolean;
    };
  }
}

const CONTROL_SCHEMA_VERSION = 1;
const MAX_RECONNECT_DELAY_MS = 10_000;
const MAX_RECONNECT_ATTEMPTS = 5;

export type ConnectionState = 'connecting' | 'open' | 'error' | 'closed';

export interface ControlStreamState {
  connection: ConnectionState;
  lastControlX: number;
  smoothedControlX: number;
  statusMessage?: string;
  reconnectAttempts: number;
  retryDelayMs?: number;
  canRetry: boolean;
  receivedFrames: number;
}

export interface ControlStreamApi {
  state: ControlStreamState;
  retry: () => void;
  enable: () => void;
  disable: () => void;
  isEnabled: boolean;
}

export function useControlStream(explicitUrl?: string): ControlStreamApi {
  const [isEnabled, setIsEnabled] = useState(false);
  const [state, setState] = useState<ControlStreamState>({
    connection: 'closed',
    lastControlX: 0,
    smoothedControlX: 0,
    statusMessage: 'Disabled – enable in debug panel',
    reconnectAttempts: 0,
    canRetry: false,
    retryDelayMs: undefined,
    receivedFrames: 0,
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const latestControlRef = useRef(0);
  const pendingRestartRef = useRef(false);

  const wsUrl = useMemo(() => {
    if (explicitUrl) {
      console.log('[control-stream] Using explicit URL:', explicitUrl);
      return explicitUrl;
    }
    const hinted =
      import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_BASE_URL || undefined;
    if (hinted) {
      try {
        const base = new URL(hinted, window.location.origin);
        base.protocol = base.protocol === 'https:' ? 'wss:' : 'ws:';
        base.pathname = '/ws';
        base.search = '';
        base.hash = '';
        const url = base.toString();
        console.log('[control-stream] Using hinted URL:', url);
        return url;
      } catch (err) {
        console.warn('Failed to construct WS URL from hint', err);
      }
    }
    // Default to localhost:8765 for development
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const defaultUrl = `${protocol}://localhost:8765/ws`;
    return defaultUrl;
  }, [explicitUrl]);

  const cleanupSocket = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.onopen = null;
      wsRef.current.onmessage = null;
      wsRef.current.onclose = null;
      wsRef.current.onerror = null;
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const scheduleReconnect = useCallback(
    (attempt: number) => {
      if (attempt >= MAX_RECONNECT_ATTEMPTS) {
        setState(prev => ({
          ...prev,
          connection: 'closed',
          statusMessage: 'Disconnected – manual retry required',
          canRetry: true,
        }));
        pendingRestartRef.current = false;
        return;
      }

      const delay = Math.min(1000 * 2 ** attempt, MAX_RECONNECT_DELAY_MS);
      setState(prev => ({
        ...prev,
        statusMessage: `Disconnected – retrying in ${Math.ceil(delay / 1000)}s`,
        retryDelayMs: delay,
        reconnectAttempts: attempt,
        canRetry: false,
      }));
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
      }
      reconnectTimerRef.current = window.setTimeout(() => {
        reconnectTimerRef.current = null;
        pendingRestartRef.current = false;
        connect(attempt);
      }, delay);
    },
    []
  );

  const connect = useCallback(
    (attempt = 0) => {
      if (pendingRestartRef.current || !isEnabled) {
        return;
      }
      pendingRestartRef.current = true;
      cleanupSocket();
      setState(prev => ({
        ...prev,
        connection: 'connecting',
        statusMessage: 'Connecting…',
        reconnectAttempts: attempt,
        retryDelayMs: undefined,
        canRetry: false,
      }));

      try {
        console.log('[control-stream] Attempting to connect to:', wsUrl);
        const socket = new WebSocket(wsUrl);
        wsRef.current = socket;

        socket.onopen = () => {
          pendingRestartRef.current = false;
          setState(prev => ({
            ...prev,
            connection: 'open',
            statusMessage: undefined,
            reconnectAttempts: 0,
            canRetry: false,
            receivedFrames: prev.receivedFrames, // unchanged on open
          }));
        };

        socket.onmessage = event => {
          try {
            const frame = JSON.parse(event.data);
            if (frame?.kind !== 'control') {
              return;
            }
            if (frame.schema_version !== CONTROL_SCHEMA_VERSION) {
              setState(prev => ({
                ...prev,
                statusMessage: 'Incompatible control schema version',
              }));
              return;
            }
            const controlX = clampControl(frame.control_x);
            latestControlRef.current = controlX;
            if (import.meta.env.DEV) {
              console.debug('[control-stream] received control_x:', controlX);
            }
            setState(prev => ({
              ...prev,
              lastControlX: controlX,
              receivedFrames: prev.receivedFrames + 1,
            }));
          } catch (err) {
            setState(prev => ({
              ...prev,
              statusMessage: 'Invalid frame received',
            }));
          }
        };

        socket.onerror = () => {
          setState(prev => ({
            ...prev,
            connection: 'error',
            statusMessage: 'Connection error',
          }));
        };

        socket.onclose = () => {
          cleanupSocket();
          setState(prev => ({
            ...prev,
            connection: 'error',
            statusMessage: 'Connection lost',
            reconnectAttempts: attempt + 1,
          }));
          pendingRestartRef.current = false;
          scheduleReconnect(attempt + 1);
        };
      } catch (err) {
        setState(prev => ({
          ...prev,
          connection: 'error',
          statusMessage: (err as Error).message ?? 'Failed to open websocket',
        }));
        pendingRestartRef.current = false;
        scheduleReconnect(attempt + 1);
      }
    },
    [cleanupSocket, scheduleReconnect, wsUrl, isEnabled]
  );

  useEffect(() => {
    if (isEnabled) {
      connect();
    } else {
      cleanupSocket();
    }
    return () => {
      if (reconnectTimerRef.current) {
        window.clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      cleanupSocket();
    };
  }, [cleanupSocket, connect, isEnabled]);

  useEffect(() => {
    let frameId: number;
    const animate = () => {
      setState(prev => {
        const target = latestControlRef.current;
        const nextSmoothed = smoothTowards(prev.smoothedControlX, target);
        if (
          Math.abs(nextSmoothed - prev.smoothedControlX) < 0.0001 &&
          Math.abs(prev.lastControlX - target) < 0.0001
        ) {
          return prev;
        }
        return {
          ...prev,
          lastControlX: target,
          smoothedControlX: nextSmoothed,
        };
      });
      frameId = window.requestAnimationFrame(animate);
    };
    frameId = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(frameId);
  }, []);

  const retry = useCallback(() => {
    if (state.connection === 'open' || !isEnabled) {
      return;
    }
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    setState(prev => ({
      ...prev,
      connection: 'connecting',
      statusMessage: 'Reconnecting…',
      reconnectAttempts: 0,
      retryDelayMs: undefined,
      canRetry: false,
      receivedFrames: prev.receivedFrames,
    }));
    connect(0);
  }, [connect, state.connection, isEnabled]);

  const enable = useCallback(() => {
    console.log('[control-stream] Enabling WebSocket connection');
    setIsEnabled(true);
  }, []);

  const disable = useCallback(() => {
    console.log('[control-stream] Disabling WebSocket connection');
    setIsEnabled(false);
    cleanupSocket();
    setState(prev => ({
      ...prev,
      connection: 'closed',
      statusMessage: 'Disabled by user',
      canRetry: false,
    }));
  }, [cleanupSocket]);

  return { state, retry, enable, disable, isEnabled };
}

function clampControl(value: unknown): number {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return 0;
  }
  if (value > 1) {
    return 1;
  }
  if (value < -1) {
    return -1;
  }
  return value;
}

function smoothTowards(current: number, target: number): number {
  const eased = current + (target - current) * 0.2;
  if (Math.abs(eased - target) < 0.0001) {
    return target;
  }
  return Math.max(-1, Math.min(1, eased));
}