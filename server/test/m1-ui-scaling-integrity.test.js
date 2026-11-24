import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('Milestone 1: UI Scaling, Immersion & Layout Integrity Tests', () => {
  const readComponent = (relPath) => fs.readFileSync(path.join(projectRoot, relPath), 'utf8');

  test('M1.1 Bazaar Ludo Board Scaling & Responsive Layout', () => {
    const ludoBoard = readComponent('client/src/components/ludo/LudoBoard.jsx');
    const ludoScreen = readComponent('client/src/components/ludo/LudoScreen.jsx');

    // Asserts hardcoded 560px constraint is removed and fluid responsive sizing is used
    assert.ok(!ludoBoard.includes('max-w-[560px]'), 'LudoBoard must not contain hardcoded max-w-[560px]');
    assert.ok(ludoBoard.includes('max-w-[min(94vw,90vh)]'), 'LudoBoard must include fluid viewport-bounded max-width');
    assert.ok(ludoBoard.includes('lg:max-w-[min(88vh,calc(100vw-360px))]'), 'LudoBoard must include desktop lg responsive max-width');

    // Asserts LudoScreen scrolling container
    assert.ok(ludoScreen.includes('overflow-y-auto'), 'LudoScreen root container must allow vertical scrolling');
  });

  test('M1.2 Snakes & Ladders Board Scaling & Active Container', () => {
    const snakesScreen = readComponent('client/src/components/snakes/SnakesScreen.jsx');

    // Asserts hardcoded 560px constraint is removed and fluid responsive sizing is used
    assert.ok(!snakesScreen.includes('max-w-[560px]'), 'SnakesScreen must not contain hardcoded max-w-[560px]');
    assert.ok(snakesScreen.includes('max-w-[min(94vw,90vh)]'), 'SnakesScreen must include fluid viewport-bounded max-width');
    assert.ok(snakesScreen.includes('overflow-y-auto'), 'SnakesScreen root must allow vertical scrolling on mobile');
  });

  test('M1.3 Snakes & Ladders Yard Pawn Clipping Bug Fix', () => {
    const snakesScreen = readComponent('client/src/components/snakes/SnakesScreen.jsx');

    // Asserts unstarted yard pawns at pos 0 do not calculate to row: 9.6 / top: 101%
    assert.ok(!snakesScreen.includes('row: 9.6'), 'SnakesScreen must not place yard pawns at row 9.6');
    assert.ok(snakesScreen.includes('isAtYard ? 94'), 'Yard pawns must be explicitly placed at top: 94% inside container');
  });

  test('M1.4 Bazaar UNO Opponents Ring & Hand Hover Protection', () => {
    const unoScreen = readComponent('client/src/components/uno/UnoScreen.jsx');

    // Asserts opponents ring has justify-start across all breakpoints and no justify-center to eliminate negative scroll clipping
    assert.ok(unoScreen.includes('justify-start gap-2 sm:gap-4 overflow-x-auto'), 'UnoScreen opponents ring must support justify-start on overflow');
    assert.ok(!unoScreen.includes('md:justify-center'), 'UnoScreen opponents ring must not have md:justify-center to prevent negative coordinate clipping');

    // Asserts hand container provides elevation headroom and prevents vertical scrollbars
    assert.ok(unoScreen.includes('pt-7 sm:pt-8'), 'Hand cards container must have generous padding-top for hover elevation');
    assert.ok(unoScreen.includes('overflow-y-hidden'), 'Hand cards container must prevent vertical scrollbar flickering');

    // Asserts center table scaling
    assert.ok(unoScreen.includes('max-w-xl md:max-w-2xl'), 'Center table must expand on desktop viewports');
  });

  test('M1.5 Bazaar Baron 1024px Breakpoint Overflow Fix', () => {
    const board = readComponent('client/src/components/Board.jsx');
    const sidePanel = readComponent('client/src/components/SidePanel.jsx');

    // Asserts Board lg max-width calculation
    assert.ok(board.includes('lg:max-w-[min(84vh,calc(100vw-390px))]'), 'Board must adjust max-width at lg: to reserve space for side panel');

    // Asserts SidePanel lg width
    assert.ok(sidePanel.includes('lg:w-[350px]'), 'SidePanel width at lg: must be 350px');
  });

  test('M1.6 Bazaar Baron Mobile Segmented Tab Switcher', () => {
    const gameScreen = readComponent('client/src/components/GameScreen.jsx');

    // Asserts mobileTab is wired to segmented control buttons
    assert.ok(gameScreen.includes("setMobileTab('board')"), 'GameScreen must have interactive button to set mobileTab to board');
    assert.ok(gameScreen.includes("setMobileTab('panel')"), 'GameScreen must have interactive button to set mobileTab to panel');
    assert.ok(gameScreen.includes("mobileTab === 'board' ? 'flex' : 'hidden lg:flex'"), 'Board must toggle visibility based on mobileTab on mobile');
    assert.ok(gameScreen.includes("mobileTab === 'panel' ? 'flex' : 'hidden lg:flex'"), 'SidePanel must toggle visibility based on mobileTab on mobile');
  });

  test('M1.7 Common Lobbies & Modals Immersion Fixes', () => {
    const app = readComponent('client/src/App.jsx');
    const lobby = readComponent('client/src/components/Lobby.jsx');
    const deedModal = readComponent('client/src/components/PropertyDeedModal.jsx');
    const winnerModal = readComponent('client/src/components/WinnerModal.jsx');

    // Asserts App.jsx eliminates lobby scroll trap
    assert.ok(app.includes('justify-start sm:justify-center overflow-y-auto min-h-0'), 'App.jsx main container must allow scrolling lobby content');

    // Asserts Lobby timer buttons avoid text wrapping
    assert.ok(lobby.includes('whitespace-nowrap truncate'), 'Lobby timer options must prevent fragment wrapping');

    // Asserts PropertyDeedModal pins action buttons and scrolls deed card
    assert.ok(deedModal.includes('overflow-y-auto max-h-[50vh] sm:max-h-[58vh]'), 'Deed card must have scrollable container bounded by viewport');
    assert.ok(deedModal.includes('shrink-0 bg-neutral-900/95'), 'Action button panel in DeedModal must be shrink-0 pinned');

    // Asserts WinnerModal has overflow-y-auto on backdrop
    assert.ok(winnerModal.includes('overflow-y-auto'), 'WinnerModal backdrop must allow scrolling on short viewports');
  });
});
