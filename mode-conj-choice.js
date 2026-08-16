const state = {
  score: 0,
  streak: 0,
  total: 0,
  current: null,
  locked: false,
  exampleCount: 0,
  advanceMode: localStorage.getItem("conjChoiceAdvanceMode") || "manual"
};

const els = {
  prompt: document.querySelector("#promptWord"),
  grid: document.querySelector("#choiceGrid"),
  feedback: document.querySelector("#feedback"),
  next: document.querySelector("#nextBtn"),
  example: document.querySelector("#exampleBtn"),
  count: document.querySelector("#countTag"),
  settingsToggle: document.querySelector("#settingsToggle"),
  settingsPanel: document.querySelector("#choiceSettings"),
  settingOptions: document.querySelectorAll("[data-advance-mode]")
};

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
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

function syncSettings() {
  els.settingOptions.forEach(button => {
    button.classList.toggle("is-active", button.dataset.advanceMode === state.advanceMode);
  });
}

function activeChoiceCount() {
  return els.grid.querySelectorAll(".choice-btn:not(.removed)").length;
}

function showExample() {
  if (!state.current) return;
  const examples = [
    state.current.example,
    `Example: ${state.current.term} connects two ideas in one sentence.`,
    `Example: Use "${state.current.term}" when the relationship between ideas matches "${state.current.meaning}".`
  ].filter(Boolean);
  const text = examples[state.exampleCount % examples.length];
  state.exampleCount += 1;
  setFeedback(text);
}

function nearbyOptions(answer) {
  const pool = window.CONJUNCTIONS || [];
  return shuffle(pool.filter(item => item.id !== answer.id)).slice(0, 4);
}

function newQuestion() {
  const pool = window.CONJUNCTIONS || [];
  state.locked = false;
  state.current = shuffle(pool)[0];
  state.exampleCount = 0;
  const options = shuffle([state.current, ...nearbyOptions(state.current)]);

  els.prompt.textContent = state.current.term;
  els.grid.innerHTML = "";
  if (els.count) els.count.textContent = `${pool.length} items`;

  options.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-btn";
    button.dataset.id = item.id;
    button.textContent = item.meaning;
    button.title = item.meaning;
    button.addEventListener("click", () => choose(item, button));
    els.grid.appendChild(button);
  });

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
        ? `ถูกต้อง: ${state.current.term} จะไปคำใหม่ใน 3 วินาที`
        : `ถูกต้อง: ${state.current.term} กดคำใหม่เพื่อไปต่อ`,
      "good"
    );
    setStats();
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
  setStats();
  setTimeout(() => {
    button.classList.add("removed");
    button.setAttribute("aria-hidden", "true");
    state.locked = false;
  }, 220);
}

els.next.addEventListener("click", newQuestion);
els.example.addEventListener("click", showExample);
els.settingsToggle.addEventListener("click", () => {
  const isOpen = els.settingsPanel.classList.toggle("is-open");
  els.settingsToggle.setAttribute("aria-expanded", String(isOpen));
  els.settingsPanel.setAttribute("aria-hidden", String(!isOpen));
});
els.settingOptions.forEach(button => {
  button.addEventListener("click", () => {
    state.advanceMode = button.dataset.advanceMode;
    localStorage.setItem("conjChoiceAdvanceMode", state.advanceMode);
    syncSettings();
  });
});
syncSettings();
setStats();
newQuestion();
