import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAppleMetadata, validateGoogleMetadata } from '../scripts/validate-aso-metadata.mjs';

test('Apple metadata enforces character, byte, and redundancy rules', () => {
  const validApple = {
    title: 'Bible Unlock: Daily App Block',
    subtitle: 'Read Scripture to Unlock Apps',
    promotionalText: 'Stop doomscrolling. Start reading. Bible Unlock shields your distracting apps until you spend time in God’s Word. Build an unbreakable daily habit today.',
    keywords: 'screen,time,habit,devotional,verse,christian,discipline,phone,addiction,focus,opal,sec,holy,prayer',
    supportUrl: 'https://bibleunlock.in',
    privacyUrl: 'https://bibleunlock.in/privacy'
  };

  const result = validateAppleMetadata(validApple);
  assert.equal(result.isValid, true);
  assert.equal(result.titleLength, 29);
  assert.equal(result.subtitleLength, 29);
  assert.equal(result.keywordBytes, 98);
  assert.equal(result.redundantWords.length, 0);
});

test('Apple metadata rejects duplicate keywords from title or subtitle', () => {
  const invalidApple = {
    title: 'Bible Unlock: Daily App Block',
    subtitle: 'Read Scripture to Unlock Apps',
    promotionalText: 'Valid promo text.',
    keywords: 'bible,daily,screen,time' // 'bible' and 'daily' are duplicates
  };

  const result = validateAppleMetadata(invalidApple);
  assert.equal(result.isValid, false);
  assert.ok(result.redundantWords.includes('bible'));
  assert.ok(result.redundantWords.includes('daily'));
});

test('Google Play metadata enforces character caps and policy constraints', () => {
  const validGoogle = {
    title: 'Bible Unlock: Daily App Block',
    shortDescription: 'Block distracting apps until you complete your daily Bible reading. Guard focus.',
    fullDescription: 'Stop doomscrolling and put God first. Bible Unlock is a purpose-built app blocker...',
    privacyUrl: 'https://bibleunlock.in/privacy'
  };

  const result = validateGoogleMetadata(validGoogle);
  assert.equal(result.isValid, true);
  assert.equal(result.titleLength, 29);
  assert.equal(result.shortDescLength, 80);
});

test('Google Play rejects forbidden promotional claims in title', () => {
  const invalidGoogle = {
    title: 'Best Free Bible App Blocker #1',
    shortDescription: 'Short description.',
    fullDescription: 'Full description.'
  };

  const result = validateGoogleMetadata(invalidGoogle);
  assert.equal(result.isValid, false);
  assert.ok(result.policyViolations.length >= 2); // 'best', 'free', '#1'
});
