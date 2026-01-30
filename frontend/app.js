const state = {
  templates: [],
  current: null,
  autoTimer: null,
  pose: null,
  faceMesh: null,
  camera: null,
  latestLandmarks: null,
  latestFaceLandmarks: null,
  scoringTimer: null,
  templateAngles: null,
  templateFps: 30,
  latestDiffs: null,
  lastScore: null,
  lastGrade: "—",
  badgePos: { x: 24, y: 24 },
  badgeNextMove: 0,
  sessionTimer: null,
  sessionStart: null,
  nextCheerAt: 300,
  scoreHistory: [],
  minuteScores: [],
  minuteStart: null,
  sessionScores: [],
  sessionBpms: [],
  hrCsvRows: [],
  hrCsvWriter: null,
  hrCsvWriteQueue: [],
  hrCsvWriting: false,
  hrCsvEnabled: false,
  rppgWorker: null,
  rppgRunning: false,
  rppgCanvas: null,
  rppgCtx: null,
  rppgSampleTimer: null,
  rppgEstimateTimer: null,
  rppgLastSampleTs: 0,
  rppgLastStoreTs: 0,
  rppgBpm: null,
  bgmRunning: false,
  bgmCurrent: null,
  bgmNext: null,
  bgmRequestTimer: null,
  bgmFadeTimer: null,
  bgmCurrentStartMs: 0,
  bgmRequestInFlight: false,
  bgmUserPrompt: null,
  bgmStarted: false,
  sessionEnded: false,
  visionRunning: false,
  visionBusy: false,
};

const ALLOWED_CLIP_IDS = new Set([
  "[KxzZJwmB8qc]_0168",
  "[lCMN-y0BDM4]_0118",
  "[wP27i_ZksZ8]_0112",
  "[43ujp3KQ8kE]_0003",
  "[hXyamPHNhkk]_0218",
  "[43ujp3KQ8kE]_0013",
  "[9UX7XUBMJnc]_0306",
  "[iKWmRIflEhc]_0252",
  "[wP27i_ZksZ8]_0077",
  "[wP27i_ZksZ8]_0085",
  "[wP27i_ZksZ8]_0072",
  "[cU1lz4_5dRM]_0023",
  "[wP27i_ZksZ8]_0107",
  "[43ujp3KQ8kE]_0004",
  "[cU1lz4_5dRM]_0022",
  "[wP27i_ZksZ8]_0102",
  "[lCMN-y0BDM4]_0120",
  "[lCMN-y0BDM4]_0116",
  "[hXyamPHNhkk]_0222",
  "[iKWmRIflEhc]_0260",
  "[lCMN-y0BDM4]_0140",
  "[lCMN-y0BDM4]_0126",
  "[wP27i_ZksZ8]_0067",
  "[lCMN-y0BDM4]_0134",
  "[hXyamPHNhkk]_0224",
  "[hXyamPHNhkk]_0228",
  "[lCMN-y0BDM4]_0138",
  "[9UX7XUBMJnc]_0322",
  "[9UX7XUBMJnc]_0302",
  "[43ujp3KQ8kE]_0001",
  "[wP27i_ZksZ8]_0093",
  "[Qs8Z7X90f68]_0186",
  "[cU1lz4_5dRM]_0025",
  "[iKWmRIflEhc]_0254",
  "[wP27i_ZksZ8]_0091",
  "[cU1lz4_5dRM]_0015",
  "[lCMN-y0BDM4]_0114",
  "[KxzZJwmB8qc]_0158",
  "[wP27i_ZksZ8]_0070",
  "[cU1lz4_5dRM]_0019",
  "[wP27i_ZksZ8]_0096",
  "[43ujp3KQ8kE]_0012",
  "[cU1lz4_5dRM]_0028",
  "[43ujp3KQ8kE]_0002",
  "[Qs8Z7X90f68]_0188",
  "[KxzZJwmB8qc]_0144",
  "[wP27i_ZksZ8]_0095",
  "[hXyamPHNhkk]_0216",
  "[cU1lz4_5dRM]_0017",
  "[wP27i_ZksZ8]_0066",
  "[9UX7XUBMJnc]_0300",
  "[hXyamPHNhkk]_0244",
  "[lCMN-y0BDM4]_0142",
  "[9UX7XUBMJnc]_0316",
  "[Qs8Z7X90f68]_0178",
  "[wP27i_ZksZ8]_0099",
]);

const els = {
  exerciseTitle: document.getElementById("exercise-title"),
  exerciseMeta: document.getElementById("exercise-meta"),
  templateVideo: document.getElementById("template-video"),
  metrics: document.getElementById("metrics"),
  assetLinks: document.getElementById("asset-links"),
  judgement: document.getElementById("judgement"),
  feedback: document.getElementById("feedback"),
  scoreFill: document.getElementById("score-fill"),
  scoreValue: document.getElementById("score-value"),
  shuffleBtn: document.getElementById("shuffle-btn"),
  startCamera: document.getElementById("start-camera"),
  cameraVideo: document.getElementById("camera-video"),
  overlay: document.getElementById("overlay-canvas"),
  duration: document.getElementById("duration"),
  autoToggle: document.getElementById("auto-toggle"),
  endSession: document.getElementById("end-session"),
  sessionTime: document.getElementById("session-time"),
  sessionFill: document.getElementById("session-fill"),
  cheerMessage: document.getElementById("cheer-message"),
  exerciseAlert: document.getElementById("exercise-alert"),
  minuteScore: document.getElementById("minute-score"),
  heartBadge: document.getElementById("heart-badge"),
  bgmLoading: document.getElementById("bgm-loading"),
  musicGenre: document.getElementById("music-genre"),
  sessionSummary: document.getElementById("session-summary"),
  summaryScore: document.getElementById("summary-score"),
  summaryBest: document.getElementById("summary-best"),
  summaryBpm: document.getElementById("summary-bpm"),
  summaryPeak: document.getElementById("summary-peak"),
  summaryDuration: document.getElementById("summary-duration"),
};

