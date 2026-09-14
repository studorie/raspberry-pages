let chapters = [];
let currentChapterIndex = 0;
let currentPageIndex = 0;
let pages = [];
let chapterData = null;
let touchStartX = null;
let touchStartY = null;

// Whole-book pagination is calculated for the current viewport. Because the
// reader uses real rendered-height pagination, these values can change when
// the viewport changes.
let chapterPageCounts = [];
let chapterPageOffsets = [];
let totalBookPages = 0;
let bookPaginationReady = false;
let bookPaginationPromise = null;
let bookPaginationGeneration = 0;
const BOOK_PAGINATION_CACHE_VERSION = 2;
const BOOK_PAGINATION_CACHE_KEY = "adiRaspberryBookPagination";

// Reading mood / audio
const TRACKS = [
  {
    title: "Rain ambience",
    shortTitle: "Rain",
    src: "assets/audio/rain.mp3",
    loop: true
  },
  {
    title: "SHEFE SHEFE",
    shortTitle: "SHEFE SHEFE",
    src: "assets/audio/shefe-shefe.mp3",
    loop: false,
    secret: "I did not forget who the boss is, Adi."
  }
];

let currentTrackIndex = 0;
let moodSettings = {
  warmLight: false,
  soundEnabled: true,
  volume: 0.32
};
let toastTimer = null;

// Hidden pigeon easter egg
let pigeonRevealTimer = null;
let pigeonHideTimer = null;
let pigeonTeaseTimer = null;
let pigeonAutoHideTimer = null;
let pigeonDiscovered = localStorage.getItem("adiPigeonDiscovered") === "1";

const coverScreen = document.getElementById("coverScreen");
const libraryScreen = document.getElementById("libraryScreen");
const startBtn = document.getElementById("startBtn");
const homeBtn = document.getElementById("homeBtn");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const prevTextBtn = document.getElementById("prevTextBtn");
const nextTextBtn = document.getElementById("nextTextBtn");

const pageCard = document.getElementById("pageCard");
const pageBody = document.getElementById("pageBody");
const pageChapter = document.getElementById("pageChapter");
const pageNumberTop = document.getElementById("pageNumberTop");
const pageCounter = document.getElementById("pageCounter");

const chapterHeading = document.getElementById("chapterHeading");
const chapterProgressText = document.getElementById("chapterProgressText");
const progressBar = document.getElementById("progressBar");

const chapterDrawer = document.getElementById("chapterDrawer");
const chapterList = document.getElementById("chapterList");
const chaptersBtn = document.getElementById("chaptersBtn");
const closeDrawerBtn = document.getElementById("closeDrawerBtn");

const moodBtn = document.getElementById("moodBtn");
const moodPanel = document.getElementById("moodPanel");
const closeMoodBtn = document.getElementById("closeMoodBtn");
const warmLightToggle = document.getElementById("warmLightToggle");
const ambientAudio = document.getElementById("ambientAudio");
const playPauseBtn = document.getElementById("playPauseBtn");
const nextTrackBtn = document.getElementById("nextTrackBtn");
const trackTitle = document.getElementById("trackTitle");
const trackKind = document.getElementById("trackKind");
const volumeSlider = document.getElementById("volumeSlider");
const volumeValue = document.getElementById("volumeValue");
const secretToast = document.getElementById("secretToast");
const pigeonEasterEgg = document.getElementById("pigeonEasterEgg");
const pigeonTouchHotspot = document.getElementById("pigeonTouchHotspot");

function clearPigeonTimers() {
  clearTimeout(pigeonRevealTimer);
  clearTimeout(pigeonHideTimer);
  clearTimeout(pigeonAutoHideTimer);
  pigeonRevealTimer = null;
  pigeonHideTimer = null;
  pigeonAutoHideTimer = null;
}

function revealPigeon({ autoHide = false } = {}) {
  if (!pigeonEasterEgg || libraryScreen.classList.contains("hidden")) return;

  clearPigeonTimers();
  pigeonEasterEgg.classList.remove("tease");
  pigeonEasterEgg.classList.add("show");
  pigeonEasterEgg.setAttribute("aria-hidden", "false");

  if (!pigeonDiscovered) {
    pigeonDiscovered = true;
    localStorage.setItem("adiPigeonDiscovered", "1");
  }

  if (autoHide) {
    pigeonAutoHideTimer = setTimeout(hidePigeon, 5200);
  }
}

