const state = { score: 0, streak: 0, total: 0, hintCount: 0, current: null, meaning: "" };

const els = {
  level: document.querySelector("#levelSelect"),
  prompt: document.querySelector("#promptMeaning"),
  form: document.querySelector("#answerForm"),
  input: document.querySelector("#answerInput"),
  feedback: document.querySelector("#feedback"),
  next: document.querySelector("#nextBtn"),
  hint: document.querySelector("#hintBtn")
};

function setFeedback(text, type = "") {
  els.feedback.textContent = text;
  els.feedback.className = `feedback ${type}`.trim();
}

function cleanAnswerWord() {
  return state.current.word.replace(/\s*\([^)]*\)/g, "").trim();
}

function answerVariants(word) {
  const base = word.replace(/\s*\([^)]*\)/g, "").trim();
  const variants = [word, base, ...base.split(",").map(item => item.trim())];
  return variants.filter(Boolean).map(OxfordGame.normalizeEnglish);
}

function maskEnglish(value) {
  return [...String(value)].map((char, index) => {
    if (/[\s,-/]/.test(char)) return char;
    if (index === 0 || index === value.length - 1 || index % 3 === 0) return char;
    return "_";
  }).join("");
}

function hintText() {
  state.hintCount += 1;
  const clean = cleanAnswerWord();

  if (state.hintCount === 1) {
    return `Hint 1: ขึ้นต้นด้วย "${clean[0] || "?"}" มี ${clean.length} ตัวอักษร`;
  }

  if (state.hintCount === 2) {
    return `Hint 2: รูปคำคือ ${maskEnglish(clean)}`;
  }

  return `Hint 3: ${state.meaning} = ${state.current.word}`;
}

async function newQuestion() {
  state.hintCount = 0;
  els.prompt.textContent = "กำลังแปล...";
  els.input.value = "";
  els.input.focus();
  setFeedback("กำลังเตรียมคำ...");

  for (let attempt = 0; attempt < 12; attempt += 1) {
    state.current = OxfordGame.pickWord(els.level.value);
    OxfordGame.setMeta(state.current);
    try {
      state.meaning = await OxfordGame.translateWord(state.current.word);
      els.prompt.textContent = state.meaning;
      setFeedback("พิมพ์คำศัพท์ภาษาอังกฤษ");
      return;
    } catch (error) {
      setFeedback("กำลังหาคำที่มีคำแปล...");
    }
  }

  setFeedback("โหลดคำแปลไม่ได้ ลองกดคำใหม่อีกครั้ง", "bad");
}

function checkAnswer(event) {
  event.preventDefault();
  state.total += 1;
  const answer = OxfordGame.normalizeEnglish(els.input.value);
  const correctAnswers = answerVariants(state.current.word);

  if (correctAnswers.includes(answer)) {
    state.score += Math.max(10 - state.hintCount * 2, 4);
    state.streak += 1;
    setFeedback(`ถูกต้อง: ${state.current.word}`, "good");
    OxfordGame.setStats(state);
    setTimeout(newQuestion, 850);
    return;
  }

  state.streak = 0;
  setFeedback("ยังไม่ถูก ลองอีกครั้ง หรือกด Hint", "bad");
  OxfordGame.setStats(state);
}

els.form.addEventListener("submit", checkAnswer);
els.next.addEventListener("click", newQuestion);
els.hint.addEventListener("click", () => setFeedback(hintText(), state.hintCount >= 3 ? "good" : ""));
els.level.addEventListener("change", newQuestion);
OxfordGame.setStats(state);
newQuestion();
