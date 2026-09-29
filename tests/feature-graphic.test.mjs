import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Feature graphic has exact 1024x500 dimension styling and required copy', () => {
  const html = fs.readFileSync('store-assets/feature-graphic/feature-graphic.html', 'utf8');

  assert.ok(html.includes('width: 1024px') || html.includes('width:1024px'));
  assert.ok(html.includes('height: 500px') || html.includes('height:500px'));
  assert.ok(html.includes('Block Distractions.'));
  assert.ok(html.includes('Unlock With Scripture.'));
  assert.ok(html.includes('BIBLE UNLOCK'));
});
