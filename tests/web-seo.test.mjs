import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Homepage contains exact SEO meta tags and Schema.org JSON-LD', () => {
  const html = fs.readFileSync('web/index.html', 'utf8');

  // Verify single H1
  const h1Matches = html.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  assert.equal(h1Matches.length, 1, 'Must have exactly one H1 tag');

  // Verify canonical URL
  assert.ok(html.includes('<link rel="canonical" href="https://bibleunlock.in"'));

  // Verify OpenGraph
  assert.ok(html.includes('property="og:title"'));
  assert.ok(html.includes('property="og:image"'));

  // Verify JSON-LD Schema
  const schemaMatches = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  assert.ok(schemaMatches.length >= 3, 'Must contain at least 3 JSON-LD blocks (SoftwareApplication, FAQPage, Organization)');

  // Verify JSON-LD parsability
  for (const block of schemaMatches) {
    const jsonStr = block.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '').trim();
    const parsed = JSON.parse(jsonStr);
    assert.ok(parsed['@context'], 'Valid Schema.org context');
  }

  // Verify FAQ questions in Schema match page copy
  assert.ok(html.includes('How does Bible Unlock block distracting apps?'));
  assert.ok(html.includes('Is my reading data and phone activity private?'));
});
