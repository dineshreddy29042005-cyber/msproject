'use strict';

/* ================================================================
   engine.js  —  PlagiaCheck AI Platform
   Single source of truth for mock data, word diff, phrase detection,
   AI chatbot brain, floating chat, auth helpers, utilities.
   NO DUPLICATES. NO INCOMPLETE BLOCKS.
   ================================================================ */

/* ── Stop words ─────────────────────────────────────────────── */
const STOPWORDS = new Set([
  'the','a','an','is','are','was','were','be','been','being','have','has','had',
  'do','does','did','will','would','could','should','may','might','shall','can',
  'of','in','on','at','to','for','with','by','from','as','into','through',
  'during','about','against','between','before','after','above','below','up',
  'down','out','off','over','under','that','this','these','those','it','its',
  'and','or','but','if','while','than','so','yet','both','nor','not','no',
  'such','what','which','who','when','where','how','all','each','every','more',
  'most','other','some','any','only','own','same','very','just','also','then'
]);

/* ── Synonym map ─────────────────────────────────────────────── */
const SYNONYMS = {
  'automate':'perform','repetitive':'routine','effort':'work',
  'improves':'increases','efficiency':'effectiveness',
  'institutions':'organizations','enables':'allows',
  'interpret':'understand','produce':'generate',
  'identify':'detect','benefits':'advantages',
  'comprehensive':'complete','significant':'major',
  'examine':'analyze','demonstrate':'show',
  'approximately':'about','contemporary':'modern',
  'transformative':'revolutionary','allows':'enables',
  'increases':'improves','perform':'automate'
};

