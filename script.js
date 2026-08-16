document.querySelectorAll(".mode-picker").forEach(button => {
  button.addEventListener("click", () => {
    const group = button.closest(".mode-group");
    const isOpen = !group.classList.contains("is-open");

    document.querySelectorAll(".mode-group").forEach(item => {
      item.classList.remove("is-open");
      const itemButton = item.querySelector(".mode-picker");
      if (itemButton) {
        itemButton.setAttribute("aria-expanded", "false");
        itemButton.textContent = "เลือกโหมด";
      }
    });

    group.classList.toggle("is-open", isOpen);
    button.setAttribute("aria-expanded", String(isOpen));
    button.textContent = isOpen ? "ปิดโหมด" : "เลือกโหมด";
  });
});
