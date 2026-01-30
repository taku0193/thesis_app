const MAX_WINDOW_SEC = 12;
const MIN_WINDOW_SEC = 6;
const MIN_BPM = 50;
const MAX_BPM = 200;
const SMOOTH_ALPHA = 0.25;
const QUALITY_THRESHOLD = 0.12;
const MAX_BPM_JUMP = 12;
const BPM_HISTORY = 5;
const MIN_HZ = 0.9;
const MAX_HZ = 3.0;

let samples = [];
let lastBpm = null;
let bpmHistory = [];

function mean(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function std(values, avg) {
  if (values.length < 2) {
    return 0;
  }
  const mu = avg ?? mean(values);
  const v =
    values.reduce((sum, x) => {
      const d = x - mu;
      return sum + d * d;
    }, 0) / values.length;
  return Math.sqrt(v);
}

function hannWindow(n) {
  const w = new Array(n);
  if (n <= 1) {
    return w.fill(1);
  }
  for (let i = 0; i < n; i += 1) {
    w[i] = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
  }
  return w;
}

function estimateBpmPOS(now) {
  if (samples.length < 2) {
    return null;
  }
  const cutoff = now - MAX_WINDOW_SEC;
  const windowed = samples.filter((s) => s.t >= cutoff);
  if (windowed.length < 2) {
    return null;
  }
  const duration = windowed[windowed.length - 1].t - windowed[0].t;
  if (duration < MIN_WINDOW_SEC) {
    return null;
  }

  const fs = (windowed.length - 1) / duration;
  if (!Number.isFinite(fs) || fs <= 0) {
    return null;
  }

  const rs = windowed.map((s) => s.r);
  const gs = windowed.map((s) => s.g);
  const bs = windowed.map((s) => s.b);
  const rMean = mean(rs);
  const gMean = mean(gs);
  const bMean = mean(bs);
  if (!rMean || !gMean || !bMean) {
    return null;
  }

  const rn = rs.map((v) => v / rMean);
  const gn = gs.map((v) => v / gMean);
  const bn = bs.map((v) => v / bMean);

  const x = rn.map((v, i) => 3 * v - 2 * gn[i]);
  const y = rn.map((v, i) => 1.5 * v + gn[i] - 1.5 * bn[i]);
  const sx = std(x);
  const sy = std(y);
  if (!sx || !sy) {
    return null;
  }
  const alpha = sx / sy;
  const s = x.map((v, i) => v + alpha * y[i]);
  const sMean = mean(s);
  const signal = s.map((v) => v - sMean);

  const n = signal.length;
  const w = hannWindow(n);
  const windowedSignal = signal.map((v, i) => v * w[i]);

  const minBin = Math.floor((MIN_HZ * n) / fs);
  const maxBin = Math.ceil((MAX_HZ * n) / fs);
  if (maxBin <= minBin || maxBin >= n) {
    return null;
  }

  let bestBin = null;
  let bestPower = -Infinity;
  let powerSum = 0;
  let powerCount = 0;
  const powerByBin = {};

  for (let k = minBin; k <= maxBin; k += 1) {
    let re = 0;
    let im = 0;
    for (let i = 0; i < n; i += 1) {
      const angle = (2 * Math.PI * k * i) / n;
      re += windowedSignal[i] * Math.cos(angle);
      im -= windowedSignal[i] * Math.sin(angle);
    }
    const power = re * re + im * im;
    powerByBin[k] = power;
    powerSum += power;
    powerCount += 1;
    if (power > bestPower) {
      bestPower = power;
      bestBin = k;
    }
  }

  if (!bestBin || powerCount === 0) {
    return null;
  }

  const meanPower = powerSum / powerCount;
  const confidence = meanPower ? bestPower / meanPower : 0;
  if (confidence < QUALITY_THRESHOLD) {
    return null;
  }

  let chosenBin = bestBin;
  const bestHz = (bestBin * fs) / n;
  const doubledBin = bestBin * 2;
  if (doubledBin <= maxBin) {
    const doubledPower = powerByBin[doubledBin] ?? 0;
    const bestBpm = bestHz * 60;
    const shouldPreferDouble =
      bestHz < 1.2 || (bestBpm < 80 && doubledPower >= bestPower * 0.45);
    if (shouldPreferDouble && doubledPower >= bestPower * 0.35) {
      chosenBin = doubledBin;
    }
  }

  const hz = (chosenBin * fs) / n;
  const bpm = hz * 60;
  if (!Number.isFinite(bpm) || bpm < MIN_BPM || bpm > MAX_BPM) {
    return null;
  }

  return { bpm, confidence };
}

self.onmessage = (event) => {
  const data = event.data || {};
  if (data.type === "sample") {
    const { t, r, g, b } = data;
    if (
      typeof t !== "number" ||
      typeof r !== "number" ||
      typeof g !== "number" ||
      typeof b !== "number"
    ) {
      return;
    }
    samples.push({ t, r, g, b });
    const cutoff = t - MAX_WINDOW_SEC * 1.2;
    while (samples.length && samples[0].t < cutoff) {
      samples.shift();
    }
    return;
  }

  if (data.type === "estimate") {
    const now = typeof data.t === "number" ? data.t : samples[samples.length - 1]?.t;
    if (!now) {
      return;
    }
    const result = estimateBpmPOS(now);
    if (!result) {
      return;
    }
    let clamped = result.bpm;
    if (lastBpm !== null) {
      const diff = result.bpm - lastBpm;
      if (Math.abs(diff) > MAX_BPM_JUMP) {
        clamped = lastBpm + Math.sign(diff) * MAX_BPM_JUMP;
      }
    }
    const next = lastBpm === null ? clamped : lastBpm + SMOOTH_ALPHA * (clamped - lastBpm);
    lastBpm = next;
    bpmHistory.push(next);
    if (bpmHistory.length > BPM_HISTORY) {
      bpmHistory.shift();
    }
    const sorted = [...bpmHistory].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    self.postMessage({ bpm: Math.round(median), confidence: result.confidence });
  }
};
