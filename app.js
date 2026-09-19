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
const pageJumpForm = document.getElementById("pageJumpForm");
const pageJumpInput = document.getElementById("pageJumpInput");
const pageJumpBtn = document.getElementById("pageJumpBtn");
const pageJumpHint = document.getElementById("pageJumpHint");

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
const berryMessage = document.getElementById("berryMessage");
const berryMessageText = document.getElementById("berryMessageText");
const butterflyIntro = document.getElementById("butterflyIntro");
const butterflyFlightLayer = document.getElementById("butterflyFlightLayer");
const pageButterflyPeek = document.getElementById("pageButterflyPeek");

// Raspberry page messages
// These are intentionally lightweight and infrequent. They appear only while
// the reader is open, never require a response, and can be dismissed by tapping
// anywhere on the message.
const BERRY_MESSAGE_HISTORY_KEY = "adiBerryMessageHistory";
const BERRY_MESSAGE_HISTORY_LIMIT = 15;
const BERRY_MESSAGE_WEIGHTS = {
  common: 55,
  warm: 25,
  uncommon: 15,
  rare: 4,
  veryRare: 1
};

const BERRY_MESSAGES = {
  common: [
    "A wild raspberry appeared.",
    "Random raspberry delivery.",
    "Emergency raspberry deployment.",
    "🍓 ← found this for you.",
    "Raspberry tax successfully avoided.",
    "Carry on reading. I was never here.",
    "Nothing to see here, m’lady.",
    "This message will self-destruct eventually.",
    "Alex.exe is currently behaving.",
    "No allegations, please.",
    "Objection overruled. Keep reading.",
    "The court permits one raspberry.",
    "Case closed. 🍓",
    "Classified information. Keep scrolling.",
    "You saw nothing.",
    "This was definitely necessary.",
    "Very serious website functionality.",
    "Essential feature. Do not question it.",
    "I spent development time on this btw.",
    "Was this feature worth it? Absolutely.",
    "Productivity has left the building.",
    "Corporate suffering temporarily suspended.",
    "Your motivation has clocked out.",
    "HR has approved this raspberry.",
    "Your suffering has been assigned a low-priority ticket.",
    "Please allow 3 to 5 business days for emotional recovery.",
    "~tiny raspberry noises~",
    "~appears, refuses to elaborate~",
    "~quietly leaves raspberry~",
    "~pretends this feature was in scope~",
    "~developer has lost the plot~",
    "~Adi continues reading~",
    "~perhaps hugs the reader~",
    "~wipes nonexistent tears~",
    "Drink some water, bookworm.",
    "Posture check, m’lady.",
    "Unclench your jaw. Yes, you.",
    "Blink occasionally.",
    "You still have a real life btw.",
    "The book will survive if you take a break.",
    "Go acquire snacks.",
    "Raspberry break?",
    "Have you eaten? Suspicious.",
    "Pilates cannot save you from hydration.",
    "I know you’re reading this instead of sleeping.",
    "Go to sleep at a reasonable hour. Signed, a hypocrite."
  ],
  uncommon: [
    "M’lady has been detected.",
    "Adi privilege activated.",
    "Clearance level: suspiciously high.",
    "You’ve unlocked another unnecessary feature.",
    "Congratulations. You found absolutely nothing useful.",
    "Achievement unlocked: distracted by raspberry.",
    "Achievement unlocked: still reading.",
    "Achievement unlocked: tolerated Alex.",
    "Achievement unlocked: good girl... wait, wrong menu.",
    "No need to behave. This is your website.",
    "Your attitude has been noted.",
    "Classic Adi behaviour.",
    "Somehow, I already know you’d argue with this message.",
    "I can practically hear the ‘mhm.’",
    "‘Maybe?’ Classic Adi answer. Reveals absolutely nothing.",
    "I know that concentrated face is happening rn.",
    "Stop judging my code.",
    "Yes, I intentionally programmed this nonsense.",
    "No, you cannot speak to the developer.",
    "Developer unavailable. Probably bothering Adi.",
    "Bug report rejected. Works on my machine.",
    "Feature request denied, m’lady.",
    "Fine. Feature request approved. You’re persuasive.",
    "Your wish is my command. Terms and conditions absolutely apply.",
    "Don’t even try using my own terms against me.",
    "The court remembers your previous offences.",
    "Appeal denied. Raspberry granted.",
    "Evidence has mysteriously disappeared.",
    "I blame the pigeon.",
    "Somewhere, a pigeon knows what you did.",
    "Pigeon surveillance remains active.",
    "This message was approved by the pigeon council.",
    "The pigeons told me to add this.",
    "Don’t look at me. Blame the raspberries.",
    "Raspberry beggar detected nearby.",
    "Fine, you can have the extra 50 cents.",
    "Economically irresponsible raspberry purchase approved.",
    "€2.50 well invested.",
    "One raspberry for m’lady. Alex gets his share."
  ],
  warm: [
    "Hope you’re enjoying your little corner of the internet.",
    "I hope this made you smile at least once.",
    "Thinking about you. That’s it. Carry on.",
    "Tiny reminder: I appreciate you.",
    "I really enjoy having you around.",
    "Still very glad I bumped into you.",
    "You make ordinary days considerably less ordinary.",
    "Thanks for letting me into your weird little world.",
    "I like learning your little things.",
    "Your stories, pigeons, food and random thoughts. I like hearing all of it.",
    "I hope today has been kind to you.",
    "In case nobody told you today: you’re doing alright.",
    "You deserve some quiet in that busy head of yours.",
    "No response required. Just appreciation.",
    "This one doesn’t need an answer. ♡",
    "Just leaving a little kindness here for you.",
    "Consider this a tiny internet hug.",
    "~perhaps hugs the subject as well~",
    "You know I genuinely like listening to you, right?",
    "I even like listening when you’re talking absolute shit. Especially then.",
    "Your singing privileges remain permanently approved.",
    "Five languages later and I’m somehow still listening.",
    "I like hearing you be unapologetically you.",
    "The unfiltered Adi is pretty great, you know.",
    "You never need to perform for me. Just exist.",
    "Whatever mood you’re in today is allowed here.",
    "You can just read. Nothing is expected from you here.",
    "This little corner belongs to you.",
    "No pressure to love it. I loved making it for you.",
    "Making this for you made me happy too.",
    "Your smile was worth the lost sleep.",
    "I’d probably build the stupid thing again.",
    "You’re very easy to make things for when I pay attention.",
    "Turns out paying attention to you gives me too many ideas."
  ],
  rare: [
    "You cross my mind more than you probably realise.",
    "I appreciate you more than I probably say properly.",
    "I’m really happy our paths crossed.",
    "Having you around has become one of my favourite little parts of the day.",
    "You somehow challenge me, annoy me and make me smile at the same time. Impressive.",
    "Underneath all the shit I give you, I care about you quite a bit.",
    "Some people are simply nice to have around. You’re one of mine.",
    "I hope you know you never owe me anything for caring about you.",
    "I don’t need anything from you right now. I’m just happy you’re here.",
    "You don’t have to find the right words with me.",
    "You can take as long as you need with things that are difficult to say.",
    "There’s no deadline on being comfortable with me.",
    "I’ll listen whenever you actually want to talk.",
    "No need to touch the hot stove. ♡",
    "The stove can stay untouched as long as you need, m’lady.",
    "Some things don’t need to be said for me to appreciate the intention behind them.",
    "The fact that you wanted to say it was already enough.",
    "You don’t owe this little cloud an answer either.",
    "I hope this feels like somewhere you can just be Adi for a while.",
    "I pay attention because I genuinely enjoy knowing you.",
    "You’re worth paying attention to.",
    "Still glad you’re here, m’lady."
  ],
  veryRare: [
    "Hey. I’m thinking about you. ♡",
    "If you found this one, consider yourself quietly appreciated.",
    "You’re my favourite raspberry-shaped inconvenience.",
    "Unfortunately, I’ve grown rather fond of you, m’lady.",
    "Don’t get cocky about it, but you matter to me.",
    "This website contains trace amounts of Alex having a soft spot for you.",
    "Somewhere between the raspberries and all our bullshit, you became pretty important to me.",
    "No clever joke for this one. I’m simply glad I know you.",
    "I hope future-you finds this on a day she needs it. You’re appreciated.",
    "If today is difficult, you don’t need to explain it. Be here for a while.",
    "For once, no terms and conditions. Just ♡.",
    "You found the sentimental one. Say nothing. My reputation is at stake.",
    "Classified: I have a soft spot for m’lady. Destroy after reading.",
    "Objection: this is getting sentimental. Overruled. ♡",
    "Okay, enough feelings. Here’s a raspberry. 🍓"
  ]
};

