// Krishna Divinity - Student Course Content
// Structured topic-wise (Modules & Classes).
// Synced dynamically from Google Sheets 'Lessons' published CSV tab.

window.KD_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vS4XzE8kHkKs3z3JzAUWXFXvqD4SFz6QF4bThewGyFWiu88msGxdgedltZCJBg2gt1uGStfNly5Bxt9/pub?gid=803244824&single=true&output=csv";

// Fallback & base initial structure matching the Google Sheet exactly
window.KD_COURSES = {
  gita: {
    id: "gita",
    title: "Bhagavad Gita Foundation Course",
    badge: "Spiritual Wisdom",
    instructor: "Rohini Suta Dasa",
    telegramLink: "https://t.me/+zrMP1VqfFBQzNjE1",
    description: "Systematic, practical, and interactive study of Bhagavad Gita As It Is with live class recordings and structured digital learning.",
    modules: [
      {
        moduleName: "Chapter 1: Arjuna Vishada Yoga",
        moduleNumber: "1",
        lessons: [
          {
            id: "gita-1-1",
            classNo: "1.1",
            title: "Observing the Armies & Signs of Victory",
            duration: "53 mins",
            description: "The battlefield of Kurukshetra and Parampara.",
            youtube: "https://www.youtube.com/embed/iGHaiZDs7Jw",
            pdfs: [
              { url: "https://drive.google.com/file/d/18b16eY03lBkl0IePNJrITvbcb7a93AD6/view?usp=drive_link", label: "PDF 1: Chapter 1 Notes" },
              { url: "https://drive.google.com/", label: "PDF 2: Parampara Chart" },
              { url: "https://drive.google.com/", label: "PDF 3: Shloka Guide" }
            ]
          }
        ]
      },
      {
        moduleName: "Chapter 2: Sankhya Yoga",
        moduleNumber: "2",
        lessons: [
          {
            id: "gita-2-1",
            classNo: "2.1",
            title: "Surrender to Spiritual Master",
            duration: "35 mins",
            description: "Arjuna accepts Krishna as his Guru.",
            youtube: "https://www.youtube.com/embed/DwhE0rq171Y",
            pdfs: [
              { url: "https://drive.google.com/file/d/1YF-ZH85-PcLvF3jxhG1ryHep8J53AOVS/view?usp=sharing", label: "PDF 1: Chapter 2 Notes" }
            ]
          }
        ]
      },
      {
        moduleName: "Chapter 3: Karma Yoga (कर्म योग)",
        moduleNumber: "3",
        lessons: [
          {
            id: "gita-3-1",
            classNo: "3.1",
            title: "Action in Krishna Consciousness",
            duration: "1 hr 11 min",
            description: "Action in Krishna Consciousness: Why working in devotion is superior to premature renunciation. Performing prescribed duties without fruitive attachment.",
            youtube: "https://www.youtube.com/embed/J515fKeNZ_A",
            pdfs: [
              { url: "https://drive.google.com/file/d/1giM_wRMjdKfF-uG0k04_8wLrX-0zfhAm/view?usp=sharing", label: "PDF 1: Chapter 3 Karma Yoga Notes" }
            ]
          }
        ]
      },
      {
        moduleName: "Chapter 4: Transcendental Knowledge (दिव्य ज्ञान)",
        moduleNumber: "4",
        lessons: [
          {
            id: "gita-4-1",
            classNo: "4.1",
            title: "The Divine Appearance of Krishna & Parampara",
            duration: "1 hr 01 min",
            description: "Transcendental Knowledge: Disciplic succession (parampara), divine birth and activities of Krishna (janma karma ca me divyam), and approaching a spiritual master.",
            youtube: "https://www.youtube.com/embed/oQFperf2qj8",
            pdfs: [
              { url: "https://drive.google.com/file/d/1EXFGxox66G07FgBiqmxy29SkpsIZU6eD/view?usp=sharing", label: "PDF 1: Chapter 4 Study Notes" }
            ]
          }
        ]
      },
      {
        moduleName: "Chapter 5: Karma Sannyasa Yoga",
        moduleNumber: "5",
        lessons: [
          {
            id: "gita-5-1",
            classNo: "5.1",
            title: "Action in Devotion & The Lotus Leaf Analogy",
            duration: "54 mins",
            description: "Karma-Sannyasa vs Karma-Yoga: Performing prescribed duties without attachment, like a lotus leaf untouched by water (padma-patram ivambhasa), and the ultimate Peace Formula (5.29).",
            youtube: "https://www.youtube.com/embed/XlfVKO12UlM",
            pdfs: [
              { url: "https://drive.google.com/file/d/1TqkNKwf8jLSxxYgzjcS0D-uGLpTdVkeM/view?usp=sharing", label: "PDF 1: Chapter 5 Karma Sannyasa Notes" }
            ]
          }
        ]
      }
    ]
  },
  ai: {
    id: "ai",
    title: "Practical AI Course",
    badge: "10 Modern Skills",
    instructor: "Rohini Suta Dasa",
    telegramLink: "https://t.me/+zrMP1VqfFBQzNjE1",
    description: "Learn practical Artificial Intelligence tools and real workflows: prompt engineering, content generation, visual design, video creation, and teaching automation.",
    modules: [
      {
        moduleName: "Topic 1: Script Writing",
        moduleNumber: "1",
        lessons: [
          {
            id: "ai-1-1",
            classNo: "1.1",
            title: "Hook & Core Concept",
            duration: "45 mins",
            description: "Structuring engaging hooks using AI.",
            youtube: "",
            pdfs: [
              { url: "https://drive.google.com/", label: "PDF 1: Class Notes" },
              { url: "https://drive.google.com/", label: "PDF 2: Prompts Cheatsheet" },
              { url: "https://drive.google.com/", label: "PDF 3: Homework Assignment" }
            ]
          },
          {
            id: "ai-1-2",
            classNo: "1.2",
            title: "Pacing, Tone & Storytelling",
            duration: "50 mins",
            description: "Refining tone for spiritual and educational videos.",
            youtube: "",
            pdfs: [
              { url: "https://drive.google.com/", label: "PDF 1: Storytelling Blueprint" },
              { url: "https://drive.google.com/", label: "PDF 2: Assignment Sheet" }
            ]
          }
        ]
      },
      {
        moduleName: "Topic 2: AI Video Creation",
        moduleNumber: "2",
        lessons: [
          {
            id: "ai-2-1",
            classNo: "2.1",
            title: "AI Tools & Automated Captions",
            duration: "48 mins",
            description: "Automated subtitle generation and editing.",
            youtube: "",
            pdfs: [
              { url: "https://drive.google.com/", label: "PDF 1: Video Tools Cheatsheet" }
            ]
          }
        ]
      },
      {
        moduleName: "Topic 3: Graphic Design & Image Generation",
        moduleNumber: "3",
        lessons: [
          {
            id: "ai-3-1",
            classNo: "3.1",
            title: "Graphic Design — YouTube Thumbnails with AI",
            duration: "45 mins",
            description: "Designing high-CTR YouTube thumbnails with vibrant contrast, expressive faces, and clean typography.",
            youtube: "",
            pdfs: [
              { url: "https://drive.google.com/", label: "Download 3.1 Thumbnail Prompts (PDF)" }
            ]
          },
          {
            id: "ai-3-2",
            classNo: "3.2",
            title: "Graphic Design — Posters, Social Graphics & Artwork",
            duration: "50 mins",
            description: "Generating educational posters, festival announcements, and spiritual art with Midjourney/DALL-E prompts.",
            youtube: "",
            pdfs: [
              { url: "https://drive.google.com/", label: "Download 3.2 Art Generation Guide (PDF)" }
            ]
          }
        ]
      },
      {
        moduleName: "Topic 4: Prompt Engineering & Research",
        moduleNumber: "4",
        lessons: [
          {
            id: "ai-4-1",
            classNo: "4.1",
            title: "Prompt Engineering — Fundamentals & Techniques",
            duration: "50 mins",
            description: "Mastering role prompts, few-shot prompting, chain-of-thought, and output constraints.",
            youtube: "",
            pdfs: [
              { url: "https://drive.google.com/", label: "Download 4.1 Master Prompts (PDF)" }
            ]
          },
          {
            id: "ai-4-2",
            classNo: "4.2",
            title: "Deep Research & Literature Synthesis",
            duration: "45 mins",
            description: "Summarizing books, comparing translations, synthesizing research papers, and organizing notes.",
            youtube: "",
            pdfs: [
              { url: "https://drive.google.com/", label: "Download 4.2 Research Framework (PDF)" }
            ]
          }
        ]
      }
    ]
  }
};

