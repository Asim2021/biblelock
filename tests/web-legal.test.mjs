import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Privacy policy satisfies App Store and Google Play criteria', () => {
  const html = fs.readFileSync('web/privacy.html', 'utf8');
  assert.ok(html.includes('https://bibleunlock.in/privacy'));
  assert.ok(html.includes('support@bibleunlock.in'));
  assert.ok(html.includes('Screen Time') || html.includes('Family Controls'));
  assert.ok(html.includes('Accessibility'));
  assert.ok(html.includes('zero data collection') || html.includes('local device') || html.includes('offline'));
});

test('Terms of service satisfies subscription and trial disclosure criteria', () => {
  const html = fs.readFileSync('web/terms.html', 'utf8');
  assert.ok(html.includes('https://bibleunlock.in/terms'));
  assert.ok(html.includes('support@bibleunlock.in'));
  assert.ok(html.includes('7-day free trial') || html.includes('trial'));
  assert.ok(html.includes('24 hours') || html.includes('auto-renew'));
});
