import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Sitemap contains canonical URLs with valid XML structure', () => {
  const xml = fs.readFileSync('web/sitemap.xml', 'utf8');
  assert.ok(xml.includes('<?xml version="1.0" encoding="UTF-8"?>'));
  assert.ok(xml.includes('<loc>https://bibleunlock.in/</loc>') || xml.includes('<loc>https://bibleunlock.in</loc>'));
  assert.ok(xml.includes('<loc>https://bibleunlock.in/privacy</loc>') || xml.includes('<loc>https://bibleunlock.in/privacy.html</loc>'));
  assert.ok(xml.includes('<loc>https://bibleunlock.in/terms</loc>') || xml.includes('<loc>https://bibleunlock.in/terms.html</loc>'));
});

test('Robots.txt allows indexing and links sitemap', () => {
  const robots = fs.readFileSync('web/robots.txt', 'utf8');
  assert.ok(robots.includes('User-agent: *'));
  assert.ok(robots.includes('Allow: /'));
  assert.ok(robots.includes('Sitemap: https://bibleunlock.in/sitemap.xml'));
});
