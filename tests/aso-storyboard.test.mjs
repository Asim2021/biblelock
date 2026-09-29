import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Screenshot storyboard contains all 6 required screens with exact captions', () => {
  const html = fs.readFileSync('store-assets/screenshots/storyboard.html', 'utf8');

  // Check 6 screens exist
  const screenMatches = html.match(/class=["'][^"']*aso-screen-card[^"']*["']/g) || [];
  assert.equal(screenMatches.length, 6, 'Must contain exactly 6 screenshot cards');

  // Verify headers from A-pile spec
  assert.ok(html.includes('LOCKED UNTIL YOU READ'));
  assert.ok(html.includes('CHOOSE SCRIPTURE OVER SCROLLING'));
  assert.ok(html.includes('336 VISUAL SCRIPTURE CARDS'));
  assert.ok(html.includes('NEVER LOSE YOUR MOMENTUM'));
  assert.ok(html.includes('RECLAIM 180+ HOURS PER YEAR'));
  assert.ok(html.includes('92 TRANSLATIONS') && html.includes('HISTORIC PRAYERS'));
});
