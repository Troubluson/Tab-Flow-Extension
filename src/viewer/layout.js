let currentZoom = 1; // default = "normal"

const LEFT_PAD = 150;
const LANE_HEIGHT = 100;
const PAUSE_THRESHOLD = 10 * 60 * 1000; // 10 minutes

const ZOOM_LEVELS = [
  {
    id: "overview",
    minSpacing: 20,
    maxSpacing: 120,
    logFactor: 4,
  },
  {
    id: "normal",
    minSpacing: 40,
    maxSpacing: 220,
    logFactor: 8,
  },
  {
    id: "detail",
    minSpacing: 80,
    maxSpacing: 360,
    logFactor: 14,
  },
];

export function spacing(deltaMs) {
  const z = ZOOM_LEVELS[currentZoom];
  return Math.min(
    z.maxSpacing,
    z.minSpacing + Math.log1p(deltaMs) * z.logFactor,
  );
}

export function computePositions(pages) {
  const xByPage = new Map();

  const firstTime = pages[0].timestamp;

  for (const e of pages) {
    let baseX;

    // 1️ Root nodes start at LEFT_PAD
    if (!e.sourcePageId || !xByPage.has(e.sourcePageId)) {
      baseX = LEFT_PAD;
    } else {
      // 2️ Branches start from parent X
      baseX = xByPage.get(e.sourcePageId).x;
    }

    // 3 Time-based offset (relative, not cumulative)
    const dt = e.timestamp - firstTime;

    const offset =
      dt > PAUSE_THRESHOLD ? ZOOM_LEVELS[currentZoom].maxSpacing : spacing(dt);

    const x = baseX + offset;

    xByPage.set(e.pageId, {
      x,
      dt,
      paused: dt > PAUSE_THRESHOLD,
    });
  }

  return xByPage;
}

export function normalizeLanes(laneByPage) {
  const lanes = [...laneByPage.values()];
  const minLane = Math.min(...lanes);

  if (minLane < 0) {
    for (const [k, v] of laneByPage.entries()) {
      laneByPage.set(k, v - minLane);
    }
  }

  return laneByPage;
}

export function computeLanes(pages) {
  const laneByPage = new Map();
  const childrenCount = new Map();

  let nextFreeLane = 0;

  for (const e of pages) {
    let lane;

    if (e.sourcePageId && laneByPage.has(e.sourcePageId)) {
      const parentLane = laneByPage.get(e.sourcePageId);
      const count = childrenCount.get(e.sourcePageId) || 0;

      if (count === 0) {
        // First child stays in parent's lane
        lane = parentLane;
      } else {
        // Real branching starts here
        const offset =
          count % 2 === 1 ? Math.ceil(count / 2) : -Math.ceil(count / 2);

        lane = parentLane + offset;
      }

      childrenCount.set(e.sourcePageId, count + 1);
    } else {
      // Root page
      lane = nextFreeLane;
      nextFreeLane += 2; // reserve space for possible branches
    }

    laneByPage.set(e.pageId, lane);
  }

  return normalizeLanes(laneByPage);
}

export function laneToY(lane) {
  return 100 + lane * LANE_HEIGHT;
}
