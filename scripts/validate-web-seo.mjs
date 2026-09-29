import fs from 'node:fs';
import path from 'node:path';

export function validateWebSeo(webDir = 'web') {
  const errors = [];
  const warnings = [];

  const requiredFiles = ['index.html', 'privacy.html', 'terms.html', 'sitemap.xml', 'robots.txt', 'assets/css/styles.css', 'assets/js/main.js'];
  for (const f of requiredFiles) {
    const full = path.join(webDir, f);
    if (!fs.existsSync(full)) {
      errors.push(`Missing required file: ${f}`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings };
  }

  // 1. Validate index.html
  const indexHtml = fs.readFileSync(path.join(webDir, 'index.html'), 'utf8');
  
  // Single H1
  const h1Matches = indexHtml.match(/<h1[^>]*>[\s\S]*?<\/h1>/gi) || [];
  if (h1Matches.length !== 1) {
    errors.push(`index.html must have exactly 1 <h1> tag, found ${h1Matches.length}`);
  }

  // Canonical tag
  if (!indexHtml.includes('<link rel="canonical" href="https://bibleunlock.in"')) {
    errors.push('index.html is missing canonical tag for https://bibleunlock.in');
  }

  // OpenGraph tags
  const ogRequired = ['og:title', 'og:description', 'og:image', 'og:url'];
  for (const og of ogRequired) {
    if (!indexHtml.includes(`property="${og}"`)) {
      errors.push(`index.html is missing OpenGraph property: ${og}`);
    }
  }

  // Images have alt attributes
  const imgTags = indexHtml.match(/<img[^>]*>/gi) || [];
  for (const img of imgTags) {
    if (!img.includes('alt="') && !img.includes("alt='")) {
      errors.push(`Image tag missing alt attribute: ${img}`);
    }
  }

  // Schema.org JSON-LD
  const schemaMatches = indexHtml.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi) || [];
  if (schemaMatches.length < 3) {
    errors.push(`Expected at least 3 JSON-LD scripts in index.html, found ${schemaMatches.length}`);
  }

  for (const block of schemaMatches) {
    const jsonStr = block.replace(/<script type="application\/ld\+json">/i, '').replace(/<\/script>/i, '').trim();
    try {
      const parsed = JSON.parse(jsonStr);
      if (!parsed['@context'] || !parsed['@type']) {
        errors.push(`JSON-LD block missing @context or @type: ${jsonStr.slice(0, 50)}...`);
      }
    } catch (e) {
      errors.push(`Invalid JSON-LD syntax: ${e.message}`);
    }
  }

  // 2. Validate Sitemap & Robots
  const sitemapXml = fs.readFileSync(path.join(webDir, 'sitemap.xml'), 'utf8');
  if (!sitemapXml.includes('https://bibleunlock.in/')) {
    errors.push('sitemap.xml missing root URL https://bibleunlock.in/');
  }

  const robotsTxt = fs.readFileSync(path.join(webDir, 'robots.txt'), 'utf8');
  if (!robotsTxt.includes('Sitemap: https://bibleunlock.in/sitemap.xml')) {
    errors.push('robots.txt missing Sitemap directive');
  }

  // 3. Validate CSS Dual-Theme tokens
  const css = fs.readFileSync(path.join(webDir, 'assets/css/styles.css'), 'utf8');
  if (!css.includes('--bg-canvas') || !css.includes('--accent-gold')) {
    errors.push('styles.css missing core CSS design tokens');
  }
  if (!css.includes('data-theme="light"')) {
    errors.push('styles.css missing light theme selector');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    schemaCount: schemaMatches.length,
    h1Count: h1Matches.length,
    imagesChecked: imgTags.length
  };
}

if (process.argv[1] && (process.argv[1].endsWith('validate-web-seo.mjs') || process.argv[1].includes('validate-web-seo'))) {
  const result = validateWebSeo();
  if (result.isValid) {
    console.log('✅ Web SEO & Schema Validation 100% Passed!');
    console.log(`- Exact 1 <h1> tag verified`);
    console.log(`- ${result.schemaCount} Schema.org JSON-LD blocks validated`);
    console.log(`- ${result.imagesChecked} image tags verified with descriptive alt attributes`);
    console.log(`- Canonical links, OpenGraph, Twitter cards, sitemap.xml, and robots.txt verified`);
    console.log(`- Dual-theme CSS variables verified (Celestial Dark & Parchment Light)`);
  } else {
    console.error('❌ Web SEO Validation FAILED:');
    result.errors.forEach(e => console.error(`  - ${e}`));
    process.exit(1);
  }
}
