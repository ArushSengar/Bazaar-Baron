import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { io as Client } from 'socket.io-client';
import {
  createRoom,
  joinRoom,
  handlePlayerIntent,
  handleDisconnect
} from '../rooms.js';

describe('Stage 1 Integration: Server + Lobby Real-time Flow', () => {
  let server, io, port, serverUrl;
  let client1, client2;

  before((_, done) => {
    const app = express();
    server = http.createServer(app);
    io = new Server(server, { cors: { origin: '*' } });

    io.on('connection', (socket) => {
      socket.on('create_room', (data, cb) => {
        const res = createRoom(socket, data);
        if (cb) cb(res);
      });
      socket.on('join_room', (data, cb) => {
        const res = joinRoom(socket, data);
        if (res.success) {
          io.to(res.roomCode).emit('game_state_updated', res.gameState);
        }
        if (cb) cb(res);
      });
      socket.on('start_game', (cb) => {
        const res = handlePlayerIntent(socket, { type: 'START_GAME' }, io);
        if (cb) cb(res);
      });
      socket.on('disconnect', () => {
        handleDisconnect(socket, io);
      });
    });

    server.listen(0, () => {
      port = server.address().port;
      serverUrl = `http://localhost:${port}`;
      done();
    });
  });

  after((_, done) => {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
    if (io) {
      io.disconnectSockets(true);
      io.close();
    }
    if (server) {
      server.close(() => {
        done();
      });
      server.unref();
    } else {
      done();
    }
  });

  it('Player 1 creates room, Player 2 joins, Host starts game', async () => {
    client1 = Client(serverUrl, { reconnection: false });
    client2 = Client(serverUrl, { reconnection: false });

    // Wait for client1 connect
    await new Promise((resolve) => client1.on('connect', resolve));
    await new Promise((resolve) => client2.on('connect', resolve));

    // Player 1 creates room
    let roomCode = '';
    const createRes = await new Promise((resolve) => {
      client1.emit('create_room', { name: 'Sethji', color: 'amber' }, resolve);
    });

    assert.equal(createRes.success, true);
    assert.equal(createRes.gameState.players.length, 1);
    assert.equal(createRes.player.name, 'Sethji');
    assert.equal(createRes.player.isHost, true);
    assert.match(createRes.roomCode, /^[A-Z]{4}$/);
    roomCode = createRes.roomCode;

    // Player 2 listens for state updates
    const player2JoinPromise = new Promise((resolve) => {
      client1.on('game_state_updated', (state) => {
        if (state.players.length === 2) {
          resolve(state);
        }
      });
    });

    // Player 2 joins room
    const joinRes = await new Promise((resolve) => {
      client2.emit('join_room', { roomCode, name: 'Raja', color: 'blue' }, resolve);
    });

    assert.equal(joinRes.success, true);
    assert.equal(joinRes.gameState.players.length, 2);
    assert.equal(joinRes.player.name, 'Raja');
    assert.equal(joinRes.player.isHost, false);

    // Verify Player 1 received the update with Player 2 present
    const updatedState = await player2JoinPromise;
    assert.equal(updatedState.players.length, 2);
    assert.equal(updatedState.players[1].name, 'Raja');

    // Host clicks Start Game
    const startNotificationPromise = new Promise((resolve) => {
      client2.on('game_state_updated', (state) => {
        if (state.phase === 'PLAYING') {
          resolve(state);
        }
      });
    });

    const startRes = await new Promise((resolve) => {
      client1.emit('start_game', resolve);
    });

    assert.equal(startRes.success, true);

    const activeState = await startNotificationPromise;
    assert.equal(activeState.phase, 'PLAYING');
    assert.equal(activeState.players.length, 2);
    assert.equal(activeState.playerOrder.length, 2);
    assert.equal(activeState.step, 'INITIAL');
  });
});
