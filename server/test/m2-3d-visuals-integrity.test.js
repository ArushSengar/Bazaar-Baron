import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

describe('Milestone 2: 3D Visual Depth & Tangible Tabletop Integrity Tests', () => {
  const readComponent = (relPath) => fs.readFileSync(path.join(projectRoot, relPath), 'utf8');

  test('M2.1 Volumetric 3D Havelis (Houses 1-4)', () => {
    const tileContent = readComponent('client/src/components/Tile.jsx');

    // Asserts Haveli3D is exported and implements realistic architectural geometry
    assert.ok(tileContent.includes('export function Haveli3D'), 'Tile.jsx must export Haveli3D component');
    assert.ok(tileContent.includes('#4ade80'), 'Haveli3D must include illuminated ridge slope in #4ade80');
    assert.ok(tileContent.includes('#15803d'), 'Haveli3D must include shaded side slope in #15803d');
    assert.ok(tileContent.includes('#166534'), 'Haveli3D must include south facade in #166534');
    assert.ok(tileContent.includes('drop-shadow(0 2px 2px rgba(0,0,0,0.5))'), 'Haveli3D must include ground contact drop shadow');

    // Asserts HouseIcons renders Haveli3D for 1-4 houses aligned on the color band
    assert.ok(tileContent.includes('<Haveli3D key={i} />'), 'HouseIcons must render Haveli3D instances for houses 1-4');
  });

  test('M2.2 3D Grand Haveli Palace Hotel (House 5)', () => {
    const tileContent = readComponent('client/src/components/Tile.jsx');

    // Asserts HotelGrand3D is exported and replaces flat emojis with Rajasthani palace block
    assert.ok(tileContent.includes('export function HotelGrand3D'), 'Tile.jsx must export HotelGrand3D component');
    assert.ok(tileContent.includes('#f59e0b'), 'HotelGrand3D must include ornamental golden dome / chhatri in #f59e0b');
    assert.ok(tileContent.includes('#b91c1c'), 'HotelGrand3D must include deep royal crimson walls in #b91c1c');
    assert.ok(tileContent.includes('drop-shadow(0 2px 2px rgba(0,0,0,0.5))'), 'HotelGrand3D must include ground contact drop shadow');

    // Asserts HouseIcons returns HotelGrand3D when houses === 5 and no flat emoji is used
    assert.ok(tileContent.includes('return <HotelGrand3D />;'), 'HouseIcons must render HotelGrand3D when houses === 5');
    assert.ok(!tileContent.includes("🏰"), 'Tile.jsx must not use flat castle emoji for hotel');
  });

  test('M2.3 3D Brass/Gold Token Pedestals', () => {
    const tileContent = readComponent('client/src/components/Tile.jsx');
    const cssContent = readComponent('client/src/index.css');

    // Asserts TokenPedestal3D elevates tokens with translateZ(6px) and metallic styling
    assert.ok(tileContent.includes('export function TokenPedestal3D'), 'Tile.jsx must export TokenPedestal3D');
    assert.ok(tileContent.includes('translateZ(6px)'), 'TokenPedestal3D must elevate tokens with translateZ(6px)');
    assert.ok(tileContent.includes('#f59e0b'), 'TokenPedestal3D must use radial metallic gradient starting at #f59e0b');
    assert.ok(tileContent.includes('#78350f'), 'TokenPedestal3D must use radial metallic gradient ending at #78350f');
    assert.ok(tileContent.includes('inset 0 1px 1px rgba(255,255,255,0.8)'), 'TokenPedestal3D must have specular rim highlight');

    // Asserts CSS contains .token-pedestal-3d class
    assert.ok(cssContent.includes('.token-pedestal-3d'), 'index.css must define .token-pedestal-3d');
    assert.ok(cssContent.includes('transform: translateZ(6px)'), 'index.css must include translateZ(6px) for token pedestals');
  });

  test('M2.4 3D Board Slab & Cardboard Bevel Extrusion', () => {
    const boardContent = readComponent('client/src/components/Board.jsx');
    const cssContent = readComponent('client/src/index.css');

    // Asserts Board applies .tabletop-board-3d
    assert.ok(boardContent.includes('tabletop-board-3d'), 'Board.jsx must apply tabletop-board-3d class');

    // Asserts CSS defines multi-layered cardboard edge shadows (10px-12px physical depth)
    assert.ok(cssContent.includes('.tabletop-board-3d'), 'index.css must define .tabletop-board-3d');
    assert.ok(cssContent.includes('0 1px 0 #d1c7b2'), 'index.css must include layer 1 cardboard shadow');
    assert.ok(cssContent.includes('0 12px 0 #2c1f06'), 'index.css must include layer 12 cardboard depth extrusion');
    assert.ok(cssContent.includes('inset 0 1px 1px rgba(255, 255, 255, 0.7)'), 'index.css must include bevel lighting');
  });

  test('M2.5 Interactive 3D Perspective Mode Toggle', () => {
    const boardContent = readComponent('client/src/components/Board.jsx');
    const gameScreenContent = readComponent('client/src/components/GameScreen.jsx');
    const cssContent = readComponent('client/src/index.css');

    // Asserts CSS defines .board-perspective-3d with perspective(1400px) rotateX(18deg) rotateZ(-1.5deg) and cubic-bezier
    assert.ok(cssContent.includes('.board-perspective-3d'), 'index.css must define .board-perspective-3d');
    assert.ok(cssContent.includes('perspective(1400px) rotateX(18deg) rotateZ(-1.5deg)'), 'board-perspective-3d must use perspective(1400px) rotateX(18deg) rotateZ(-1.5deg)');
    assert.ok(cssContent.includes('cubic-bezier(0.16, 1, 0.3, 1)'), 'board-perspective-3d must use cubic-bezier transition');
    assert.ok(cssContent.includes('.board-perspective-2d'), 'index.css must define .board-perspective-2d');

    // Asserts Board toggles perspective class based on active 3D mode
    assert.ok(boardContent.includes('board-perspective-3d'), 'Board.jsx must reference board-perspective-3d');
    assert.ok(boardContent.includes('board-perspective-2d'), 'Board.jsx must reference board-perspective-2d');

    // Asserts GameScreen provides perspective mode toggle
    assert.ok(gameScreenContent.includes('is3DView'), 'GameScreen must maintain is3DView state');
    assert.ok(gameScreenContent.includes('setIs3DView'), 'GameScreen must provide toggle handler');
    assert.ok(gameScreenContent.includes('3D View') && gameScreenContent.includes('2D View'), 'GameScreen must display 3D/2D View toggle button');
  });

  test('M2.6 Tactile 3D Cards & Deed Modals', () => {
    const deedCardContent = readComponent('client/src/components/DeedCard.jsx');
    const cardModalContent = readComponent('client/src/components/CardModal.jsx');
    const cssContent = readComponent('client/src/index.css');

    // Asserts multi-layer card edge thickness and tactile styles
    assert.ok(deedCardContent.includes('card-3d-tactile'), 'DeedCard must use card-3d-tactile');
    assert.ok(cardModalContent.includes('card-3d-tactile'), 'CardModal must use card-3d-tactile');
    assert.ok(cssContent.includes('.card-3d-tactile'), 'index.css must define .card-3d-tactile');
    assert.ok(cssContent.includes('0 4px 0 #a8a08c'), 'card-3d-tactile must include multi-layer card edge shadows');

    // Asserts gold foil rim reflections
    assert.ok(deedCardContent.includes('gold-foil-rim'), 'DeedCard must include gold-foil-rim overlay');
    assert.ok(cardModalContent.includes('gold-foil-rim'), 'CardModal must include gold-foil-rim overlay');
    assert.ok(cssContent.includes('.gold-foil-rim'), 'index.css must define .gold-foil-rim');

    // Asserts 3D card tilt on hover
    assert.ok(deedCardContent.includes('card-3d-hover'), 'DeedCard must use card-3d-hover');
    assert.ok(cardModalContent.includes('card-3d-hover'), 'CardModal must use card-3d-hover');
    assert.ok(cssContent.includes('.card-3d-hover:hover'), 'index.css must define .card-3d-hover:hover');

    // Asserts authentic mortgaged wax seal stamp
    assert.ok(deedCardContent.includes('wax-seal-stamp'), 'DeedCard must use wax-seal-stamp');
    assert.ok(cssContent.includes('.wax-seal-stamp'), 'index.css must define .wax-seal-stamp');
    assert.ok(deedCardContent.includes('गिरवी'), 'DeedCard wax seal must include Hindi mortgage text');

    // Asserts Haveli3D and HotelGrand3D in DeedCard rent table
    assert.ok(deedCardContent.includes('<Haveli3D'), 'DeedCard must render Haveli3D in rent schedule');
    assert.ok(deedCardContent.includes('<HotelGrand3D'), 'DeedCard must render HotelGrand3D in rent schedule');
  });
});
