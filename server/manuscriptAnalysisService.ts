export interface Chapter {
  title: string;
  startPosition: number;
  endPosition: number;
  wordCount: number;
  suggestedImages: string[];
  content: string;
}

export interface Section {
  title: string;
  type: 'front_matter' | 'chapter' | 'section' | 'subsection' | 'back_matter';
  startPosition: number;
  endPosition: number;
  wordCount: number;
}

export interface ContentAnalysis {
  totalWordCount: number;
  chapterWordCounts: { title: string; wordCount: number }[];
  averageSentenceLength: number;
  readingLevel: {
    fleschKincaidGrade: number;
    fleschReadingEase: number;
    description: string;
  };
  estimatedPageCount: number;
  paragraphCount: number;
  sentenceCount: number;
}

export interface StructureDetection {
  hasTitle: boolean;
  detectedTitle: string | null;
  hasAuthor: boolean;
  detectedAuthor: string | null;
  chapters: Chapter[];
  sections: Section[];
  frontMatter: {
    hasTitlePage: boolean;
    hasCopyright: boolean;
    hasDedication: boolean;
    hasTableOfContents: boolean;
    hasPreface: boolean;
    hasIntroduction: boolean;
  };
  backMatter: {
    hasAboutAuthor: boolean;
    hasAcknowledgments: boolean;
    hasAppendix: boolean;
    hasIndex: boolean;
    hasBibliography: boolean;
    hasGlossary: boolean;
  };
}

export interface ReadinessCheckItem {
  criterion: string;
  passed: boolean;
  points: number;
  maxPoints: number;
  details: string;
}

export interface PublicationReadiness {
  score: number;
  maxScore: number;
  percentage: number;
  checklist: ReadinessCheckItem[];
  recommendations: string[];
}

export interface ManuscriptAnalysis {
  structure: StructureDetection;
  content: ContentAnalysis;
  readiness: PublicationReadiness;
  chapters: Chapter[];
}

const CHAPTER_PATTERNS = [
  /^(?:chapter|chap\.?)\s*(\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty)[:\s\-–—]*(.*)?$/im,
  /^(?:part|book)\s*(\d+|[ivxlcdm]+|one|two|three|four|five|six|seven|eight|nine|ten)[:\s\-–—]*(.*)?$/im,
  /^([ivxlcdm]+)\.\s*(.*)$/im,
  /^(\d+)\.\s+([A-Z][^.!?]*?)$/m,
  /^#\s+(.+)$/m,
  /^##\s+(.+)$/m,
];

const FRONT_MATTER_PATTERNS = {
  titlePage: /^(?:title\s*page|book\s*title)[\s:]*(.+)?$/im,
  copyright: /(?:copyright|©|\(c\)|all\s*rights\s*reserved)/im,
  dedication: /^(?:dedication|dedicated\s*to|for\s+\w+)/im,
  tableOfContents: /^(?:table\s*of\s*contents|contents|toc)$/im,
  preface: /^(?:preface|foreword|prologue)[\s:]*(.+)?$/im,
  introduction: /^(?:introduction|intro)[\s:]*(.+)?$/im,
};

const BACK_MATTER_PATTERNS = {
  aboutAuthor: /^(?:about\s*(?:the\s*)?author|author\s*bio|biography)[\s:]*(.+)?$/im,
  acknowledgments: /^(?:acknowledgment|acknowledgement|thanks|special\s*thanks)s?[\s:]*(.+)?$/im,
  appendix: /^(?:appendix|appendices)(?:\s*[a-z\d])?[\s:]*(.+)?$/im,
  index: /^(?:index|indices)[\s:]*(.+)?$/im,
  bibliography: /^(?:bibliography|references|works\s*cited|sources)[\s:]*(.+)?$/im,
  glossary: /^(?:glossary|definitions|terms)[\s:]*(.+)?$/im,
};