/* ── Mock Analysis Data ──────────────────────────────────────── */
const MOCK_DATA = {
  student: {
    title: 'Impact of AI on Modern Education Systems',
    filename: 'student_paper.pdf',
    wordCount: 2847,
    sentences: [
      { id:'s1',  text:'Artificial intelligence can automate routine tasks that previously required significant human effort.',  section:'Introduction',     hm:4 },
      { id:'s2',  text:'Through personalized education, AI improves learning outcomes for individual students.',                section:'Introduction',     hm:3 },
      { id:'s3',  text:'Educational institutions can achieve greater efficiency through artificial intelligence systems.',       section:'Introduction',     hm:4 },
      { id:'s4',  text:'Machine learning algorithms analyze patterns in student performance data to provide recommendations.', section:'Literature Review', hm:3 },
      { id:'s5',  text:'The integration of AI tools in classrooms has been studied extensively over the past decade.',         section:'Literature Review', hm:2 },
      { id:'s6',  text:'Several researchers have noted improvements in student engagement when using adaptive learning platforms.', section:'Literature Review', hm:2 },
      { id:'s7',  text:'Our study employed a mixed-methods research design combining quantitative surveys and qualitative interviews.', section:'Methodology', hm:1 },
      { id:'s8',  text:'Data was collected from 450 undergraduate students across three universities during the spring semester.', section:'Methodology',    hm:0 },
      { id:'s9',  text:'Statistical analysis was performed using SPSS version 26 to evaluate correlation coefficients.',       section:'Methodology',       hm:1 },
      { id:'s10', text:'Results indicated a 34% improvement in academic performance among AI-assisted students.',              section:'Results',           hm:0 },
      { id:'s11', text:'Students reported higher satisfaction levels when interacting with personalized AI tutoring systems.', section:'Results',           hm:2 },
      { id:'s12', text:'AI allows machines to perform routine work automatically and with greater consistency than humans.',   section:'Discussion',        hm:4 },
      { id:'s13', text:'The findings suggest that AI integration is beneficial but must be implemented thoughtfully.',         section:'Discussion',        hm:1 },
      { id:'s14', text:'Natural language processing enables machines to understand and generate human language effectively.',  section:'Discussion',        hm:3 },
      { id:'s15', text:'In conclusion, artificial intelligence represents a transformative force in modern education.',        section:'Conclusion',        hm:2 }
    ]
  },
  reference: {
    title: 'Artificial Intelligence in Education: A Comprehensive Review',
    filename: 'reference_paper.pdf',
    wordCount: 3124,
    sentences: [
      { id:'r1',  text:'Artificial intelligence can automate repetitive tasks that previously required human effort.',             section:'Introduction',     matchId:'s1'  },
      { id:'r2',  text:'AI improves learning through personalized education, benefiting individual student outcomes.',             section:'Introduction',     matchId:'s2'  },
      { id:'r3',  text:'AI improves the efficiency of educational institutions significantly.',                                    section:'Introduction',     matchId:'s3'  },
      { id:'r4',  text:'Machine learning algorithms identify patterns in student data to generate learning recommendations.',      section:'Literature Review', matchId:'s4'  },
      { id:'r5',  text:'Extensive research over the past ten years has examined AI tool integration in educational settings.',     section:'Literature Review', matchId:'s5'  },
      { id:'r6',  text:'Adaptive learning platforms demonstrate measurable improvements in student engagement according to multiple studies.', section:'Literature Review', matchId:'s6' },
      { id:'r7',  text:'Mixed-methods research combining surveys and interviews provides comprehensive insights into educational outcomes.', section:'Methodology', matchId:'s7' },
      { id:'r8',  text:'Undergraduate student cohorts from multiple institutions were surveyed during academic terms.',            section:'Methodology',      matchId:'s8'  },
      { id:'r9',  text:'SPSS software was used to conduct correlation analysis on the collected performance data.',               section:'Methodology',      matchId:'s9'  },
      { id:'r10', text:'Academic performance improvements of approximately 30-35% were recorded among AI-assisted learners.',     section:'Results',          matchId:'s10' },
      { id:'r11', text:'Student satisfaction was notably higher in AI-assisted learning environments.',                           section:'Results',          matchId:'s11' },
      { id:'r12', text:'Artificial intelligence enables machines to perform repetitive work automatically.',                      section:'Discussion',       matchId:'s12' },
      { id:'r13', text:'AI integration benefits must be balanced with thoughtful implementation strategies.',                     section:'Discussion',       matchId:'s13' },
      { id:'r14', text:'Natural language processing allows machines to interpret and produce human language.',                    section:'Discussion',       matchId:'s14' },
      { id:'r15', text:'AI represents a transformative development in contemporary education systems.',                           section:'Conclusion',       matchId:'s15' }
    ]
  },
  matches: [
    { id:'m1',  studentId:'s1',  refId:'r1',  type:'EXACT',      exactOverlap:72, phraseOverlap:80, semanticSim:95, paraphraseConf:88, structuralSim:91, citation:false, evidenceStrength:'HIGH',   score:94 },
    { id:'m2',  studentId:'s2',  refId:'r2',  type:'PARAPHRASE', exactOverlap:31, phraseOverlap:62, semanticSim:91, paraphraseConf:94, structuralSim:72, citation:false, evidenceStrength:'HIGH',   score:89 },
    { id:'m3',  studentId:'s3',  refId:'r3',  type:'SEMANTIC',   exactOverlap:28, phraseOverlap:54, semanticSim:89, paraphraseConf:90, structuralSim:68, citation:false, evidenceStrength:'HIGH',   score:86 },
    { id:'m4',  studentId:'s4',  refId:'r4',  type:'SEMANTIC',   exactOverlap:45, phraseOverlap:65, semanticSim:82, paraphraseConf:79, structuralSim:74, citation:false, evidenceStrength:'MEDIUM', score:78 },
    { id:'m5',  studentId:'s5',  refId:'r5',  type:'PARAPHRASE', exactOverlap:22, phraseOverlap:48, semanticSim:78, paraphraseConf:74, structuralSim:60, citation:false, evidenceStrength:'MEDIUM', score:71 },
    { id:'m6',  studentId:'s6',  refId:'r6',  type:'SEMANTIC',   exactOverlap:18, phraseOverlap:42, semanticSim:74, paraphraseConf:70, structuralSim:55, citation:false, evidenceStrength:'MEDIUM', score:65 },
    { id:'m7',  studentId:'s7',  refId:'r7',  type:'STRUCTURAL', exactOverlap:35, phraseOverlap:55, semanticSim:68, paraphraseConf:62, structuralSim:80, citation:false, evidenceStrength:'MEDIUM', score:62 },
    { id:'m9',  studentId:'s9',  refId:'r9',  type:'EXACT',      exactOverlap:65, phraseOverlap:72, semanticSim:88, paraphraseConf:82, structuralSim:78, citation:false, evidenceStrength:'HIGH',   score:82 },
    { id:'m11', studentId:'s11', refId:'r11', type:'SEMANTIC',   exactOverlap:25, phraseOverlap:44, semanticSim:72, paraphraseConf:68, structuralSim:58, citation:false, evidenceStrength:'LOW',    score:60 },
    { id:'m12', studentId:'s12', refId:'r12', type:'EXACT',      exactOverlap:78, phraseOverlap:85, semanticSim:97, paraphraseConf:95, structuralSim:88, citation:false, evidenceStrength:'HIGH',   score:96 },
    { id:'m14', studentId:'s14', refId:'r14', type:'PARAPHRASE', exactOverlap:42, phraseOverlap:68, semanticSim:86, paraphraseConf:88, structuralSim:74, citation:false, evidenceStrength:'HIGH',   score:84 },
    { id:'m15', studentId:'s15', refId:'r15', type:'SEMANTIC',   exactOverlap:38, phraseOverlap:60, semanticSim:83, paraphraseConf:80, structuralSim:71, citation:false, evidenceStrength:'MEDIUM', score:78 }
  ],
  sources: [
    { id:'src1', title:'Wikipedia — Artificial Intelligence in Education', url:'https://en.wikipedia.org/wiki/AI_in_education',  pct:24, matchCount:5, type:'EXACT'      },
    { id:'src2', title:'IEEE Xplore — Machine Learning for Education',     url:'https://ieeexplore.ieee.org/document/9876543',   pct:17, matchCount:4, type:'SEMANTIC'   },
    { id:'src3', title:'ResearchGate — Personalized Learning Systems',     url:'https://www.researchgate.net/publication/12345', pct:11, matchCount:3, type:'PARAPHRASE' },
    { id:'src4', title:'ArXiv — NLP in Educational Technology',            url:'https://arxiv.org/abs/2301.00234',               pct:8,  matchCount:2, type:'SEMANTIC'   },
    { id:'src5', title:'Coursera Research — AI Tutoring Impact',           url:'https://research.coursera.org/ai-tutoring-2023', pct:5,  matchCount:2, type:'PARAPHRASE' }
  ],
  sections: [
    { name:'Introduction',     score:62, sentences:3, matches:3 },
    { name:'Literature Review',score:48, sentences:3, matches:3 },
    { name:'Methodology',      score:35, sentences:3, matches:2 },
    { name:'Results',          score:22, sentences:2, matches:1 },
    { name:'Discussion',       score:58, sentences:3, matches:3 },
    { name:'Conclusion',       score:41, sentences:1, matches:1 }
  ],
  kpi: {
    overallSimilarity:          47,
    originalityEstimate:        53,
    highConfidenceMatches:      6,
    semanticMatches:            5,
    exactWordMatches:           3,
    paraphrasedSentences:       4,
    sourcesDetected:            5,
    citationIssues:             12,
    confidenceScore:            88,
    processingTimeMs:           2340,
    sentencesAnalyzed:          15,
    referenceSentencesSearched: 15
  },
  layers: [
    { level:1, name:'Character',  score:18 },
    { level:2, name:'Word',       score:34 },
    { level:3, name:'Phrase',     score:42 },
    { level:4, name:'Sentence',   score:55 },
    { level:5, name:'Semantic',   score:47 },
    { level:6, name:'Paraphrase', score:38 },
    { level:7, name:'Paragraph',  score:44 },
    { level:8, name:'Section',    score:45 },
    { level:9, name:'Document',   score:47 }
  ]
};