function hidePigeon() {
  clearPigeonTimers();
  if (!pigeonEasterEgg) return;

  pigeonEasterEgg.classList.remove("show", "tease");
  pigeonEasterEgg.setAttribute("aria-hidden", "true");
}

function schedulePigeonHide(delay = 850) {
  clearTimeout(pigeonHideTimer);
  pigeonHideTimer = setTimeout(hidePigeon, delay);
}

function schedulePigeonTease() {
  clearTimeout(pigeonTeaseTimer);

  if (pigeonDiscovered || !pigeonEasterEgg) return;

  pigeonTeaseTimer = setTimeout(() => {
    if (libraryScreen.classList.contains("hidden") || pigeonDiscovered) return;

    pigeonEasterEgg.classList.add("tease");
    pigeonEasterEgg.setAttribute("aria-hidden", "false");

    setTimeout(() => {
      if (!pigeonEasterEgg.classList.contains("show")) {
        pigeonEasterEgg.classList.remove("tease");
        pigeonEasterEgg.setAttribute("aria-hidden", "true");
      }
    }, 1900);
  }, 36000);
}

function handlePigeonMouseMove(event) {
  if (
    window.innerWidth <= 760 ||
    libraryScreen.classList.contains("hidden") ||
    moodPanel?.contains(event.target) ||
    chapterDrawer?.classList.contains("open")
  ) {
    return;
  }

  const distanceFromRight = window.innerWidth - event.clientX;
  const yRatio = event.clientY / window.innerHeight;
  const nearSecretEdge =
    distanceFromRight <= 115 &&
    yRatio >= 0.18 &&
    yRatio <= 0.82;

  if (nearSecretEdge) {
    clearTimeout(pigeonHideTimer);

    if (!pigeonEasterEgg.classList.contains("show") && !pigeonRevealTimer) {
      pigeonRevealTimer = setTimeout(() => {
        pigeonRevealTimer = null;
        revealPigeon();
      }, 360);
    }
  } else if (!pigeonEasterEgg.matches(":hover")) {
    clearTimeout(pigeonRevealTimer);
    pigeonRevealTimer = null;

    if (pigeonEasterEgg.classList.contains("show")) {
      schedulePigeonHide();
    }
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function savedState() {
  try {
    return JSON.parse(localStorage.getItem("adiRaspberryReader") || "{}");
  } catch {
    return {};
  }
}

function saveState() {
  localStorage.setItem(
    "adiRaspberryReader",
    JSON.stringify({
      chapterIndex: currentChapterIndex,
      pageIndex: currentPageIndex
    })
  );
}

async function init() {
  const response = await fetch("chapters.json");
  chapters = await response.json();

  const saved = savedState();

  if (Number.isInteger(saved.chapterIndex)) {
    currentChapterIndex = Math.max(
      0,
      Math.min(saved.chapterIndex, chapters.length - 1)
    );
  } else {
    const firstLocal = chapters.findIndex(chapter => chapter.content);
    currentChapterIndex = firstLocal >= 0 ? firstLocal : 0;
  }

  if (saved.pageIndex) {
    currentPageIndex = saved.pageIndex;
  }

  loadMoodSettings();
  applyMoodSettings();
  setTrack(0, { autoplay: false, revealSecret: false });
  renderChapterDrawer();
}

async function openLibrary() {
  coverScreen.classList.add("hidden");
  libraryScreen.classList.remove("hidden");

  await loadChapter(currentChapterIndex, currentPageIndex);

  // The Start Reading click is a user gesture, so browsers allow us to start
  // the soft rain here when sound is enabled.
  if (moodSettings.soundEnabled) {
    tryPlayAudio();
  }

  // Calculate the chapter offsets/total in the background. The current page is
  // usable immediately and switches to global numbering once this completes.
  ensureBookPagination();
  schedulePigeonTease();
}

function backToCover() {
  libraryScreen.classList.add("hidden");
  coverScreen.classList.remove("hidden");
  closeDrawer();
  hidePigeon();
}

function renderChapterDrawer() {
  chapterList.innerHTML = chapters.map((chapter, index) => {
    const classes = [
      "chapter-item",
      chapter.content ? "local" : "",
      index === currentChapterIndex ? "active" : ""
    ].filter(Boolean).join(" ");

    const pageStart = bookPaginationReady
      ? `<span class="chapter-page-start">p. ${chapterPageOffsets[index] + 1}</span>`
      : "";

    return `
      <button class="${classes}" data-chapter-index="${index}">
        <span class="available-dot" aria-hidden="true"></span>
        <span class="chapter-name">${escapeHtml(chapter.label)}</span>
        ${pageStart}
        <span aria-hidden="true">›</span>
      </button>
    `;
  }).join("");

  chapterList.querySelectorAll("[data-chapter-index]").forEach(button => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.chapterIndex);
      closeDrawer();
      loadChapter(index, 0);
    });
  });
}