const GENRE_WORD_COUNTS: Record<string, { min: number; max: number; ideal: number }> = {
  novel: { min: 50000, max: 110000, ideal: 80000 },
  'literary fiction': { min: 70000, max: 120000, ideal: 90000 },
  romance: { min: 50000, max: 90000, ideal: 70000 },
  mystery: { min: 60000, max: 90000, ideal: 75000 },
  thriller: { min: 70000, max: 100000, ideal: 85000 },
  'science fiction': { min: 70000, max: 120000, ideal: 90000 },
  fantasy: { min: 80000, max: 150000, ideal: 100000 },
  'young adult': { min: 50000, max: 80000, ideal: 65000 },
  'middle grade': { min: 25000, max: 50000, ideal: 40000 },
  memoir: { min: 60000, max: 90000, ideal: 75000 },
  biography: { min: 70000, max: 120000, ideal: 90000 },
  'self-help': { min: 40000, max: 70000, ideal: 55000 },
  'how-to': { min: 30000, max: 60000, ideal: 45000 },
  'short story': { min: 1000, max: 10000, ideal: 5000 },
  novella: { min: 17500, max: 40000, ideal: 30000 },
  poetry: { min: 3000, max: 20000, ideal: 10000 },
  "children's": { min: 500, max: 5000, ideal: 2000 },
  default: { min: 40000, max: 100000, ideal: 70000 },
};

const TRIM_SIZES: Record<string, { width: number; height: number; wordsPerPage: number }> = {
  '5x8': { width: 5, height: 8, wordsPerPage: 250 },
  '5.5x8.5': { width: 5.5, height: 8.5, wordsPerPage: 275 },
  '6x9': { width: 6, height: 9, wordsPerPage: 300 },
  '7x10': { width: 7, height: 10, wordsPerPage: 350 },
  '8.5x11': { width: 8.5, height: 11, wordsPerPage: 450 },
  digest: { width: 5.5, height: 8.5, wordsPerPage: 275 },
  'trade paperback': { width: 6, height: 9, wordsPerPage: 300 },
  'mass market': { width: 4.25, height: 6.87, wordsPerPage: 200 },
};

function stripHtml(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n\n')
    .replace(/<li[^>]*>/gi, '\n• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function countWords(text: string): number {
  const plainText = stripHtml(text);
  return plainText.split(/\s+/).filter(word => word.length > 0).length;
}

function countSentences(text: string): number {
  const plainText = stripHtml(text);
  const sentences = plainText.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.length;
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, '');
  if (word.length <= 3) return 1;
  
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
  word = word.replace(/^y/, '');
  
  const syllables = word.match(/[aeiouy]{1,2}/g);
  return syllables ? syllables.length : 1;
}

function calculateFleschKincaid(text: string): { grade: number; ease: number } {
  const plainText = stripHtml(text);
  const words = plainText.split(/\s+/).filter(w => w.length > 0);
  const sentences = countSentences(text);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  
  if (words.length === 0 || sentences === 0) {
    return { grade: 0, ease: 100 };
  }
  
  const wordsPerSentence = words.length / sentences;
  const syllablesPerWord = syllables / words.length;
  
  const grade = 0.39 * wordsPerSentence + 11.8 * syllablesPerWord - 15.59;
  const ease = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllablesPerWord;
  
  return {
    grade: Math.max(0, Math.round(grade * 10) / 10),
    ease: Math.min(100, Math.max(0, Math.round(ease * 10) / 10)),
  };
}

function getReadingLevelDescription(ease: number): string {
  if (ease >= 90) return 'Very Easy (5th grade)';
  if (ease >= 80) return 'Easy (6th grade)';
  if (ease >= 70) return 'Fairly Easy (7th grade)';
  if (ease >= 60) return 'Standard (8th-9th grade)';
  if (ease >= 50) return 'Fairly Difficult (10th-12th grade)';
  if (ease >= 30) return 'Difficult (College level)';
  return 'Very Difficult (Graduate level)';
}

function detectImages(text: string): string[] {
  const images: string[] = [];
  const plainText = stripHtml(text);
  
  const imgTagPattern = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;
  while ((match = imgTagPattern.exec(text)) !== null) {
    images.push(match[1]);
  }
  
  const imageRefPattern = /\[(?:image|figure|illustration|photo|picture)(?:\s*\d+)?(?:\s*:\s*([^\]]+))?\]/gi;
  while ((match = imageRefPattern.exec(plainText)) !== null) {
    images.push(match[1] || `Image reference at position ${match.index}`);
  }
  
  const figurePattern = /(?:figure|fig\.?|illustration|plate)\s*(\d+(?:\.\d+)?)/gi;
  while ((match = figurePattern.exec(plainText)) !== null) {
    images.push(`Figure ${match[1]}`);
  }
  
  return images;
}

