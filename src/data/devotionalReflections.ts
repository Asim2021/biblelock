export interface DevotionalReflection {
  reflection: string;
  prayerPrompt: string;
}

export const DEVOTIONAL_REFLECTIONS: DevotionalReflection[] = [
  // 0: Psalms 23:1
  {
    reflection: 'Peace begins when you stop looking to worldly noise for provision and rest in the Shepherd.',
    prayerPrompt: 'Lord, teach my heart to rest content in Your faithful guidance today.',
  },
  // 1: John 3:16
  {
    reflection: 'God gave His greatest gift for you. Live today anchored in unwavering divine love.',
    prayerPrompt: 'Father, let me walk in the freedom of Your eternal gift through every circumstance.',
  },
  // 2: Philippians 4:13
  {
    reflection: 'Your endurance does not come from sheer willpower, but from the indwelling strength of Christ.',
    prayerPrompt: 'Jesus, when my energy runs dry, fill me with Your divine stamina.',
  },
  // 3: Proverbs 3:5
  {
    reflection: 'Release the urge to control every outcome. Trust God’s wisdom over your limited perspective.',
    prayerPrompt: 'Lord, I surrender my anxieties and trust where You are leading me today.',
  },
  // 4: Romans 8:28
  {
    reflection: 'Nothing in your story is wasted; God weaves every difficulty into a greater redemptive purpose.',
    prayerPrompt: 'Father, give me faith to trust Your good purpose even in unresolved situations.',
  },
  // 5: Isaiah 40:31
  {
    reflection: 'Waiting on the Lord is an active posture of hope that replaces weariness with eagle-like strength.',
    prayerPrompt: 'Lord, renew my spirit today as I choose quiet patience in Your presence.',
  },
  // 6: Jeremiah 29:11
  {
    reflection: 'God’s intentions for you are peace and a future, far beyond temporary setbacks.',
    prayerPrompt: 'God, quiet my future worries with the assurance of Your good plans for my life.',
  },
  // 7: Joshua 1:9
  {
    reflection: 'Courage is not the absence of fear, but the conviction that God is with you everywhere you go.',
    prayerPrompt: 'Lord, replace my hesitation with holy boldness to do what is right today.',
  },
  // 8: Matthew 6:33
  {
    reflection: 'When God’s kingdom is your first priority, every lesser necessity falls into its rightful place.',
    prayerPrompt: 'Father, align my desires with Your righteousness before anything else.',
  },
  // 9: Matthew 11:28
  {
    reflection: 'Jesus never asks you to carry the weight alone; He invites you to trade your exhaustion for rest.',
    prayerPrompt: 'Jesus, I lay down my heavy burdens at Your feet and receive Your deep rest.',
  },
  // 10: 2 Corinthians 12:9
  {
    reflection: 'Your weakness is not a failure—it is the exact space where God’s perfect grace is revealed.',
    prayerPrompt: 'Lord, let Your grace be my complete sufficiency in areas where I feel inadequate.',
  },
  // 11: Galatians 5:22
  {
    reflection: 'Spiritual fruit grows quietly through daily abiding in Christ, not forced external performance.',
    prayerPrompt: 'Holy Spirit, cultivate love, patience, and kindness in my conversations today.',
  },
  // 12: Ephesians 2:8
  {
    reflection: 'You are saved by unearned grace through faith; stop striving to prove what is already given.',
    prayerPrompt: 'God, thank You for the unconditional gift of salvation that anchors my worth.',
  },
  // 13: Hebrews 11:1
  {
    reflection: 'Faith is confident certainty in what God has promised, even when the path is not yet visible.',
    prayerPrompt: 'Lord, grant me spiritual sight to trust what You have spoken over what I see.',
  },
  // 14: James 1:5
  {
    reflection: 'God never scolds you for asking for guidance; He gives wisdom generously to all who seek Him.',
    prayerPrompt: 'Father, grant me clarity and godly wisdom for the decisions before me today.',
  },
  // 15: 1 Peter 5:7
  {
    reflection: 'You were never meant to carry your worries; cast every anxious thought into His caring hands.',
    prayerPrompt: 'Lord, I cast my fears onto You, knowing You deeply care for my wellbeing.',
  },
  // 16: Psalms 46:1
  {
    reflection: 'When storms shake the foundation of your world, God remains an immovable refuge and strength.',
    prayerPrompt: 'God, be my shelter and steady foundation when chaos surrounds me.',
  },
  // 17: Psalms 119:105
  {
    reflection: 'God’s Word illuminates just enough ground for your next faithful step in the dark.',
    prayerPrompt: 'Lord, let Your Scripture guide my choices and guard my steps today.',
  },
  // 18: Romans 12:2
  {
    reflection: 'Guard your mind against mindless cultural scrolling; allow God’s truth to renew your thoughts.',
    prayerPrompt: 'Holy Spirit, transform my mindset and protect my focus from worldly distractions.',
  },
  // 19: Proverbs 16:3
  {
    reflection: 'When you entrust your plans and labors to the Lord, He establishes your thoughts with peace.',
    prayerPrompt: 'Lord, I dedicate all my work and efforts today into Your loving hands. Amen.',
  },
];

export function getDevotionalReflection(index: number): DevotionalReflection {
  const safeIdx = ((index % DEVOTIONAL_REFLECTIONS.length) + DEVOTIONAL_REFLECTIONS.length) % DEVOTIONAL_REFLECTIONS.length;
  return DEVOTIONAL_REFLECTIONS[safeIdx];
}
