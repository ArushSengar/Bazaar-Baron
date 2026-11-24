import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';

const STORAGE_KEY_ROOM = 'bb_room_code';
const STORAGE_KEY_TOKEN = 'bb_player_token';
const STORAGE_KEY_PLAYER_ID = 'bb_player_id';

export function useGame() {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [roomCode, setRoomCode] = useState(() => localStorage.getItem(STORAGE_KEY_ROOM) || '');
  const [playerToken, setPlayerToken] = useState(() => localStorage.getItem(STORAGE_KEY_TOKEN) || '');
  const [playerId, setPlayerId] = useState(() => localStorage.getItem(STORAGE_KEY_PLAYER_ID) || '');
  const [gameState, setGameState] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Initialize socket
  useEffect(() => {
    // In dev with Vite proxy or production same-origin
    const socketInstance = io({
      transports: ['websocket', 'polling']
    });

    socketInstance.on('connect', () => {
      setConnected(true);
      setError('');

      // Auto-reconnect if tokens exist
      const savedRoom = localStorage.getItem(STORAGE_KEY_ROOM);
      const savedToken = localStorage.getItem(STORAGE_KEY_TOKEN);
      if (savedRoom && savedToken) {
        socketInstance.emit('join_room', { roomCode: savedRoom, playerToken: savedToken }, (res) => {
          if (res?.success) {
            setGameState(res.gameState);
            setRoomCode(res.roomCode);
            setPlayerToken(res.playerToken);
            setPlayerId(res.playerId);
          } else {
            // Room no longer exists or expired
            localStorage.removeItem(STORAGE_KEY_ROOM);
            localStorage.removeItem(STORAGE_KEY_TOKEN);
            localStorage.removeItem(STORAGE_KEY_PLAYER_ID);
            setRoomCode('');
            setPlayerToken('');
            setPlayerId('');
            setGameState(null);
          }
        });
      }
    });

    socketInstance.on('disconnect', () => {
      setConnected(false);
    });

    socketInstance.on('game_state_updated', (updatedState) => {
      setGameState(updatedState);
    });

    socketInstance.on('kicked', (data) => {
      setError(data.message || 'You were kicked by the host.');
      localStorage.removeItem(STORAGE_KEY_ROOM);
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_PLAYER_ID);
      setRoomCode('');
      setPlayerToken('');
      setPlayerId('');
      setGameState(null);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Create Room
  const createRoom = useCallback(({ name, color, avatar, gameType }) => {
    if (!socket) return;
    setLoading(true);
    setError('');

    socket.emit('create_room', { name, color, avatar, gameType }, (res) => {
      setLoading(false);
      if (res?.success) {
        setRoomCode(res.roomCode);
        setPlayerToken(res.playerToken);
        setPlayerId(res.playerId);
        setGameState(res.gameState);

        localStorage.setItem(STORAGE_KEY_ROOM, res.roomCode);
        localStorage.setItem(STORAGE_KEY_TOKEN, res.playerToken);
        localStorage.setItem(STORAGE_KEY_PLAYER_ID, res.playerId);
      } else {
        setError(res?.error || 'Failed to create room.');
      }
    });
  }, [socket]);

  // Join Room
  const joinRoom = useCallback(({ roomCode: targetCode, name, color }) => {
    if (!socket) return;
    setLoading(true);
    setError('');

    const token = localStorage.getItem(STORAGE_KEY_TOKEN);

    socket.emit('join_room', { roomCode: targetCode, name, color, playerToken: token }, (res) => {
      setLoading(false);
      if (res?.success) {
        setRoomCode(res.roomCode);
        setPlayerToken(res.playerToken);
        setPlayerId(res.playerId);
        setGameState(res.gameState);

        localStorage.setItem(STORAGE_KEY_ROOM, res.roomCode);
        localStorage.setItem(STORAGE_KEY_TOKEN, res.playerToken);
        localStorage.setItem(STORAGE_KEY_PLAYER_ID, res.playerId);
      } else {
        setError(res?.error || 'Failed to join room.');
      }
    });
  }, [socket]);

  // Set Color in Lobby
  const setColor = useCallback((newColor) => {
    if (!socket) return;
    socket.emit('set_color', { color: newColor }, (res) => {
      if (!res?.success && res?.error) {
        setError(res.error);
      }
    });
  }, [socket]);

  // Set Avatar in Lobby
  const setAvatar = useCallback((newAvatar) => {
    if (!socket) return;
    socket.emit('set_avatar', { avatar: newAvatar }, (res) => {
      if (!res?.success && res?.error) {
        setError(res.error);
      }
    });
  }, [socket]);

  // Add AI Bot Player (Host)
  const addBot = useCallback((botData) => {
    if (!socket) return;
    socket.emit('add_bot', botData || {}, (res) => {
      if (!res?.success && res?.error) {
        setError(res.error);
      }
    });
  }, [socket]);

  // Kick Player (Host)
  const kickPlayer = useCallback((targetPlayerId) => {
    if (!socket) return;
    socket.emit('kick_player', { targetPlayerId }, (res) => {
      if (!res?.success && res?.error) {
        setError(res.error);
      }
    });
  }, [socket]);

  // Start Game (Host)
  const startGame = useCallback(() => {
    if (!socket) return;
    setError('');
    socket.emit('start_game', (res) => {
      if (!res?.success && res?.error) {
        setError(res.error);
      }
    });
  }, [socket]);

  // Send Intent
  const sendIntent = useCallback((intent) => {
    if (!socket) return;
    socket.emit('game_intent', intent, (res) => {
      if (!res?.success && res?.error) {
        setError(res.error);
      }
    });
  }, [socket]);

  // Leave Room
  const leaveRoom = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY_ROOM);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    localStorage.removeItem(STORAGE_KEY_PLAYER_ID);
    setRoomCode('');
    setPlayerToken('');
    setPlayerId('');
    setGameState(null);
    setError('');
  }, []);

  const currentPlayer = gameState?.players?.find(p => p.id === playerId) || null;
  const isHost = Boolean(currentPlayer?.isHost);

  return {
    socket,
    connected,
    loading,
    error,
    setError,
    roomCode,
    playerId,
    playerToken,
    gameState,
    player: currentPlayer,
    isHost,
    createRoom,
    joinRoom,
    setColor,
    setAvatar,
    addBot,
    kickPlayer,
    startGame,
    sendIntent,
    leaveRoom
  };
}