function detectTitle(text: string): string | null {
  const plainText = stripHtml(text);
  const lines = plainText.split('\n').filter(line => line.trim().length > 0);
  
  if (lines.length === 0) return null;
  
  const h1Match = text.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (h1Match) return h1Match[1].trim();
  
  const firstLine = lines[0].trim();
  if (firstLine.length > 3 && firstLine.length < 100 && !firstLine.match(/^(chapter|part|copyright|©)/i)) {
    return firstLine;
  }
  
  return null;
}

function detectAuthor(text: string): string | null {
  const plainText = stripHtml(text);
  
  const byPattern = /(?:^|\n)\s*by\s+([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z]+)+)\s*(?:\n|$)/im;
  const byMatch = plainText.match(byPattern);
  if (byMatch) return byMatch[1].trim();
  
  const authorPattern = /(?:author|written\s+by)[\s:]+([A-Z][a-z]+(?:\s+[A-Z]\.?)?(?:\s+[A-Z][a-z]+)+)/im;
  const authorMatch = plainText.match(authorPattern);
  if (authorMatch) return authorMatch[1].trim();
  
  return null;
}

export function extractChapters(content: string): Chapter[] {
  const chapters: Chapter[] = [];
  const plainText = stripHtml(content);
  const lines = plainText.split('\n');
  
  let currentChapter: { title: string; startPosition: number; startLine: number } | null = null;
  let position = 0;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    const lineStart = position;
    position += lines[i].length + 1;
    
    let isChapter = false;
    let chapterTitle = '';
    
    for (const pattern of CHAPTER_PATTERNS) {
      const match = line.match(pattern);
      if (match) {
        isChapter = true;
        if (match[2]) {
          chapterTitle = `${match[0].split(/[:\s\-–—]/)[0].trim()}: ${match[2].trim()}`;
        } else {
          chapterTitle = match[0].trim();
        }
        break;
      }
    }
    
    if (isChapter) {
      if (currentChapter) {
        const chapterContent = lines.slice(currentChapter.startLine, i).join('\n');
        chapters.push({
          title: currentChapter.title,
          startPosition: currentChapter.startPosition,
          endPosition: lineStart,
          wordCount: countWords(chapterContent),
          suggestedImages: detectImages(chapterContent),
          content: chapterContent,
        });
      }
      currentChapter = {
        title: chapterTitle,
        startPosition: lineStart,
        startLine: i,
      };
    }
  }
  
  if (currentChapter) {
    const chapterContent = lines.slice(currentChapter.startLine).join('\n');
    chapters.push({
      title: currentChapter.title,
      startPosition: currentChapter.startPosition,
      endPosition: position,
      wordCount: countWords(chapterContent),
      suggestedImages: detectImages(chapterContent),
      content: chapterContent,
    });
  }
  
  if (chapters.length === 0 && plainText.length > 0) {
    chapters.push({
      title: 'Main Content',
      startPosition: 0,
      endPosition: plainText.length,
      wordCount: countWords(plainText),
      suggestedImages: detectImages(content),
      content: plainText,
    });
  }
  
  return chapters;
}

