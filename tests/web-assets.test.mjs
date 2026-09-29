import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Web assets exist and define 1:1 dual-theme tokens', () => {
  assert.ok(fs.existsSync('web/assets/css/styles.css'), 'styles.css must exist');
  assert.ok(fs.existsSync('web/assets/js/main.js'), 'main.js must exist');

  const css = fs.readFileSync('web/assets/css/styles.css', 'utf8');
  assert.ok(css.includes('--bg-canvas'), 'Defines canvas background variable');
  assert.ok(css.includes('--accent-gold'), 'Defines gold accent variable');
  assert.ok(css.includes('#0d120f'), 'Uses Celestial Dark base from themeContext.tsx');
  assert.ok(css.includes('#f5b800'), 'Uses Sacred Gold accent from themeContext.tsx');
  assert.ok(css.includes('#f8f6f0'), 'Uses Parchment Light base from themeContext.tsx');
  assert.ok(css.includes('data-theme="light"') || css.includes('[data-theme="light"]'), 'Defines light theme override selector');
});
