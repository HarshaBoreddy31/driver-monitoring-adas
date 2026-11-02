import { useEffect, useState, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { SimulationState, WarningEvent } from '../types';

export function useSocket() {
  const [state, setState] = useState<SimulationState | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [latencyMs, setLatencyMs] = useState<number>(0);
  const [recentEvents, setRecentEvents] = useState<WarningEvent[]>([]);

  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    // Connect to server (using window.location.origin via Vite proxy or direct port 4000)
    const socket = io({
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      console.log('[Socket] Connected to backend');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('[Socket] Disconnected from backend');
    });

    // Authoritative full state snapshot
    socket.on('simulation:state', (newState: SimulationState) => {
      setState(newState);
    });

    // Warning alert triggered (Caution or Danger)
    socket.on('warning:triggered', (event: WarningEvent) => {
      setRecentEvents((prev) => [event, ...prev.slice(0, 49)]);
    });

    // Warning cleared (Safe)
    socket.on('warning:cleared', (event: WarningEvent) => {
      setRecentEvents((prev) => [event, ...prev.slice(0, 49)]);
    });

    // Ping latency check
    const pingInterval = setInterval(() => {
      const start = Date.now();
      socket.emit('ping', () => {
        setLatencyMs(Date.now() - start);
      });
    }, 4000);

    return () => {
      clearInterval(pingInterval);
      socket.disconnect();
    };
  }, []);

  const sendCommand = useCallback((event: string, data?: any) => {
    if (socketRef.current && socketRef.current.connected) {
      socketRef.current.emit(event, data);
    }
  }, []);

  const start = useCallback(() => sendCommand('client:control:start'), [sendCommand]);
  const pause = useCallback(() => sendCommand('client:control:pause'), [sendCommand]);
  const resume = useCallback(() => sendCommand('client:control:resume'), [sendCommand]);
  const reset = useCallback(() => sendCommand('client:control:reset'), [sendCommand]);
  const setSpeed = useCallback((speedMs: number) => sendCommand('client:control:speed', { speedMs }), [sendCommand]);
  const setLane = useCallback((lane: number) => sendCommand('client:control:lane', { lane }), [sendCommand]);
  const applyBrake = useCallback(
    (active: boolean, emergency = false) => sendCommand('client:control:brake', { active, emergency }),
    [sendCommand]
  );
  const triggerScenario = useCallback((scenario: string) => sendCommand('client:control:scenario', { scenario }), [sendCommand]);

  return {
    state,
    isConnected,
    latencyMs,
    recentEvents,
    start,
    pause,
    resume,
    reset,
    setSpeed,
    setLane,
    applyBrake,
    triggerScenario,
  };
}