/* ── AI Explanation templates ─────────────────────────────────── */
const AI_EXPLANATIONS = {
  EXACT:      function(m){ return 'Both passages share identical or near-identical wording. The student text reproduces content from the reference with ' + m.exactOverlap + '% exact word overlap and ' + m.phraseOverlap + '% phrase overlap. This is a high-confidence match requiring immediate review.'; },
  PARAPHRASE: function(m){ return 'The student has changed the wording while preserving the original meaning. Semantic similarity is ' + m.semanticSim + '% with paraphrase confidence of ' + m.paraphraseConf + '%. The core idea is expressed differently but originates from the same source concept.'; },
  SEMANTIC:   function(m){ return 'Although many words differ, the underlying meaning is nearly identical — semantic similarity: ' + m.semanticSim + '%. The student may have drawn ideas from this source without direct quotation or appropriate citation.'; },
  STRUCTURAL: function(m){ return 'The sentence structure and argument organisation closely mirrors the reference. While individual words differ, the structural similarity score is ' + m.structuralSim + '%, suggesting the student modelled their writing on this source.'; }
};

/* ── Tokenizer ─────────────────────────────────────────────────── */
function tokenize(text) {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').split(/\s+/).filter(Boolean);
}
function isStopword(word) { return STOPWORDS.has(word); }
function isSynonym(w1, w2) {
  return SYNONYMS[w1] === w2 || SYNONYMS[w2] === w1;
}