function detectStructure(content: string): StructureDetection {
  const plainText = stripHtml(content);
  const chapters = extractChapters(content);
  
  const frontMatter = {
    hasTitlePage: FRONT_MATTER_PATTERNS.titlePage.test(plainText),
    hasCopyright: FRONT_MATTER_PATTERNS.copyright.test(plainText),
    hasDedication: FRONT_MATTER_PATTERNS.dedication.test(plainText),
    hasTableOfContents: FRONT_MATTER_PATTERNS.tableOfContents.test(plainText),
    hasPreface: FRONT_MATTER_PATTERNS.preface.test(plainText),
    hasIntroduction: FRONT_MATTER_PATTERNS.introduction.test(plainText),
  };
  
  const backMatter = {
    hasAboutAuthor: BACK_MATTER_PATTERNS.aboutAuthor.test(plainText),
    hasAcknowledgments: BACK_MATTER_PATTERNS.acknowledgments.test(plainText),
    hasAppendix: BACK_MATTER_PATTERNS.appendix.test(plainText),
    hasIndex: BACK_MATTER_PATTERNS.index.test(plainText),
    hasBibliography: BACK_MATTER_PATTERNS.bibliography.test(plainText),
    hasGlossary: BACK_MATTER_PATTERNS.glossary.test(plainText),
  };
  
  const sections: Section[] = [];
  
  Object.entries(frontMatter).forEach(([key, value]) => {
    if (value) {
      sections.push({
        title: key.replace(/^has/, '').replace(/([A-Z])/g, ' $1').trim(),
        type: 'front_matter',
        startPosition: 0,
        endPosition: 0,
        wordCount: 0,
      });
    }
  });
  
  chapters.forEach(chapter => {
    sections.push({
      title: chapter.title,
      type: 'chapter',
      startPosition: chapter.startPosition,
      endPosition: chapter.endPosition,
      wordCount: chapter.wordCount,
    });
  });
  
  Object.entries(backMatter).forEach(([key, value]) => {
    if (value) {
      sections.push({
        title: key.replace(/^has/, '').replace(/([A-Z])/g, ' $1').trim(),
        type: 'back_matter',
        startPosition: 0,
        endPosition: 0,
        wordCount: 0,
      });
    }
  });
  
  return {
    hasTitle: detectTitle(content) !== null,
    detectedTitle: detectTitle(content),
    hasAuthor: detectAuthor(content) !== null,
    detectedAuthor: detectAuthor(content),
    chapters,
    sections,
    frontMatter,
    backMatter,
  };
}

function analyzeContent(content: string, trimSize: string = '6x9'): ContentAnalysis {
  const plainText = stripHtml(content);
  const totalWordCount = countWords(content);
  const sentenceCount = countSentences(content);
  const paragraphCount = plainText.split(/\n\s*\n/).filter(p => p.trim().length > 0).length;
  
  const chapters = extractChapters(content);
  const chapterWordCounts = chapters.map(ch => ({
    title: ch.title,
    wordCount: ch.wordCount,
  }));
  
  const { grade, ease } = calculateFleschKincaid(content);
  
  const trimConfig = TRIM_SIZES[trimSize] || TRIM_SIZES['6x9'];
  const estimatedPageCount = Math.ceil(totalWordCount / trimConfig.wordsPerPage);
  
  return {
    totalWordCount,
    chapterWordCounts,
    averageSentenceLength: sentenceCount > 0 ? Math.round((totalWordCount / sentenceCount) * 10) / 10 : 0,
    readingLevel: {
      fleschKincaidGrade: grade,
      fleschReadingEase: ease,
      description: getReadingLevelDescription(ease),
    },
    estimatedPageCount,
    paragraphCount,
    sentenceCount,
  };
}

