import React, { useState } from 'react';
import {
  Crown,
  Copy,
  Check,
  Users,
  Wifi,
  LogOut,
  Play,
  UserX,
  AlertCircle,
  Bot,
  Plus,
  Sparkles,
  HelpCircle,
  BookOpen
} from 'lucide-react';
import { MERCHANT_AVATARS, PLAYER_COLORS, PLAYER_PAWNS } from '../data/constants';
import { PawnIcon } from './PawnIcon';
import { AudioControls } from './AudioControls';
import { getAllGames, getGameConfig } from './GameRegistry';

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
  connected,
  onOpenGuide
}) {
  const [mode, setMode] = useState('create'); // 'create' | 'join'
  const [selectedGameType, setSelectedGameType] = useState('monopoly');
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
      setError('Please enter your player name.');
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

  // If already in a room, render the Waiting Room Lobby
  if (isInRoom) {
    const config = getGameConfig(gameState.gameType);
    const players = gameState.players || [];
    const maxPlayers = config.maxPlayers || 6;
    const minPlayers = config.minPlayers || 2;
    const canStart = players.length >= minPlayers && players.length <= maxPlayers;
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
                  {config.icon} {config.title}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-amber-100 tracking-tight mt-0.5 font-display flex items-center gap-2">
                <span>{config.icon}</span>
                <span>{config.title} Lobby</span>
              </h1>
            </div>

            {/* Room Code Badge & Audio Controls */}
            <div className="flex items-center gap-2">
              <AudioControls compact={true} />

              <button
                type="button"
                onClick={() => onOpenGuide?.(gameState.gameType)}
                className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
                title="View Rules for this game"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Rules</span>
              </button>

              <div className="flex items-center gap-2 bg-neutral-950 border border-amber-500/40 px-3.5 py-1.5 rounded-xl">
                <div className="text-right">
                  <div className="text-[9px] text-amber-400/80 uppercase font-semibold">Room Code</div>
                  <div className="text-xl font-mono font-black text-amber-300 tracking-widest">
                    {gameState.roomCode}
                  </div>
                </div>
                <button
                  onClick={handleCopyCode}
                  title="Copy Room Code"
                  className="p-1.5 hover:bg-amber-500/10 rounded-lg text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-xs text-neutral-400 mt-3 text-center sm:text-left">
            Invite players on your local Wi-Fi. Enter room code{' '}
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
              <h2 className="text-lg font-bold text-neutral-100 font-display">Players in Lobby</h2>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ml-1 ${
                players.length >= minPlayers ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-neutral-800 text-neutral-400'
              }`}>
                {players.length} / {maxPlayers}
              </span>
            </div>

            {/* Host: Add AI Bot Button */}
            {isHost && players.length < maxPlayers && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowBotPicker(!showBotPicker)}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
                >
                  <Bot className="w-4 h-4" />
                  <span>+ Add AI Player</span>
                </button>

                {showBotPicker && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-[#FCF9F2] text-[#1B1B1B] border-2 border-[#8B5A2B]/40 rounded-2xl shadow-2xl p-3 z-30 space-y-2 animate-scale-up">
                    <span className="text-[10px] font-black uppercase text-[#7A6B5D] tracking-wider block">
                      Choose AI Player:
                    </span>
                    <div className="space-y-1">
                      {(config.defaultBotNames || ['Priya (AI)', 'Rani (AI)', 'Kabir (AI)', 'Aarav (AI)']).map((bName) => (
                        <button
                          key={bName}
                          onClick={() => {
                            addBot({ name: bName });
                            setShowBotPicker(false);
                          }}
                          className="w-full text-left p-2 rounded-xl hover:bg-[#EFE7D5] transition-colors flex items-center gap-2 cursor-pointer border border-transparent hover:border-[#D5C7B0]"
                        >
                          <span className="text-xl">🤖</span>
                          <div>
                            <div className="text-xs font-bold">{bName}</div>
                            <div className="text-[10px] text-neutral-600">Automated Bot</div>
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
                    {/* Avatar Display */}
                    <div className="relative">
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-md border-2"
                        style={{ borderColor: colorObj.hex, backgroundColor: `${colorObj.hex}22` }}
                      >
                        {p.avatar || '👳'}
                      </div>
                      <div
                        className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow"
                        style={{ backgroundColor: colorObj.hex }}
                      >
                        <PawnIcon shape={pShape} color="#ffffff" size={12} />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-neutral-100 text-sm">{p.name}</span>
                        {p.isHost && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Crown className="w-2.5 h-2.5" /> HOST
                          </span>
                        )}
                        {p.isBot && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                            <Bot className="w-2.5 h-2.5" /> BOT
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-neutral-400 mt-0.5">
                        Token: <span style={{ color: colorObj.hex }}>{colorObj.name}</span>
                      </div>
                    </div>
                  </div>

                  {/* Kick Button (Host Only, Can't kick self) */}
                  {isHost && !p.isHost && (
                    <button
                      onClick={() => kickPlayer(p.id)}
                      title="Kick Player"
                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors cursor-pointer"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Start Game Action Card */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-2xl p-5 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <div className="text-xs font-semibold text-neutral-400 uppercase">Status</div>
            <div className="text-sm font-bold text-neutral-200 mt-0.5">
              {players.length < minPlayers ? (
                <span className="text-amber-400">Waiting for at least {minPlayers} players to join...</span>
              ) : (
                <span className="text-emerald-400 font-extrabold">Ready to begin match!</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={leaveRoom}
              className="px-4 py-3 rounded-xl border border-neutral-700 hover:border-neutral-600 hover:bg-neutral-800 text-neutral-300 font-bold text-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-4 h-4" />
              <span>Leave</span>
            </button>

            {isHost && (
              <button
                onClick={startGame}
                disabled={!canStart}
                className="flex-1 sm:flex-none px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-neutral-950 font-black text-sm font-display tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>START MATCH</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- NON-ROOM VIEW: Arcade Welcome & Game Choice Screen ---
  const allArcadeGames = getAllGames();

  return (
    <div className="max-w-xl mx-auto p-4 md:p-6 w-full font-body">
      {/* Top Arcade Header Bar with Global Sound & Rules */}
      <div className="flex items-center justify-between mb-4 bg-neutral-900/60 border border-neutral-800/80 rounded-2xl px-4 py-2.5 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <span className="text-xl">🎪</span>
          <span className="text-xs font-black font-display uppercase tracking-widest text-amber-300">
            BAZAAR ARCADE
          </span>
        </div>

        <div className="flex items-center gap-2">
          <AudioControls compact={false} />

          <button
            type="button"
            onClick={() => onOpenGuide?.(selectedGameType)}
            className="px-2.5 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 border border-neutral-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Browse Arcade Rulebooks"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Rulebook</span>
          </button>
        </div>
      </div>

      {/* Brand Hero Card */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500 to-amber-700 shadow-xl shadow-amber-500/20 mb-3 border border-amber-400/30 text-3xl">
          🎪
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-amber-200 tracking-tight font-display">
          BAZAAR ARCADE
        </h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 max-w-sm mx-auto">
          Multiplayer Tabletop & Card Arcade for Local Wi-Fi. Play with friends on any phone or PC browser, or challenge AI bots!
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
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                Select Arcade Game:
              </label>
              <span className="text-[10px] text-amber-400/80 font-semibold">
                {allArcadeGames.length} Games Available
              </span>
            </div>

            {/* 4-Game Choice Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {allArcadeGames.map((game) => {
                const isSelected = selectedGameType === game.id;
                return (
                  <div
                    key={game.id}
                    onClick={() => setSelectedGameType(game.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 relative ${
                      isSelected
                        ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 shadow-md'
                        : 'bg-neutral-950/60 border-neutral-800 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xl">{game.icon}</span>
                          <span className="font-display font-black text-sm text-neutral-100">{game.title}</span>
                        </div>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300 border border-neutral-700">
                          {game.minPlayers}-{game.maxPlayers}P
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-400 leading-tight">
                        {game.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80">
                      <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider">
                        {game.badge}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenGuide?.(game.id);
                        }}
                        className="text-[11px] text-neutral-300 hover:text-amber-300 flex items-center gap-1 cursor-pointer"
                        title={`How to play ${game.title}`}
                      >
                        <HelpCircle className="w-3 h-3 text-amber-400" />
                        <span>Rules 📖</span>
                      </button>
                    </div>
                  </div>
                );
              })}
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
            Your Player Name
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

        {/* Avatar Picker */}
        <div>
          <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
            Choose Avatar
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
            {MERCHANT_AVATARS.map((av) => {
              const emojiChar = typeof av === 'object' ? av.emoji : av;
              const avatarKey = typeof av === 'object' ? (av.id || av.name || emojiChar) : av;
              const avatarTitle = typeof av === 'object' ? `${av.name} (${av.title})` : '';
              const isSelected = selectedAvatar === emojiChar;

              return (
                <button
                  key={avatarKey}
                  type="button"
                  onClick={() => setSelectedAvatar(emojiChar)}
                  title={avatarTitle}
                  className={`w-full aspect-square rounded-xl text-xl flex items-center justify-center transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50 scale-105 shadow-md'
                      : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                  }`}
                >
                  {emojiChar}
                </button>
              );
            })}
          </div>
        </div>

        {/* Color Picker */}
        <div>
          <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
            Choose Token Color
          </label>
          <div className="grid grid-cols-6 gap-2">
            {PALETTE.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setSelectedColor(c.id)}
                className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${
                  selectedColor === c.id
                    ? 'border-white ring-2 ring-amber-400/80 scale-105'
                    : 'border-transparent opacity-75 hover:opacity-100'
                }`}
                style={{ backgroundColor: c.hex }}
                title={c.name}
              >
                {selectedColor === c.id && <Check className="w-4 h-4 text-white drop-shadow" />}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-4 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-neutral-950 font-black text-sm font-display tracking-wide shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
        >
          {loading ? 'Connecting...' : mode === 'create' ? 'CREATE ARCADE ROOM' : 'JOIN ROOM'}
        </button>
      </form>
    </div>
  );
}

export default Lobby;
