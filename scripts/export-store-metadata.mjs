import fs from 'node:fs';
import path from 'node:path';
import { validateAppleMetadata, validateGoogleMetadata } from './validate-aso-metadata.mjs';

export async function exportMetadata(baseOutDir = 'store-assets/metadata/fastlane') {
  const appleJson = JSON.parse(fs.readFileSync('store-assets/metadata/apple.json', 'utf8'));
  const googleJson = JSON.parse(fs.readFileSync('store-assets/metadata/google-play.json', 'utf8'));

  const appleVal = validateAppleMetadata({
    title: appleJson.name,
    subtitle: appleJson.subtitle,
    promotionalText: appleJson.promotional_text,
    keywords: appleJson.keywords
  });
  if (!appleVal.isValid) throw new Error(`Apple metadata validation failed: ${appleVal.errors.join('; ')}`);

  const googleVal = validateGoogleMetadata({
    title: googleJson.title,
    shortDescription: googleJson.short_description,
    fullDescription: googleJson.full_description || 'Valid description'
  });
  if (!googleVal.isValid) throw new Error(`Google metadata validation failed: ${googleVal.errors.join('; ')}`);

  const iosDir = path.join(baseOutDir, 'ios/en-US');
  const androidDir = path.join(baseOutDir, 'android/en-US');

  fs.mkdirSync(iosDir, { recursive: true });
  fs.mkdirSync(androidDir, { recursive: true });

  fs.writeFileSync(path.join(iosDir, 'name.txt'), appleJson.name);
  fs.writeFileSync(path.join(iosDir, 'subtitle.txt'), appleJson.subtitle);
  fs.writeFileSync(path.join(iosDir, 'keywords.txt'), appleJson.keywords);
  fs.writeFileSync(path.join(iosDir, 'promotional_text.txt'), appleJson.promotional_text);
  fs.writeFileSync(path.join(iosDir, 'description.txt'), appleJson.description);
  fs.writeFileSync(path.join(iosDir, 'privacy_url.txt'), appleJson.privacy_url);
  fs.writeFileSync(path.join(iosDir, 'support_url.txt'), appleJson.support_url);
  fs.writeFileSync(path.join(iosDir, 'marketing_url.txt'), appleJson.marketing_url);

  fs.writeFileSync(path.join(androidDir, 'title.txt'), googleJson.title);
  fs.writeFileSync(path.join(androidDir, 'short_description.txt'), googleJson.short_description);
  fs.writeFileSync(path.join(androidDir, 'full_description.txt'), googleJson.full_description);
  fs.writeFileSync(path.join(androidDir, 'privacy_policy_url.txt'), googleJson.privacy_url);
}

if (process.argv[1] && (process.argv[1].endsWith('export-store-metadata.mjs') || process.argv[1].includes('export-store-metadata'))) {
  exportMetadata().then(() => console.log('Successfully exported Fastlane store metadata.'));
}