export function calculateReadinessScore(project: {
  title?: string;
  authorName?: string;
  content?: string;
  genre?: string;
  targetAudience?: string;
  coverDesign?: string | null;
  hasCover?: boolean;
}): PublicationReadiness {
  const checklist: ReadinessCheckItem[] = [];
  let totalScore = 0;
  const maxPoints = 10;
  
  const content = project.content || '';
  const structure = detectStructure(content);
  const analysis = analyzeContent(content);
  
  const hasTitle = Boolean(project.title?.trim() || structure.hasTitle);
  checklist.push({
    criterion: 'Has title',
    passed: hasTitle,
    points: hasTitle ? maxPoints : 0,
    maxPoints,
    details: hasTitle ? `Title: ${project.title || structure.detectedTitle}` : 'No title detected',
  });
  if (hasTitle) totalScore += maxPoints;
  
  const hasAuthor = Boolean(project.authorName?.trim() || structure.hasAuthor);
  checklist.push({
    criterion: 'Has author name',
    passed: hasAuthor,
    points: hasAuthor ? maxPoints : 0,
    maxPoints,
    details: hasAuthor ? `Author: ${project.authorName || structure.detectedAuthor}` : 'No author name specified',
  });
  if (hasAuthor) totalScore += maxPoints;
  
  const genre = (project.genre || 'default').toLowerCase();
  const genreConfig = GENRE_WORD_COUNTS[genre] || GENRE_WORD_COUNTS.default;
  const wordCountAppropriate = analysis.totalWordCount >= genreConfig.min && analysis.totalWordCount <= genreConfig.max;
  const wordCountScore = wordCountAppropriate ? maxPoints : 
    (analysis.totalWordCount >= genreConfig.min * 0.5 ? Math.floor(maxPoints / 2) : 0);
  checklist.push({
    criterion: 'Word count appropriate for genre',
    passed: wordCountAppropriate,
    points: wordCountScore,
    maxPoints,
    details: `${analysis.totalWordCount.toLocaleString()} words (${genre}: ${genreConfig.min.toLocaleString()}-${genreConfig.max.toLocaleString()} recommended)`,
  });
  totalScore += wordCountScore;
  
  const hasChapterStructure = structure.chapters.length > 1;
  checklist.push({
    criterion: 'Has chapter structure',
    passed: hasChapterStructure,
    points: hasChapterStructure ? maxPoints : 0,
    maxPoints,
    details: `${structure.chapters.length} chapter(s) detected`,
  });
  if (hasChapterStructure) totalScore += maxPoints;
  
  const hasCover = Boolean(project.coverDesign || project.hasCover);
  checklist.push({
    criterion: 'Has cover design',
    passed: hasCover,
    points: hasCover ? maxPoints : 0,
    maxPoints,
    details: hasCover ? 'Cover design present' : 'No cover design uploaded',
  });
  if (hasCover) totalScore += maxPoints;
  
  const frontMatterCount = Object.values(structure.frontMatter).filter(Boolean).length;
  const hasFrontMatter = frontMatterCount >= 2;
  const frontMatterScore = frontMatterCount >= 3 ? maxPoints : 
    (frontMatterCount >= 1 ? Math.floor(maxPoints * frontMatterCount / 3) : 0);
  checklist.push({
    criterion: 'Has front matter',
    passed: hasFrontMatter,
    points: frontMatterScore,
    maxPoints,
    details: `${frontMatterCount} front matter element(s): ${Object.entries(structure.frontMatter)
      .filter(([_, v]) => v)
      .map(([k]) => k.replace(/^has/, ''))
      .join(', ') || 'none'}`,
  });
  totalScore += frontMatterScore;
  
  const backMatterCount = Object.values(structure.backMatter).filter(Boolean).length;
  const hasBackMatter = backMatterCount >= 1;
  const backMatterScore = backMatterCount >= 2 ? maxPoints : 
    (backMatterCount >= 1 ? Math.floor(maxPoints / 2) : 0);
  checklist.push({
    criterion: 'Has back matter',
    passed: hasBackMatter,
    points: backMatterScore,
    maxPoints,
    details: `${backMatterCount} back matter element(s): ${Object.entries(structure.backMatter)
      .filter(([_, v]) => v)
      .map(([k]) => k.replace(/^has/, ''))
      .join(', ') || 'none'}`,
  });
  totalScore += backMatterScore;
  
  const readingEase = analysis.readingLevel.fleschReadingEase;
  const contentQualityPassed = readingEase >= 30 && readingEase <= 80 && analysis.averageSentenceLength >= 10 && analysis.averageSentenceLength <= 25;
  const contentQualityScore = contentQualityPassed ? maxPoints : 
    (readingEase >= 20 && readingEase <= 90 ? Math.floor(maxPoints * 0.7) : Math.floor(maxPoints * 0.3));
  checklist.push({
    criterion: 'Content quality check',
    passed: contentQualityPassed,
    points: contentQualityScore,
    maxPoints,
    details: `Reading ease: ${readingEase} (${analysis.readingLevel.description}), Avg sentence: ${analysis.averageSentenceLength} words`,
  });
  totalScore += contentQualityScore;
  
  const hasGenre = Boolean(project.genre?.trim());
  checklist.push({
    criterion: 'Genre specified',
    passed: hasGenre,
    points: hasGenre ? maxPoints : 0,
    maxPoints,
    details: hasGenre ? `Genre: ${project.genre}` : 'No genre specified',
  });
  if (hasGenre) totalScore += maxPoints;
  
  const hasAudience = Boolean(project.targetAudience?.trim());
  checklist.push({
    criterion: 'Target audience defined',
    passed: hasAudience,
    points: hasAudience ? maxPoints : 0,
    maxPoints,
    details: hasAudience ? `Audience: ${project.targetAudience}` : 'No target audience defined',
  });
  if (hasAudience) totalScore += maxPoints;
  
  const recommendations: string[] = [];
  checklist.forEach(item => {
    if (!item.passed) {
      switch (item.criterion) {
        case 'Has title':
          recommendations.push('Add a compelling title to your manuscript');
          break;
        case 'Has author name':
          recommendations.push('Specify the author name in your project settings');
          break;
        case 'Word count appropriate for genre':
          if (analysis.totalWordCount < genreConfig.min) {
            recommendations.push(`Your manuscript may be too short. Consider adding ${(genreConfig.min - analysis.totalWordCount).toLocaleString()} more words`);
          } else {
            recommendations.push(`Your manuscript may be too long. Consider trimming ${(analysis.totalWordCount - genreConfig.max).toLocaleString()} words`);
          }
          break;
        case 'Has chapter structure':
          recommendations.push('Organize your content into clear chapters for better readability');
          break;
        case 'Has cover design':
          recommendations.push('Create or upload a professional cover design');
          break;
        case 'Has front matter':
          recommendations.push('Add front matter elements like a title page, copyright page, and dedication');
          break;
        case 'Has back matter':
          recommendations.push('Consider adding back matter such as an About the Author section or acknowledgments');
          break;
        case 'Content quality check':
          if (readingEase < 30) {
            recommendations.push('Your writing may be too complex. Consider simplifying sentences for better readability');
          } else if (readingEase > 80) {
            recommendations.push('Your writing may be too simple for adult audiences. Consider adding more sophisticated vocabulary');
          }
          break;
        case 'Genre specified':
          recommendations.push('Specify your book\'s genre to help with marketing and distribution');
          break;
        case 'Target audience defined':
          recommendations.push('Define your target audience to guide your marketing strategy');
          break;
      }
    }
  });
  
  const maxTotalScore = checklist.length * maxPoints;
  
  return {
    score: totalScore,
    maxScore: maxTotalScore,
    percentage: Math.round((totalScore / maxTotalScore) * 100),
    checklist,
    recommendations,
  };
}