function openDrawer() {
  chapterDrawer.classList.add("open");
  chapterDrawer.setAttribute("aria-hidden", "false");
  chaptersBtn?.setAttribute("aria-expanded", "true");
}

function closeDrawer() {
  chapterDrawer.classList.remove("open");
  chapterDrawer.setAttribute("aria-hidden", "true");
  chaptersBtn?.setAttribute("aria-expanded", "false");
}

function createPaginationMeasurer(pageIndex = 0) {
  const rect = pageBody.getBoundingClientRect();

  if (rect.width <= 0 || rect.height <= 0) {
    return null;
  }

  const measurer = document.createElement("div");
  measurer.className = "page-body pagination-measurer";
  measurer.style.width = `${rect.width}px`;
  measurer.style.height = `${rect.height}px`;
  document.body.appendChild(measurer);

  setMeasurerPage(measurer, pageIndex);
  return measurer;
}

function setMeasurerPage(measurer, pageIndex) {
  measurer.innerHTML = "";
  measurer.classList.toggle("chapter-first-page", pageIndex === 0);
}

function makeFragment(text, continuation = false, paragraphEnd = true) {
  return {
    text: String(text).replace(/\s+/g, " ").trim(),
    continuation,
    paragraphEnd
  };
}

function paragraphNode(item) {
  const paragraph = document.createElement("p");
  paragraph.textContent = item.text;

  if (item.continuation) {
    paragraph.classList.add("paragraph-continuation");
  }

  if (!item.paragraphEnd) {
    paragraph.classList.add("paragraph-fragment");
  }

  return paragraph;
}

function renderMeasuredPage(measurer, items, pageIndex) {
  setMeasurerPage(measurer, pageIndex);

  for (const item of items) {
    measurer.appendChild(paragraphNode(item));
  }
}

function pageFits(items, pageIndex, measurer) {
  renderMeasuredPage(measurer, items, pageIndex);

  // The small tolerance avoids an extra page caused only by sub-pixel rounding.
  return measurer.scrollHeight <= measurer.clientHeight + 1;
}

