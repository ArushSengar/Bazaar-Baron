import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const screenshotsDir = path.join(projectRoot, 'docs', 'screenshots');

const PNG_MAGIC_HEADER = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const MIN_FILE_SIZE_BYTES = 20 * 1024; // 20KB

const REQUIRED_SCREENSHOTS = [
  { file: 'arcade-lobby-desktop.png', width: 1920, height: 1080 },
  { file: 'arcade-lobby-mobile.png', width: 390, height: 844 },
  { file: 'baron-board-desktop.png', width: 1920, height: 1080 },
  { file: 'baron-board-mobile.png', width: 390, height: 844 },
  { file: 'baron-board-3d-isometric.png', width: 1920, height: 1080 },
  { file: 'baron-deed-modal.png', width: 1920, height: 1080 },
  { file: 'baron-card-modal.png', width: 1920, height: 1080 },
  { file: 'uno-board-desktop.png', width: 1920, height: 1080 },
  { file: 'uno-board-mobile.png', width: 390, height: 844 },
  { file: 'ludo-board-desktop.png', width: 1920, height: 1080 },
  { file: 'ludo-board-mobile.png', width: 390, height: 844 },
  { file: 'snakes-board-desktop.png', width: 1920, height: 1080 },
  { file: 'snakes-board-mobile.png', width: 390, height: 844 },
  { file: 'rules-modal.png', width: 1920, height: 1080 }
];

describe('Milestone 3: Automated Screenshot Pipeline & Visual Verification Integrity Tests', () => {
  test('M3.1 Screenshot automation script and npm script are configured', () => {
    const scriptPath = path.join(projectRoot, 'scripts', 'capture_all_screenshots.js');
    assert.ok(fs.existsSync(scriptPath), 'scripts/capture_all_screenshots.js must exist');

    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf8'));
    assert.equal(
      pkg.scripts?.['test:screenshots'],
      'node scripts/capture_all_screenshots.js',
      'package.json must define test:screenshots script'
    );
  });

  test('M3.2 docs/screenshots directory exists and contains all 14 required views', () => {
    assert.ok(fs.existsSync(screenshotsDir), 'docs/screenshots directory must exist');
    assert.ok(fs.statSync(screenshotsDir).isDirectory(), 'docs/screenshots must be a directory');

    for (const { file } of REQUIRED_SCREENSHOTS) {
      const filePath = path.join(screenshotsDir, file);
      assert.ok(fs.existsSync(filePath), `Missing required screenshot: ${file}`);
    }
  });

  for (const { file, width, height } of REQUIRED_SCREENSHOTS) {
    test(`M3.3 Valid PNG format, dimensions (${width}x${height}), and >20KB size for ${file}`, () => {
      const filePath = path.join(screenshotsDir, file);
      const buffer = fs.readFileSync(filePath);

      assert.ok(
        buffer.length > MIN_FILE_SIZE_BYTES,
        `${file} must exceed 20KB (actual: ${buffer.length} bytes)`
      );

      assert.ok(
        buffer.subarray(0, 8).equals(PNG_MAGIC_HEADER),
        `${file} must begin with valid 8-byte PNG signature`
      );

      // Parse PNG IHDR chunk (bytes 12..15 = 'IHDR', 16..19 = width BE, 20..23 = height BE)
      assert.equal(buffer.subarray(12, 16).toString('ascii'), 'IHDR', `${file} must have valid IHDR chunk`);
      const actualWidth = buffer.readUInt32BE(16);
      const actualHeight = buffer.readUInt32BE(20);
      assert.equal(actualWidth, width, `${file} width expected ${width}, got ${actualWidth}`);
      assert.equal(actualHeight, height, `${file} height expected ${height}, got ${actualHeight}`);
    });
  }
});
