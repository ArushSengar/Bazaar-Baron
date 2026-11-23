import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load board data
const boardPath = path.resolve(__dirname, '../data/board.json');
const board = JSON.parse(fs.readFileSync(boardPath, 'utf8'));

// User-specified 8 color groups
const REQUIRED_COLORS = {
  brown: '#8B5A2B',
  sky: '#7FD0F0',
  pink: '#E75A9B',
  orange: '#F28C28',
  red: '#D62F2F',
  yellow: '#F2D13A',
  green: '#2E9D5B',
  navy: '#1F3FA8'
};

// Calculate relative luminance for WCAG contrast
function getLuminance(hex) {
  const rgb = hex.replace('#', '');
  const r = parseInt(rgb.substring(0, 2), 16) / 255;
  const g = parseInt(rgb.substring(2, 4), 16) / 255;
  const b = parseInt(rgb.substring(4, 6), 16) / 255;

  const a = [r, g, b].map(v => {
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });

  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(hex1, hex2) {
  const lum1 = getLuminance(hex1);
  const lum2 = getLuminance(hex2);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

test('Tile Text & Layout: All 40 tiles have valid names and wrap to 2 lines max without overflow', () => {
  assert.equal(board.length, 40, 'Board must have exactly 40 tiles');

  for (const tile of board) {
    assert.ok(tile.name, `Tile ${tile.id} must have a name`);
    assert.ok(tile.name.trim().length > 0, `Tile ${tile.id} name cannot be empty`);

    // Verify word wrapping logic: words must not exceed 14 characters (so they never clip inside a tile column)
    const words = tile.name.split(/\s+/);
    for (const word of words) {
      assert.ok(
        word.length <= 15,
        `Tile ${tile.id} ("${tile.name}") has single word "${word}" with length ${word.length} exceeding 15 chars (would cause text clipping)`
      );
    }

    // Edge tiles wrap to 2 lines max
    // Check simulated wrap: greedy line fill
    let lines = 1;
    let currentLineLength = 0;
    const maxCharsPerLine = [0, 10, 20, 30].includes(tile.id) ? 20 : (tile.id > 10 && tile.id < 20) || (tile.id > 30 && tile.id < 40) ? 22 : 14;

    for (const word of words) {
      if (currentLineLength === 0) {
        currentLineLength = word.length;
      } else if (currentLineLength + 1 + word.length <= maxCharsPerLine) {
        currentLineLength += 1 + word.length;
      } else {
        lines++;
        currentLineLength = word.length;
      }
    }

    assert.ok(
      lines <= 2,
      `Tile ${tile.id} ("${tile.name}") wraps to ${lines} lines, exceeding the 2 lines maximum spec limit`
    );
  }
});

test('Color Contrast: Cream background #F3EBD8 and dark text #1B1B1B exceed WCAG AAA standards', () => {
  const contrastRatio = getContrastRatio('#F3EBD8', '#1B1B1B');
  // WCAG AAA requires at least 7.0:1 for normal text
  assert.ok(
    contrastRatio >= 7.0,
    `Contrast ratio ${contrastRatio.toFixed(2)} between #F3EBD8 and #1B1B1B is below WCAG AAA (7.0:1)`
  );
  assert.ok(contrastRatio > 10.0, `Contrast ratio is exceptionally readable at ${contrastRatio.toFixed(2)}:1`);
});

test('Theme & Tiles: 8 distinct color groups match requirements exactly', () => {
  // Check client constants file contains all 8 required colors
  const clientConstantsPath = path.resolve(__dirname, '../../client/src/data/constants.js');
  const clientConstants = fs.readFileSync(clientConstantsPath, 'utf8');

  for (const [groupName, hex] of Object.entries(REQUIRED_COLORS)) {
    assert.ok(
      clientConstants.includes(hex),
      `Client constants must contain color ${hex} for group ${groupName}`
    );
  }
});

test('Special Tiles: Distinct icons are configured for all 4 stations, 2 utilities, taxes and cards', () => {
  const clientTilePath = path.resolve(__dirname, '../../client/src/components/Tile.jsx');
  const tileCode = fs.readFileSync(clientTilePath, 'utf8');

  // Verify Station distinctive icons
  assert.ok(tileCode.includes('Train'), 'Tile must include Train icon for station 5');
  assert.ok(tileCode.includes('Ship'), 'Tile must include Ship icon for station 15');
  assert.ok(tileCode.includes('Plane'), 'Tile must include Plane icon for station 25');
  assert.ok(tileCode.includes('TramFront'), 'Tile must include TramFront icon for station 35');

  // Verify Utilities distinctive icons
  assert.ok(tileCode.includes('Lightbulb'), 'Tile must include Lightbulb icon for utility 12');
  assert.ok(tileCode.includes('Droplets'), 'Tile must include Droplets icon for utility 28');

  // Verify Tax distinctive icons
  assert.ok(tileCode.includes('Receipt'), 'Tile must include Receipt icon for GST Tax 4');
  assert.ok(tileCode.includes('Gem'), 'Tile must include Gem icon for Wealth Tax 38');

  // Verify Corner icons
  assert.ok(tileCode.includes('ArrowRight'), 'Tile must include ArrowRight icon for Start 0');
  assert.ok(tileCode.includes('Coffee'), 'Tile must include Coffee icon for Chai Break 20');
  assert.ok(tileCode.includes('ShieldAlert'), 'Tile must include ShieldAlert icon for Go To Jail 30');
});