/* ── Word diff (annotated HTML) ────────────────────────────────── */
function buildWordDiff(studentText, refText) {
  var rToks  = tokenize(refText);
  var rSet   = new Set(rToks);
  var phrases = new Set();
  for (var i = 0; i <= rToks.length - 3; i++) {
    phrases.add(rToks.slice(i, i + 3).join(' '));
  }

  var html  = '';
  var words = studentText.split(/(\s+)/);
  var idx   = 0;
  while (idx < words.length) {
    var raw   = words[idx];
    var word  = raw.trim();
    if (!word) { html += raw; idx++; continue; }
    var lower = word.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!lower) { html += raw; idx++; continue; }

    var next2 = words.slice(idx + 1, idx + 5).join('').split(/\s+/).filter(Boolean).slice(0, 2);
    if (next2.length === 2) {
      var phrase3 = [lower, next2[0].toLowerCase(), next2[1].toLowerCase()].join(' ');
      if (phrases.has(phrase3) && !isStopword(lower)) {
        html += '<span class="wd-phrase" title="Phrase match">' + words.slice(idx, idx + 5).join('') + '</span>';
        idx += 5; continue;
      }
    }

    if (isStopword(lower)) {
      html += '<span class="wd-stopword">' + raw + '</span>';
    } else if (rSet.has(lower)) {
      html += '<span class="wd-exact" title="Exact word match">' + raw + '</span>';
    } else {
      var synKey = Object.keys(SYNONYMS).find(function(k) { return SYNONYMS[k] === lower || k === lower; });
      if (synKey && rSet.has(synKey)) {
        html += '<span class="wd-synonym" title="Synonym">' + raw + '</span>';
      } else {
        html += raw;
      }
    }
    idx++;
  }
  return html;
}

/* ── Phrase detection ──────────────────────────────────────────── */
function detectPhrases(studentText, refText) {
  var sToks   = tokenize(studentText);
  var rToks   = tokenize(refText);
  var rJoined = rToks.join(' ');
  var matches = [];
  for (var len = 5; len >= 3; len--) {
    for (var i = 0; i <= sToks.length - len; i++) {
      var phrase = sToks.slice(i, i + len).join(' ');
      if (rJoined.includes(phrase)) {
        var hasContent = sToks.slice(i, i + len).some(function(w) { return !isStopword(w); });
        if (hasContent) matches.push({ phrase: phrase, length: len, start: i });
      }
    }
  }
  var deduped = [];
  matches.forEach(function(m) {
    if (!deduped.some(function(d) { return d.phrase.includes(m.phrase) || m.phrase.includes(d.phrase); })) {
      deduped.push(m);
    }
  });
  return deduped;
}

function phraseOverlapPct(studentText, refText) {
  var phrases = detectPhrases(studentText, refText);
  var sToks   = tokenize(studentText);
  var covered = new Set();
  phrases.forEach(function(p) {
    var idx = sToks.join(' ').indexOf(p.phrase);
    for (var i = idx; i < idx + p.phrase.length; i++) covered.add(i);
  });
  return Math.round((covered.size / (sToks.join(' ').length || 1)) * 100);
}

/* ── Transformation analysis ───────────────────────────────────── */
function analyzeTransformation(studentText, refText) {
  var sWords  = tokenize(studentText);
  var rWords  = tokenize(refText);
  var changes = [];
  rWords.forEach(function(w) {
    if (isStopword(w)) return;
    if (!sWords.includes(w)) {
      var syn = sWords.find(function(s) { return isSynonym(s, w); });
      if (syn) changes.push({ type:'synonym', from: w, to: syn });
      else     changes.push({ type:'removed', word: w });
    }
  });
  sWords.forEach(function(w) {
    if (isStopword(w)) return;
    if (!rWords.includes(w)) {
      var syn = rWords.find(function(r) { return isSynonym(r, w); });
      if (!syn) changes.push({ type:'added', word: w });
    }
  });
  return changes;
}

