const state = { score: 0, streak: 0, total: 0, hintCount: 0, current: null };

const els = {
  prompt: document.querySelector("#promptMeaning"),
  form: document.querySelector("#answerForm"),
  input: document.querySelector("#answerInput"),
  feedback: document.querySelector("#feedback"),
  next: document.querySelector("#nextBtn"),
  hint: document.querySelector("#hintBtn"),
  count: document.querySelector("#countTag")
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeEnglish(value) {
  return String(value)
    .toLowerCase()
    .replace(/\b(to|that)\b/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

function compactEnglish(value) {
  return String(value).replace(/[^a-zA-Z0-9]/g, "");
}

function mainTerm() {
  return String(state.current?.term || "").split(/[\/;]/)[0].trim();
}

function maskEnglish(value) {
  return [...String(value)].map((char, index) => {
    if (/[^a-zA-Z0-9]/.test(char)) return char;
    if (index === 0 || index === value.length - 1 || index % 4 === 0) return char;
    return "_";
  }).join("");
}

function setFeedback(text, type = "") {
  els.feedback.textContent = text;
  els.feedback.className = `feedback ${type}`.trim();
}

function setStats() {
  document.querySelector("#score").textContent = state.score;
  document.querySelector("#streak").textContent = state.streak;
  document.querySelector("#total").textContent = state.total;
}

function isCorrect(answer) {
  const expected = normalizeEnglish(state.current.term);
  const primary = normalizeEnglish(mainTerm());
  const guess = normalizeEnglish(answer);
  return guess && (guess === expected || guess === primary);
}

function newQuestion() {
  const pool = window.CONJUNCTIONS || [];
  state.current = shuffle(pool)[0];
  state.hintCount = 0;
  els.prompt.textContent = state.current.meaning;
  els.input.value = "";
  els.input.focus();
  if (els.count) els.count.textContent = `${pool.length} items`;
  setFeedback("พิมพ์คำเชื่อมภาษาอังกฤษให้ตรงกับความหมายนี้");
}

function hintText() {
  state.hintCount += 1;
  const answer = mainTerm();

  if (state.hintCount === 1) {
    return `Hint 1: ${state.current.example || "ดูจากหน้าที่ของคำเชื่อมในประโยค"}`;
  }

  if (state.hintCount === 2) {
    return `Hint 2: ขึ้นต้นด้วย "${answer[0] || "?"}" และมีประมาณ ${compactEnglish(answer).length} ตัวอักษร`;
  }

  if (state.hintCount === 3) {
    return `Hint 3: รูปคำคือ ${maskEnglish(answer)}`;
  }

  return `Hint 4: ${state.current.meaning} = ${state.current.term}`;
}

function checkAnswer(event) {
  event.preventDefault();
  state.total += 1;

  if (isCorrect(els.input.value)) {
    state.score += Math.max(10 - state.hintCount * 2, 4);
    state.streak += 1;
    setFeedback(`ถูกต้อง: ${state.current.meaning} = ${state.current.term}`, "good");
    setStats();
    setTimeout(newQuestion, 900);
    return;
  }

  state.streak = 0;
  setFeedback("ยังไม่ถูก ลองดูประโยคใบ้หรือกด Hint เพิ่ม", "bad");
  setStats();
}

els.form.addEventListener("submit", checkAnswer);
els.next.addEventListener("click", newQuestion);
els.hint.addEventListener("click", () => setFeedback(hintText(), state.hintCount >= 4 ? "good" : ""));
setStats();
newQuestion();