function apiBase() {
  if (location.port === "8080") {
    return `${location.protocol}//${location.hostname}:8000`;
  }
  return "";
}

function assetUrl(path) {
  if (!path) {
    return "#";
  }
  if (path.startsWith("http")) {
    return path;
  }
  if (path.startsWith("/api/")) {
    return `${apiBase()}${path}`;
  }
  if (path.startsWith("/data/outputs/")) {
    return `${apiBase()}/api/static/${path.replace("/data/outputs/", "")}`;
  }
  const clean = path.replace(/^\/+/, "");
  return `${apiBase()}/api/static/${clean}`;
}

const MP_INDEX = {
  leftShoulder: 11,
  rightShoulder: 12,
  leftElbow: 13,
  rightElbow: 14,
  leftWrist: 15,
  rightWrist: 16,
  leftHip: 23,
  rightHip: 24,
  leftKnee: 25,
  rightKnee: 26,
  leftAnkle: 27,
  rightAnkle: 28,
};

const MP_CONNECTIONS = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

function mirrorLandmarks(landmarks) {
  const swapped = landmarks.map((lm) => ({ ...lm, x: 1 - lm.x }));
  const swap = (a, b) => {
    const tmp = swapped[a];
    swapped[a] = swapped[b];
    swapped[b] = tmp;
  };
  swap(MP_INDEX.leftShoulder, MP_INDEX.rightShoulder);
  swap(MP_INDEX.leftElbow, MP_INDEX.rightElbow);
  swap(MP_INDEX.leftWrist, MP_INDEX.rightWrist);
  swap(MP_INDEX.leftHip, MP_INDEX.rightHip);
  swap(MP_INDEX.leftKnee, MP_INDEX.rightKnee);
  swap(MP_INDEX.leftAnkle, MP_INDEX.rightAnkle);
  return swapped;
}

const SMPL_INDEX = {
  leftHip: 1,
  rightHip: 2,
  leftKnee: 4,
  rightKnee: 5,
  leftAnkle: 7,
  rightAnkle: 8,
  leftShoulder: 16,
  rightShoulder: 17,
  leftElbow: 18,
  rightElbow: 19,
  leftWrist: 20,
  rightWrist: 21,
};

const ANGLE_LABELS = [
  "左肘",
  "右肘",
  "左膝",
  "右膝",
  "左股関節",
  "右股関節",
  "左肩",
  "右肩",
];

const ANGLE_MAX_DIFF = 220;
const GOOD_DIFF = 90;
const OK_DIFF = 140;
const ANGLE_WEIGHTS = [1.3, 1.3, 0.25, 0.25, 0.25, 0.25, 1.2, 1.2];
const SESSION_SECONDS = 30 * 60;
const CHEER_INTERVAL = 5 * 60;
const EXERCISE_INTERVAL = 30;
const CHEER_MESSAGES = [
  "その調子でいこう！",
  "フォームきれい！",
  "あと少し、ナイス！",
  "呼吸を整えて、リズム良いよ！",
  "いいペース！続けよう！",
];
const MINUTE_INTERVAL = 60;
const BGM_INTERVAL_SEC = 30;
const BGM_FADE_MS = 4000;
const BGM_PREFETCH_SEC = 8;

const SCORE_WINDOW_MS = 1200;

async function loadTemplates() {
  const response = await fetch(`${apiBase()}/api/templates?limit=1000`);
  if (!response.ok) {
    throw new Error(`Request failed (${response.status})`);
  }
  const data = await response.json();
  const templates = data.templates || [];
  if (ALLOWED_CLIP_IDS.size) {
    state.templates = templates.filter((entry) => ALLOWED_CLIP_IDS.has(entry.clip_id));
  } else {
    state.templates = templates;
  }
}

function pickRandomTemplate() {
  if (!state.templates.length) {
    return null;
  }
  const index = Math.floor(Math.random() * state.templates.length);
  return state.templates[index];
}

function formatMetric(value) {
  if (value === null || value === undefined) {
    return "-";
  }
  return Number(value).toFixed(2);
}

