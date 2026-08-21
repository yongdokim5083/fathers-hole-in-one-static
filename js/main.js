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
  const version = window.SITE_VERSION ? `?v=${window.SITE_VERSION}` : "";
  document.querySelector("#gallery-grid").innerHTML = data.gallery.map((image, index) =>
    `<button type="button" class="gallery-item" data-gallery-index="${index}" aria-label="${image.caption} 크게 보기"><img src="${image.src}${version}" alt="${image.alt}"><span>${image.caption}</span></button>`
  ).join("");
  const STORAGE_KEY = "memorial.messages";

  function loadStoredMessages() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveStoredMessages(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      // ignore
    }
  }

  const storedMessages = loadStoredMessages();
  const allMessages = [].concat(data.messages || [], storedMessages || []);

  function renderMessages(messages) {
    document.querySelector("#message-grid").innerHTML = messages.map((message) =>
      `<blockquote class="message"><p>${escapeHtml(message.text)}</p><footer>— ${escapeHtml(message.name)}</footer></blockquote>`
    ).join("");
  }

  function mergeUniqueMessages(...messageLists) {
    const seen = new Set();
    return messageLists.flat().filter((message) => {
      const key = `${String(message.name || "").trim()}\n${String(message.text || "").trim()}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  renderMessages(allMessages);

  async function loadFirebaseMessages() {
    const config = window.FIREBASE_CONFIG;
    if (!config || !config.apiKey || !config.projectId || !config.appId) return;

    try {
      const appModuleUrl = "https://www.gstatic.com/firebasejs/12.17.1/firebase-app.js";
      const firestoreModuleUrl = "https://www.gstatic.com/firebasejs/12.17.1/firebase-firestore.js";
      const [firebaseApp, firestore] = await Promise.all([
        import(appModuleUrl),
        import(firestoreModuleUrl)
      ]);

      const app = firebaseApp.getApps().length
        ? firebaseApp.getApp()
        : firebaseApp.initializeApp(config);
      const db = firestore.getFirestore(app);
      const approvedMessages = firestore.query(
        firestore.collection(db, "messages"),
        firestore.where("approved", "==", true),
        firestore.limit(100)
      );
      const snapshot = await firestore.getDocs(approvedMessages);
      const remoteMessages = snapshot.docs
        .map((document) => {
          const message = document.data();
          return {
            name: String(message.name || "").trim(),
            text: String(message.text || "").trim(),
            createdAt: message.createdAt?.toMillis?.() || 0
          };
        })
        .filter((message) => message.name && message.text)
        .sort((a, b) => a.createdAt - b.createdAt);

      if (remoteMessages.length) {
        renderMessages(mergeUniqueMessages(allMessages, remoteMessages));
      }
    } catch (error) {
      console.warn("Firebase 메시지를 불러오지 못해 기본 메시지를 표시합니다.", error);
    }
  }

  loadFirebaseMessages();

  const form = document.querySelector('#message-form');
  if (form) {
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      const nameInput = document.querySelector('#message-name');
      const textInput = document.querySelector('#message-text');
      const status = document.querySelector('#message-status');
      const name = (nameInput.value || '').trim();
      const text = (textInput.value || '').trim();
      if (!name || !text) {
        status.textContent = '이름과 메시지를 모두 입력해주세요.';
        return;
      }
      const newMessage = { name, text };
      storedMessages.push(newMessage);
      saveStoredMessages(storedMessages);
      renderMessages(allMessages.concat([newMessage]));
      nameInput.value = '';
      textInput.value = '';
      status.textContent = '메시지가 등록되었습니다. 감사합니다.';
      setTimeout(() => { status.textContent = ''; }, 3000);
    });
  }

  const modal = document.querySelector("#image-modal");
  const modalImage = document.querySelector("#modal-image");
  const modalCaption = document.querySelector("#modal-caption");
  const closeButton = document.querySelector("#modal-close");
  let lastTrigger = null;

  function openModal(index, trigger) {
    const image = data.gallery[index];
    lastTrigger = trigger;
    const ver = window.SITE_VERSION ? `?v=${window.SITE_VERSION}` : "";
    modalImage.src = image.src + ver;
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

  // Quick menu: show on scroll and toggle panel
  (function setupQuickMenu() {
    const quick = document.getElementById('quick-menu');
    const toggle = document.getElementById('quick-menu-toggle');
    const panel = document.getElementById('quick-menu-panel');
    if (!quick || !toggle || !panel) return;

    const THRESHOLD = 120;

    function setOpen(nextOpen) {
      open = nextOpen;
      quick.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? '퀵메뉴 닫기' : '퀵메뉴 열기');
      panel.querySelectorAll('a').forEach((link) => {
        link.tabIndex = open ? 0 : -1;
      });
    }

    function onScroll() {
      const y = window.scrollY;
      const scrollable = document.documentElement.scrollHeight > window.innerHeight + 10;
      if (!scrollable) {
        quick.classList.remove('is-visible');
        setOpen(false);
        return;
      }
      if (y > THRESHOLD) quick.classList.add('is-visible');
      else {
        quick.classList.remove('is-visible');
        setOpen(false);
      }
    }

    let open = false;
    setOpen(false);
    toggle.addEventListener('click', () => setOpen(!open));

    panel.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        setOpen(false);
      });
    });

    document.addEventListener('click', (event) => {
      if (open && !quick.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && open) {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();
})();