/* ── Score helpers ─────────────────────────────────────────────── */
function scoreColor(score) {
  if (score >= 70) return 'var(--risk-critical)';
  if (score >= 50) return 'var(--risk-high)';
  if (score >= 25) return 'var(--risk-medium)';
  return 'var(--risk-low)';
}
function scoreLabel(score) {
  if (score >= 70) return 'Critical';
  if (score >= 50) return 'High';
  if (score >= 25) return 'Medium';
  return 'Low';
}
function hmClass(score) {
  if (score <= 0) return 'hm-0';
  if (score === 1) return 'hm-1';
  if (score === 2) return 'hm-2';
  if (score === 3) return 'hm-3';
  return 'hm-4';
}
function riskBadge(level) {
  var cls = { LOW:'chip-common', MEDIUM:'chip-structural', HIGH:'chip-paraphrase', CRITICAL:'chip-exact' };
  return '<span class="match-chip ' + (cls[level] || 'chip-semantic') + '">' + (level || '—') + '</span>';
}
function matchChip(type) {
  var cls = { EXACT:'chip-exact', SEMANTIC:'chip-semantic', PARAPHRASE:'chip-paraphrase', STRUCTURAL:'chip-structural', COMMON:'chip-common', CITATION:'chip-citation' };
  return '<span class="match-chip ' + (cls[type] || 'chip-semantic') + '">' + (type || '—') + '</span>';
}

/* ── AI Response brain ─────────────────────────────────────────── */
var activeMatch = null;