function renderTemplate(entry) {
  if (!entry) {
    els.exerciseTitle.textContent = "No template";
    els.exerciseMeta.textContent = "";
    els.metrics.innerHTML = "";
    els.assetLinks.innerHTML = "";
    clearPreview();
    return;
  }

  const meta = entry.meta || {};
  const entryAssets = entry.assets || {};
  const people = entry.people || [];
  const first = people[0] || {};
  const metrics = first.metrics || {};
  const assets = first.assets || {};

  els.exerciseTitle.textContent = meta.exercise || entry.clip_id || "Untitled";
  els.exerciseMeta.textContent = `${meta.body_part || ""} · ${meta.intensity || ""} · ${entry.clip_id}`;

  els.metrics.innerHTML = `
    <div>Difficulty: ${formatMetric(metrics.difficulty_score)}</div>
    <div>Speed: ${formatMetric(metrics.speed_mean)}</div>
    <div>ROM: ${formatMetric(metrics.rom_mean)}</div>
    <div>People: ${people.length}</div>
  `;

  els.assetLinks.innerHTML = `
    <a href="${assetUrl(assets.npz)}" target="_blank" rel="noreferrer">npz</a>
    <a href="${assetUrl(assets.summary)}" target="_blank" rel="noreferrer">summary</a>
    <a href="${assetUrl(assets.metrics)}" target="_blank" rel="noreferrer">metrics</a>
  `;

  if (entryAssets.template_video) {
    els.templateVideo.src = assetUrl(entryAssets.template_video);
    els.templateVideo.style.display = "block";
    if (state.bgmStarted) {
      els.templateVideo.play().catch(() => {});
    }
  } else {
    els.templateVideo.removeAttribute("src");
    els.templateVideo.style.display = "none";
  }

  const seriesPath = assets.joints2d_series || assets.joints3d_series;
  state.templateAngles = null;
  if (seriesPath) {
    loadTemplateAngles(seriesPath);
  }
}

async function init() {
  try {
    await loadTemplates();
    state.current = pickRandomTemplate();
    renderTemplate(state.current);
  } catch (err) {
    els.exerciseTitle.textContent = "Failed to load templates";
    els.exerciseMeta.textContent = err.message;
  }
}

els.shuffleBtn.addEventListener("click", () => {
  state.current = pickRandomTemplate();
  renderTemplate(state.current);
});

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    return;
  }
  try {
    await initHrCsvLogger();
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
    els.cameraVideo.srcObject = stream;
    els.cameraVideo.onloadedmetadata = () => {
      els.overlay.width = els.cameraVideo.videoWidth;
      els.overlay.height = els.cameraVideo.videoHeight;
      setupVision();
    };
    if (els.cameraVideo.paused) {
      els.cameraVideo.play().catch(() => {});
    }
    startRppg();
    startBgm();
  } catch (err) {
    // Ignore camera errors for now.
  }
}

els.startCamera.addEventListener("click", () => {
  startCamera();
});

function startAutoCycle() {
  stopAutoCycle();
  const seconds = EXERCISE_INTERVAL;
  state.autoTimer = window.setInterval(() => {
    const next = pickRandomTemplate();
    announceNextExercise(next);
    state.current = next;
    renderTemplate(state.current);
  }, seconds * 1000);
}

function stopAutoCycle() {
  if (state.autoTimer) {
    window.clearInterval(state.autoTimer);
    state.autoTimer = null;
  }
}

function startSessionTimer() {
  if (state.sessionTimer) {
    return;
  }
  state.sessionStart = performance.now();
  state.nextCheerAt = CHEER_INTERVAL;
  state.minuteStart = 0;
  state.sessionScores = [];
  state.sessionBpms = [];
  state.sessionEnded = false;
  state.hrCsvRows = ["time_sec,bpm"];
  state.hrCsvWriteQueue = [];
  state.hrCsvWriting = false;
  updateSessionTimer();
  state.sessionTimer = window.setInterval(updateSessionTimer, 1000);
}

function updateSessionTimer() {
  if (!state.sessionStart || !els.sessionTime || !els.sessionFill) {
    return;
  }
  const elapsed = Math.floor((performance.now() - state.sessionStart) / 1000);
  const remaining = Math.max(0, SESSION_SECONDS - elapsed);
  const minutes = String(Math.floor(remaining / 60)).padStart(2, "0");
  const seconds = String(remaining % 60).padStart(2, "0");
  els.sessionTime.textContent = `${minutes}:${seconds}`;
  const progress = Math.min(1, elapsed / SESSION_SECONDS);
  els.sessionFill.style.width = `${progress * 100}%`;
  if (remaining === 0 && !state.sessionEnded) {
    state.sessionEnded = true;
    stopAutoCycle();
    showSessionSummary(elapsed);
    if (state.sessionTimer) {
      window.clearInterval(state.sessionTimer);
      state.sessionTimer = null;
    }
  }

  if (elapsed >= state.nextCheerAt) {
    showCheerMessage();
    state.nextCheerAt += CHEER_INTERVAL;
  }

  if (elapsed >= (state.minuteStart ?? 0) + MINUTE_INTERVAL) {
    announceMinuteScore();
    state.minuteStart = (state.minuteStart ?? 0) + MINUTE_INTERVAL;
  }
}

function showCheerMessage() {
  if (!els.cheerMessage) {
    return;
  }
  const message = CHEER_MESSAGES[Math.floor(Math.random() * CHEER_MESSAGES.length)];
  els.cheerMessage.textContent = message;
  els.cheerMessage.classList.add("pulse");
  window.setTimeout(() => {
    els.cheerMessage.classList.remove("pulse");
  }, 800);
}

