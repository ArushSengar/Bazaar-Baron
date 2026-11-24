import React, { useState } from 'react';
import { useGame } from './hooks/useGame';
import { Lobby } from './components/Lobby';
import { getGameScreen } from './components/GameRegistry';
import HowToPlayModal, { useGuideHotkey } from './components/guide/HowToPlayModal';

export function App() {
  const {
    connected,
    loading,
    error,
    setError,
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
    sendIntent,
    leaveRoom
  } = useGame();

  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [guideGameId, setGuideGameId] = useState('monopoly');

  // Register global '?' keyboard shortcut for rules guide
  useGuideHotkey(() => setIsGuideOpen(prev => !prev));

  const handleOpenGuide = (gameId) => {
    setGuideGameId(gameId || gameState?.gameType || 'monopoly');
    setIsGuideOpen(true);
  };

  const isGameActive = gameState && (
    gameState.phase === 'PLAYING' ||
    gameState.phase === 'ROUND_OVER' ||
    gameState.phase === 'GAME_OVER'
  );

  const ScreenComponent = getGameScreen(gameState?.gameType);

  return (
    <div className={`tabletop-wood text-[#e6edf3] selection:bg-amber-500 selection:text-neutral-950 ${isGameActive ? 'h-screen h-[100dvh] w-screen overflow-hidden flex flex-col' : 'min-h-screen flex flex-col justify-between'}`}>
      <main className={isGameActive ? "flex-1 w-full h-full overflow-hidden flex flex-col p-1 sm:p-2" : "flex-1 flex flex-col justify-start sm:justify-center overflow-y-auto min-h-0 py-2 sm:py-4 px-2 sm:px-4"}>
        {isGameActive ? (
          <ScreenComponent
            gameState={gameState}
            player={player}
            isHost={isHost}
            leaveRoom={leaveRoom}
            connected={connected}
            sendIntent={sendIntent}
            onOpenGuide={handleOpenGuide}
          />
        ) : (
          <Lobby
            gameState={gameState}
            player={player}
            isHost={isHost}
            createRoom={createRoom}
            joinRoom={joinRoom}
            setColor={setColor}
            setAvatar={setAvatar}
            addBot={addBot}
            kickPlayer={kickPlayer}
            startGame={startGame}
            sendIntent={sendIntent}
            leaveRoom={leaveRoom}
            error={error}
            setError={setError}
            loading={loading}
            connected={connected}
            onOpenGuide={handleOpenGuide}
          />
        )}
      </main>

      {!isGameActive && (
        <footer className="py-4 text-center text-xs text-neutral-500 border-t border-neutral-900">
          Bazaar Arcade LAN Edition • 4 Multiplayer Games • Free & Offline • Node.js + React + Socket.IO
        </footer>
      )}

      {/* Global How to Play Beginner Guides Modal */}
      <HowToPlayModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        initialGameId={guideGameId}
      />
    </div>
  );
}

export default App;