function getAIResponse(input, match) {
  var q = (input || '').toLowerCase();
  var m = match || activeMatch;

  if (q.includes('flagg') || (q.includes('why') && q.includes('this'))) {
    if (!m) return 'No match selected. Click a highlighted sentence first, then ask me.';
    var s = MOCK_DATA.student.sentences.find(function(x){ return x.id === m.studentId; });
    var r = MOCK_DATA.reference.sentences.find(function(x){ return x.id === m.refId; });
    return '**Why was this flagged?**\n\nThis passage shows **' + m.type + '** similarity (' + m.score + '%) with the reference document.\n\n**Student:** "' + (s ? s.text : '—') + '"\n**Reference:** "' + (r ? r.text : '—') + '"\n\n' + (AI_EXPLANATIONS[m.type] ? AI_EXPLANATIONS[m.type](m) : '') + '\n\nExact overlap: ' + m.exactOverlap + '% | Semantic: ' + m.semanticSim + '% | Paraphrase: ' + m.paraphraseConf + '%';
  }

  if (q.includes('suspicious') || q.includes('most') && q.includes('section')) {
    var top = MOCK_DATA.matches.filter(function(x){ return x.evidenceStrength === 'HIGH'; }).slice(0, 3);
    return '**Most Suspicious Sections:**\n\n' + top.map(function(x, i) {
      var s = MOCK_DATA.student.sentences.find(function(z){ return z.id === x.studentId; });
      return (i+1) + '. **' + (s ? s.section : '—') + '** — "' + (s ? s.text.substring(0,60) : '') + '…"\n   Type: ' + x.type + ' | Score: ' + x.score + '% | Semantic: ' + x.semanticSim + '%';
    }).join('\n\n');
  }

  if (q.includes('source') || q.includes('contribut')) {
    return '**Top Contributing Sources:**\n\n' + MOCK_DATA.sources.slice(0, 3).map(function(s, i) {
      return (i+1) + '. **' + s.title + '**\n   Contribution: ' + s.pct + '% | ' + s.matchCount + ' matching passages\n   ' + s.url;
    }).join('\n\n');
  }

  if (q.includes('explain') || q.includes('simple')) {
    if (!m) return 'Please select a specific match first. Click any highlighted sentence on the Overview page.';
    var s2 = MOCK_DATA.student.sentences.find(function(x){ return x.id === m.studentId; });
    var r2 = MOCK_DATA.reference.sentences.find(function(x){ return x.id === m.refId; });
    return '**Match Explanation:**\n\n**Student:** "' + (s2 ? s2.text : '—') + '"\n\n**Reference:** "' + (r2 ? r2.text : '—') + '"\n\n' + (AI_EXPLANATIONS[m.type] ? AI_EXPLANATIONS[m.type](m) : 'No explanation available.') + '\n\nSemantic similarity: ' + m.semanticSim + '% | Paraphrase confidence: ' + m.paraphraseConf + '%';
  }

  if (q.includes('paraphrase')) {
    var pm = MOCK_DATA.matches.filter(function(x){ return x.type === 'PARAPHRASE' || x.paraphraseConf > 80; });
    return '**Paraphrased Content (' + pm.length + ' passages):**\n\n' + pm.map(function(x) {
      var s = MOCK_DATA.student.sentences.find(function(z){ return z.id === x.studentId; });
      return '• "' + (s ? s.text.substring(0,70) : '') + '…"\n  Confidence: ' + x.paraphraseConf + '% | Section: ' + (s ? s.section : '—');
    }).join('\n\n');
  }

  if (q.includes('citation') || q.includes('cite')) {
    var missing = MOCK_DATA.matches.filter(function(x){ return !x.citation; });
    return '**Citation Analysis:**\n\n**' + missing.length + '** of ' + MOCK_DATA.matches.length + ' flagged passages have no detected citation.\n\nCitation detection scanned for APA, MLA, IEEE, numbered references, author-year, URLs and DOIs.\n\n⚠️ Missing citation does not automatically mean plagiarism — teacher must make the final decision.';
  }

  if (q.includes('score') || q.includes('47') || q.includes('%')) {
    return '**Why is the overall score ' + MOCK_DATA.kpi.overallSimilarity + '%?**\n\nThe score combines:\n• Exact word match: ' + (MOCK_DATA.layers.find(function(l){ return l.name === 'Word'; }) || {score:34}).score + '% (weight 40%)\n• Semantic similarity: ' + MOCK_DATA.kpi.overallSimilarity + '% (weight 35%)\n• Paraphrase score: ' + (MOCK_DATA.layers.find(function(l){ return l.name === 'Paraphrase'; }) || {score:38}).score + '% (weight 25%)\n\nSentences analyzed: ' + MOCK_DATA.kpi.sentencesAnalyzed + ' | Originality estimate: **' + MOCK_DATA.kpi.originalityEstimate + '%**';
  }

  if (q.includes('section') && (q.includes('high') || q.includes('most') || q.includes('risk'))) {
    var topSec = MOCK_DATA.sections.slice().sort(function(a,b){ return b.score - a.score; })[0];
    return '**Highest Risk Section: ' + topSec.name + '**\n\nSimilarity: ' + topSec.score + '% | ' + topSec.matches + ' of ' + topSec.sentences + ' sentences flagged\n\n**All sections:**\n' + MOCK_DATA.sections.map(function(s){ return '• ' + s.name + ': ' + s.score + '%'; }).join('\n');
  }

  if (q.includes('original')) {
    var orig = MOCK_DATA.student.sentences.filter(function(s){ return s.hm === 0; }).length;
    return '**Original Content:**\n\nApproximately **' + MOCK_DATA.kpi.originalityEstimate + '%** of the document appears original.\n\n• Sentences with no similarity: ' + orig + ' / ' + MOCK_DATA.student.sentences.length + '\n• Most original sections: Methodology, Results\n• Sections needing review: Introduction, Discussion\n\nNote: Some academic phrasing similarity is normal and expected.';
  }

  if (q.includes('summary') || q.includes('overview') || q.includes('finding')) {
    return '**Plagiarism Analysis Summary**\n\nDocument: "' + MOCK_DATA.student.title + '"\n\n• Overall similarity: **' + MOCK_DATA.kpi.overallSimilarity + '%**\n• Originality estimate: **' + MOCK_DATA.kpi.originalityEstimate + '%**\n• High-confidence matches: **' + MOCK_DATA.kpi.highConfidenceMatches + '**\n• Exact word matches: ' + MOCK_DATA.kpi.exactWordMatches + '\n• Paraphrased sentences: ' + MOCK_DATA.kpi.paraphrasedSentences + '\n• Missing citations: ' + MOCK_DATA.kpi.citationIssues + '\n• Sources detected: ' + MOCK_DATA.kpi.sourcesDetected + '\n\nHighest risk: ' + MOCK_DATA.sections.slice().sort(function(a,b){ return b.score-a.score; })[0].name + '\n\n⚠️ All matches require teacher review before any academic integrity determination.';
  }

  if (q.includes('exact') || q.includes('word match') || q.includes('verbatim')) {
    var exact = MOCK_DATA.matches.filter(function(x){ return x.type === 'EXACT'; });
    return '**Exact Word Matches (' + exact.length + ' passages):**\n\n' + exact.map(function(x) {
      var s = MOCK_DATA.student.sentences.find(function(z){ return z.id === x.studentId; });
      return '• Score: ' + x.score + '% | Overlap: ' + x.exactOverlap + '% | "' + (s ? s.text.substring(0,60) : '') + '…"';
    }).join('\n');
  }

  if (q.includes('semantic')) {
    return '**Semantic Similarity Analysis:**\n\n' + MOCK_DATA.kpi.semanticMatches + ' passages show high semantic (meaning-level) similarity.\n\nSemantic analysis detects conceptual overlap even when wording is completely different. It uses embedding-based comparison rather than keyword matching.\n\nOverall semantic score: ' + MOCK_DATA.kpi.overallSimilarity + '%';
  }

  if (q.includes('compare') && q.includes('intro')) {
    var intros = MOCK_DATA.matches.filter(function(x) {
      var s = MOCK_DATA.student.sentences.find(function(z){ return z.id === x.studentId; });
      return s && s.section === 'Introduction';
    });
    return '**Introduction Comparison (' + intros.length + ' matches):**\n\n' + intros.map(function(x) {
      var s = MOCK_DATA.student.sentences.find(function(z){ return z.id === x.studentId; });
      var r = MOCK_DATA.reference.sentences.find(function(z){ return z.id === x.refId; });
      return 'Type: ' + x.type + ' | Score: ' + x.score + '%\nStudent: "' + (s ? s.text : '—') + '"\nReference: "' + (r ? r.text : '—') + '"';
    }).join('\n\n---\n\n');
  }

  return 'I analyzed **"' + MOCK_DATA.student.title + '"** and found **' + MOCK_DATA.kpi.overallSimilarity + '% similarity** across ' + MOCK_DATA.kpi.sentencesAnalyzed + ' sentences.\n\nYou can ask me:\n• "Why was this flagged?"\n• "Show suspicious sections"\n• "Show top sources"\n• "Find paraphrases"\n• "Check citations"\n• "Give me a summary"\n• "Why is the score ' + MOCK_DATA.kpi.overallSimilarity + '%?"';
}