export function estimatePageCount(content: string, trimSize: string, fontSize: number = 12): number {
  const totalWordCount = countWords(content);
  const trimConfig = TRIM_SIZES[trimSize] || TRIM_SIZES['6x9'];
  
  let wordsPerPage = trimConfig.wordsPerPage;
  if (fontSize !== 12) {
    const fontMultiplier = 12 / fontSize;
    wordsPerPage = Math.round(wordsPerPage * fontMultiplier * fontMultiplier);
  }
  
  return Math.ceil(totalWordCount / wordsPerPage);
}

export function analyzeManuscript(
  content: string,
  options?: {
    detectImages?: boolean;
    trimSize?: string;
    genre?: string;
  }
): ManuscriptAnalysis {
  const trimSize = options?.trimSize || '6x9';
  const genre = options?.genre || 'default';
  
  const structure = detectStructure(content);
  const contentAnalysis = analyzeContent(content, trimSize);
  
  const chapters = extractChapters(content);
  if (options?.detectImages !== false) {
    chapters.forEach(chapter => {
      chapter.suggestedImages = detectImages(chapter.content);
    });
  }
  
  const readiness = calculateReadinessScore({
    title: structure.detectedTitle || undefined,
    authorName: structure.detectedAuthor || undefined,
    content,
    genre,
  });
  
  return {
    structure,
    content: contentAnalysis,
    readiness,
    chapters,
  };
}
