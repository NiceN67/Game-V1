const OxfordGame = (() => {
  const WORDS = window.OXFORD_WORDS || [];
  const MANUAL_TRANSLATIONS = {
    "direction": "ทิศทาง / คำสั่ง",
    "preparation": "การเตรียมพร้อม",
    "title": "หัวข้อ / ชื่อเรื่อง",
    "earn": "ได้รับ / หาเงินได้"
  };

  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function wordsByLevel(level) {
    if (!level || level === "all") return WORDS;
    return WORDS.filter(item => item.level === level || item.levels.includes(level));
  }

  function pickWord(level = "all") {
    const pool = wordsByLevel(level);
    return pool[Math.floor(Math.random() * pool.length)];
  }

  function cleanWord(word) {
    return String(word).replace(/\d+$/g, "").trim();
  }

  function hasThai(value) {
    return /[\u0e00-\u0e7f]/.test(String(value));
  }

  function compactThai(value) {
    return String(value).replace(/\s+/g, "").replace(/[.,!?()"'“”‘’]/g, "");
  }

  function conciseTranslation(value) {
    let text = decodeHtml(value)
      .replace(/\s+/g, " ")
      .replace(/^การแปลภาษา[:：]\s*/i, "")
      .trim();
    const pieces = text
      .split(/\s*(?:\/|,|;|、|，|\.|เช่น|ได้แก่|หมายถึง|คือ)\s*/)
      .map(item => item.trim())
      .filter(Boolean);
    text = pieces.find(item => compactThai(item).length <= 34) || pieces[0] || text;
    if (compactThai(text).length > 42) {
      text = [...text].slice(0, 34).join("").trim() + "...";
    }
    return text;
  }

  function decodeHtml(value) {
    const textarea = document.createElement("textarea");
    textarea.innerHTML = value;
    return textarea.value.trim();
  }

  function isBadTranslation(value, word) {
    if (!value) return true;
    if (/\?{2,}|à¸|�/.test(value)) return true;
    if (/ยังไม่มีคำแปลของ|แปลภาษาไม่สำเร็จ|à¸¢à¸±à¸‡à¹„à¸¡à¹ˆà¸¡à¸µ/.test(value)) return true;
    if (!hasThai(value)) return true;
    if (compactThai(value).length > 54) return true;
    return value.trim().toLowerCase() === cleanWord(word).toLowerCase();
  }

  function cacheKey(word) {
    return `thai:${word.toLowerCase()}`;
  }

  async function translateWord(word) {
    const key = cacheKey(word);
    const cached = localStorage.getItem(key);
    if (cached && !isBadTranslation(cached, word)) return conciseTranslation(cached);
    if (cached) localStorage.removeItem(key);

    const query = cleanWord(word);
    if (MANUAL_TRANSLATIONS[query.toLowerCase()]) {
      localStorage.setItem(key, MANUAL_TRANSLATIONS[query.toLowerCase()]);
      return MANUAL_TRANSLATIONS[query.toLowerCase()];
    }

    const translated = await translateWithGoogle(query, word) || await translateWithMyMemory(query, word);

    if (translated && !isBadTranslation(translated, word)) {
      const concise = conciseTranslation(translated);
      localStorage.setItem(key, concise);
      return concise;
    }

    throw new Error(`Translation unavailable: ${word}`);
  }

  async function translateWithMyMemory(query, originalWord) {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(query)}&langpair=en|th`;
    try {
      const response = await fetch(url);
      if (!response.ok) return "";
      const data = await response.json();
      const candidates = [
        data?.responseData?.translatedText,
        ...(data?.matches || []).map(match => match.translation)
      ].filter(Boolean).map(decodeHtml);
      return candidates.find(candidate => !isBadTranslation(candidate, originalWord)) || "";
    } catch (error) {
      return "";
    }
  }

  async function translateWithGoogle(query, originalWord) {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=th&dt=t&q=${encodeURIComponent(query)}`;
    try {
      const response = await fetch(url);
      if (!response.ok) return "";
      const data = await response.json();
      const translated = conciseTranslation((data?.[0] || []).map(part => part?.[0] || "").join("").trim());
      return isBadTranslation(translated, originalWord) ? "" : translated;
    } catch (error) {
      return "";
    }
  }

  function normalizeEnglish(value) {
    return String(value).toLowerCase().trim().replace(/\s+/g, " ");
  }

  function normalizeThai(value) {
    return String(value).toLowerCase().replace(/[ \t\n\r.,!?()"'“”‘’]/g, "");
  }

  function isThaiClose(answer, target) {
    const a = normalizeThai(answer);
    const t = normalizeThai(target);
    if (!a || !t) return false;
    return a === t || (a.length >= 2 && t.includes(a)) || (t.length >= 2 && a.includes(t));
  }

  function setStats(state) {
    const score = document.querySelector("#score");
    const streak = document.querySelector("#streak");
    const total = document.querySelector("#total");
    if (score) score.textContent = state.score;
    if (streak) streak.textContent = state.streak;
    if (total) total.textContent = state.total;
  }

  function setMeta(item) {
    const level = document.querySelector("#levelTag");
    const pos = document.querySelector("#posTag");
    const count = document.querySelector("#countTag");
    if (level) level.textContent = item.levels;
    if (pos) pos.textContent = item.pos || "word";
    if (count) count.textContent = `${WORDS.length.toLocaleString("en-US")} words`;
  }

  function clearTranslationCache() {
    Object.keys(localStorage)
      .filter(key => key.startsWith("thai:"))
      .forEach(key => localStorage.removeItem(key));
  }

  function clearBadTranslationCache() {
    Object.keys(localStorage)
      .filter(key => key.startsWith("thai:"))
      .forEach(key => {
        const word = key.replace(/^thai:/, "");
        if (isBadTranslation(localStorage.getItem(key), word)) {
          localStorage.removeItem(key);
        }
      });
  }

  clearBadTranslationCache();

  return {
    WORDS,
    shuffle,
    wordsByLevel,
    pickWord,
    translateWord,
    normalizeEnglish,
    isThaiClose,
    setStats,
    setMeta,
    clearTranslationCache
  };
})();