function splitParagraphToFit(
  currentPage,
  text,
  continuation,
  pageIndex,
  measurer
) {
  const words = String(text).trim().split(/\s+/).filter(Boolean);

  if (!words.length) {
    return null;
  }

  let low = 1;
  let high = words.length;
  let best = 0;

  // Continuous book flow:
  // use EVERY bit of remaining vertical space. Paragraph boundaries do not
  // decide page boundaries. We simply find the largest word prefix that the
  // browser can physically render in the space that is left on this page.
  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const isWholeParagraph = middle === words.length;

    const candidate = makeFragment(
      words.slice(0, middle).join(" "),
      continuation,
      isWholeParagraph
    );

    if (pageFits([...currentPage, candidate], pageIndex, measurer)) {
      best = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  // Not even the first word fits. The caller should turn the page and retry
  // the exact same paragraph on a fresh page.
  if (best === 0) {
    return null;
  }

  // The whole paragraph fits after all.
  if (best === words.length) {
    return {
      head: makeFragment(text, continuation, true),
      tail: ""
    };
  }

  // No widow/orphan minimums here on purpose. If one line, five words, or even
  // one word genuinely fits in the remaining space, we use it. That is the
  // behaviour requested for a fluid book-like page flow.
  return {
    head: makeFragment(
      words.slice(0, best).join(" "),
      continuation,
      false
    ),
    tail: words.slice(best).join(" ")
  };
}

function paginateParagraphs(paragraphs) {
  const cleanParagraphs = (paragraphs || [])
    .map(value => String(value).replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (!cleanParagraphs.length) {
    return [];
  }

  if (pageBody.clientHeight <= 0 || pageBody.clientWidth <= 0) {
    return [[makeFragment(cleanParagraphs.join(" "))]];
  }

  const measurer = createPaginationMeasurer();

  if (!measurer) {
    return [[makeFragment(cleanParagraphs.join(" "))]];
  }

  const result = [];
  let current = [];

  try {
    for (const originalParagraph of cleanParagraphs) {
      let remaining = originalParagraph;
      let continuation = false;

      while (remaining) {
        const pageIndex = result.length;

        // First try the entire remaining paragraph.
        const whole = makeFragment(remaining, continuation, true);

        if (pageFits([...current, whole], pageIndex, measurer)) {
          current.push(whole);
          remaining = "";
          break;
        }

        // It does not fit in full. Put the largest possible prefix into the
        // CURRENT page, regardless of paragraph length or paragraph boundary.
        const split = splitParagraphToFit(
          current,
          remaining,
          continuation,
          pageIndex,
          measurer
        );

        if (split) {
          current.push(split.head);

          if (!split.tail) {
            remaining = "";
            break;
          }

          // The page is now filled as far as a word boundary allows.
          result.push(current);
          current = [];
          remaining = split.tail;
          continuation = true;
          continue;
        }

        // Not even one word of the next text fits in the current page. Only
        // NOW are we allowed to turn the page.
        if (current.length) {
          result.push(current);
          current = [];
          continue;
        }

        // Extremely defensive fallback: an individual word/string is wider or
        // taller than an empty page. Keep forward progress rather than loop.
        const words = remaining.split(/\s+/).filter(Boolean);
        const forcedHead = words.shift();

        current.push(
          makeFragment(
            forcedHead,
            continuation,
            words.length === 0
          )
        );

        if (words.length) {
          result.push(current);
          current = [];
          remaining = words.join(" ");
          continuation = true;
        } else {
          remaining = "";
        }
      }
    }

    if (current.length) {
      result.push(current);
    }
  } finally {
    measurer.remove();
  }

  return result;
}

function moodStateFromStorage() {
  try {
    return JSON.parse(localStorage.getItem("adiReadingMood") || "{}");
  } catch {
    return {};
  }
}

function loadMoodSettings() {
  const saved = moodStateFromStorage();

  if (typeof saved.warmLight === "boolean") {
    moodSettings.warmLight = saved.warmLight;
  }

  if (typeof saved.soundEnabled === "boolean") {
    moodSettings.soundEnabled = saved.soundEnabled;
  }

  if (Number.isFinite(saved.volume)) {
    moodSettings.volume = Math.max(0, Math.min(1, saved.volume));
  }
}

function saveMoodSettings() {
  localStorage.setItem("adiReadingMood", JSON.stringify(moodSettings));
}

function applyMoodSettings() {
  document.body.classList.toggle("warm-light", moodSettings.warmLight);
  warmLightToggle?.setAttribute("aria-pressed", String(moodSettings.warmLight));
  warmLightToggle?.classList.toggle("active", moodSettings.warmLight);

  if (ambientAudio) {
    ambientAudio.volume = moodSettings.volume;
  }

  if (volumeSlider) {
    volumeSlider.value = String(Math.round(moodSettings.volume * 100));
  }

  if (volumeValue) {
    volumeValue.textContent = `${Math.round(moodSettings.volume * 100)}%`;
  }

  updateAudioControls();
}

function openMoodPanel() {
  moodPanel?.classList.add("open");
  moodPanel?.setAttribute("aria-hidden", "false");
  moodBtn?.setAttribute("aria-expanded", "true");
}

function closeMoodPanel() {
  moodPanel?.classList.remove("open");
  moodPanel?.setAttribute("aria-hidden", "true");
  moodBtn?.setAttribute("aria-expanded", "false");
}

function showSecret(message) {
  if (!secretToast) return;

  secretToast.textContent = message;
  secretToast.classList.add("show");

  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    secretToast.classList.remove("show");
  }, 4200);
}

