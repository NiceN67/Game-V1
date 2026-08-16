const state = {
  score: 0,
  streak: 0,
  total: 0,
  round: [],
  selectedEnglish: null,
  selectedThai: null,
  matched: new Set(),
  locked: false
};

const els = {
  level: document.querySelector("#levelSelect"),
  pairs: document.querySelector("#pairSelect"),
  english: document.querySelector("#englishList"),
  thai: document.querySelector("#thaiList"),
  feedback: document.querySelector("#feedback"),
  next: document.querySelector("#nextBtn")
};

function setFeedback(text, type = "") {
  els.feedback.textContent = text;
  els.feedback.className = `feedback ${type}`.trim();
}

function setRoundMeta() {
  const level = document.querySelector("#levelTag");
  const pos = document.querySelector("#posTag");
  const count = document.querySelector("#countTag");
  if (level) level.textContent = els.level.value === "all" ? "ทุกระดับ" : els.level.value;
  if (pos) pos.textContent = `${state.matched.size}/${state.round.length} คู่`;
  if (count) count.textContent = `${OxfordGame.WORDS.length.toLocaleString("en-US")} words`;
}

function pickCandidates(count) {
  return OxfordGame.shuffle(OxfordGame.wordsByLevel(els.level.value)).slice(0, count * 3);
}

async function buildRound() {
  const target = Number(els.pairs.value);
  const items = [];
  for (const word of pickCandidates(target)) {
    if (items.length >= target) break;
    try {
      items.push({ ...word, meaning: await OxfordGame.translateWord(word.word) });
    } catch (error) {
      // Skip words that cannot be translated cleanly.
    }
  }
  return items;
}

async function newRound() {
  state.locked = true;
  state.selectedEnglish = null;
  state.selectedThai = null;
  state.matched = new Set();
  els.english.innerHTML = "";
  els.thai.innerHTML = "";
  setFeedback("กำลังสร้างรอบใหม่...");

  state.round = await buildRound();
  if (!state.round.length) {
    state.locked = false;
    setFeedback("โหลดคำแปลไม่ได้ ลองกดรอบใหม่อีกครั้ง", "bad");
    return;
  }

  renderRound();
  state.locked = false;
  setFeedback("เลือกคำอังกฤษ แล้วเลือกคำแปลไทยที่ตรงกัน");
}

function renderRound() {
  els.english.innerHTML = "";
  els.thai.innerHTML = "";

  state.round.forEach(item => {
    els.english.appendChild(createMatchButton(item, "english", item.word));
  });

  OxfordGame.shuffle(state.round).forEach(item => {
    els.thai.appendChild(createMatchButton(item, "thai", item.meaning));
  });

  setRoundMeta();
}

function createMatchButton(item, kind, label) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "match-btn";
  button.dataset.id = item.id;
  button.dataset.kind = kind;
  button.textContent = label;
  button.title = label;
  button.addEventListener("click", () => choose(kind, item.id));
  return button;
}

function choose(kind, id) {
  if (state.locked || state.matched.has(id)) return;
  if (kind === "english") state.selectedEnglish = id;
  if (kind === "thai") state.selectedThai = id;
  paintSelection();

  if (state.selectedEnglish && state.selectedThai) {
    checkMatch();
  }
}

function checkMatch() {
  state.total += 1;
  const englishId = state.selectedEnglish;
  const thaiId = state.selectedThai;

  if (englishId === thaiId) {
    state.score += 10;
    state.streak += 1;
    state.matched.add(englishId);
    setFeedback("จับคู่ถูกต้อง", "good");
  } else {
    state.streak = 0;
    flashWrong(englishId, thaiId);
    setFeedback("ยังไม่ตรง ลองใหม่อีกครั้ง", "bad");
  }

  state.selectedEnglish = null;
  state.selectedThai = null;
  OxfordGame.setStats(state);
  setRoundMeta();
  setTimeout(paintSelection, 220);

  if (state.matched.size === state.round.length) {
    setTimeout(() => setFeedback("จบรอบแล้ว กดรอบใหม่เพื่อเล่นต่อ", "good"), 250);
  }
}

function paintSelection() {
  document.querySelectorAll(".match-btn").forEach(button => {
    const id = Number(button.dataset.id);
    const kind = button.dataset.kind;
    const selected = (kind === "english" && id === state.selectedEnglish) ||
      (kind === "thai" && id === state.selectedThai);
    button.classList.toggle("selected", selected);
    button.classList.toggle("matched", state.matched.has(id));
  });
}

function flashWrong(englishId, thaiId) {
  document.querySelectorAll(`.match-btn[data-kind="english"][data-id="${englishId}"], .match-btn[data-kind="thai"][data-id="${thaiId}"]`).forEach(button => {
    button.classList.add("wrong");
    setTimeout(() => button.classList.remove("wrong"), 300);
  });
}

els.next.addEventListener("click", newRound);
els.level.addEventListener("change", newRound);
els.pairs.addEventListener("change", newRound);
OxfordGame.setStats(state);
newRound();