// Check if cached data exists in localStorage
try {
  const cached = localStorage.getItem('kd_sheet_courses_cache');
  if (cached) {
    const parsedCache = JSON.parse(cached);
    if (parsedCache && parsedCache.gita && parsedCache.ai) {
      window.KD_COURSES = parsedCache;
    }
  }
} catch (e) {}

// Robust CSV Parser
window.kdParseCSV = function(text) {
  const lines = [];
  let row = [''];
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '"') {
      if (inQuotes && next === '"') {
        row[row.length - 1] += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      row.push('');
    } else if ((c === '\r' || c === '\n') && !inQuotes) {
      if (c === '\r' && next === '\n') i++;
      lines.push(row);
      row = [''];
    } else {
      row[row.length - 1] += c;
    }
  }
  if (row.length > 1 || (row.length === 1 && row[0] !== '')) {
    lines.push(row);
  }
  return lines;
};

// Dynamic sync function that fetches from Google Sheet CSV
window.syncCoursesFromGoogleSheet = async function(onSuccess) {
  if (!window.KD_SHEET_CSV_URL) return;
  try {
    const res = await fetch(window.KD_SHEET_CSV_URL, { cache: 'no-cache' });
    if (!res.ok) return;
    const csv = await res.text();
    const table = window.kdParseCSV(csv);
    if (table.length <= 1) return;

    const headers = table[0].map(h => (h || '').trim().toLowerCase().replace(/[\s_-]+/g, ''));
    
    // Create new structure preserving course metadata
    const updated = {
      gita: {
        id: 'gita',
        title: 'Bhagavad Gita Foundation Course',
        badge: 'Spiritual Wisdom',
        instructor: 'Rohini Suta Dasa',
        telegramLink: 'https://t.me/+zrMP1VqfFBQzNjE1',
        description: 'Systematic, practical, and interactive study of Bhagavad Gita As It Is with live class recordings and structured digital learning.',
        modules: []
      },
      ai: {
        id: 'ai',
        title: 'Practical AI Course',
        badge: '10 Modern Skills',
        instructor: 'Rohini Suta Dasa',
        telegramLink: 'https://t.me/+zrMP1VqfFBQzNjE1',
        description: 'Learn practical Artificial Intelligence tools and real workflows: prompt engineering, content generation, visual design, video creation, and teaching automation.',
        modules: []
      }
    };

    let hasGita = false;
    let hasAi = false;

    for (let i = 1; i < table.length; i++) {
      const row = table[i];
      if (!row || !row[0]) continue;
      const get = (key) => {
        const idx = headers.indexOf(key);
        return idx >= 0 && row[idx] !== undefined ? String(row[idx]).trim() : '';
      };

      const courseId = get('course').toLowerCase();
      if (!updated[courseId]) continue;
      if (courseId === 'gita') hasGita = true;
      if (courseId === 'ai') hasAi = true;

      const moduleName = get('module') || 'General';
      let mod = updated[courseId].modules.find(m => m.moduleName === moduleName);
      if (!mod) {
        mod = {
          moduleName: moduleName,
          moduleNumber: String(updated[courseId].modules.length + 1),
          lessons: []
        };
        updated[courseId].modules.push(mod);
      }

      const pdfList = [];
      const p1 = get('pdf1') || get('pdf');
      const p1L = get('pdflabel1') || 'PDF 1: Class Notes';
      if (p1) pdfList.push({ url: p1, label: p1L });

      const p2 = get('pdf2');
      const p2L = get('pdflabel2') || 'PDF 2: Study Material';
      if (p2) pdfList.push({ url: p2, label: p2L });

      const p3 = get('pdf3');
      const p3L = get('pdflabel3') || 'PDF 3: Reference Guide';
      if (p3) pdfList.push({ url: p3, label: p3L });

      let yt = get('youtube') || '';
      if (yt) {
        if (yt.includes('youtu.be/')) {
          const vid = yt.split('youtu.be/')[1].split('?')[0];
          yt = `https://www.youtube.com/embed/${vid}`;
        } else if (yt.includes('watch?v=')) {
          const vid = yt.split('watch?v=')[1].split('&')[0];
          yt = `https://www.youtube.com/embed/${vid}`;
        } else if (!yt.startsWith('http')) {
          yt = `https://www.youtube.com/embed/${yt}`;
        }
      }

      mod.lessons.push({
        id: `${courseId}-${mod.moduleNumber}-${mod.lessons.length + 1}`,
        classNo: get('classno') || `${mod.moduleNumber}.${mod.lessons.length + 1}`,
        title: get('title') || ('Class ' + (mod.lessons.length + 1)),
        duration: get('duration') || 'Session',
        description: get('description'),
        youtube: yt,
        pdfs: pdfList
      });
    }

    if (hasGita) window.KD_COURSES.gita.modules = updated.gita.modules;
    if (hasAi && updated.ai.modules.length > 0) {
      // If AI sheet has rows, keep them and supplement with remaining curriculum if any
      window.KD_COURSES.ai.modules = updated.ai.modules;
    }

    try {
      localStorage.setItem('kd_sheet_courses_cache', JSON.stringify(window.KD_COURSES));
    } catch (e) {}

    if (typeof onSuccess === 'function') {
      onSuccess(window.KD_COURSES);
    }
  } catch (err) {
    console.warn('Google Sheet CSV auto-sync encountered an error, using static fallback:', err);
  }
};