/* ── Markdown renderer for chat ────────────────────────────────── */
function renderMd(text) {
  if (!text) return '';
  return String(text)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n\n/g, '<br><br>')
    .replace(/\n/g,   '<br>')
    .replace(/•\s/g,  '&nbsp;&nbsp;•&nbsp;');
}

/* ── HTML escape ───────────────────────────────────────────────── */
function escHtml(s) {
  var d = document.createElement('div');
  d.textContent = String(s || '');
  return d.innerHTML;
}

/* ── Toast notification ────────────────────────────────────────── */
function toast(msg, type, dur) {
  type = type || 'info';
  dur  = dur  || 3500;
  var c = document.getElementById('toastContainer');
  if (!c) return;
  var icons = { success:'✅', error:'❌', info:'💡', warning:'⚠️' };
  var el = document.createElement('div');
  el.className = 'toast ' + type;
  el.innerHTML = '<span>' + (icons[type] || 'ℹ️') + '</span><span>' + escHtml(msg) + '</span>';
  c.appendChild(el);
  setTimeout(function() {
    el.style.opacity = '0';
    el.style.transform = 'translateX(20px)';
    el.style.transition = 'all 0.3s';
    setTimeout(function() { el.remove(); }, 300);
  }, dur);
}

/* ── Format helpers ────────────────────────────────────────────── */
function fmtMs(ms) { return ms < 1000 ? ms + 'ms' : (ms / 1000).toFixed(1) + 's'; }

/* ── Animated counter ──────────────────────────────────────────── */
function countUp(el, target, suffix, duration) {
  if (!el) return;
  suffix   = suffix   || '';
  duration = duration || 900;
  var start = performance.now();
  function step(now) {
    var p    = Math.min((now - start) / duration, 1);
    var ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(target * ease) + suffix;
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── Auth helpers ──────────────────────────────────────────────── */
function requireAuthAdv() {
  // Demo mode — all pages work without login
  return true;
}

function getUser() {
  try {
    var u = JSON.parse(localStorage.getItem('pc_user') || 'null');
    return u || { username: 'Demo User', email: 'demo@plagiacheck.ai', role: 'STUDENT' };
  } catch(e) {
    return { username: 'Demo User', email: 'demo@plagiacheck.ai', role: 'STUDENT' };
  }
}

/* ── Init nav user display ─────────────────────────────────────── */
function initAdvNav() {
  var user = getUser();
  if (!user) return;
  var name = user.username || 'User';
  var initial = name.charAt(0).toUpperCase();

  document.querySelectorAll('.nav-user-name, #topbarUserName, #userName').forEach(function(el) {
    el.textContent = name;
  });
  document.querySelectorAll('.nav-user-avatar, .topbar-avatar, #topbarAvatar, #userAvatar').forEach(function(el) {
    el.textContent = initial;
  });
  document.querySelectorAll('.logout-btn').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      localStorage.removeItem('pc_token');
      localStorage.removeItem('pc_user');
      window.location.href = '/login.html';
    });
  });
}