function setTrack(index, { autoplay = null, revealSecret = true } = {}) {
  if (!ambientAudio || !TRACKS.length) return;

  currentTrackIndex = ((index % TRACKS.length) + TRACKS.length) % TRACKS.length;
  const track = TRACKS[currentTrackIndex];
  const shouldPlay = autoplay === null
    ? moodSettings.soundEnabled
    : autoplay;

  ambientAudio.pause();
  ambientAudio.src = track.src;
  ambientAudio.loop = Boolean(track.loop);
  ambientAudio.volume = moodSettings.volume;
  ambientAudio.load();

  try {
    ambientAudio.currentTime = 0;
  } catch (_) {
    // Some browsers do not allow setting currentTime until metadata is ready.
  }

  if (revealSecret && track.secret) {
    showSecret(track.secret);
  }

  updateAudioControls();

  if (shouldPlay) {
    tryPlayAudio();
  }
}

async function tryPlayAudio() {
  if (!ambientAudio) return;

  try {
    await ambientAudio.play();
    moodSettings.soundEnabled = true;
    saveMoodSettings();
  } catch (error) {
    // Autoplay can still be blocked in unusual browser configurations. Keep the
    // player usable and wait for the explicit play button.
    console.debug("Audio playback needs another user gesture:", error);
  }

  updateAudioControls();
}

function toggleAudio() {
  if (!ambientAudio) return;

  if (ambientAudio.paused) {
    moodSettings.soundEnabled = true;
    tryPlayAudio();
  } else {
    ambientAudio.pause();
    moodSettings.soundEnabled = false;
    saveMoodSettings();
    updateAudioControls();
  }
}

function nextTrack() {
  // This button is an explicit user gesture, so selecting another track should
  // immediately play it even if the previous track had been paused.
  moodSettings.soundEnabled = true;
  saveMoodSettings();

  setTrack(currentTrackIndex + 1, {
    autoplay: true,
    revealSecret: true
  });
}

function updateAudioControls() {
  if (!ambientAudio) return;

  const track = TRACKS[currentTrackIndex];
  const isPlaying = !ambientAudio.paused && !ambientAudio.ended;

  if (trackTitle) trackTitle.textContent = track.title;
  if (trackKind) {
    trackKind.textContent = currentTrackIndex === 0
      ? "background ambience"
      : "bonus track";
  }

  if (playPauseBtn) {
    playPauseBtn.textContent = isPlaying ? "Ⅱ" : "▶";
    playPauseBtn.setAttribute("aria-label", isPlaying ? "Pause audio" : "Play audio");
  }

  moodBtn?.classList.toggle("audio-playing", isPlaying);
}

function layoutSignature() {
  const rect = pageBody.getBoundingClientRect();
  const styles = getComputedStyle(pageBody);

  return [
    BOOK_PAGINATION_CACHE_VERSION,
    chapters.length,
    Math.round(rect.width),
    Math.round(rect.height),
    styles.fontSize,
    styles.lineHeight,
    styles.fontFamily
  ].join("|");
}

function rebuildPageOffsets() {
  chapterPageOffsets = [];
  let running = 0;

  for (let index = 0; index < chapters.length; index++) {
    chapterPageOffsets[index] = running;
    running += chapterPageCounts[index] || 0;
  }

  totalBookPages = running;
}

function restoreBookPaginationCache() {
  try {
    const cached = JSON.parse(localStorage.getItem(BOOK_PAGINATION_CACHE_KEY) || "null");

    if (
      !cached ||
      cached.signature !== layoutSignature() ||
      !Array.isArray(cached.counts) ||
      cached.counts.length !== chapters.length ||
      cached.counts.some(count => !Number.isInteger(count) || count < 1)
    ) {
      return false;
    }

    chapterPageCounts = cached.counts;
    rebuildPageOffsets();
    bookPaginationReady = totalBookPages > 0;
    return bookPaginationReady;
  } catch {
    return false;
  }
}

