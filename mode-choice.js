const state = {
  score: 0,
  streak: 0,
  total: 0,
  current: null,
  locked: false,
  exampleCount: 0,
  advanceMode: localStorage.getItem("vocabChoiceAdvanceMode") || "manual"
};

const els = {
  level: document.querySelector("#levelSelect"),
  prompt: document.querySelector("#promptWord"),
  grid: document.querySelector("#choiceGrid"),
  feedback: document.querySelector("#feedback"),
  next: document.querySelector("#nextBtn"),
  example: document.querySelector("#exampleBtn"),
  settingsToggle: document.querySelector("#settingsToggle"),
  settingsPanel: document.querySelector("#choiceSettings"),
  settingOptions: document.querySelectorAll("[data-advance-mode]")
};

function setFeedback(text, type = "") {
  els.feedback.textContent = text;
  els.feedback.className = `feedback ${type}`.trim();
}

function syncSettings() {
  els.settingOptions.forEach(button => {
    button.classList.toggle("is-active", button.dataset.advanceMode === state.advanceMode);
  });
}

function activeChoiceCount() {
  return els.grid.querySelectorAll(".choice-btn:not(.removed)").length;
}

function exampleSentences(item) {
  const word = item.word;
  const pos = String(item.pos || "").toLowerCase();

  if (pos.includes("v.")) {
    return [
      `Example: I need to ${word} this before tomorrow.`,
      `Example: Please ${word} the answer carefully.`,
      `Example: They try to ${word} when they practise English.`
    ];
  }

  if (pos.includes("adj.")) {
    return [
      `Example: This is a ${word} idea.`,
      `Example: The answer felt ${word}.`,
      `Example: She gave a ${word} explanation.`
    ];
  }

  if (pos.includes("adv.")) {
    return [
      `Example: She answered ${word}.`,
      `Example: They worked ${word} during the lesson.`,
      `Example: He listened ${word} and took notes.`
    ];
  }

  if (pos.includes("prep.")) {
    return [
      `Example: She talked ${word} the plan.`,
      `Example: The answer is written ${word} the line.`,
      `Example: He stayed focused ${word} the noise.`
    ];
  }

  return [
    `Example: The ${word} was important in the story.`,
    `Example: She wrote the ${word} in her notebook.`,
    `Example: We talked about the ${word} after class.`
  ];
}

function showExample() {
  if (!state.current) return;
  const examples = exampleSentences(state.current);
  const text = examples[state.exampleCount % examples.length];
  state.exampleCount += 1;
  setFeedback(text);
}

function nearbyOptions(answer) {
  const pool = OxfordGame.wordsByLevel(els.level.value);
  const sameType = pool.filter(item =>
    item.id !== answer.id && item.pos.split(" ")[0] === answer.pos.split(" ")[0]
  );
  const backup = pool.filter(item => item.id !== answer.id);
  return OxfordGame.shuffle(sameType.length >= 4 ? sameType : backup).slice(0, 4);
}

async function newQuestion() {
  state.locked = true;
  els.grid.innerHTML = "";
  setFeedback("กำลังสร้างตัวเลือก...");

  let translated = [];
  for (let attempt = 0; attempt < 12; attempt += 1) {
    state.current = OxfordGame.pickWord(els.level.value);
    state.exampleCount = 0;
    els.prompt.textContent = state.current.word;
    OxfordGame.setMeta(state.current);
    const options = OxfordGame.shuffle([state.current, ...nearbyOptions(state.current)]);
    try {
      translated = await Promise.all(options.map(async item => ({
        ...item,
        meaning: await OxfordGame.translateWord(item.word)
      })));
      break;
    } catch (error) {
      translated = [];
      setFeedback("กำลังหาชุดคำที่มีคำแปล...");
    }
  }

  if (!translated.length) {
    state.locked = false;
    setFeedback("โหลดคำแปลไม่ได้ ลองกดคำใหม่อีกครั้ง", "bad");
    return;
  }

  translated.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-btn";
    button.dataset.id = item.id;
    button.textContent = item.meaning;
    button.title = item.meaning;
    button.addEventListener("click", () => choose(item, button));
    els.grid.appendChild(button);
  });

  state.locked = false;
  setFeedback("เลือกความหมายที่ถูก");
}

function choose(item, button) {
  if (state.locked) return;
  state.total += 1;

  const correct = item.id === state.current.id;

  if (correct) {
    state.locked = true;
    state.score += 10;
    state.streak += 1;
    button.classList.add("correct");
    setFeedback(
      state.advanceMode === "auto"
        ? `ถูกต้อง: ${state.current.word} จะไปคำใหม่ใน 3 วินาที`
        : `ถูกต้อง: ${state.current.word} กดคำใหม่เพื่อไปต่อ`,
      "good"
    );
    OxfordGame.setStats(state);
    if (state.advanceMode === "auto") {
      setTimeout(newQuestion, 3000);
    }
    return;
  }

  state.streak = 0;
  state.locked = true;
  button.classList.add("wrong");
  button.disabled = true;
  setFeedback(`ยังไม่ถูก ตัวเลือกนี้ถูกตัดออก เหลือ ${activeChoiceCount() - 1} ข้อ`, "bad");
  OxfordGame.setStats(state);
  setTimeout(() => {
    button.classList.add("removed");
    button.setAttribute("aria-hidden", "true");
    state.locked = false;
  }, 220);
}

els.next.addEventListener("click", newQuestion);
els.example.addEventListener("click", showExample);
els.level.addEventListener("change", newQuestion);
els.settingsToggle.addEventListener("click", () => {
  const isOpen = els.settingsPanel.classList.toggle("is-open");
  els.settingsToggle.setAttribute("aria-expanded", String(isOpen));
  els.settingsPanel.setAttribute("aria-hidden", String(!isOpen));
});
els.settingOptions.forEach(button => {
  button.addEventListener("click", () => {
    state.advanceMode = button.dataset.advanceMode;
    localStorage.setItem("vocabChoiceAdvanceMode", state.advanceMode);
    syncSettings();
  });
});
syncSettings();
OxfordGame.setStats(state);
newQuestion();
