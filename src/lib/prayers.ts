import rawPrayersData from '../../assets/bible/en_prayers.json';

export type PrayerCategory = 'daily' | 'foundations' | 'traditional';

export interface PrayerItem {
  id: string;
  title: string;
  prayerText: string;
  category: PrayerCategory;
  timeOfDay?: 'morning' | 'afternoon' | 'evening';
}

const CATEGORY_MAP: Record<string, { category: PrayerCategory; timeOfDay?: 'morning' | 'afternoon' | 'evening' }> = {
  // Daily Rhythm
  '25': { category: 'daily', timeOfDay: 'morning' }, // Morning Prayer
  '27': { category: 'daily', timeOfDay: 'afternoon' }, // Afternoon Prayer
  '26': { category: 'daily', timeOfDay: 'evening' }, // Evening Prayer
  '6': { category: 'daily', timeOfDay: 'morning' }, // Morning Offering
  '24': { category: 'daily' }, // Vocation Prayer

  // Biblical Foundations & Core Creeds
  '1': { category: 'foundations' }, // Our Father (Lord's Prayer)
  '9': { category: 'foundations' }, // Apostles' Creed
  '7': { category: 'foundations' }, // Nicene Creed
  '4': { category: 'foundations' }, // Glory Be (Doxology)
  '8': { category: 'foundations' }, // Gloria
  '10': { category: 'foundations' }, // Act of Contrition (Traditional)
  '11': { category: 'foundations' }, // Act of Contrition (Rite of Penance)
  '12': { category: 'foundations' }, // Act of Contrition (Jesus Prayer)
  '13': { category: 'foundations' }, // Act of Faith
  '14': { category: 'foundations' }, // Act of Hope
  '15': { category: 'foundations' }, // Act of Love

  // Liturgical & Traditional
  '2': { category: 'traditional' }, // Hail Mary
  '3': { category: 'traditional' }, // Sign of the Cross
  '5': { category: 'traditional' }, // Guardian Angel
  '16': { category: 'traditional' }, // Angelus
  '17': { category: 'traditional' }, // Anima Christi
  '18': { category: 'traditional' }, // Divine Praises
  '19': { category: 'traditional' }, // Hail, Holy Queen
  '20': { category: 'traditional' }, // Memorare
  '21': { category: 'traditional' }, // O Sacrum Convivium
  '22': { category: 'traditional' }, // Tantum Ergo
  '23': { category: 'traditional' }, // Oh My Jesus
};

const NORMALIZED_PRAYERS: PrayerItem[] = (rawPrayersData as Array<{ id: string; title: string; prayerText: string }>).map((item) => {
  const meta = CATEGORY_MAP[item.id] || { category: 'foundations' as PrayerCategory };
  return {
    id: item.id,
    title: item.title,
    prayerText: item.prayerText,
    category: meta.category,
    timeOfDay: meta.timeOfDay,
  };
});

const PRAYERS_BY_ID = new Map<string, PrayerItem>(
  NORMALIZED_PRAYERS.map((p) => [p.id, p])
);

export function getAllPrayers(): PrayerItem[] {
  return NORMALIZED_PRAYERS;
}

export function getPrayerById(id: string): PrayerItem | null {
  return PRAYERS_BY_ID.get(id) || null;
}

export function getPrayersByCategory(category: PrayerCategory): PrayerItem[] {
  return NORMALIZED_PRAYERS.filter((p) => p.category === category);
}

/**
 * Returns the contextual prayer based on local time of day:
 * - 05:00 - 11:59: Morning Prayer (#25)
 * - 12:00 - 16:59: Afternoon Prayer (#27)
 * - 17:00 - 04:59: Evening Prayer (#26)
 */
export function getTimeOfDayPrayer(date: Date = new Date()): PrayerItem {
  const hour = date.getHours();
  if (hour >= 5 && hour < 12) {
    return PRAYERS_BY_ID.get('25') || NORMALIZED_PRAYERS[0];
  }
  if (hour >= 12 && hour < 17) {
    return PRAYERS_BY_ID.get('27') || NORMALIZED_PRAYERS[0];
  }
  return PRAYERS_BY_ID.get('26') || NORMALIZED_PRAYERS[0];
}

export function getRandomPrayer(excludeId?: string): PrayerItem {
  const filtered = excludeId ? NORMALIZED_PRAYERS.filter((p) => p.id !== excludeId) : NORMALIZED_PRAYERS;
  const idx = Math.floor(Math.random() * filtered.length);
  return filtered[idx] || NORMALIZED_PRAYERS[0];
}