function saveBookPaginationCache() {
  try {
    localStorage.setItem(
      BOOK_PAGINATION_CACHE_KEY,
      JSON.stringify({
        signature: layoutSignature(),
        counts: chapterPageCounts
      })
    );
  } catch {
    // Cache is only an optimisation. The reader works without it.
  }
}

function invalidateBookPagination() {
  bookPaginationGeneration += 1;
  bookPaginationReady = false;
  chapterPageCounts = [];
  chapterPageOffsets = [];
  totalBookPages = 0;
  bookPaginationPromise = null;
}

async function fetchChapterData(index) {
  if (index === currentChapterIndex && chapterData?.paragraphs) {
    return chapterData;
  }

  const chapter = chapters[index];
  if (!chapter?.content) return null;

  const response = await fetch(chapter.content);
  if (!response.ok) {
    throw new Error(`Could not load ${chapter.label}: HTTP ${response.status}`);
  }

  return response.json();
}

async function ensureBookPagination({ force = false } = {}) {
  if (!chapters.length || pageBody.clientHeight <= 0) return;

  if (!force && bookPaginationReady) return;
  if (!force && restoreBookPaginationCache()) {
    renderPage();
    renderChapterDrawer();
    return;
  }

  if (bookPaginationPromise) return bookPaginationPromise;

  const generation = bookPaginationGeneration;

  bookPaginationPromise = (async () => {
    const counts = new Array(chapters.length).fill(0);

    for (let index = 0; index < chapters.length; index++) {
      if (generation !== bookPaginationGeneration) return;
      try {
        const data = await fetchChapterData(index);
        counts[index] = data?.paragraphs
          ? Math.max(1, paginateParagraphs(data.paragraphs).length)
          : 1;
      } catch (error) {
        console.error(error);
        counts[index] = 1;
      }

      // Yield occasionally so the UI stays responsive while the whole book is
      // being measured for the current screen size.
      if (index % 2 === 1) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }

    if (generation !== bookPaginationGeneration) return;

    chapterPageCounts = counts;
    rebuildPageOffsets();
    bookPaginationReady = totalBookPages > 0;
    saveBookPaginationCache();

    renderPage();
    renderChapterDrawer();
  })().finally(() => {
    if (generation === bookPaginationGeneration) {
      bookPaginationPromise = null;
    }
  });

  return bookPaginationPromise;
}

function globalPageNumber() {
  if (!bookPaginationReady) return null;
  return chapterPageOffsets[currentChapterIndex] + currentPageIndex + 1;
}

async function loadChapter(index, requestedPage = 0) {
  if (!chapters.length) return;

  currentChapterIndex = Math.max(0, Math.min(index, chapters.length - 1));
  const chapter = chapters[currentChapterIndex];

  chapterHeading.textContent = chapter.label;
  pageChapter.textContent = `${chapter.label} · Alchemised`;

  chapterData = null;
  pages = [];
  currentPageIndex = 0;

  if (chapter.content) {
    try {
      const response = await fetch(chapter.content);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      chapterData = await response.json();

      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      pages = paginateParagraphs(chapterData.paragraphs);
      currentPageIndex = Math.max(
        0,
        Math.min(requestedPage || 0, Math.max(0, pages.length - 1))
      );

      // The current chapter count is immediately known even if the whole-book
      // count is still being calculated.
      if (bookPaginationReady && chapterPageCounts[currentChapterIndex] !== pages.length) {
        invalidateBookPagination();
      }
    } catch (error) {
      console.error("Could not load local chapter:", error);
    }
  }

  renderPage();
  renderChapterDrawer();

  if (!bookPaginationReady) {
    ensureBookPagination();
  }
}

function emptyChapterHtml(chapter) {
  return `
    <div class="chapter-empty">
      <span class="empty-berry">● ● ●</span>
      <h2>${escapeHtml(chapter.label)}</h2>
      <p>
        This chapter has not been imported into Adi's local reader yet.
        You can still open the chapter at its original source.
      </p>
      <a class="source-button"
         href="${escapeHtml(chapter.url)}"
         target="_blank"
         rel="noopener noreferrer">
         Open original chapter ↗
      </a>
    </div>
  `;
}

