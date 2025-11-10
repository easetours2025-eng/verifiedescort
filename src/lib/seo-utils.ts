/**
 * SEO Utilities for dynamic meta keyword generation
 */

// Common stop words to filter out
const STOP_WORDS = new Set([
  'the', 'is', 'at', 'which', 'on', 'a', 'an', 'as', 'are', 'was', 'were',
  'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'can', 'may', 'might', 'must', 'shall', 'of',
  'to', 'in', 'for', 'with', 'by', 'from', 'up', 'about', 'into', 'through',
  'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again',
  'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how',
  'all', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
  'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'and', 'or',
  'but', 'if', 'because', 'until', 'while', 'this', 'that', 'these', 'those',
  'i', 'you', 'he', 'she', 'it', 'we', 'they', 'what', 'who', 'our', 'your'
]);

interface KeywordOptions {
  maxKeywords?: number;
  minWordLength?: number;
  includeMultiWord?: boolean;
  priorityWords?: string[];
}

/**
 * Extract keywords from text content
 */
export function extractKeywordsFromText(
  text: string, 
  options: KeywordOptions = {}
): string[] {
  const {
    maxKeywords = 30,
    minWordLength = 3,
    includeMultiWord = true,
    priorityWords = []
  } = options;

  if (!text) return [];

  // Clean and normalize text
  const normalizedText = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Extract single words
  const words = normalizedText.split(' ')
    .filter(word => 
      word.length >= minWordLength && 
      !STOP_WORDS.has(word) &&
      !/^\d+$/.test(word) // Filter out pure numbers
    );

  // Count word frequency
  const wordFrequency = new Map<string, number>();
  words.forEach(word => {
    wordFrequency.set(word, (wordFrequency.get(word) || 0) + 1);
  });

  // Extract multi-word phrases (bigrams and trigrams)
  const phrases: string[] = [];
  if (includeMultiWord) {
    const wordArray = normalizedText.split(' ');
    
    // Bigrams (2-word phrases)
    for (let i = 0; i < wordArray.length - 1; i++) {
      const phrase = `${wordArray[i]} ${wordArray[i + 1]}`;
      if (!STOP_WORDS.has(wordArray[i]) && !STOP_WORDS.has(wordArray[i + 1])) {
        phrases.push(phrase);
      }
    }
    
    // Trigrams (3-word phrases)
    for (let i = 0; i < wordArray.length - 2; i++) {
      const phrase = `${wordArray[i]} ${wordArray[i + 1]} ${wordArray[i + 2]}`;
      if (!STOP_WORDS.has(wordArray[i]) && !STOP_WORDS.has(wordArray[i + 2])) {
        phrases.push(phrase);
      }
    }
  }

  // Sort words by frequency
  const sortedWords = Array.from(wordFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([word]) => word);

  // Combine priority words, frequent words, and phrases
  const allKeywords = [
    ...priorityWords.map(w => w.toLowerCase()),
    ...sortedWords.slice(0, Math.floor(maxKeywords * 0.6)),
    ...phrases.slice(0, Math.floor(maxKeywords * 0.4))
  ];

  // Remove duplicates and limit
  return [...new Set(allKeywords)].slice(0, maxKeywords);
}

/**
 * Generate SEO keywords for the homepage
 */
export function generateHomePageKeywords(data: {
  celebrityCount: number;
  locations: string[];
  genders: string[];
  features: string[];
}): string {
  const baseKeywords = [
    'Royal Escorts Kenya',
    'Kenya escorts',
    'verified escorts Kenya',
    'premium escorts',
    'celebrity escorts',
    'luxury companions Kenya',
    'VIP escorts',
    'elite escorts Kenya',
    '24/7 available escorts',
    'secure escort platform',
    'AI smart search escorts',
    'exclusive escort services'
  ];

  const locationKeywords = data.locations.map(loc => `${loc} escorts`);
  const genderKeywords = data.genders.flatMap(gender => [
    `${gender} escorts Kenya`,
    `${gender} companions`
  ]);

  const allKeywords = [
    ...baseKeywords,
    ...locationKeywords.slice(0, 10),
    ...genderKeywords.slice(0, 6),
    ...data.features
  ];

  return [...new Set(allKeywords)].slice(0, 40).join(', ');
}

