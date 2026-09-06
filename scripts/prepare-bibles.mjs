import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BOOK_NAMES = [
  { abbrev: 'gn', name: 'Genesis', short: 'Gen' },
  { abbrev: 'ex', name: 'Exodus', short: 'Exo' },
  { abbrev: 'lv', name: 'Leviticus', short: 'Lev' },
  { abbrev: 'nm', name: 'Numbers', short: 'Num' },
  { abbrev: 'dt', name: 'Deuteronomy', short: 'Deu' },
  { abbrev: 'js', name: 'Joshua', short: 'Jos' },
  { abbrev: 'jud', name: 'Judges', short: 'Jdg' },
  { abbrev: 'rt', name: 'Ruth', short: 'Rut' },
  { abbrev: '1sm', name: '1 Samuel', short: '1Sa' },
  { abbrev: '2sm', name: '2 Samuel', short: '2Sa' },
  { abbrev: '1kgs', name: '1 Kings', short: '1Ki' },
  { abbrev: '2kgs', name: '2 Kings', short: '2Ki' },
  { abbrev: '1ch', name: '1 Chronicles', short: '1Ch' },
  { abbrev: '2ch', name: '2 Chronicles', short: '2Ch' },
  { abbrev: 'ezr', name: 'Ezra', short: 'Ezr' },
  { abbrev: 'ne', name: 'Nehemiah', short: 'Neh' },
  { abbrev: 'et', name: 'Esther', short: 'Est' },
  { abbrev: 'job', name: 'Job', short: 'Job' },
  { abbrev: 'ps', name: 'Psalms', short: 'Psa' },
  { abbrev: 'prv', name: 'Proverbs', short: 'Pro' },
  { abbrev: 'ec', name: 'Ecclesiastes', short: 'Ecc' },
  { abbrev: 'so', name: 'Song of Solomon', short: 'Sng' },
  { abbrev: 'is', name: 'Isaiah', short: 'Isa' },
  { abbrev: 'jr', name: 'Jeremiah', short: 'Jer' },
  { abbrev: 'lm', name: 'Lamentations', short: 'Lam' },
  { abbrev: 'ez', name: 'Ezekiel', short: 'Ezk' },
  { abbrev: 'dn', name: 'Daniel', short: 'Dan' },
  { abbrev: 'ho', name: 'Hosea', short: 'Hos' },
  { abbrev: 'jl', name: 'Joel', short: 'Jol' },
  { abbrev: 'am', name: 'Amos', short: 'Amo' },
  { abbrev: 'ob', name: 'Obadiah', short: 'Oba' },
  { abbrev: 'jn', name: 'Jonah', short: 'Jon' },
  { abbrev: 'mi', name: 'Micah', short: 'Mic' },
  { abbrev: 'na', name: 'Nahum', short: 'Nah' },
  { abbrev: 'hk', name: 'Habakkuk', short: 'Hab' },
  { abbrev: 'zp', name: 'Zephaniah', short: 'Zep' },
  { abbrev: 'hg', name: 'Haggai', short: 'Hag' },
  { abbrev: 'zc', name: 'Zechariah', short: 'Zec' },
  { abbrev: 'ml', name: 'Malachi', short: 'Mal' },
  { abbrev: 'mt', name: 'Matthew', short: 'Mat' },
  { abbrev: 'mk', name: 'Mark', short: 'Mrk' },
  { abbrev: 'lk', name: 'Luke', short: 'Luk' },
  { abbrev: 'jo', name: 'John', short: 'Jhn' },
  { abbrev: 'act', name: 'Acts', short: 'Act' },
  { abbrev: 'rm', name: 'Romans', short: 'Rom' },
  { abbrev: '1co', name: '1 Corinthians', short: '1Co' },
  { abbrev: '2co', name: '2 Corinthians', short: '2Co' },
  { abbrev: 'gl', name: 'Galatians', short: 'Gal' },
  { abbrev: 'eph', name: 'Ephesians', short: 'Eph' },
  { abbrev: 'ph', name: 'Philippians', short: 'Php' },
  { abbrev: 'cl', name: 'Colossians', short: 'Col' },
  { abbrev: '1ts', name: '1 Thessalonians', short: '1Th' },
  { abbrev: '2ts', name: '2 Thessalonians', short: '2Th' },
  { abbrev: '1tm', name: '1 Timothy', short: '1Ti' },
  { abbrev: '2tm', name: '2 Timothy', short: '2Ti' },
  { abbrev: 'tt', name: 'Titus', short: 'Tit' },
  { abbrev: 'phm', name: 'Philemon', short: 'Phm' },
  { abbrev: 'hb', name: 'Hebrews', short: 'Heb' },
  { abbrev: 'jm', name: 'James', short: 'Jas' },
  { abbrev: '1pe', name: '1 Peter', short: '1Pe' },
  { abbrev: '2pe', name: '2 Peter', short: '2Pe' },
  { abbrev: '1jo', name: '1 John', short: '1Jn' },
  { abbrev: '2jo', name: '2 John', short: '2Jn' },
  { abbrev: '3jo', name: '3 John', short: '3Jn' },
  { abbrev: 'jd', name: 'Jude', short: 'Jud' },
  { abbrev: 're', name: 'Revelation', short: 'Rev' },
];

function fetchRaw(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to fetch ${url} - HTTP ${res.statusCode}`));
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data.replace(/^\uFEFF/, '').trim()));
    }).on('error', reject);
  });
}

async function prepare() {
  const targetDir = path.resolve(__dirname, '../frontend/assets/bible');
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const sources = [
    {
      id: 'kjv',
      title: 'King James Version',
      url: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_kjv.json',
      out: path.join(targetDir, 'kjv.json'),
    },
    {
      id: 'web',
      title: 'World English Bible / Easy Reader',
      url: 'https://raw.githubusercontent.com/thiagobodruk/bible/master/json/en_bbe.json',
      out: path.join(targetDir, 'web.json'),
    },
  ];

  for (const src of sources) {
    console.log(`Downloading ${src.title}...`);
    const raw = await fetchRaw(src.url);
    const parsed = JSON.parse(raw);

    const formattedBooks = parsed.map((bookItem, index) => {
      const meta = BOOK_NAMES[index] || { name: bookItem.abbrev, short: bookItem.abbrev };
      const chapters = (bookItem.chapters || []).map((versesArr, cIdx) => ({
        chapter: cIdx + 1,
        verses: (versesArr || []).map((verseText, vIdx) => ({
          verse: vIdx + 1,
          text: verseText,
        })),
      }));

      return {
        id: meta.abbrev || bookItem.abbrev,
        name: meta.name,
        shortName: meta.short,
        chapterCount: chapters.length,
        chapters,
      };
    });

    const finalData = {
      translation: src.id.toUpperCase(),
      title: src.title,
      books: formattedBooks,
    };

    fs.writeFileSync(src.out, JSON.stringify(finalData), 'utf-8');
    console.log(`Wrote ${src.title} -> ${src.out} (${(fs.statSync(src.out).size / 1024 / 1024).toFixed(2)} MB)`);
  }

  console.log('Bible assets preparation complete!');
}

prepare().catch((e) => {
  console.error('Error preparing Bible data:', e);
  process.exit(1);
});
