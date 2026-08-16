const state = { score: 0, streak: 0, total: 0, hintCount: 0, current: null, meaning: "" };

const els = {
  level: document.querySelector("#levelSelect"),
  prompt: document.querySelector("#promptWord"),
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

function mainThaiAnswer() {
  return String(state.meaning || "").split(/[\/,;]/)[0].trim();
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

function hintText() {
  state.hintCount += 1;
  const answer = mainThaiAnswer();
  const length = compactThai(answer).length || answer.length;

  if (state.hintCount === 1) {
    return `Hint 1: คำแปลขึ้นต้นด้วย "${answer[0] || "?"}" มีประมาณ ${length} ตัวอักษร`;
  }

  if (state.hintCount === 2) {
    return `Hint 2: รูปคำคือ ${maskThai(answer)}`;
  }

  return `Hint 3: ${state.current.word} = ${state.meaning}`;
}

async function newQuestion() {
  state.meaning = "";
  state.hintCount = 0;
  els.input.value = "";
  els.input.focus();
  setFeedback("กำลังเตรียมคำ...");

  for (let attempt = 0; attempt < 12; attempt += 1) {
    state.current = OxfordGame.pickWord(els.level.value);
    els.prompt.textContent = state.current.word;
    OxfordGame.setMeta(state.current);
    try {
      state.meaning = await OxfordGame.translateWord(state.current.word);
      setFeedback("พิมพ์ความหมายภาษาไทย");
      return;
    } catch (error) {
      setFeedback("กำลังหาคำที่มีคำแปล...");
    }
  }

  setFeedback("โหลดคำแปลไม่ได้ ลองกดคำใหม่อีกครั้ง", "bad");
}

function checkAnswer(event) {
  event.preventDefault();
  const answer = els.input.value;
  state.total += 1;

  if (OxfordGame.isThaiClose(answer, state.meaning)) {
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