function renderPage(direction = null) {
  const chapter = chapters[currentChapterIndex];
  if (!chapter) return;

  if (direction) {
    pageCard.classList.remove("page-flip-next", "page-flip-prev");
    void pageCard.offsetWidth;
    pageCard.classList.add(
      direction === "next" ? "page-flip-next" : "page-flip-prev"
    );
  }

  if (!pages.length) {
    pageBody.classList.remove("chapter-first-page");
    pageBody.innerHTML = emptyChapterHtml(chapter);
    pageNumberTop.textContent = "—";
    pageCounter.textContent = "Source page";
    chapterProgressText.textContent = `${chapter.label} · not imported locally`;

    const chapterFraction = chapters.length > 1
      ? currentChapterIndex / (chapters.length - 1)
      : 1;

    progressBar.style.width = `${chapterFraction * 100}%`;

    prevBtn.disabled = currentChapterIndex === 0;
    nextBtn.disabled = currentChapterIndex === chapters.length - 1;
    prevTextBtn.disabled = prevBtn.disabled;
    nextTextBtn.disabled = nextBtn.disabled;
    saveState();
    return;
  }

  const page = pages[currentPageIndex];

  pageBody.classList.toggle("chapter-first-page", currentPageIndex === 0);
  pageBody.innerHTML = page
    .map(item => {
      const classes = [];
      if (item.continuation) classes.push("paragraph-continuation");
      if (!item.paragraphEnd) classes.push("paragraph-fragment");
      const className = classes.length ? ` class="${classes.join(" ")}"` : "";
      return `<p${className}>${escapeHtml(item.text)}</p>`;
    })
    .join("");

  const globalPage = globalPageNumber();

  if (globalPage !== null) {
    pageNumberTop.textContent = globalPage;
    pageCounter.textContent = `Page ${globalPage} of ${totalBookPages}`;
    chapterProgressText.textContent = `${chapter.label} · page ${globalPage}/${totalBookPages}`;
    progressBar.style.width = `${(globalPage / totalBookPages) * 100}%`;
  } else {
    pageNumberTop.textContent = currentPageIndex + 1;
    pageCounter.textContent = `Page ${currentPageIndex + 1} · calculating book…`;
    chapterProgressText.textContent = `${chapter.label} · calculating total pages…`;

    const overallPosition =
      (currentChapterIndex + ((currentPageIndex + 1) / pages.length)) /
      chapters.length;
    progressBar.style.width = `${overallPosition * 100}%`;
  }

  const progressPercent = totalBookPages > 0
    ? (globalPageNumber() ?? currentPageIndex + 1) / totalBookPages * 100
    : ((currentChapterIndex + 1) / chapters.length) * 100;

  const progressBarRoot = document.querySelector(".reading-progress");
  if (progressBarRoot) {
    progressBarRoot.setAttribute("aria-valuenow", String(Math.max(0, Math.min(100, progressPercent))));
  }

  const atBookStart = currentChapterIndex === 0 && currentPageIndex === 0;
  const atBookEnd =
    currentChapterIndex === chapters.length - 1 &&
    currentPageIndex === pages.length - 1;

  prevBtn.disabled = atBookStart;
  nextBtn.disabled = atBookEnd;
  prevTextBtn.disabled = atBookStart;
  nextTextBtn.disabled = atBookEnd;

  saveState();
}

function goNext() {
  if (pages.length && currentPageIndex < pages.length - 1) {
    currentPageIndex++;
    renderPage("next");
    return;
  }

  if (currentChapterIndex < chapters.length - 1) {
    loadChapter(currentChapterIndex + 1, 0);
  }
}

function goPrevious() {
  if (pages.length && currentPageIndex > 0) {
    currentPageIndex--;
    renderPage("prev");
    return;
  }

  if (currentChapterIndex > 0) {
    const previousIndex = currentChapterIndex - 1;
    const previous = chapters[previousIndex];

    if (previous.content) {
      fetch(previous.content)
        .then(response => response.json())
        .then(data => {
          const previousPages = paginateParagraphs(data.paragraphs);
          loadChapter(previousIndex, Math.max(0, previousPages.length - 1));
        })
        .catch(() => loadChapter(previousIndex, 0));
    } else {
      loadChapter(previousIndex, 0);
    }
  }
}