/**
 * Generate SEO keywords for celebrity profile pages
 */
export function generateCelebrityProfileKeywords(data: {
  stageName: string;
  location?: string;
  country?: string;
  gender?: string[];
  services?: string[];
  bio?: string;
}): string {
  const baseKeywords = [
    data.stageName,
    `${data.stageName} escort`,
    `${data.stageName} Royal Escorts`,
    'verified celebrity escort',
    'premium companion',
    'exclusive meetings',
    'photo sessions'
  ];

  // Location-based keywords
  const locationKeywords: string[] = [];
  if (data.location) {
    locationKeywords.push(
      `${data.location} escort`,
      `escort in ${data.location}`,
      `${data.stageName} ${data.location}`
    );
  }
  if (data.country) {
    locationKeywords.push(
      `${data.country} escort`,
      `escort ${data.country}`
    );
  }

  // Gender-based keywords
  const genderKeywords = (data.gender || []).flatMap(g => [
    `${g} escort`,
    `${g} companion ${data.location || data.country || 'Kenya'}`
  ]);

  // Service-based keywords
  const serviceKeywords = (data.services || []).map(service => 
    `${service.toLowerCase()} escort service`
  );

  // Extract keywords from bio
  const bioKeywords = data.bio 
    ? extractKeywordsFromText(data.bio, { 
        maxKeywords: 10,
        priorityWords: [data.stageName, data.location || '', data.country || '']
      })
    : [];

  const allKeywords = [
    ...baseKeywords,
    ...locationKeywords,
    ...genderKeywords,
    ...serviceKeywords,
    ...bioKeywords
  ].filter(Boolean);

  return [...new Set(allKeywords)].slice(0, 35).join(', ');
}

/**
 * Generate SEO keywords for FAQ page
 */
export function generateFAQKeywords(faqs: Array<{ question: string; answer: string; category: string }>): string {
  const baseKeywords = [
    'Royal Escorts FAQ',
    'escort service questions',
    'Kenya escort FAQ',
    'verified escorts help',
    'escort subscription FAQ',
    'celebrity escort information'
  ];

  // Extract categories
  const categories = [...new Set(faqs.map(faq => 
    faq.category.replace(/_/g, ' ')
  ))];

  // Extract keywords from questions and answers
  const faqText = faqs
    .map(faq => `${faq.question} ${faq.answer}`)
    .join(' ');
  
  const contentKeywords = extractKeywordsFromText(faqText, {
    maxKeywords: 20,
    priorityWords: ['escort', 'Kenya', 'subscription', 'verification', 'payment']
  });

  const allKeywords = [
    ...baseKeywords,
    ...categories,
    ...contentKeywords
  ];

  return [...new Set(allKeywords)].slice(0, 35).join(', ');
}

/**
 * Generate SEO keywords for Videos page
 */
export function generateVideosPageKeywords(data: {
  videoCount: number;
  celebrityNames: string[];
  locations: string[];
}): string {
  const baseKeywords = [
    'escort videos Kenya',
    'celebrity escort videos',
    'premium escort content',
    'exclusive escort videos',
    'VIP escort videos',
    'verified escort video gallery',
    'Kenya escort video collection',
    'luxury escort videos',
    'escort video content'
  ];

  const celebrityKeywords = data.celebrityNames.slice(0, 10).map(name => 
    `${name} video`
  );

  const locationKeywords = data.locations.slice(0, 8).map(loc => 
    `${loc} escort videos`
  );

  const allKeywords = [
    ...baseKeywords,
    ...celebrityKeywords,
    ...locationKeywords
  ];

  return [...new Set(allKeywords)].slice(0, 35).join(', ');
}

/**
 * Update meta keywords tag dynamically
 */
export function updateMetaKeywords(keywords: string) {
  let metaKeywords = document.querySelector('meta[name="keywords"]');
  
  if (!metaKeywords) {
    metaKeywords = document.createElement('meta');
    metaKeywords.setAttribute('name', 'keywords');
    document.head.appendChild(metaKeywords);
  }
  
  metaKeywords.setAttribute('content', keywords);
}
