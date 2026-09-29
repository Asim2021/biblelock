import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { exportMetadata } from '../scripts/export-store-metadata.mjs';

test('Exports Fastlane directory files with valid content', async () => {
  const tmpOut = path.resolve('store-assets/metadata/fastlane-test');
  await exportMetadata(tmpOut);

  assert.ok(fs.existsSync(path.join(tmpOut, 'ios/en-US/name.txt')));
  assert.ok(fs.existsSync(path.join(tmpOut, 'ios/en-US/subtitle.txt')));
  assert.ok(fs.existsSync(path.join(tmpOut, 'ios/en-US/keywords.txt')));
  assert.ok(fs.existsSync(path.join(tmpOut, 'android/en-US/title.txt')));
  assert.ok(fs.existsSync(path.join(tmpOut, 'android/en-US/short_description.txt')));

  const iosName = fs.readFileSync(path.join(tmpOut, 'ios/en-US/name.txt'), 'utf8').trim();
  assert.equal(iosName, 'Bible Unlock: Daily App Block');

  // Clean up test dir
  fs.rmSync(tmpOut, { recursive: true, force: true });
});