const ULTRA_RARE_BERRY_MESSAGES = [
  "You’re still here? Good. I like having you around. ♡",
  "There are probably easier ways of saying ‘I appreciate you’ than building an entire website. Unfortunately, you met me.",
  "You once said some words feel like touching a hot stove. Nothing on this page requires you to touch it. Just enjoy your book, m’lady.",
  "If you’re reading this on a bad day: you don’t have to be funny, interesting, talkative or okay. The raspberries still accept you.",
  "I hope one day you randomly open this months from now, find this message, and smile because some idiot was thinking about you when he wrote it."
];

let berryMessageTimer = null;
let berryMessageHideTimer = null;
let berryMessageShownCount = 0;
let berryMessageScheduleStep = 0;
let berryMessageSessionLimit = Math.random() < 0.5 ? 3 : 4;
let berryReadingStartedAt = null;

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

function getBerryMessageHistory() {
  try {
    const value = JSON.parse(localStorage.getItem(BERRY_MESSAGE_HISTORY_KEY) || "[]");
    return Array.isArray(value) ? value.slice(-BERRY_MESSAGE_HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function rememberBerryMessage(id) {
  const history = getBerryMessageHistory().filter(item => item !== id);
  history.push(id);
  localStorage.setItem(
    BERRY_MESSAGE_HISTORY_KEY,
    JSON.stringify(history.slice(-BERRY_MESSAGE_HISTORY_LIMIT))
  );
}

function messageId(category, index) {
  return `${category}:${index}`;
}

function pickFromCategory(category, history) {
  const messages = BERRY_MESSAGES[category] || [];
  let candidates = messages
    .map((text, index) => ({ id: messageId(category, index), text }))
    .filter(item => !history.includes(item.id));

  if (!candidates.length) {
    candidates = messages.map((text, index) => ({ id: messageId(category, index), text }));
  }

  return candidates[Math.floor(Math.random() * candidates.length)] || null;
}

function pickWeightedBerryMessage() {
  const history = getBerryMessageHistory();
  const readingMinutes = berryReadingStartedAt
    ? (Date.now() - berryReadingStartedAt) / 60000
    : 0;

  // Ultra-rare notes are not part of the normal weighted pool. They only get
  // a tiny chance after a longer reading session.
  if (readingMinutes >= 20 && Math.random() < 0.008) {
    let candidates = ULTRA_RARE_BERRY_MESSAGES
      .map((text, index) => ({ id: `ultra:${index}`, text }))
      .filter(item => !history.includes(item.id));

    if (!candidates.length) {
      candidates = ULTRA_RARE_BERRY_MESSAGES.map((text, index) => ({ id: `ultra:${index}`, text }));
    }

    return candidates[Math.floor(Math.random() * candidates.length)] || null;
  }

  const roll = Math.random() * 100;
  let cumulative = 0;
  let selectedCategory = "common";

  for (const [category, weight] of Object.entries(BERRY_MESSAGE_WEIGHTS)) {
    cumulative += weight;
    if (roll < cumulative) {
      selectedCategory = category;
      break;
    }
  }

  return pickFromCategory(selectedCategory, history);
}

function berryMessageCanAppear() {
  return Boolean(
    berryMessage &&
    berryMessageText &&
    !libraryScreen.classList.contains("hidden") &&
    !document.hidden &&
    !chapterDrawer?.classList.contains("open") &&
    !moodPanel?.classList.contains("open") &&
    !pigeonEasterEgg?.classList.contains("show") &&
    berryMessage.hidden
  );
}

function clearBerryMessageTimers() {
  clearTimeout(berryMessageTimer);
  clearTimeout(berryMessageHideTimer);
  berryMessageTimer = null;
  berryMessageHideTimer = null;
}

function scheduleBerryMessage({ retry = false } = {}) {
  clearTimeout(berryMessageTimer);

  if (berryMessageShownCount >= berryMessageSessionLimit) return;
  if (libraryScreen.classList.contains("hidden")) return;

  let delayMinutes;
  if (retry) {
    delayMinutes = randomBetween(0.5, 1.0);
  } else {
    const ranges = [
      [4, 8],
      [7, 15],
      [10, 20]
    ];
    const [min, max] = ranges[Math.min(berryMessageScheduleStep, ranges.length - 1)];
    delayMinutes = randomBetween(min, max);
  }

  berryMessageTimer = setTimeout(() => {
    berryMessageTimer = null;
    tryShowBerryMessage();
  }, delayMinutes * 60 * 1000);
}

function tryShowBerryMessage() {
  if (berryMessageShownCount >= berryMessageSessionLimit) return;

  if (!berryMessageCanAppear()) {
    scheduleBerryMessage({ retry: true });
    return;
  }

  const selected = pickWeightedBerryMessage();
  if (!selected) {
    scheduleBerryMessage({ retry: true });
    return;
  }

  showBerryMessage(selected);
}

function showBerryMessage(selected) {
  if (!berryMessage || !berryMessageText) return;

  const positions = ["top-left", "top-right", "bottom-left", "bottom-right"];
  const position = positions[Math.floor(Math.random() * positions.length)];

  berryMessage.classList.remove(
    "berry-message-top-left",
    "berry-message-top-right",
    "berry-message-bottom-left",
    "berry-message-bottom-right",
    "show"
  );
  berryMessage.classList.add(`berry-message-${position}`);
  berryMessageText.textContent = selected.text;
  berryMessage.hidden = false;
  berryMessage.setAttribute("aria-label", `${selected.text} Tap to dismiss.`);

  requestAnimationFrame(() => {
    requestAnimationFrame(() => berryMessage.classList.add("show"));
  });

  rememberBerryMessage(selected.id);
  berryMessageShownCount += 1;
  berryMessageScheduleStep += 1;

  const visibleForMs = randomBetween(6, 10) * 1000;
  clearTimeout(berryMessageHideTimer);
  berryMessageHideTimer = setTimeout(() => {
    hideBerryMessage({ scheduleNext: true });
  }, visibleForMs);
}

function hideBerryMessage({ scheduleNext = false } = {}) {
  clearTimeout(berryMessageHideTimer);
  berryMessageHideTimer = null;

  if (!berryMessage || berryMessage.hidden) {
    if (scheduleNext) scheduleBerryMessage();
    return;
  }

  berryMessage.classList.remove("show");

  setTimeout(() => {
    if (!berryMessage.classList.contains("show")) {
      berryMessage.hidden = true;
      berryMessageText.textContent = "";
    }
  }, 280);

  if (scheduleNext) {
    scheduleBerryMessage();
  }
}

function startBerryMessageSession() {
  if (!berryReadingStartedAt) {
    berryReadingStartedAt = Date.now();
  }

  if (!berryMessageTimer && berryMessageShownCount < berryMessageSessionLimit) {
    scheduleBerryMessage();
  }
}

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


// ---------------------------------------------------------
// White butterfly intro + page-corner butterfly
// ---------------------------------------------------------
const BUTTERFLY_INTRO_SESSION_KEY = "adiButterflyIntroSeen";
let butterflyIntroTimer = null;
let butterflyIntroRaf = null;
let butterflyIntroFinished = false;

function butterflySafeId(value) {
  return String(value).replace(/[^a-zA-Z0-9_-]/g, "");
}

function createWhiteButterflySVG(id = "butterfly") {
  const uid = butterflySafeId(id);
  const wingWhite = `wing-white-${uid}`;
  const wingShade = `wing-shade-${uid}`;

  return `
    <svg viewBox="0 0 100 74" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="${wingWhite}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".99" />
          <stop offset="70%" stop-color="#fffdf8" stop-opacity=".93" />
          <stop offset="100%" stop-color="#d7d8d6" stop-opacity=".74" />
        </linearGradient>
        <linearGradient id="${wingShade}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#ffffff" stop-opacity=".90" />
          <stop offset="100%" stop-color="#e8e4dc" stop-opacity=".67" />
        </linearGradient>
      </defs>

      <g class="wing-left">
        <path
          d="M49 35 C38 16,20 4,8 10 C1 14,3 24,9 31 C16 39,32 42,49 40 Z"
          fill="url(#${wingWhite})" stroke="rgba(125,125,125,.25)" stroke-width=".7"
        />
        <path
          d="M9 10 C16 7,25 10,32 15 C25 15,17 18,9 23 C5 19,4 14,9 10 Z"
          fill="rgba(80,82,82,.17)"
        />
        <path
          d="M49 38 C37 39,21 40,15 49 C10 57,18 64,29 63 C39 62,46 54,50 42 Z"
          fill="url(#${wingShade})" stroke="rgba(125,125,125,.20)" stroke-width=".7"
        />
        <path
          d="M47 36 L15 15 M46 37 L10 29 M47 39 L20 51 M47 40 L31 59"
          fill="none" stroke="rgba(115,115,115,.19)" stroke-width=".65" stroke-linecap="round"
        />
      </g>

      <g class="wing-right">
        <path
          d="M51 35 C62 16,80 4,92 10 C99 14,97 24,91 31 C84 39,68 42,51 40 Z"
          fill="url(#${wingWhite})" stroke="rgba(125,125,125,.25)" stroke-width=".7"
        />
        <path
          d="M91 10 C84 7,75 10,68 15 C75 15,83 18,91 23 C95 19,96 14,91 10 Z"
          fill="rgba(80,82,82,.17)"
        />
        <path
          d="M51 38 C63 39,79 40,85 49 C90 57,82 64,71 63 C61 62,54 54,50 42 Z"
          fill="url(#${wingShade})" stroke="rgba(125,125,125,.20)" stroke-width=".7"
        />
        <path
          d="M53 36 L85 15 M54 37 L90 29 M53 39 L80 51 M53 40 L69 59"
          fill="none" stroke="rgba(115,115,115,.19)" stroke-width=".65" stroke-linecap="round"
        />
      </g>

      <g class="body-group">
        <path d="M49 28 C43 19,41 13,37 9" fill="none" stroke="rgba(82,74,70,.75)" stroke-width=".8" stroke-linecap="round" />
        <path d="M51 28 C57 19,59 13,63 9" fill="none" stroke="rgba(82,74,70,.75)" stroke-width=".8" stroke-linecap="round" />
        <circle cx="37" cy="9" r="1.1" fill="rgba(75,68,65,.8)" />
        <circle cx="63" cy="9" r="1.1" fill="rgba(75,68,65,.8)" />
        <ellipse cx="50" cy="28" rx="2.6" ry="3" fill="#69635f" />
        <ellipse cx="50" cy="35" rx="3" ry="6" fill="#77716d" />
        <path d="M48.7 38 C48.4 48,48.8 58,50 63 C51.2 58,51.6 48,51.3 38 Z" fill="#746d68" />
      </g>
    </svg>
  `;
}

function butterflyEaseOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function butterflyEaseInOutSine(t) {
  return -(Math.cos(Math.PI * t) - 1) / 2;
}

function finishButterflyIntro() {
  if (!butterflyIntro || butterflyIntroFinished) return;

  butterflyIntroFinished = true;
  clearTimeout(butterflyIntroTimer);
  butterflyIntroTimer = null;

  if (butterflyIntroRaf) {
    cancelAnimationFrame(butterflyIntroRaf);
    butterflyIntroRaf = null;
  }

  butterflyIntro.classList.add("butterfly-intro-hidden");
  butterflyIntro.setAttribute("aria-hidden", "true");
}

function startButterflyIntro({ force = false } = {}) {
  if (!butterflyIntro || !butterflyFlightLayer) return;

  if (!force) {
    try {
      if (sessionStorage.getItem(BUTTERFLY_INTRO_SESSION_KEY) === "1") {
        butterflyIntro.classList.add("butterfly-intro-hidden");
        butterflyIntro.setAttribute("aria-hidden", "true");
        return;
      }
    } catch {}
  }

  document.documentElement.classList.remove("butterfly-intro-seen");
  butterflyIntro.classList.remove("butterfly-intro-hidden");
  butterflyIntro.setAttribute("aria-hidden", "false");
  butterflyIntroFinished = false;

  clearTimeout(butterflyIntroTimer);
  if (butterflyIntroRaf) cancelAnimationFrame(butterflyIntroRaf);
  butterflyFlightLayer.replaceChildren();

  try {
    sessionStorage.setItem(BUTTERFLY_INTRO_SESSION_KEY, "1");
  } catch {}

  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  if (prefersReducedMotion) {
    butterflyIntroTimer = setTimeout(finishButterflyIntro, 1800);
    return;
  }

  const settings = [
    { delay: 0,    duration: 7700, scale: .98, flap: .29, side: -.98, y: -.06, drift: -.06 },
    { delay: 140,  duration: 7600, scale: .84, flap: .31, side: -.68, y: -.17, drift: -.04 },
    { delay: 300,  duration: 7900, scale: .90, flap: .27, side: -.31, y: -.07, drift: -.03 },
    { delay: 470,  duration: 8800, scale: .76, flap: .24, side:  .05, y: -.20, drift:  .01, distant: true },
    { delay: 650,  duration: 8150, scale: .81, flap: .26, side:  .40, y: -.08, drift:  .04 },
    { delay: 840,  duration: 8500, scale: .70, flap: .23, side:  .72, y: -.16, drift:  .06, distant: true },
    { delay: 1050, duration: 8050, scale: .64, flap: .22, side: 1.00, y: -.03, drift:  .05, distant: true },
    { delay: 1240, duration: 9100, scale: .60, flap: .21, side:  .02, y: -.25, drift: -.01, distant: true }
  ];

  const createdAt = performance.now();
  const butterflies = settings.map((config, index) => {
    const element = document.createElement("div");
    element.className = "white-butterfly" + (config.distant ? " distant" : "");
    element.style.setProperty("--flap-speed", `${config.flap}s`);
    element.innerHTML = createWhiteButterflySVG(`intro-${Date.now()}-${index}`);
    butterflyFlightLayer.appendChild(element);

    return {
      element,
      config,
      index,
      start: createdAt + config.delay
    };
  });

  const animate = now => {
    if (butterflyIntroFinished) return;

    const width = window.innerWidth;
    const height = window.innerHeight;
    const centerX = width * .5;
    const startY = height + Math.max(30, height * .035);
    const tornadoTopY = height * .54;
    const maxSpread = Math.min(width * .39, 390);
    const phase1End = .47;

    butterflies.forEach(item => {
      const { element, config, index } = item;
      const elapsed = now - item.start;

      if (elapsed < 0) {
        element.style.opacity = "0";
        return;
      }

      const progress = Math.min(elapsed / config.duration, 1);
      let x;
      let y;
      let rotation;
      let scale;
      let opacity = 1;

      if (progress <= phase1End) {
        const t = progress / phase1End;
        const eased = butterflyEaseOutCubic(t);
        const turns = 2.35 + index * .035;
        const angle = t * Math.PI * 2 * turns + index * .72;
        const radius = (Math.min(width * .16, 125) * (1 - eased * .62)) + index * 2.5;

        x = centerX + Math.cos(angle) * radius;
        y = startY - (startY - tornadoTopY) * eased + Math.sin(angle * 1.35) * Math.min(18, height * .02);
        rotation = Math.sin(angle) * 13;
        scale = config.scale * (.76 + .24 * eased);
        opacity = Math.min(1, t * 2.8);
      } else {
        const t = (progress - phase1End) / (1 - phase1End);
        const eased = butterflyEaseInOutSine(t);
        const spreadStartX = centerX + Math.cos(index * 1.17) * Math.min(44, width * .06);
        const spreadStartY = tornadoTopY + Math.sin(index * 1.61) * Math.min(24, height * .025);
        const targetX = centerX + config.side * maxSpread;
        const targetY = tornadoTopY + config.y * height;
        const waveX = Math.sin(t * Math.PI * 2.35 + index) * Math.min(22, width * .035);
        const waveY = Math.sin(t * Math.PI * 3.15 + index * 1.4) * Math.min(14, height * .018);

        x = spreadStartX + (targetX - spreadStartX) * eased + config.drift * width * t + waveX;
        y = spreadStartY + (targetY - spreadStartY) * eased + waveY;
        rotation = Math.cos(t * Math.PI * 2.3 + index) * 9;
        scale = config.scale * (.96 + Math.sin(t * Math.PI) * .06);

        if (progress > .94) {
          opacity = Math.max(0, 1 - (progress - .94) / .06);
        }
      }

      const halfWidth = element.offsetWidth * .5;
      const halfHeight = element.offsetHeight * .5;
      element.style.opacity = String(Math.max(0, opacity));
      element.style.transform = `translate3d(${x - halfWidth}px, ${y - halfHeight}px, 0) scale(${scale}) rotate(${rotation}deg)`;
    });

    butterflyIntroRaf = requestAnimationFrame(animate);
  };

  butterflyIntroRaf = requestAnimationFrame(animate);
  butterflyIntroTimer = setTimeout(finishButterflyIntro, 6500);
}

function setupPageButterflyPeek() {
  if (!pageButterflyPeek || pageButterflyPeek.childElementCount) return;
  pageButterflyPeek.innerHTML = createWhiteButterflySVG("page-peek");
}

function setupButterflyIntro() {
  if (!butterflyIntro) return;
  butterflyIntro.addEventListener("click", finishButterflyIntro);
  startButterflyIntro();
}

// Handy for testing the intro again from DevTools without opening a new session.
window.playButterflyIntro = () => startButterflyIntro({ force: true });
window.skipButterflyIntro = finishButterflyIntro;


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
  startBerryMessageSession();
}

function backToCover() {
  libraryScreen.classList.add("hidden");
  coverScreen.classList.remove("hidden");
  closeDrawer();
  hidePigeon();
  clearBerryMessageTimers();
  hideBerryMessage({ scheduleNext: false });
}

function renderChapterDrawer() {
  chapterList.innerHTML = chapters.map((chapter, index) => {
    const classes = [
      "chapter-item",
      index === currentChapterIndex ? "active" : ""
    ].filter(Boolean).join(" ");

    const pageStart = bookPaginationReady
      ? `<span class="chapter-page-start">p. ${chapterPageOffsets[index] + 1}</span>`
      : "";

    return `
      <button class="${classes}" data-chapter-index="${index}">
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

  updatePageJumpUI();
}

function updatePageJumpUI() {
  if (!pageJumpInput || !pageJumpHint) return;

  if (bookPaginationReady && totalBookPages > 0) {
    pageJumpInput.max = String(totalBookPages);
    const current = globalPageNumber();
    pageJumpInput.placeholder = current ? `Current: ${current}` : "e.g. 300";
    pageJumpHint.textContent = `Pages 1–${totalBookPages} · your place is saved automatically on this device.`;
  } else {
    pageJumpInput.removeAttribute("max");
    pageJumpInput.placeholder = "e.g. 300";
    pageJumpHint.textContent = "Page numbers are calculated for this screen.";
  }
}

async function jumpToBookPage(rawPage) {
  const requested = Math.trunc(Number(rawPage));

  if (!Number.isFinite(requested) || requested < 1) {
    if (pageJumpHint) pageJumpHint.textContent = "Enter a page number first.";
    pageJumpInput?.focus();
    return;
  }

  if (pageJumpBtn) pageJumpBtn.disabled = true;
  if (pageJumpHint) pageJumpHint.textContent = "Finding that page…";

  await ensureBookPagination();

  if (!bookPaginationReady || totalBookPages < 1) {
    if (pageJumpBtn) pageJumpBtn.disabled = false;
    if (pageJumpHint) pageJumpHint.textContent = "I couldn’t calculate the book pages just yet.";
    return;
  }

  const target = Math.max(1, Math.min(requested, totalBookPages));
  let targetChapter = chapters.length - 1;

  for (let index = 0; index < chapters.length; index++) {
    const firstPage = chapterPageOffsets[index] + 1;
    const lastPage = chapterPageOffsets[index] + chapterPageCounts[index];

    if (target >= firstPage && target <= lastPage) {
      targetChapter = index;
      break;
    }
  }

  const targetLocalPage = target - chapterPageOffsets[targetChapter] - 1;

  if (pageJumpInput) pageJumpInput.value = String(target);
  if (pageJumpBtn) pageJumpBtn.disabled = false;
  closeDrawer();
  await loadChapter(targetChapter, targetLocalPage);
}

function openDrawer() {
  chapterDrawer.classList.add("open");
  chapterDrawer.setAttribute("aria-hidden", "false");
  chaptersBtn?.setAttribute("aria-expanded", "true");
  updatePageJumpUI();

  if (!bookPaginationReady) {
    ensureBookPagination().then(updatePageJumpUI);
  }
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
    updateAudioControls();

  } catch (error) {
    console.debug("Audio not ready yet. Waiting for track...", error);

    const retryPlayback = async () => {
      if (!moodSettings.soundEnabled) return;

      try {
        await ambientAudio.play();

        moodSettings.soundEnabled = true;
        saveMoodSettings();
        updateAudioControls();

      } catch (retryError) {
        console.debug("Audio retry failed:", retryError);
      }
    };

    ambientAudio.addEventListener("canplay", retryPlayback, {
      once: true
    });
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

    prevTextBtn.disabled = currentChapterIndex === 0;
    nextTextBtn.disabled = currentChapterIndex === chapters.length - 1;
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

prevTextBtn.addEventListener("click", goPrevious);
nextTextBtn.addEventListener("click", goNext);

chaptersBtn.addEventListener("click", openDrawer);
closeDrawerBtn.addEventListener("click", closeDrawer);

chapterDrawer.querySelectorAll("[data-close-drawer]").forEach(node => {
  node.addEventListener("click", closeDrawer);
});

pageJumpForm?.addEventListener("submit", event => {
  event.preventDefault();
  jumpToBookPage(pageJumpInput?.value);
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

berryMessage?.addEventListener("click", () => {
  hideBerryMessage({ scheduleNext: true });
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

  if (event.target instanceof HTMLElement && event.target.closest("input, textarea, select")) {
    return;
  }

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

setupPageButterflyPeek();
setupButterflyIntro();
init();