function reflowCurrentChapter() {
  if (!chapterData || !chapterData.paragraphs) return;

  const oldPageCount = pages.length || 1;
  const oldFraction = currentPageIndex / oldPageCount;

  pages = paginateParagraphs(chapterData.paragraphs);
  currentPageIndex = Math.min(
    pages.length - 1,
    Math.max(0, Math.round(oldFraction * pages.length))
  );

  invalidateBookPagination();
  renderPage();
  ensureBookPagination({ force: true });
}

startBtn.addEventListener("click", openLibrary);
homeBtn.addEventListener("click", backToCover);

prevBtn.addEventListener("click", goPrevious);
nextBtn.addEventListener("click", goNext);
prevTextBtn.addEventListener("click", goPrevious);
nextTextBtn.addEventListener("click", goNext);

chaptersBtn.addEventListener("click", openDrawer);
closeDrawerBtn.addEventListener("click", closeDrawer);

chapterDrawer.querySelectorAll("[data-close-drawer]").forEach(node => {
  node.addEventListener("click", closeDrawer);
});

moodBtn?.addEventListener("click", () => {
  if (moodPanel.classList.contains("open")) {
    closeMoodPanel();
  } else {
    closeDrawer();
    openMoodPanel();
  }
});

closeMoodBtn?.addEventListener("click", closeMoodPanel);

warmLightToggle?.addEventListener("click", () => {
  moodSettings.warmLight = !moodSettings.warmLight;
  saveMoodSettings();
  applyMoodSettings();
});

playPauseBtn?.addEventListener("click", toggleAudio);
nextTrackBtn?.addEventListener("click", nextTrack);

volumeSlider?.addEventListener("input", event => {
  moodSettings.volume = Math.max(0, Math.min(1, Number(event.target.value) / 100));
  ambientAudio.volume = moodSettings.volume;
  saveMoodSettings();
  applyMoodSettings();
});

ambientAudio?.addEventListener("play", updateAudioControls);
ambientAudio?.addEventListener("pause", updateAudioControls);
ambientAudio?.addEventListener("ended", () => {
  // The easter-egg song plays once. When it ends, return to rain quietly.
  if (currentTrackIndex === 1) {
    setTrack(0, {
      autoplay: moodSettings.soundEnabled,
      revealSecret: false
    });
  }
});

document.addEventListener("mousemove", handlePigeonMouseMove, { passive: true });

pigeonEasterEgg?.addEventListener("mouseenter", () => {
  clearTimeout(pigeonHideTimer);
});

pigeonEasterEgg?.addEventListener("mouseleave", () => {
  schedulePigeonHide(700);
});

pigeonTouchHotspot?.addEventListener("click", event => {
  event.preventDefault();
  event.stopPropagation();

  if (pigeonEasterEgg?.classList.contains("show")) {
    hidePigeon();
  } else {
    revealPigeon({ autoHide: true });
  }
});

document.addEventListener("keydown", event => {
  if (libraryScreen.classList.contains("hidden")) return;

  if (event.key === "ArrowRight") {
    event.preventDefault();
    goNext();
  }

  if (event.key === "ArrowLeft") {
    event.preventDefault();
    goPrevious();
  }

  if (event.key === "Escape") {
    closeDrawer();
    closeMoodPanel();
  }
});

document.addEventListener("touchstart", event => {
  if (libraryScreen.classList.contains("hidden")) return;

  // Do not turn a page while manipulating the mood/player controls.
  if (event.target.closest(".mood-panel")) return;

  const touch = event.changedTouches[0];
  touchStartX = touch.screenX;
  touchStartY = touch.screenY;
}, { passive: true });

document.addEventListener("touchend", event => {
  if (
    touchStartX === null ||
    touchStartY === null ||
    libraryScreen.classList.contains("hidden")
  ) {
    return;
  }

  const touch = event.changedTouches[0];
  const diffX = touch.screenX - touchStartX;
  const diffY = touch.screenY - touchStartY;

  if (Math.abs(diffX) > 65 && Math.abs(diffX) > Math.abs(diffY) * 1.25) {
    if (diffX < 0) goNext();
    else goPrevious();
  }

  touchStartX = null;
  touchStartY = null;
}, { passive: true });

let resizeTimer = null;
window.addEventListener("resize", () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(reflowCurrentChapter, 320);
});

init();
