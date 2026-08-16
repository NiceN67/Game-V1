const state = { score: 0, streak: 0, total: 0, hintCount: 0, current: null };

const els = {
  prompt: document.querySelector("#promptWord"),
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

function normalizeThai(value) {
  return String(value).toLowerCase().replace(/[ \t\n\r.,!?()"'“”‘’]/g, "");
}

function mainMeaning() {
  return String(state.current?.meaning || "").split(/[\/,;]/)[0].trim();
}

function compactThai(value) {
  return String(value).replace(/\s+/g, "").replace(/[.,!?()"'“”‘’]/g, "");
}

function maskThai(value) {
  const chars = [...String(value)];
  return chars.map((char, index) => {
    if (/\s/.test(char)) return " ";
    if (index === 0 || index === chars.length - 1 || index % 3 === 0) return char;
    return "_";
  }).join("");
}

function isCloseThai(answer, target) {
  const a = normalizeThai(answer);
  const meanings = String(target).split(/[\/,;]/).map(normalizeThai).filter(Boolean);
  return meanings.some(item => a === item || (a.length >= 2 && item.includes(a)) || (item.length >= 2 && a.includes(item)));
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

function newQuestion() {
  const pool = window.CONJUNCTIONS || [];
  state.current = shuffle(pool)[0];
  state.hintCount = 0;
  els.prompt.textContent = state.current.term;
  els.input.value = "";
  els.input.focus();
  if (els.count) els.count.textContent = `${pool.length} items`;
  setFeedback("พิมพ์ความหมายภาษาไทยของคำเชื่อมนี้");
}

function hintText() {
  state.hintCount += 1;
  const answer = mainMeaning();

  if (state.hintCount === 1) {
    return `Hint 1: ${state.current.example || "ลองดูหน้าที่ของคำเชื่อมในประโยค"}`;
  }

  if (state.hintCount === 2) {
    const length = compactThai(answer).length || answer.length;
    return `Hint 2: คำแปลขึ้นต้นด้วย "${answer[0] || "?"}" มีประมาณ ${length} ตัวอักษร`;
  }

  if (state.hintCount === 3) {
    return `Hint 3: รูปคำคือ ${maskThai(answer)}`;
  }

  return `Hint 4: ${state.current.term} = ${state.current.meaning}`;
}

function checkAnswer(event) {
  event.preventDefault();
  state.total += 1;

  if (isCloseThai(els.input.value, state.current.meaning)) {
    state.score += Math.max(10 - state.hintCount * 2, 4);
    state.streak += 1;
    setFeedback(`ถูกต้อง: ${state.current.term} = ${state.current.meaning}`, "good");
    setStats();
    setTimeout(newQuestion, 900);
    return;
  }

  state.streak = 0;
  setFeedback("ยังไม่ถูก ลองอีกครั้ง หรือกด Hint", "bad");
  setStats();
}

els.form.addEventListener("submit", checkAnswer);
els.next.addEventListener("click", newQuestion);
els.hint.addEventListener("click", () => setFeedback(hintText(), state.hintCount >= 4 ? "good" : ""));
setStats();
newQuestion();
