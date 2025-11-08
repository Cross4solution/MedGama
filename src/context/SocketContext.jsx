import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { token } = useAuth();
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);
  const roomsRef = useRef(new Set());

  const WS_URL = process.env.REACT_APP_WS_URL || process.env.REACT_APP_API_BASE || '';

  useEffect(() => {
    if (!WS_URL) return;
    const s = io(WS_URL, {
      transports: ['websocket'],
      auth: { token },
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000
    });
    socketRef.current = s;
    const onConnect = () => {
      setConnected(true);
      roomsRef.current.forEach((r) => s.emit('room:join', { roomId: r }));
    };
    const onDisconnect = () => setConnected(false);
    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);
    s.on('connect_error', () => setConnected(false));
    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
      try { s.disconnect(); } catch {}
      socketRef.current = null;
    };
  }, [WS_URL, token]);

  const joinRoom = (roomId) => {
    if (!roomId) return;
    roomsRef.current.add(roomId);
    socketRef.current?.emit('room:join', { roomId });
  };
  const leaveRoom = (roomId) => {
    if (!roomId) return;
    roomsRef.current.delete(roomId);
    socketRef.current?.emit('room:leave', { roomId });
  };
  const sendMessage = (payload) => {
    socketRef.current?.emit('message:new', payload);
  };
  const emitTyping = (roomId, isTyping) => {
    socketRef.current?.emit('user:typing', { roomId, isTyping });
  };

  const value = useMemo(() => ({
    socket: socketRef.current,
    connected,
    joinRoom,
    leaveRoom,
    sendMessage,
    emitTyping
  }), [connected]);

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
