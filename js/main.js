(function () {
  const data = window.memorial;
  const read = (path) => path.split(".").reduce((value, key) => value[key], data);

  document.querySelectorAll("[data-content]").forEach((element) => {
    element.textContent = read(element.dataset.content);
  });

  const records = [
    ["Date", data.event.date], ["Course", data.event.club], ["Hole", data.event.course],
    ["Distance", data.event.distance], ["Club", data.event.clubUsed]
  ];
  document.querySelector("#record-grid").innerHTML = records.map(([label, value]) =>
    `<article class="record"><small>${label}</small><p>${value}</p></article>`
  ).join("");

  document.querySelector("#story-copy").innerHTML = data.story.map((text) => `<p>${text}</p>`).join("");
  document.querySelector("#gallery-grid").innerHTML = data.gallery.map((image, index) =>
    `<button type="button" class="gallery-item" data-gallery-index="${index}" aria-label="${image.caption} 크게 보기"><img src="${image.src}" alt="${image.alt}"><span>${image.caption}</span></button>`
  ).join("");
  document.querySelector("#message-grid").innerHTML = data.messages.map((message) =>
    `<blockquote class="message"><p>${message.text}</p><footer>— ${message.name}</footer></blockquote>`
  ).join("");

  const modal = document.querySelector("#image-modal");
  const modalImage = document.querySelector("#modal-image");
  const modalCaption = document.querySelector("#modal-caption");
  const closeButton = document.querySelector("#modal-close");
  let lastTrigger = null;

  function openModal(index, trigger) {
    const image = data.gallery[index];
    lastTrigger = trigger;
    modalImage.src = image.src;
    modalImage.alt = image.alt;
    modalCaption.textContent = image.caption;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    closeButton.focus();
  }

  function closeModal() {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");
    modalImage.src = "";
    if (lastTrigger) lastTrigger.focus();
  }

  document.querySelectorAll("[data-gallery-index]").forEach((button) => {
    button.addEventListener("click", () => openModal(Number(button.dataset.galleryIndex), button));
  });
  closeButton.addEventListener("click", closeModal);
  modal.querySelector(".modal__backdrop").addEventListener("click", closeModal);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("is-open")) closeModal();
  });
})();
