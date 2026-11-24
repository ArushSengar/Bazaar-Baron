import React, { useState } from 'react';
import { Crown, Copy, Check, Users, Wifi, LogOut, Play, UserX, AlertCircle, Bot, Plus, Sparkles } from 'lucide-react';
import { MERCHANT_AVATARS, PLAYER_COLORS, PLAYER_PAWNS } from '../data/constants';
import { PawnIcon } from './PawnIcon';

const PALETTE = [
  { id: 'red', name: 'Ruby Red', hex: '#D62F2F', text: '#ffffff' },
  { id: 'blue', name: 'Sapphire Blue', hex: '#2563EB', text: '#ffffff' },
  { id: 'green', name: 'Emerald Green', hex: '#2E9D5B', text: '#ffffff' },
  { id: 'amber', name: 'Amber Gold', hex: '#F28C28', text: '#000000' },
  { id: 'purple', name: 'Amethyst Purple', hex: '#9333EA', text: '#ffffff' },
  { id: 'teal', name: 'Teal Turquoise', hex: '#0D9488', text: '#ffffff' }
];

export function Lobby({
  gameState,
  player,
  isHost,
  createRoom,
  joinRoom,
  setColor,
  setAvatar,
  addBot,
  kickPlayer,
  startGame,
  leaveRoom,
  error,
  setError,
  loading,
  connected
}) {
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [selectedGameType, setSelectedGameType] = useState('monopoly'); // 'monopoly' | 'uno'
  const [name, setName] = useState('');
  const [inputCode, setInputCode] = useState('');
  const [selectedColor, setSelectedColor] = useState('red');
  const [selectedAvatar, setSelectedAvatar] = useState('👩‍💼');
  const [copied, setCopied] = useState(false);
  const [showBotPicker, setShowBotPicker] = useState(false);

  const isInRoom = Boolean(gameState && gameState.roomCode);

  const handleCopyCode = () => {
    if (!gameState?.roomCode) return;
    navigator.clipboard.writeText(gameState.roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCreate = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your player name.');
      return;
    }
    createRoom({
      name: name.trim(),
      color: selectedColor,
      avatar: selectedAvatar,
      gameType: selectedGameType
    });
  };

  const handleJoin = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your merchant name.');
      return;
    }
    if (!inputCode.trim() || inputCode.trim().length < 4) {
      setError('Please enter a valid 4-letter room code.');
      return;
    }
    joinRoom({
      roomCode: inputCode.trim().toUpperCase(),
      name: name.trim(),
      color: selectedColor,
      avatar: selectedAvatar
    });
  };

  // If already in a room, render the Room Lobby
  if (isInRoom) {
    const isUno = gameState.gameType === 'uno';
    const players = gameState.players || [];
    const maxPlayers = isUno ? 10 : 6;
    const canStart = players.length >= 2 && players.length <= maxPlayers;
    const takenColors = new Set(players.map(p => p.color));

    return (
      <div className="max-w-3xl mx-auto p-4 md:p-6 w-full font-body">
        {/* Room Header Card */}
        <div className="bg-gradient-to-r from-amber-950/40 via-neutral-900 to-amber-950/40 border border-amber-600/30 rounded-2xl p-5 sm:p-6 shadow-2xl backdrop-blur mb-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-4 border-b border-neutral-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold tracking-wider uppercase text-amber-400">
                <Wifi className={`w-3.5 h-3.5 ${connected ? 'text-emerald-400 animate-pulse' : 'text-red-400'}`} />
                {connected ? 'LAN Room Active' : 'Connecting to Server...'}
                <span className="text-[10px] bg-neutral-800 text-neutral-300 px-2 py-0.5 rounded-full border border-neutral-700">
                  {isUno ? '🃏 Bazaar UNO' : '🕌 Bazaar Baron'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-amber-100 tracking-tight mt-0.5 font-display">
                {isUno ? 'Bazaar UNO Lobby' : 'Bazaar Baron Lobby'}
              </h1>
            </div>

            {/* Room Code Badge */}
            <div className="flex items-center gap-2 bg-neutral-950 border border-amber-500/40 px-4 py-2 rounded-xl">
              <div className="text-right">
                <div className="text-[10px] text-amber-400/80 uppercase font-semibold">Room Code</div>
                <div className="text-2xl font-mono font-black text-amber-300 tracking-widest">
                  {gameState.roomCode}
                </div>
              </div>
              <button
                onClick={handleCopyCode}
                title="Copy Room Code"
                className="p-2 hover:bg-amber-500/10 rounded-lg text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
              >
                {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <p className="text-xs text-neutral-400 mt-3 text-center sm:text-left">
            Invite friends on your local Wi-Fi. Enter room code{' '}
            <span className="font-mono font-bold text-amber-300">{gameState.roomCode}</span> from any phone or PC browser.
          </p>
        </div>

        {error && (
          <div className="mb-4 bg-red-950/50 border border-red-500/50 rounded-xl p-3 flex items-center gap-2.5 text-sm text-red-200">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Players List Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl mb-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-neutral-100 font-display">Merchants in Lobby</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ml-1 ${
                players.length >= 2 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {players.length} / 6
              </span>
            </div>

            {/* Host: Add AI Friend / Bot Button */}
            {isHost && players.length < 6 && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBotPicker(!showBotPicker)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Bot className="w-4 h-4" />
                  <span>+ Add AI Friend</span>
                </button>

                {showBotPicker && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#FCF9F2] text-[#1B1B1B] border-2 border-[#8B5A2B]/40 rounded-2xl shadow-2xl p-3 z-30 space-y-2 animate-scale-up">
                    <span className="text-[10px] font-black uppercase text-[#7A6B5D] tracking-wider block">
                      Choose AI Merchant:
                    </span>
                    <div className="space-y-1">
                      {[
                        { name: 'Priya (AI)', avatar: '👩‍💼', desc: 'Sharp Real Estate Tycoon' },
                        { name: 'Rani (AI)', avatar: '👸', desc: 'Royal Monopoly Heiress' },
                        { name: 'Meera (AI)', avatar: '🧕', desc: 'Traditional Banker' },
                        { name: 'Aarav (AI)', avatar: '👳', desc: 'Spice Route Trader' },
                        { name: 'Kabir (AI)', avatar: '🧔', desc: 'Aggressive Gem Baron' }
                      ].map(botOpt => (
                        <button
                          key={botOpt.name}
                          onClick={() => {
                            addBot({ name: botOpt.name, avatar: botOpt.avatar });
                            setShowBotPicker(false);
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#EFE7D5] transition-colors flex items-center gap-2 cursor-pointer border border-transparent hover:border-[#D5C7B0]"
                        >
                          <span className="text-xl">{botOpt.avatar}</span>
                          <div>
                            <div className="text-xs font-bold">{botOpt.name}</div>
                            <div className="text-[10px] text-neutral-600">{botOpt.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Players Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {players.map((p) => {
              const colorObj = PALETTE.find(c => c.id === p.color) || PALETTE[0];
              const pShape = PLAYER_PAWNS[p.color] || 'hat';
              const isLocalPlayer = player?.id === p.id;

              return (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                    isLocalPlayer
                      ? 'bg-amber-500/10 border-amber-500/50 shadow-md'
                      : 'bg-neutral-950/70 border-neutral-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar & Pawn Display */}
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border-2"
                        style={{ borderColor: colorObj.hex, backgroundColor: `${colorObj.hex}22` }}
                      >
                        {p.avatar || '🧑'}
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center p-0.5 shadow border border-black/40"
                        style={{ backgroundColor: colorObj.hex }}
                        title={colorObj.name}
                      >
                        <PawnIcon shape={pShape} color="#ffffff" size={11} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-bold text-neutral-100 text-sm">{p.name}</span>
                        {p.isHost && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.5 rounded-full">
                            <Crown className="w-2.5 h-2.5 text-amber-400" /> Host
                          </span>
                        )}
                        {p.isBot && (
                          <span className="flex items-center gap-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 px-1.5 py-0.5 rounded-full">
                            <Bot className="w-2.5 h-2.5" /> AI
                          </span>
                        )}
                        {isLocalPlayer && (
                          <span className="text-[10px] bg-neutral-800 text-neutral-300 px-1.5 py-0.5 rounded font-bold">
                            You
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1">
                        <span className="font-semibold" style={{ color: colorObj.hex }}>
                          {colorObj.name}
                        </span>
                        <span>•</span>
                        <span className={p.connected ? 'text-emerald-400 font-semibold' : 'text-red-400 font-semibold'}>
                          {p.connected ? 'Ready' : 'Disconnected'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Kick Button (Host only) */}
                  {isHost && !p.isHost && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      title={`Kick ${p.name}`}
                      className="p-2 text-neutral-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Customization for Local Player */}
          {player && (
            <div className="pt-4 border-t border-neutral-800 space-y-4">
              {/* Avatar Selector */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-2">
                  Choose Your Character Avatar:
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                  {MERCHANT_AVATARS.map((av) => {
                    const isSelected = (player.avatar || selectedAvatar) === av.emoji;
                    return (
                      <button
                        key={av.id}
                        type="button"
                        onClick={() => {
                          setSelectedAvatar(av.emoji);
                          if (setAvatar) setAvatar(av.emoji);
                        }}
                        className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md scale-105'
                            : 'bg-neutral-950/60 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                        }`}
                      >
                        <span className="text-2xl">{av.emoji}</span>
                        <span className="text-[10px] font-semibold text-neutral-300 mt-1 truncate w-full text-center">
                          {av.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Color Switcher */}
              <div>
                <label className="text-xs font-bold text-neutral-300 block mb-2">
                  Choose Your Token Color & Pawn:
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  {PALETTE.map((c) => {
                    const isCurrent = player.color === c.id;
                    const isTaken = takenColors.has(c.id) && !isCurrent;
                    const pShape = PLAYER_PAWNS[c.id] || 'hat';

                    return (
                      <button
                        key={c.id}
                        disabled={isTaken}
                        onClick={() => setColor(c.id)}
                        className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-transform cursor-pointer border ${
                          isCurrent
                            ? 'ring-2 ring-amber-400 scale-110 shadow-lg border-white'
                            : isTaken
                            ? 'opacity-25 cursor-not-allowed border-transparent'
                            : 'opacity-70 hover:opacity-100 hover:scale-105 border-neutral-700'
                        }`}
                        style={{ backgroundColor: c.hex }}
                        title={isTaken ? `${c.name} (Taken)` : `${c.name} (${pShape})`}
                      >
                        <PawnIcon shape={pShape} color="#ffffff" size={16} />
                        {isCurrent && (
                          <div className="absolute -top-1 -right-1 bg-amber-400 text-neutral-950 rounded-full p-0.5">
                            <Check className="w-3 h-3 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Panel */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={leaveRoom}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800 text-neutral-300 text-sm font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" /> Leave Room
          </button>

          {isHost ? (
            <div className="w-full sm:w-auto flex flex-col items-center sm:items-end gap-1">
              <button
                onClick={startGame}
                disabled={!canStart}
                className={`w-full sm:w-auto px-8 py-3 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all ${
                  canStart
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 shadow-lg shadow-amber-500/20 active:scale-95 cursor-pointer font-display'
                    : 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700 font-display'
                }`}
              >
                <Play className="w-5 h-5 fill-current" />
                Start Game ({players.length} Players)
              </button>
              {!canStart && (
                <span className="text-xs text-amber-400/90 font-medium">
                  Need at least 2 merchants to start. Add an AI Friend above if needed!
                </span>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-sm text-neutral-400 italic">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
              Waiting for host to launch the game...
            </div>
          )}
        </div>
      </div>
    );
  }

  // Not in a room: Join or Create Room Screen
  return (
    <div className="max-w-lg mx-auto p-4 sm:p-6 w-full my-auto font-body">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl shadow-amber-500/20 mb-3 border border-amber-400/30 text-3xl">
          🕌
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-amber-200 tracking-tight font-display">
          BAZAAR BARON
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
          Multiplayer Indian Bazaar Trading Game for Wi-Fi. Play with friends or AI merchants!
        </p>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="bg-neutral-900 border border-neutral-800 p-1 rounded-xl flex mb-6">
        <button
          type="button"
          onClick={() => { setMode('create'); setError(''); }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
            mode === 'create'
              ? 'bg-neutral-800 text-amber-300 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Create Room (Host)
        </button>
        <button
          type="button"
          onClick={() => { setMode('join'); setError(''); }}
          className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
            mode === 'join'
              ? 'bg-neutral-800 text-amber-300 shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Join Room
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-950/50 border border-red-500/50 rounded-xl p-3 flex items-center gap-2.5 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={mode === 'create' ? handleCreate : handleJoin} className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        {mode === 'create' && (
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-2">
              Choose Game:
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setSelectedGameType('monopoly')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedGameType === 'monopoly'
                    ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🕌</span>
                  <span className="font-display font-black text-sm text-neutral-100">Bazaar Baron</span>
                </div>
                <span className="text-[11px] text-neutral-400 leading-tight">
                  Monopoly board game with Indian localities & trading
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedGameType('uno')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col gap-1 ${
                  selectedGameType === 'uno'
                    ? 'bg-red-500/20 border-red-400 ring-2 ring-red-400/50 shadow-md'
                    : 'bg-neutral-950/60 border-neutral-800 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xl">🃏</span>
                  <span className="font-display font-black text-sm text-neutral-100">Bazaar UNO</span>
                </div>
                <span className="text-[11px] text-neutral-400 leading-tight">
                  Classic 108-card UNO with Skip, Reverse, +2, +4 & UNO!
                </span>
              </button>
            </div>
          </div>
        )}

        {mode === 'join' && (
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
              4-Letter Room Code
            </label>
            <input
              type="text"
              maxLength={4}
              value={inputCode}
              onChange={(e) => setInputCode(e.target.value.toUpperCase())}
              placeholder="e.g. ABCD"
              className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-center font-mono text-xl tracking-widest uppercase font-black text-amber-300 placeholder-neutral-600 focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
            Your Merchant Name
          </label>
          <input
            type="text"
            maxLength={16}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya, Aarav, Kabir..."
            className="w-full bg-neutral-950 border border-neutral-700 rounded-xl px-4 py-2.5 text-sm font-bold text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Character Avatar Picker */}
        <div>
          <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
            Select Your Avatar
          </label>
          <div className="grid grid-cols-4 gap-2">
            {MERCHANT_AVATARS.map((av) => {
              const isSelected = selectedAvatar === av.emoji;
              return (
                <button
                  key={av.id}
                  type="button"
                  onClick={() => setSelectedAvatar(av.emoji)}
                  className={`p-2 rounded-xl flex flex-col items-center justify-center border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md scale-105'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700 hover:bg-neutral-900'
                  }`}
                >
                  <span className="text-2xl">{av.emoji}</span>
                  <span className="text-[10px] font-semibold text-neutral-300 mt-0.5 truncate w-full text-center">
                    {av.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Color / Pawn Picker */}
        <div>
          <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
            Select Token Color & Pawn
          </label>
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {PALETTE.map((c) => {
              const isSelected = selectedColor === c.id;
              const pShape = PLAYER_PAWNS[c.id] || 'hat';

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.id)}
                  className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-transform cursor-pointer border ${
                    isSelected
                      ? 'ring-2 ring-amber-400 scale-110 shadow-lg border-white'
                      : 'opacity-70 hover:opacity-100 hover:scale-105 border-neutral-700'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={`${c.name} (${pShape})`}
                >
                  <PawnIcon shape={pShape} color="#ffffff" size={16} />
                  {isSelected && (
                    <div className="absolute -top-1 -right-1 bg-amber-400 text-neutral-950 rounded-full p-0.5">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !name.trim()}
          className="w-full py-3.5 px-4 rounded-xl font-black text-sm bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-neutral-950 shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 font-display disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>{mode === 'create' ? 'Create Room & Enter Lobby' : 'Join Room'}</span>
        </button>
      </form>
    </div>
  );
}