function showSessionSummary(elapsedSeconds) {
  if (!els.sessionSummary) {
    return;
  }
  const scores = state.sessionScores.map((item) => item.score);
  const bpms = state.sessionBpms.map((item) => item.bpm);
  const avgScore = scores.length
    ? scores.reduce((sum, v) => sum + v, 0) / scores.length
    : null;
  const bestScore = scores.length ? Math.max(...scores) : null;
  const avgBpm = bpms.length ? bpms.reduce((sum, v) => sum + v, 0) / bpms.length : null;
  const peakBpm = bpms.length ? Math.max(...bpms) : null;
  const minutes = Math.floor(elapsedSeconds / 60);
  const seconds = elapsedSeconds % 60;

  if (els.summaryScore) {
    els.summaryScore.textContent = avgScore === null ? "--" : avgScore.toFixed(1);
  }
  if (els.summaryBest) {
    els.summaryBest.textContent = bestScore === null ? "--" : bestScore.toFixed(0);
  }
  if (els.summaryBpm) {
    els.summaryBpm.textContent = avgBpm === null ? "--" : avgBpm.toFixed(0);
  }
  if (els.summaryPeak) {
    els.summaryPeak.textContent = peakBpm === null ? "--" : peakBpm.toFixed(0);
  }
  if (els.summaryDuration) {
    els.summaryDuration.textContent = `${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}`;
  }
  els.sessionSummary.classList.add("show");

  const summary = {
    started_at: state.sessionStart,
    duration_seconds: elapsedSeconds,
    avg_score: avgScore,
    best_score: bestScore,
    avg_bpm: avgBpm,
    peak_bpm: peakBpm,
    scores: state.sessionScores,
    bpms: state.sessionBpms,
  };
  downloadSessionSummary(summary);
  downloadHrCsv();
  closeHrCsvWriter();
}

