export function extractWords(text) {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

export function validateAppleMetadata(data) {
  const title = data.title || '';
  const subtitle = data.subtitle || '';
  const promo = data.promotionalText || '';
  const keywords = data.keywords || '';

  const titleWords = new Set(extractWords(title));
  const subtitleWords = new Set(extractWords(subtitle));
  const keywordList = keywords.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  
  const redundantWords = keywordList.filter(k => titleWords.has(k) || subtitleWords.has(k));
  const hasSpacesAfterCommas = /,\s/.test(keywords);
  const keywordBytes = Buffer.byteLength(keywords, 'utf8');

  const errors = [];
  if (title.length > 30) errors.push(`Title exceeds 30 chars (${title.length})`);
  if (subtitle.length > 30) errors.push(`Subtitle exceeds 30 chars (${subtitle.length})`);
  if (promo.length > 170) errors.push(`Promotional text exceeds 170 chars (${promo.length})`);
  if (keywordBytes > 100) errors.push(`Keywords exceed 100 bytes (${keywordBytes})`);
  if (hasSpacesAfterCommas) errors.push('Keywords contain spaces after commas (wastes byte budget)');
  if (redundantWords.length > 0) errors.push(`Duplicate keywords found: ${redundantWords.join(', ')}`);

  return {
    isValid: errors.length === 0,
    titleLength: title.length,
    subtitleLength: subtitle.length,
    promoLength: promo.length,
    keywordBytes,
    redundantWords,
    errors
  };
}

export function validateGoogleMetadata(data) {
  const title = data.title || '';
  const shortDesc = data.shortDescription || '';
  const fullDesc = data.fullDescription || '';

  const errors = [];
  const policyViolations = [];
  const forbiddenTerms = ['best', 'free', '#1', 'top', 'discount', 'download now'];

  const lowerTitle = title.toLowerCase();
  for (const term of forbiddenTerms) {
    if (lowerTitle.includes(term)) {
      policyViolations.push(term);
    }
  }

  if (title.length > 30) errors.push(`Title exceeds 30 chars (${title.length})`);
  if (shortDesc.length > 80) errors.push(`Short description exceeds 80 chars (${shortDesc.length})`);
  if (fullDesc.length > 4000) errors.push(`Full description exceeds 4000 chars (${fullDesc.length})`);
  if (policyViolations.length > 0) errors.push(`Prohibited terms in title: ${policyViolations.join(', ')}`);

  return {
    isValid: errors.length === 0 && policyViolations.length === 0,
    titleLength: title.length,
    shortDescLength: shortDesc.length,
    fullDescLength: fullDesc.length,
    policyViolations,
    errors
  };
}

if (process.argv[1] && (process.argv[1].endsWith('validate-aso-metadata.mjs') || process.argv[1].includes('validate-aso-metadata'))) {
  import('node:fs').then(fs => {
    try {
      const appleJson = JSON.parse(fs.readFileSync('store-assets/metadata/apple.json', 'utf8'));
      const googleJson = JSON.parse(fs.readFileSync('store-assets/metadata/google-play.json', 'utf8'));

      const appleVal = validateAppleMetadata({
        title: appleJson.name,
        subtitle: appleJson.subtitle,
        promotionalText: appleJson.promotional_text,
        keywords: appleJson.keywords
      });

      const googleVal = validateGoogleMetadata({
        title: googleJson.title,
        shortDescription: googleJson.short_description,
        fullDescription: googleJson.full_description || ''
      });

      if (!appleVal.isValid) {
        console.error('❌ Apple ASO Validation FAILED:', appleVal.errors);
        process.exit(1);
      }
      if (!googleVal.isValid) {
        console.error('❌ Google Play ASO Validation FAILED:', googleVal.errors);
        process.exit(1);
      }

      console.log('✅ ASO Metadata 100% Valid!');
      console.log(`- Apple Title: ${appleVal.titleLength}/30 | Subtitle: ${appleVal.subtitleLength}/30 | Keywords: ${appleVal.keywordBytes}/100 bytes`);
      console.log(`- Google Title: ${googleVal.titleLength}/30 | Short Desc: ${googleVal.shortDescLength}/80`);
    } catch (err) {
      console.error('Validation error:', err.message);
      process.exit(1);
    }
  });
}