/* ── Floating AI chat ──────────────────────────────────────────── */
function initFloatingChat() {
  var btn   = document.getElementById('floatChatBtn');
  var panel = document.getElementById('floatChatPanel');
  if (!btn || !panel) return;

  var isOpen    = false;
  var welcomed  = false;
  var msgBox    = panel.querySelector('.chat-messages') || panel.querySelector('#floatMessages');
  var input     = panel.querySelector('.chat-input');
  var sendBtn   = panel.querySelector('.chat-send-btn');
  var prompts   = panel.querySelectorAll('.prompt-chip');

  function open() {
    panel.classList.add('open');
    isOpen = true;
    btn.innerHTML = '<i class="fa-solid fa-xmark" style="font-size:1.2rem"></i>';
    if (!welcomed && msgBox) {
      welcomed = true;
      addMsg('ai', 'Hi! I\'m **PlagiGuard AI** 🤖\n\nI\'ve analyzed **"' + MOCK_DATA.student.title + '"**\nSimilarity: **' + MOCK_DATA.kpi.overallSimilarity + '%** | Originality: **' + MOCK_DATA.kpi.originalityEstimate + '%**\n\nAsk me anything about the results!');
    }
    if (msgBox) setTimeout(function(){ msgBox.scrollTop = 99999; }, 50);
  }

  function close() {
    panel.classList.remove('open');
    isOpen = false;
    btn.innerHTML = '🤖<span class="notif">!</span>';
  }

  btn.addEventListener('click', function() { isOpen ? close() : open(); });

  function send(text) {
    text = (text || '').trim();
    if (!text) return;
    addMsg('user', text);
    if (input) input.value = '';

    // typing dots
    var typing = document.createElement('div');
    typing.id = '_floatTyping';
    typing.className = 'chat-msg';
    typing.innerHTML = '<div class="chat-msg-avatar msg-ai-avatar">🤖</div><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div>';
    if (msgBox) { msgBox.appendChild(typing); msgBox.scrollTop = 99999; }

    setTimeout(function() {
      var t = document.getElementById('_floatTyping');
      if (t) t.remove();
      addMsg('ai', getAIResponse(text, activeMatch));
    }, 600 + Math.random() * 400);
  }

  function addMsg(role, text) {
    if (!msgBox) return;
    var isAI = role === 'ai';
    var div  = document.createElement('div');
    div.className = 'chat-msg' + (isAI ? '' : ' user');
    div.innerHTML =
      '<div class="chat-msg-avatar ' + (isAI ? 'msg-ai-avatar' : 'msg-user-avatar') + '">' + (isAI ? '🤖' : '👤') + '</div>' +
      '<div class="chat-bubble ' + (isAI ? 'bubble-ai' : 'bubble-user') + '">' + (isAI ? renderMd(text) : escHtml(text)) + '</div>';
    msgBox.appendChild(div);
    msgBox.scrollTop = 99999;
  }

  if (sendBtn) sendBtn.addEventListener('click', function() { send(input ? input.value : ''); });
  if (input)   input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input.value); }
  });
  prompts.forEach(function(p) {
    p.addEventListener('click', function() {
      send(p.textContent.replace(/[\[\]]/g, '').trim());
    });
  });
}

/* ── Append message to full AI page chat ───────────────────────── */
function appendFloatMsg(role, text) {
  var panel = document.getElementById('floatChatPanel');
  if (!panel) return;
  var container = panel.querySelector('.chat-messages') || panel.querySelector('#floatMessages');
  if (!container) return;
  var isAI = role === 'ai';
  var div  = document.createElement('div');
  div.className = 'chat-msg' + (isAI ? '' : ' user');
  div.innerHTML =
    '<div class="chat-msg-avatar ' + (isAI ? 'msg-ai-avatar' : 'msg-user-avatar') + '">' + (isAI ? '🤖' : '👤') + '</div>' +
    '<div class="chat-bubble ' + (isAI ? 'bubble-ai' : 'bubble-user') + '">' + (isAI ? renderMd(text) : escHtml(text)) + '</div>';
  container.appendChild(div);
  container.scrollTop = 99999;
}

/* ── Safe regex (prevents ReDoS) ───────────────────────────────── */
function safeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