function downloadSessionSummary(summary) {
  const blob = new Blob([JSON.stringify(summary, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `session_summary_${stamp}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadHrCsv() {
  if (state.hrCsvWriter) {
    return;
  }
  if (!state.sessionBpms.length) {
    return;
  }
  const rows = ["time_sec,bpm"];
  const base = state.sessionStart ?? 0;
  state.sessionBpms.forEach((item) => {
    const t = base ? (item.time - base) / 1000 : 0;
    rows.push(`${t.toFixed(2)},${item.bpm}`);
  });
  const blob = new Blob([rows.join("\n") + "\n"], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  a.href = url;
  a.download = `session_hr_${stamp}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function initHrCsvLogger() {
  if (state.hrCsvEnabled) {
    return;
  }
  state.hrCsvEnabled = true;
  state.hrCsvRows = ["time_sec,bpm"];
  if (!window.showSaveFilePicker) {
    return;
  }
  try {
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const handle = await window.showSaveFilePicker({
      suggestedName: `session_hr_${stamp}.csv`,
      types: [{ description: "CSV", accept: { "text/csv": [".csv"] } }],
    });
    const writer = await handle.createWritable();
    await writer.write("time_sec,bpm\n");
    state.hrCsvWriter = writer;
  } catch (err) {
    state.hrCsvWriter = null;
  }
}

async function flushHrCsvWrites() {
  if (!state.hrCsvWriter || state.hrCsvWriting) {
    return;
  }
  state.hrCsvWriting = true;
  try {
    while (state.hrCsvWriteQueue.length) {
      const chunk = state.hrCsvWriteQueue.shift();
      await state.hrCsvWriter.write(chunk);
    }
  } catch (err) {
    state.hrCsvWriter = null;
  } finally {
    state.hrCsvWriting = false;
  }
}

function appendHrCsvRow(timeSec, bpm) {
  const row = `${timeSec.toFixed(2)},${bpm}`;
  state.hrCsvRows.push(row);
  if (state.hrCsvWriter) {
    state.hrCsvWriteQueue.push(`${row}\n`);
    flushHrCsvWrites();
  }
}

async function closeHrCsvWriter() {
  if (!state.hrCsvWriter) {
    return;
  }
  try {
    await flushHrCsvWrites();
    await state.hrCsvWriter.close();
  } catch (err) {
    // Ignore close errors.
  } finally {
    state.hrCsvWriter = null;
  }
}

function endSession() {
  if (!state.sessionStart || state.sessionEnded) {
    return;
  }
  const elapsed = Math.floor((performance.now() - state.sessionStart) / 1000);
  state.sessionEnded = true;
  stopAutoCycle();
  if (state.sessionTimer) {
    window.clearInterval(state.sessionTimer);
    state.sessionTimer = null;
  }
  showSessionSummary(elapsed);
}

function startRppg() {
  if (state.rppgRunning) {
    return;
  }
  state.rppgCanvas = document.createElement("canvas");
  state.rppgCanvas.width = 64;
  state.rppgCanvas.height = 64;
  state.rppgCtx = state.rppgCanvas.getContext("2d", { willReadFrequently: true });
  state.rppgWorker = new Worker("rppg-worker.js");
  state.rppgWorker.onmessage = (event) => {
    const bpm = event.data?.bpm;
    if (!els.heartBadge || typeof bpm !== "number") {
      return;
    }
    state.rppgBpm = bpm;
    els.heartBadge.textContent = `❤ ${bpm} bpm`;
    if (state.sessionStart && !state.sessionEnded) {
      const now = performance.now();
      if (now - state.rppgLastStoreTs >= 900) {
        state.sessionBpms.push({ time: now, bpm });
        const t = state.sessionStart ? (now - state.sessionStart) / 1000 : 0;
        appendHrCsvRow(t, bpm);
        state.rppgLastStoreTs = now;
      }
    }
  };
  state.rppgRunning = true;

  const sample = () => {
    if (!state.rppgRunning || !state.rppgCtx || !els.cameraVideo) {
      return;
    }
    if (els.cameraVideo.readyState >= 2) {
      const roi = computeFaceRoi(
        state.latestFaceLandmarks,
        els.cameraVideo.videoWidth,
        els.cameraVideo.videoHeight
      );
      if (roi) {
        state.rppgCtx.drawImage(
          els.cameraVideo,
          roi.x,
          roi.y,
          roi.w,
          roi.h,
          0,
          0,
          64,
          64
        );
        const frame = state.rppgCtx.getImageData(0, 0, 64, 64).data;
        let sumR = 0;
        let sumG = 0;
        let sumB = 0;
        for (let i = 0; i < frame.length; i += 4) {
          sumR += frame[i];
          sumG += frame[i + 1];
          sumB += frame[i + 2];
        }
        const denom = frame.length / 4;
        const now = performance.now();
        state.rppgLastSampleTs = now;
        state.rppgWorker.postMessage({
          type: "sample",
          t: now / 1000,
          r: sumR / denom,
          g: sumG / denom,
          b: sumB / denom,
        });
      } else if (els.heartBadge && performance.now() - state.rppgLastSampleTs > 1500) {
        els.heartBadge.textContent = "❤ -- bpm";
      }
    }
  };

  const estimate = () => {
    if (!state.rppgRunning || !state.rppgWorker) {
      return;
    }
    state.rppgWorker.postMessage({ type: "estimate", t: performance.now() / 1000 });
  };

  sample();
  estimate();
  state.rppgSampleTimer = window.setInterval(sample, 50);
  state.rppgEstimateTimer = window.setInterval(estimate, 1000);
}

function computeFaceRoi(landmarks, width, height) {
  if (!landmarks) {
    return {
      x: width * 0.32,
      y: height * 0.18,
      w: width * 0.36,
      h: height * 0.18,
    };
  }
  const indices = [10, 234, 454, 152];
  const pts = indices
    .map((idx) => landmarks[idx])
    .filter(Boolean)
    .map((lm) => ({
      x: lm.x * width,
      y: lm.y * height,
    }));
  if (!pts.length) {
    return null;
  }
  let minX = Math.min(...pts.map((p) => p.x));
  let maxX = Math.max(...pts.map((p) => p.x));
  let minY = Math.min(...pts.map((p) => p.y));
  let maxY = Math.max(...pts.map((p) => p.y));

  const w = maxX - minX;
  const h = maxY - minY;
  if (w <= 0 || h <= 0) {
    return null;
  }

  // Focus on forehead band to reduce mouth/jaw motion.
  const top = minY + h * 0.05;
  const bottom = minY + h * 0.35;
  minY = top;
  maxY = bottom;

  const marginX = -0.08;
  const marginY = 0.03;
  minX -= w * marginX;
  maxX += w * marginX;
  minY -= h * marginY;
  maxY += h * marginY;

  minX = Math.max(0, minX);
  minY = Math.max(0, minY);
  maxX = Math.min(width, maxX);
  maxY = Math.min(height, maxY);

  const outW = maxX - minX;
  const outH = maxY - minY;
  if (outW <= 0 || outH <= 0) {
    return null;
  }
  const minW = width * 0.2;
  const minH = height * 0.14;
  if (outW < minW || outH < minH) {
    return null;
  }
  return { x: minX, y: minY, w: outW, h: outH };
}

function announceMinuteScore() {
  if (!els.minuteScore || !state.scoreHistory.length) {
    return;
  }
  const now = performance.now();
  const oneMinuteAgo = now - MINUTE_INTERVAL * 1000;
  const samples = state.scoreHistory.filter((item) => item.time >= oneMinuteAgo);
  if (!samples.length) {
    return;
  }
  const avg = samples.reduce((sum, item) => sum + item.score, 0) / samples.length;
  const message = avg >= 80 ? "Excellent!" : avg >= 60 ? "Good!" : "Keep going!";
  els.minuteScore.textContent = `1分スコア: ${avg.toFixed(0)}点 · ${message}`;
  els.minuteScore.classList.add("show");
  window.setTimeout(() => {
    els.minuteScore.classList.remove("show");
  }, 1200);
}

async function loadTemplateAngles(seriesPath) {
  try {
    const response = await fetch(assetUrl(seriesPath));
    if (!response.ok) {
      return;
    }
    const data = await response.json();
    const frames = data.frames || [];
    state.templateFps = data.fps || 30;
    if (!frames.length) {
      return;
    }
    state.templateAngles = frames.map((frame) => computeTemplateAngles(frame));
  } catch (err) {
    state.templateAngles = null;
  }
}

function computeTemplateAngles(frame) {
  const joints = frame || [];
  const get = (idx) => joints[idx] || [0, 0, 0];
  const lElbow = angle2d(get(SMPL_INDEX.leftShoulder), get(SMPL_INDEX.leftElbow), get(SMPL_INDEX.leftWrist));
  const rElbow = angle2d(get(SMPL_INDEX.rightShoulder), get(SMPL_INDEX.rightElbow), get(SMPL_INDEX.rightWrist));
  const lKnee = angle2d(get(SMPL_INDEX.leftHip), get(SMPL_INDEX.leftKnee), get(SMPL_INDEX.leftAnkle));
  const rKnee = angle2d(get(SMPL_INDEX.rightHip), get(SMPL_INDEX.rightKnee), get(SMPL_INDEX.rightAnkle));
  const lHip = angle2d(get(SMPL_INDEX.leftShoulder), get(SMPL_INDEX.leftHip), get(SMPL_INDEX.leftKnee));
  const rHip = angle2d(get(SMPL_INDEX.rightShoulder), get(SMPL_INDEX.rightHip), get(SMPL_INDEX.rightKnee));
  const lShoulder = angle2d(get(SMPL_INDEX.leftElbow), get(SMPL_INDEX.leftShoulder), get(SMPL_INDEX.leftHip));
  const rShoulder = angle2d(get(SMPL_INDEX.rightElbow), get(SMPL_INDEX.rightShoulder), get(SMPL_INDEX.rightHip));
  return [lElbow, rElbow, lKnee, rKnee, lHip, rHip, lShoulder, rShoulder];
}

function angle2d(a, b, c) {
  const abx = a[0] - b[0];
  const aby = a[1] - b[1];
  const cbx = c[0] - b[0];
  const cby = c[1] - b[1];
  const dot = abx * cbx + aby * cby;
  const mag = Math.hypot(abx, aby) * Math.hypot(cbx, cby);
  if (!mag) {
    return 0;
  }
  const cosine = Math.min(1, Math.max(-1, dot / mag));
  return (Math.acos(cosine) * 180) / Math.PI;
}

function drawOverlay(landmarks) {
  if (!els.overlay || !els.cameraVideo) {
    return;
  }
  const ctx = els.overlay.getContext("2d");
  const width = els.overlay.width;
  const height = els.overlay.height;
  ctx.clearRect(0, 0, width, height);

  if (!landmarks || !landmarks.length) {
    return;
  }

  const points = landmarks.map((lm) => ({
    x: lm.x * width,
    y: lm.y * height,
    v: lm.visibility ?? 1,
  }));

  if (state.lastScore !== null) {
    // Intentionally left blank: no grade badge on camera overlay.
  }

  ctx.lineWidth = 2.5;
  MP_CONNECTIONS.forEach(([a, b]) => {
    const pa = points[a];
    const pb = points[b];
    if (!pa || !pb || pa.v < 0.3 || pb.v < 0.3) {
      return;
    }
    const indices = connectionDiffIndex(a, b);
    let diff = null;
    if (state.latestDiffs && indices.length) {
      diff = Math.max(...indices.map((idx) => state.latestDiffs[idx] ?? 0));
    }
    ctx.strokeStyle = diff === null ? "rgba(255, 255, 255, 0.7)" : diffToColor(diff);
    ctx.beginPath();
    ctx.moveTo(pa.x, pa.y);
    ctx.lineTo(pb.x, pb.y);
    ctx.stroke();
  });

  ctx.fillStyle = "rgba(43, 158, 179, 0.9)";
  points.forEach((p) => {
    if (p.v < 0.3) {
      return;
    }
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

}

function computeUserAngles(landmarks) {
  const lm = mirrorLandmarks(landmarks);
  const get = (idx) => [lm[idx].x, lm[idx].y];
  const lElbow = angle2d(get(MP_INDEX.leftShoulder), get(MP_INDEX.leftElbow), get(MP_INDEX.leftWrist));
  const rElbow = angle2d(get(MP_INDEX.rightShoulder), get(MP_INDEX.rightElbow), get(MP_INDEX.rightWrist));
  const lKnee = angle2d(get(MP_INDEX.leftHip), get(MP_INDEX.leftKnee), get(MP_INDEX.leftAnkle));
  const rKnee = angle2d(get(MP_INDEX.rightHip), get(MP_INDEX.rightKnee), get(MP_INDEX.rightAnkle));
  const lHip = angle2d(get(MP_INDEX.leftShoulder), get(MP_INDEX.leftHip), get(MP_INDEX.leftKnee));
  const rHip = angle2d(get(MP_INDEX.rightShoulder), get(MP_INDEX.rightHip), get(MP_INDEX.rightKnee));
  const lShoulder = angle2d(get(MP_INDEX.leftElbow), get(MP_INDEX.leftShoulder), get(MP_INDEX.leftHip));
  const rShoulder = angle2d(get(MP_INDEX.rightElbow), get(MP_INDEX.rightShoulder), get(MP_INDEX.rightHip));
  return [lElbow, rElbow, lKnee, rKnee, lHip, rHip, lShoulder, rShoulder];
}

function updateScore(score, worstIndex) {
  if (!els.scoreFill || !els.scoreValue) {
    return;
  }
  const clamped = Math.max(0, Math.min(100, score));
  els.scoreFill.style.width = `${clamped}%`;
  els.scoreValue.textContent = `${clamped.toFixed(0)}`;
  state.lastScore = clamped;

  if (clamped >= 60) {
    els.judgement.textContent = "Good";
    state.lastGrade = "Good";
  } else {
    els.judgement.textContent = "Fight!";
    state.lastGrade = "Fight!";
  }

  if (els.feedback) {
    els.feedback.textContent = "";
  }
}

function buildBgmPayload() {
  const meta = state.current?.meta || {};
  const score = state.lastScore ?? 0;
  let intensity = meta.intensity;
  if (!intensity) {
    if (score >= 80) {
      intensity = "high";
    } else if (score >= 60) {
      intensity = "mid";
    } else {
      intensity = "low";
    }
  }
  const tags = [];
  if (meta.body_part) {
    tags.push(meta.body_part);
  }
  if (meta.exercise) {
    tags.push(meta.exercise);
  }
  tags.push("workout");
  let prompt = meta.exercise
    ? `Energetic workout music for ${meta.exercise}`
    : "Energetic workout music";

  const genre = els.musicGenre?.value?.trim();
  const parts = [];
  if (genre) {
    parts.push(`genre ${genre}`);
  }
  const nextUserPrompt = parts.join(", ");
  if (nextUserPrompt !== (state.bgmUserPrompt || "")) {
    state.bgmUserPrompt = nextUserPrompt || null;
  }
  if (state.bgmUserPrompt) {
    prompt = `${prompt}. User preference: ${state.bgmUserPrompt}`;
  }

  return {
    heart_rate: state.rppgBpm ?? undefined,
    intensity,
    tags,
    duration: BGM_INTERVAL_SEC,
    prompt,
  };
}

async function requestBgm() {
  if (state.bgmRequestInFlight) {
    return null;
  }
  state.bgmRequestInFlight = true;
  if (els.bgmLoading && !state.bgmStarted) {
    els.bgmLoading.classList.add("show");
  }
  try {
    const payload = buildBgmPayload();
    const response = await fetch(`${apiBase()}/api/generate-bgm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      let detail = "";
      try {
        const data = await response.json();
        detail = data?.detail ? `: ${data.detail}` : "";
      } catch (err) {
        try {
          detail = `: ${await response.text()}`;
        } catch (errText) {
          detail = "";
        }
      }
      console.error(`BGM generate failed (${response.status})${detail}`);
      return null;
    }
    const data = await response.json();
    return data?.url || null;
  } catch (err) {
    return null;
  } finally {
    state.bgmRequestInFlight = false;
    if (els.bgmLoading) {
      els.bgmLoading.classList.remove("show");
    }
  }
}

function startSessionWithBgm() {
  if (state.bgmStarted) {
    return;
  }
  state.bgmStarted = true;
  if (els.sessionSummary) {
    els.sessionSummary.classList.remove("show");
  }
  startSessionTimer();
  startAutoCycle();
  startScoring();
  if (els.templateVideo) {
    els.templateVideo.play().catch(() => {});
  }
}

function crossfade(current, next) {
  if (!next) {
    return;
  }
  next.volume = 0;
  next.play().catch(() => {});
  if (!current) {
    next.volume = 1;
    return;
  }
  const start = performance.now();
  const step = () => {
    const t = (performance.now() - start) / BGM_FADE_MS;
    if (t >= 1) {
      next.volume = 1;
      current.volume = 0;
      current.pause();
      current.currentTime = 0;
      return;
    }
    next.volume = t;
    current.volume = 1 - t;
    requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function loadAudio(audio, url) {
  return new Promise((resolve, reject) => {
    const onCanPlay = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      reject(new Error("audio load failed"));
    };
    const cleanup = () => {
      audio.removeEventListener("canplaythrough", onCanPlay);
      audio.removeEventListener("error", onError);
    };
    audio.addEventListener("canplaythrough", onCanPlay);
    audio.addEventListener("error", onError);
    audio.src = url;
    audio.currentTime = 0;
    audio.load();
  });
}

function scheduleNextBgmRequest(delayMs) {
  if (state.bgmRequestTimer) {
    window.clearTimeout(state.bgmRequestTimer);
  }
  state.bgmRequestTimer = window.setTimeout(() => {
    playNextBgm();
  }, delayMs);
}

function scheduleFade(whenMs, next) {
  if (state.bgmFadeTimer) {
    window.clearTimeout(state.bgmFadeTimer);
  }
  const now = performance.now();
  const delay = Math.max(0, whenMs - now);
  state.bgmFadeTimer = window.setTimeout(() => {
    crossfade(state.bgmCurrent, next);
    const prev = state.bgmCurrent;
    state.bgmCurrent = next;
    state.bgmNext = prev;
    state.bgmCurrentStartMs = performance.now();
    scheduleNextBgmRequest(Math.max(0, (BGM_INTERVAL_SEC - BGM_PREFETCH_SEC) * 1000));
  }, delay);
}

async function playNextBgm() {
  if (!state.bgmRunning) {
    return;
  }
  const url = await requestBgm();
  if (!url) {
    scheduleNextBgmRequest(2000);
    return;
  }
  if (!state.bgmStarted) {
    startSessionWithBgm();
  }
  const resolvedUrl = assetUrl(url);
  if (state.bgmCurrent && !state.bgmCurrent.src) {
    try {
      await loadAudio(state.bgmCurrent, resolvedUrl);
    } catch (err) {
      scheduleNextBgmRequest(2000);
      return;
    }
    state.bgmCurrent.loop = true;
    state.bgmCurrent.volume = 1;
    state.bgmCurrent.play().catch(() => {});
    state.bgmCurrentStartMs = performance.now();
    scheduleNextBgmRequest(Math.max(0, (BGM_INTERVAL_SEC - BGM_PREFETCH_SEC) * 1000));
    return;
  }

  const next = state.bgmNext;
  if (!next) {
    return;
  }
  try {
    await loadAudio(next, resolvedUrl);
  } catch (err) {
    scheduleNextBgmRequest(2000);
    return;
  }
  next.loop = true;

  const fadeAt = state.bgmCurrentStartMs + BGM_INTERVAL_SEC * 1000 - BGM_FADE_MS;
  scheduleFade(fadeAt, next);
}

function startBgm() {
  if (state.bgmRunning) {
    return;
  }
  state.bgmRunning = true;
  state.bgmCurrent = new Audio();
  state.bgmNext = new Audio();
  state.bgmCurrent.loop = true;
  state.bgmNext.loop = true;
  state.bgmCurrent.preload = "auto";
  state.bgmNext.preload = "auto";
  state.bgmCurrent.volume = 0;
  state.bgmNext.volume = 0;
  playNextBgm();
}

function diffToColor(diff) {
  if (diff <= GOOD_DIFF) {
    return "rgba(46, 204, 113, 0.95)";
  }
  if (diff <= OK_DIFF) {
    return "rgba(241, 196, 15, 0.95)";
  }
  return "rgba(231, 76, 60, 0.95)";
}

function connectionDiffIndex(a, b) {
  const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
  const map = {
    "11-12": [6, 7],
    "11-13": [0],
    "13-15": [0],
    "12-14": [1],
    "14-16": [1],
    "11-23": [4],
    "12-24": [5],
    "23-24": [4, 5],
    "23-25": [2],
    "25-27": [2],
    "24-26": [3],
    "26-28": [3],
  };
  return map[key] || [];
}

function startScoring() {
  if (state.scoringTimer) {
    window.clearInterval(state.scoringTimer);
  }
  state.scoringTimer = window.setInterval(() => {
    if (!state.latestLandmarks || !state.templateAngles || !state.templateAngles.length) {
      return;
    }
    const t = els.templateVideo?.currentTime || 0;
    const frameIndex = Math.floor(t * state.templateFps) % state.templateAngles.length;
    const template = state.templateAngles[frameIndex];
    if (!template) {
      return;
    }
    const user = computeUserAngles(state.latestLandmarks);
    let total = 0;
    let weightSum = 0;
    let maxDiff = -1;
    let worstIndex = 0;
    const diffs = [];
    for (let i = 0; i < template.length; i += 1) {
      const diff = Math.abs(template[i] - user[i]);
      diffs[i] = diff;
      const weight = ANGLE_WEIGHTS[i] ?? 1;
      total += diff * weight;
      weightSum += weight;
      if (diff > maxDiff) {
        maxDiff = diff;
        worstIndex = i;
      }
    }
    const mean = total / Math.max(1, weightSum);
    const score = 100 - (mean / ANGLE_MAX_DIFF) * 100;
    const now = performance.now();
    state.scoreHistory.push({ time: now, score });
    const cutoff = now - SCORE_WINDOW_MS;
    state.scoreHistory = state.scoreHistory.filter((item) => item.time >= cutoff);
    const smoothed =
      state.scoreHistory.reduce((sum, item) => sum + item.score, 0) /
      Math.max(1, state.scoreHistory.length);
    state.latestDiffs = diffs;
    updateScore(smoothed, worstIndex);
    if (state.sessionStart && !state.sessionEnded) {
      state.sessionScores.push({ time: now, score: smoothed });
    }
  }, 100);
}

function setupVision() {
  if (state.visionRunning || !window.Pose) {
    return;
  }
  const pose = new window.Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5/${file}`,
  });
  pose.setOptions({
    modelComplexity: 1,
    smoothLandmarks: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
  });
  pose.onResults((results) => {
    const landmarks = results.poseLandmarks || null;
    state.latestLandmarks = landmarks;
    drawOverlay(landmarks);
  });
  state.pose = pose;

  if (window.FaceMesh) {
    const faceMesh = new window.FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh@0.5/${file}`,
    });
    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: false,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });
    faceMesh.onResults((results) => {
      state.latestFaceLandmarks = results.multiFaceLandmarks?.[0] || null;
    });
    state.faceMesh = faceMesh;
  } else {
    state.faceMesh = null;
    state.latestFaceLandmarks = null;
  }

  state.visionRunning = true;
  const loop = async () => {
    if (!state.visionRunning || !state.pose || !els.cameraVideo) {
      return;
    }
    let didSetBusy = false;
    try {
      if (state.visionBusy) {
        return;
      }
      if (els.cameraVideo.readyState >= 2) {
        state.visionBusy = true;
        didSetBusy = true;
        await state.pose.send({ image: els.cameraVideo });
        if (state.faceMesh) {
          await state.faceMesh.send({ image: els.cameraVideo });
        }
      }
    } catch (err) {
      // Keep the loop alive even if MediaPipe throws on a frame.
    } finally {
      if (didSetBusy) {
        state.visionBusy = false;
      }
      requestAnimationFrame(loop);
    }
  };
  requestAnimationFrame(loop);
}

function announceNextExercise(nextTemplate) {
  const alert = els.exerciseAlert;
  if (!alert) {
    return;
  }
  const meta = nextTemplate?.meta || {};
  const name = meta.exercise || nextTemplate?.clip_id || "次の種目";
  alert.textContent = `次の種目へ！ ${name}`;
  alert.classList.add("show");
  window.setTimeout(() => {
    alert.classList.remove("show");
  }, 1800);
}

els.autoToggle.addEventListener("click", () => {
  if (state.autoTimer) {
    stopAutoCycle();
    els.autoToggle.textContent = "Auto: Off";
    els.autoToggle.classList.remove("primary");
    els.autoToggle.classList.add("ghost");
  } else {
    startAutoCycle();
    els.autoToggle.textContent = "Auto: On";
    els.autoToggle.classList.remove("ghost");
    els.autoToggle.classList.add("primary");
  }
});

els.duration.addEventListener("change", () => {
  if (state.autoTimer) {
    startAutoCycle();
  }
});

els.endSession.addEventListener("click", () => {
  endSession();
});

init();
