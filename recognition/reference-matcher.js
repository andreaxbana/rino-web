/* RINO's local, geometric handwriting matcher. This is a conservative
 * reference-stroke comparison, not a trained handwriting/OCR model. */
(function (root) {
  'use strict';
  const POINTS = 20;
  const preparedCache = new WeakMap();
  const junctionCache = new WeakMap();
  const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const length = points => points.slice(1).reduce((sum, point, i) => sum + distance(points[i], point), 0);

  function cleanStroke(points) {
    if (!Array.isArray(points) || points.length < 2 || points.length > 20000) return null;
    const clean = [];
    for (const point of points) {
      if (!Array.isArray(point) || point.length < 2 || !Number.isFinite(point[0]) || !Number.isFinite(point[1])) return null;
      if (!clean.length || distance(clean[clean.length - 1], point) > 1e-8) clean.push([point[0], point[1]]);
    }
    return clean.length > 1 ? clean : null;
  }

  function resample(points, count = POINTS) {
    const total = length(points);
    const result = [points[0]];
    let segment = 1, consumed = 0;
    for (let i = 1; i < count - 1; i++) {
      const target = total * i / (count - 1);
      while (segment < points.length - 1 && consumed + distance(points[segment - 1], points[segment]) < target) {
        consumed += distance(points[segment - 1], points[segment]);
        segment++;
      }
      const from = points[segment - 1], to = points[segment];
      const ratio = Math.max(0, Math.min(1, (target - consumed) / distance(from, to)));
      result.push([from[0] + (to[0] - from[0]) * ratio, from[1] + (to[1] - from[1]) * ratio]);
    }
    result.push(points[points.length - 1]);
    return result;
  }

  function normalize(strokes) {
    if (!Array.isArray(strokes) || !strokes.length || strokes.length > 40) return null;
    const clean = strokes.map(cleanStroke);
    if (clean.some(stroke => !stroke)) return null;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const stroke of clean) for (const [x, y] of stroke) {
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    }
    const width = maxX - minX, height = maxY - minY, scale = Math.max(width, height);
    if (!Number.isFinite(scale) || scale < 1e-7) return null;
    const centerX = (minX + maxX) / 2, centerY = (minY + maxY) / 2;
    const normalized = clean.map(stroke => {
      const points = stroke.map(([x, y]) => [(x - centerX) / scale, (y - centerY) / scale]);
      const strokeLength = length(points);
      const sampled = resample(points);
      return {
        points: sampled,
        length: strokeLength,
        center: sampled.reduce((sum, point) => [sum[0] + point[0] / POINTS, sum[1] + point[1] / POINTS], [0, 0])
      };
    });
    // A tap or accidental speck must not be used to manufacture a stroke count.
    if (normalized.some(stroke => stroke.length < 0.008)) return null;
    return { strokes: normalized, width: width / scale, height: height / scale, ink: normalized.reduce((sum, stroke) => sum + stroke.length, 0) };
  }

  function strokeCosts(a, b, elastic = false) {
    if(elastic) {
      const dx=(a.center[0]-b.center[0])*0.5,dy=(a.center[1]-b.center[1])*0.5;
      a={...a,points:a.points.map(([x,y])=>[x-dx,y-dy]),center:[a.center[0]-dx,a.center[1]-dy]};
    }
    let forward = 0, reverse = 0;
    for (let i = 0; i < POINTS; i++) {
      forward += distance(a.points[i], b.points[i]) / POINTS;
      reverse += distance(a.points[i], b.points[POINTS - 1 - i]) / POINTS;
    }
    const endpointForward = (distance(a.points[0], b.points[0]) + distance(a.points[POINTS - 1], b.points[POINTS - 1])) / 2;
    const endpointReverse = (distance(a.points[0], b.points[POINTS - 1]) + distance(a.points[POINTS - 1], b.points[0])) / 2;
    const shared = 0.12 * distance(a.center, b.center) + 0.08 * Math.abs(a.length - b.length);
    forward = 0.55 * forward + 0.25 * endpointForward + shared;
    reverse = 0.55 * reverse + 0.25 * endpointReverse + shared;
    return { cost: Math.min(forward, reverse), forward, reverse };
  }

  // Minimum-cost one-to-one stroke assignment permits identity recognition
  // independently of writing order. Hungarian algorithm, O(strokeCount^3).
  function assign(costs) {
    const n = costs.length;
    const u = new Array(n + 1).fill(0), v = new Array(n + 1).fill(0);
    const p = new Array(n + 1).fill(0), way = new Array(n + 1).fill(0);
    for (let i = 1; i <= n; i++) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array(n + 1).fill(Infinity), used = new Array(n + 1).fill(false);
      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = Infinity, j1 = 0;
        for (let j = 1; j <= n; j++) if (!used[j]) {
          const current = costs[i0 - 1][j - 1] - u[i0] - v[j];
          if (current < minv[j]) { minv[j] = current; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= n; j++) {
          if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
          else minv[j] -= delta;
        }
        j0 = j1;
      } while (p[j0] !== 0);
      do {
        const j1 = way[j0]; p[j0] = p[j1]; j0 = j1;
      } while (j0 !== 0);
    }
    const result = new Array(n);
    for (let j = 1; j <= n; j++) result[p[j] - 1] = j - 1;
    return result;
  }

  function compare(input, template, elastic = false) {
    const a = input.strokes, b = template.strokes;
    const n = Math.max(a.length, b.length);
    const details = a.map(stroke => b.map(reference => strokeCosts(stroke, reference, elastic)));
    const costs = Array.from({ length: n }, (_, i) => Array.from({ length: n }, (_, j) =>
      i < a.length && j < b.length ? details[i][j].cost : 0.48));
    const assignment = assign(costs);
    const selected = assignment.map((j, i) => costs[i][j]);
    const average = selected.reduce((sum, value) => sum + value, 0) / n;
    const worst = Math.max(...selected);
    const aspect = Math.abs(input.width - template.width) + Math.abs(input.height - template.height);
    const inkDifference = Math.abs(input.ink - template.ink) / Math.max(input.ink, template.ink);
    let cost = average * 0.70 + worst * 0.30 + aspect * 0.035 + inkDifference * 0.04;
    // Elastic placement may not erase a clear tall-versus-wide distinction.
    // Do not reward small aspect changes within the same orientation: that
    // would confuse a compressed character with its narrower neighbor.
    const inputOrientation=input.width-input.height,referenceOrientation=template.width-template.height;
    const orientationStrength=value=>Math.max(0,Math.min(1,(Math.abs(value)-0.10)/0.15));
    if(elastic && inputOrientation*referenceOrientation<0) cost+=0.05*orientationStrength(inputOrientation)*orientationStrength(referenceOrientation);
    if (a.length === b.length && cost < 0.22) cost += junctionContradiction(input, template, assignment);
    return { cost, average, worst, inkDifference, assignment, details, countMatches: a.length === b.length };
  }

  function straight(stroke) {
    return distance(stroke.points[0], stroke.points[POINTS - 1]) / stroke.length > 0.88;
  }

  function junctions(shape) {
    if (junctionCache.has(shape)) return junctionCache.get(shape);
    const table = new Map();
    for (let i = 0; i < shape.strokes.length; i++) for (let j = i + 1; j < shape.strokes.length; j++) {
      const a = shape.strokes[i], b = shape.strokes[j];
      if (!straight(a) || !straight(b)) continue;
      const av = [a.points[POINTS - 1][0] - a.points[0][0], a.points[POINTS - 1][1] - a.points[0][1]];
      const bv = [b.points[POINTS - 1][0] - b.points[0][0], b.points[POINTS - 1][1] - b.points[0][1]];
      if (Math.abs(av[0] * bv[0] + av[1] * bv[1]) / (Math.hypot(...av) * Math.hypot(...bv)) > 0.45) continue;
      let gap = Infinity, positions;
      for (let p = 0; p < POINTS; p++) for (let q = 0; q < POINTS; q++) {
        const current = distance(a.points[p], b.points[q]);
        if (current < gap) { gap = current; positions = [p / (POINTS - 1), q / (POINTS - 1)]; }
      }
      if (gap < 0.085) table.set(`${i}:${j}`, positions);
    }
    junctionCache.set(shape, table);
    return table;
  }

  function junctionContradiction(input, template, assignment) {
    const written = junctions(input), reference = junctions(template);
    let contradictions = 0;
    for (const [key, positions] of written) {
      const [i, j] = key.split(':').map(Number), a = assignment[i], b = assignment[j];
      let expected = reference.get(`${Math.min(a, b)}:${Math.max(a, b)}`);
      if (!expected) continue;
      if (a > b) expected = [...expected].reverse();
      for (let k = 0; k < 2; k++) {
        const actualEdge = Math.min(positions[k], 1 - positions[k]);
        const expectedEdge = Math.min(expected[k], 1 - expected[k]);
        // A line ending at another line is different from passing through it.
        // This preserves the upper stem of 土 versus 工 and interior stems in
        // 甲/申/由/中, even when absolute placement is imperfect.
        if ((actualEdge < 0.11 && expectedEdge > 0.28) || (expectedEdge < 0.11 && actualEdge > 0.28)) contradictions++;
      }
    }
    return Math.min(2, contradictions) * 0.06;
  }

  function strokeInkAgrees(input, template, comparison) {
    return input.strokes.every((stroke, i) => {
      const reference = template.strokes[comparison.assignment[i]];
      if (!reference) return false;
      const larger = Math.max(stroke.length, reference.length);
      // Small dots can vary more than longer strokes, but even a dot needs
      // enough ink: a stray speck cannot supply a defining stroke.
      return Math.min(stroke.length, reference.length) / larger >= (larger <= 0.15 ? 0.20 : 0.30);
    });
  }

  // Real writing has uneven spacing, rounded turns, and strokes that overshoot
  // their joins. A larger absolute distance is only acceptable when the stroke
  // shapes and their structural relationships still agree. These checks are
  // independent of the requested answer and do not relax the ambiguity margin.
  function structureAgrees(input, template, comparison) {
    if (!strokeInkAgrees(input, template, comparison)) return false;
    const pairs = input.strokes.map((stroke, i) => {
      const reference = template.strokes[comparison.assignment[i]];
      const reversed = comparison.details[i][comparison.assignment[i]].reverse < comparison.details[i][comparison.assignment[i]].forward;
      const points = reversed ? [...stroke.points].reverse() : stroke.points;
      let localShape = 0;
      for (let p = 0; p < POINTS; p++) {
        localShape += distance(
          [(points[p][0] - stroke.center[0]) / stroke.length, (points[p][1] - stroke.center[1]) / stroke.length],
          [(reference.points[p][0] - reference.center[0]) / reference.length, (reference.points[p][1] - reference.center[1]) / reference.length]
        ) / POINTS;
      }
      const vector = [points[POINTS - 1][0] - points[0][0], points[POINTS - 1][1] - points[0][1]];
      const referenceVector = [reference.points[POINTS - 1][0] - reference.points[0][0], reference.points[POINTS - 1][1] - reference.points[0][1]];
      const straight = Math.hypot(...vector) / stroke.length > 0.88 && Math.hypot(...referenceVector) / reference.length > 0.88;
      return { stroke, reference, localShape, vector, referenceVector, straight };
    });
    if (pairs.some(pair => pair.localShape > 0.20) || pairs.reduce((sum, pair) => sum + pair.localShape, 0) / pairs.length > 0.12) return false;
    const near = (a, b) => {
      let closest = Infinity;
      for (const point of a.points) for (const other of b.points) closest = Math.min(closest, distance(point, other));
      return closest;
    };
    for (let i = 0; i < pairs.length; i++) for (let j = i + 1; j < pairs.length; j++) {
      const a = pairs[i], b = pairs[j];
      const writtenGap = near(a.stroke, b.stroke), referenceGap = near(a.reference, b.reference);
      // Distinguish a genuine connection from a clearly separated component,
      // allowing small freehand gaps and reference sampling error at junctions.
      if ((referenceGap < 0.045 && writtenGap > 0.16) || (referenceGap > 0.20 && writtenGap < 0.035)) return false;
      if (!a.straight || !b.straight) continue;
      for (const axis of [0, 1]) {
        const referenceOffset = a.reference.center[axis] - b.reference.center[axis];
        const writtenOffset = a.stroke.center[axis] - b.stroke.center[axis];
        if (Math.abs(referenceOffset) > 0.17 && Math.sign(referenceOffset) * writtenOffset < -0.04) return false;
      }
      const parallel = Math.abs(a.referenceVector[0] * b.referenceVector[0] + a.referenceVector[1] * b.referenceVector[1]) /
        (Math.hypot(...a.referenceVector) * Math.hypot(...b.referenceVector));
      if (parallel > 0.94) {
        const referenceRatio = (a.reference.length - b.reference.length) / Math.max(a.reference.length, b.reference.length);
        const writtenRatio = (a.stroke.length - b.stroke.length) / Math.max(a.stroke.length, b.stroke.length);
        // Relative bar lengths carry identity in 土/士 and 未/末. Spacing
        // tolerance must never turn their defining length order around.
        if (Math.abs(referenceRatio) > 0.20 && Math.sign(referenceRatio) * writtenRatio < 0.05) return false;
      }
    }
    return true;
  }

  function elasticStructureAgrees(input, template, comparison) {
    if (!strokeInkAgrees(input, template, comparison)) return false;
    const pairs = input.strokes.map((stroke, i) => {
      const reference = template.strokes[comparison.assignment[i]];
      const reversed = comparison.details[i][comparison.assignment[i]].reverse < comparison.details[i][comparison.assignment[i]].forward;
      const points = reversed ? [...stroke.points].reverse() : stroke.points;
      let localShape = 0;
      for (let p = 0; p < POINTS; p++) {
        localShape += distance(
          [(points[p][0] - stroke.center[0]) / stroke.length, (points[p][1] - stroke.center[1]) / stroke.length],
          [(reference.points[p][0] - reference.center[0]) / reference.length, (reference.points[p][1] - reference.center[1]) / reference.length]
        ) / POINTS;
      }
      const vector = [points[POINTS - 1][0] - points[0][0], points[POINTS - 1][1] - points[0][1]];
      const referenceVector = [reference.points[POINTS - 1][0] - reference.points[0][0], reference.points[POINTS - 1][1] - reference.points[0][1]];
      const straight = Math.hypot(...vector) / stroke.length > 0.88 && Math.hypot(...referenceVector) / reference.length > 0.88;
      return { stroke, reference, localShape, vector, referenceVector, straight, points };
    });
    // A small dot may be shorter than the reference, but a much shorter mark
    // must still occupy that dot's location. Elastic placement must not move
    // an incidental speck into a missing defining stroke.
    if (pairs.some(({ stroke, reference }) => reference.length <= 0.15 &&
      stroke.length < reference.length * 0.5 && distance(stroke.center, reference.center) > reference.length)) return false;
    // A visible terminal hook cannot be explained away as placement drift.
    // Compare it after direction alignment, so reversing the pen is immaterial.
    const terminal = points => {
      const a=[points[19][0]-points[17][0],points[19][1]-points[17][1]];
      const b=[points[16][0]-points[13][0],points[16][1]-points[13][1]];
      return {length:Math.hypot(...a),cos:(a[0]*b[0]+a[1]*b[1])/(Math.hypot(...a)*Math.hypot(...b))};
    };
    if(pairs.some(pair=>{
      if(Math.min(pair.stroke.length,pair.reference.length)<0.55)return false;
      const a=terminal(pair.points),b=terminal(pair.reference.points);
      return a.cos<0.45 && a.length>0.06 && b.cos>0.92;
    }))return false;
    if (pairs.some(pair => pair.localShape > 0.20 && !(Math.min(pair.stroke.length,pair.reference.length) <= 0.16 && Math.max(pair.stroke.length,pair.reference.length) <= 0.27)) || pairs.reduce((sum, pair) => sum + pair.localShape, 0) / pairs.length > 0.12) return false;
    const near = (a, b) => {
      let closest = Infinity;
      for (const point of a.points) for (const other of b.points) closest = Math.min(closest, distance(point, other));
      return closest;
    };
    for (let i = 0; i < pairs.length; i++) for (let j = i + 1; j < pairs.length; j++) {
      const a = pairs[i], b = pairs[j];
      const writtenGap = near(a.stroke, b.stroke), referenceGap = near(a.reference, b.reference);
      // Distinguish a genuine connection from a clearly separated component,
      // allowing small freehand gaps and reference sampling error at junctions.
      if (referenceGap > 0.20 && writtenGap < 0.035) return false;
      if (referenceGap < 0.045 && writtenGap > 0.16) {
        // An incomplete join can still have an unambiguous direction: the
        // short endpoint must point directly at the intended adjoining line.
        const directed = (stroke, other) => {
          if (!straight(stroke)) return false;
          return [0, POINTS-1].some(end => {
            const p=stroke.points[end], inner=stroke.points[end===0?3:POINTS-4];
            const vx=p[0]-inner[0],vy=p[1]-inner[1],norm=Math.hypot(vx,vy);
            return other.points.some(q=>{
              const dx=q[0]-p[0],dy=q[1]-p[1],gap=Math.hypot(dx,dy);
              return gap<=0.23 && (vx*dx+vy*dy)/(norm*gap)>0.93;
            });
          });
        };
        if (!directed(a.stroke,b.stroke) && !directed(b.stroke,a.stroke)) return false;
      }
      if (!straight(a.reference) || !straight(b.reference)) continue;
      for (const axis of [0, 1]) {
        const referenceOffset = a.reference.center[axis] - b.reference.center[axis];
        const writtenOffset = a.stroke.center[axis] - b.stroke.center[axis];
        const bounds=stroke=>[Math.min(...stroke.points.map(p=>p[axis])),Math.max(...stroke.points.map(p=>p[axis]))];
        const ar=bounds(a.reference),br=bounds(b.reference),aw=bounds(a.stroke),bw=bounds(b.stroke);
        if ((ar[1]+0.04<br[0] && aw[0]>bw[1]+0.04) || (br[1]+0.04<ar[0] && bw[0]>aw[1]+0.04)) return false;
      }
      const parallel = Math.abs(a.referenceVector[0] * b.referenceVector[0] + a.referenceVector[1] * b.referenceVector[1]) /
        (Math.hypot(...a.referenceVector) * Math.hypot(...b.referenceVector));
      if (parallel > 0.94 && Math.abs(a.referenceVector[0]) > Math.abs(a.referenceVector[1])*3 &&
        Math.abs(a.reference.center[0]-b.reference.center[0])<0.12 && pairs.some(p=>p!==a && p!==b && straight(p.reference) &&
          Math.abs(p.referenceVector[1])>Math.abs(p.referenceVector[0])*3 && near(p.reference,a.reference)<0.045 && near(p.reference,b.reference)<0.045)) {
        const referenceRatio = (a.reference.length - b.reference.length) / Math.max(a.reference.length, b.reference.length);
        const writtenRatio = (a.stroke.length - b.stroke.length) / Math.max(a.stroke.length, b.stroke.length);
        // Relative bar lengths carry identity in 土/士 and 未/末. Spacing
        // tolerance must never turn their defining length order around.
        if (Math.abs(referenceRatio) > 0.20 && Math.sign(referenceRatio) * writtenRatio < 0.05) return false;
      }
    }
    return true;
  }

  function prepare(raw) {
    if (!root.document?.createElementNS) throw new Error('Stroke preparation requires a browser SVG implementation.');
    const templates = {};
    const path = root.document.createElementNS('http://www.w3.org/2000/svg', 'path');
    for (const [character, entry] of Object.entries(raw || {})) {
      if (!Array.isArray(entry?.paths) || !entry.paths.length) continue;
      try {
        const strokes = entry.paths.map(d => {
          path.setAttribute('d', d);
          const total = path.getTotalLength();
          if (!Number.isFinite(total) || total <= 0) throw new Error('Empty stroke');
          // Dense sampling before normalization preserves the reference bounds.
          return Array.from({ length: 41 }, (_, i) => {
            const point = path.getPointAtLength(total * i / 40);
            return [point.x, point.y];
          });
        });
        if (normalize(strokes)) templates[character] = { strokes };
      } catch (_) { /* Skip corrupt templates instead of accepting incomplete ones. */ }
    }
    return templates;
  }

  function indexed(templates) {
    if (!templates || typeof templates !== 'object') return [];
    if (!preparedCache.has(templates)) {
      preparedCache.set(templates, Object.entries(templates).map(([character, entry]) => {
        const normalized = normalize(entry?.strokes);
        return normalized ? { character, normalized } : null;
      }).filter(Boolean));
    }
    return preparedCache.get(templates);
  }

  // A pen lift can divide one visible stroke into two pointer sequences. Only
  // consider joining consecutive sequences whose endpoints nearly touch. The
  // reconstructed ink must still pass a stricter complete-character comparison
  // against every reference; the requested answer never influences the join.
  function continuousVariants(strokes, input) {
    const variants = [];
    for (let i = 0; i < input.strokes.length - 1; i++) {
      const first = input.strokes[i].points, next = input.strokes[i + 1].points;
      if (distance(first[POINTS - 1], next[0]) > 0.04) continue;
      const joined = strokes.slice(0, i).concat([strokes[i].concat(strokes[i + 1])], strokes.slice(i + 2));
      const normalized = normalize(joined);
      if (normalized) {
        const incoming = [first[POINTS - 1][0] - first[POINTS - 4][0], first[POINTS - 1][1] - first[POINTS - 4][1]];
        const outgoing = [next[3][0] - next[0][0], next[3][1] - next[0][1]];
        normalized.continuation = (incoming[0] * outgoing[0] + incoming[1] * outgoing[1]) /
          (Math.hypot(...incoming) * Math.hypot(...outgoing)) > 0.5;
        variants.push(normalized);
      }
    }
    return variants;
  }

  // A closing bar can cross two outer sides before the pen stops. Treat a
  // bounded pair of those tails as overshoot only when the same bar closes both
  // sides. Interior through-stems, lone extensions and hooks are never trimmed.
  // Shared bar tilt is corrected before locating the intersections; the whole
  // character keeps its aspect ratio. This interpretation is target-independent.
  function regularizeEnclosure(input) {
    if (!input) return null;
    const bars = input.strokes.filter(stroke => {
      const first = stroke.points[0], last = stroke.points[POINTS - 1];
      return straight(stroke) && Math.abs((last[1] - first[1]) / (last[0] - first[0])) < 0.6;
    });
    if (bars.length < 2) return null;
    const weight = bars.reduce((sum, stroke) => sum + stroke.length, 0);
    const slope = bars.reduce((sum, stroke) => {
      const first = stroke.points[0], last = stroke.points[POINTS - 1];
      return sum + (last[1] - first[1]) / (last[0] - first[0]) * stroke.length;
    }, 0) / weight;
    // Orient paths only while finding lower boundary tails, then restore their
    // original direction so identity and direction coaching stay independent.
    const flipped = input.strokes.map(stroke => stroke.points[0][1] > stroke.points[POINTS - 1][1]);
    const base = normalize(input.strokes.map((stroke, i) => (flipped[i] ? [...stroke.points].reverse() : stroke.points)
      .map(([x, y]) => [x, y - slope * x])));
    if (!base) return null;
    const cross = (a, b) => a[0] * b[1] - a[1] * b[0];
    const subtract = (a, b) => [a[0] - b[0], a[1] - b[1]];
    const cumulative = base.strokes.map(stroke => {
      const values = [0];
      for (let i = 1; i < POINTS; i++) values.push(values[i - 1] + distance(stroke.points[i - 1], stroke.points[i]));
      return values;
    });
    const ends = base.strokes.map((stroke, i) => {
      let lastContact = null;
      for (let k = 1; k < POINTS; k++) {
        const from = stroke.points[k - 1], vector = subtract(stroke.points[k], from);
        if (Math.abs(vector[0]) > Math.abs(vector[1]) * 0.6) continue;
        for (let j = 0; j < base.strokes.length; j++) {
          const other = base.strokes[j];
          if (i === j || !straight(other)) continue;
          const barVector = subtract(other.points[POINTS - 1], other.points[0]);
          if (Math.abs(barVector[1]) > Math.abs(barVector[0]) * 0.35) continue;
          for (let m = 1; m < POINTS; m++) {
            const otherVector = subtract(other.points[m], other.points[m - 1]);
            const denominator = cross(vector, otherVector);
            if (Math.abs(denominator) < 1e-9) continue;
            const offset = subtract(other.points[m - 1], from);
            const a = cross(offset, otherVector) / denominator, b = cross(offset, vector) / denominator;
            if (a < 0 || a > 1 || b < 0 || b > 1) continue;
            const position = cumulative[i][k - 1] + a * distance(from, stroke.points[k]);
            if (lastContact && position <= lastContact.position) continue;
            const across = (cumulative[j][m - 1] + b * distance(other.points[m - 1], other.points[m])) / cumulative[j][POINTS - 1];
            lastContact = { position, across, bar: j, k, vector, point: [from[0] + a * vector[0], from[1] + a * vector[1]] };
          }
        }
      }
      if (!lastContact) return null;
      const tail = cumulative[i][POINTS - 1] - lastContact.position;
      const ending = subtract(stroke.points[POINTS - 1], stroke.points[POINTS - 4]);
      const continuation = (ending[0] * lastContact.vector[0] + ending[1] * lastContact.vector[1]) /
        (Math.hypot(...ending) * Math.hypot(...lastContact.vector));
      if (tail < 0.035 || tail / cumulative[i][POINTS - 1] > 0.35 || continuation < 0.65 ||
        (lastContact.across > 0.20 && lastContact.across < 0.80)) return null;
      return { ...lastContact, tail };
    });
    const paired = ends.map(end => end && ends.some(other => other && other.bar === end.bar &&
      ((end.across <= 0.20 && other.across >= 0.80) || (end.across >= 0.80 && other.across <= 0.20))));
    const removed = ends.reduce((sum, end, i) => sum + (paired[i] ? end.tail : 0), 0);
    if (!removed || removed / base.ink > 0.22) return null;
    const trimmed = normalize(base.strokes.map((stroke, i) => paired[i] ?
      stroke.points.slice(0, ends[i].k).concat([ends[i].point]) : stroke.points));
    if (!trimmed) return null;
    return trimmed.strokes.map((stroke, i) => {
      const points = stroke.points.map(([x, y]) => [x * base.width / trimmed.width, y * base.height / trimmed.height]);
      return flipped[i] ? points.reverse() : points;
    });
  }

  function recognizeInk(strokes, targetCharacter, templates) {
    const unknown = (message, score = 0) => ({ status: 'uncertain', recognized: null, score, orderCorrect: null, directionCorrect: null, continuityCorrect: null, message });
    const input = normalize(strokes);
    if (!input) return unknown('Draw each stroke clearly, then try checking again.');
    const references = indexed(templates);
    if (!references.some(entry => entry.character === targetCharacter)) return unknown('A handwriting reference is unavailable for this character.');
    const byCharacter = new Map();
    for (const reference of references) {
      if (Math.abs(reference.normalized.strokes.length - input.strokes.length) > 2) continue;
      byCharacter.set(reference.character, { character: reference.character, input, continuityCorrect: true, ...compare(input, reference.normalized) });
    }
    for (const variant of continuousVariants(strokes, input)) {
      for (const reference of references) {
        if (reference.normalized.strokes.length !== variant.strokes.length) continue;
        const comparison = compare(variant, reference.normalized);
        // A joined freehand stroke must retain the character's structure. This
        // permits small restart gaps without explaining away additional ink.
        const preciseJoin = comparison.cost <= 0.075 && comparison.worst <= 0.14 && comparison.inkDifference <= 0.18 &&
          strokeInkAgrees(variant, reference.normalized, comparison);
        if (!preciseJoin && (!variant.continuation || comparison.cost > 0.16 || comparison.worst > 0.26 || comparison.inkDifference > 0.28 ||
          !structureAgrees(variant, reference.normalized, comparison))) continue;
        const previous = byCharacter.get(reference.character);
        if (!previous || comparison.cost < previous.cost) {
          byCharacter.set(reference.character, { character: reference.character, input: variant, continuityCorrect: false, ...comparison });
        }
      }
    }
    const candidates = [...byCharacter.values()];
    candidates.sort((a, b) => a.cost - b.cost);
    const best = candidates[0];
    if (!best) return unknown('I could not read this clearly. Clear the canvas and try again.');
    // This score measures reference similarity; it is not a probability.
    const score = Math.max(0, Math.min(1, 1 - best.cost / 0.35));
    const margin = candidates[1] ? candidates[1].cost - best.cost : Infinity;
    // Both an absolute shape threshold and separation from other characters
    // are necessary. No target-specific bonus can turn a near miss into a pass.
    const bestReference = references.find(reference => reference.character === best.character).normalized;
    const supportedInk = best.countMatches && strokeInkAgrees(best.input, bestReference, best);
    const closeFit = best.cost <= 0.105 && best.worst <= 0.19;
    const freehandFit = !closeFit && best.countMatches && best.cost <= 0.16 && best.worst <= 0.26 && margin >= 0.03 &&
      structureAgrees(best.input, bestReference, best);
    if (!supportedInk || (!closeFit && !freehandFit) || best.inkDifference > 0.28) {
      return unknown('I could not confidently match this drawing. You can adjust it or use a hint, then try again.', score);
    }
    if (margin < 0.016 || (best.cost > 0.045 && margin < 0.026)) {
      if (!best.continuityCorrect || candidates[1]?.continuityCorrect === false) {
        return { ...unknown('The pen lift makes this ambiguous. Use one continuous movement for each stroke, then try again.', score), reason:'continuity-ambiguity' };
      }
      return unknown('This looks close to more than one kanji. Make the stroke lengths and positions clearer, then try again.', score);
    }
    const status = best.character === targetCharacter ? 'correct' : 'incorrect';
    let orderCorrect = null, directionCorrect = null;
    if (status === 'correct') {
      orderCorrect = best.assignment.every((j, i) => j === i || best.details[i][i].cost - best.details[i][j].cost < 0.018);
      directionCorrect = best.assignment.every((j, i) => best.input.strokes[i].length < 0.075 || best.details[i][j].forward - best.details[i][j].reverse < 0.035);
    }
    return { status, recognized: best.character, score, orderCorrect, directionCorrect, continuityCorrect: status === 'correct' ? best.continuityCorrect : null };
  }


  // Candidate-independent elastic comparison tolerates imperfect placement of
  // individual strokes while keeping their shape, count and defining relations.
  // It is used only when the stricter reference comparison cannot identify ink.
  function recognizeElastic(strokes, targetCharacter, templates) {
    const input=normalize(strokes);
    if(!input) return null;
    const candidates=[];
    for(const reference of indexed(templates)) {
      if(reference.normalized.strokes.length!==input.strokes.length) continue;
      const absolute=compare(input,reference.normalized);
      if(absolute.cost>0.26 || absolute.worst>0.34 || absolute.inkDifference>0.30) continue;
      const comparison=compare(input,reference.normalized,true);
      if(!elasticStructureAgrees(input,reference.normalized,comparison)) continue;
      candidates.push({character:reference.character,reference:reference.normalized,...comparison});
    }
    candidates.sort((a,b)=>a.cost-b.cost);
    const best=candidates[0],margin=candidates[1]?candidates[1].cost-best.cost:Infinity;
    if(!best || best.cost>0.18 || best.worst>0.24 || margin<0.04) return null;
    const status=best.character===targetCharacter?'correct':'incorrect';
    return {status,recognized:best.character,score:Math.max(0,1-best.cost/.35),
      orderCorrect:status==='correct'?best.assignment.every((j,i)=>j===i || best.details[i][i].cost-best.details[i][j].cost<0.018):null,
      directionCorrect:status==='correct'?best.assignment.every((j,i)=>input.strokes[i].length<0.075 || best.details[i][j].forward-best.details[i][j].reverse<0.035):null,
      continuityCorrect:status==='correct'?true:null};
  }
  function recognizeStrict(strokes, targetCharacter, templates) {
    const original = recognizeInk(strokes, targetCharacter, templates);
    if (original.status !== 'uncertain' && original.score >= 0.88) return original;
    const regularized = regularizeEnclosure(normalize(strokes));
    if (!regularized) return original;
    const alternative = recognizeInk(regularized, targetCharacter, templates);
    if (alternative.status === 'uncertain') return original;
    if (original.status === 'uncertain') return alternative;
    if (original.recognized === alternative.recognized) return original;
    // Corrected ink must win by an explicit deformation cost before replacing a
    // confident reading. If neither interpretation clearly wins, do not grade.
    const deformationMargin = 0.028 / 0.35;
    if (alternative.score - original.score > deformationMargin) return alternative;
    if (original.score - alternative.score > deformationMargin) return original;
    return { status: 'uncertain', recognized: null, score: Math.max(original.score, alternative.score),
      orderCorrect: null, directionCorrect: null, continuityCorrect: null,
      message: 'This drawing has more than one possible reading. Adjust the joins and stroke lengths, then try again.' };
  }

  function recognize(strokes,targetCharacter,templates) {
    const strict=recognizeStrict(strokes,targetCharacter,templates);
    if(strict.status!=='uncertain' || strict.reason==='continuity-ambiguity' || !indexed(templates).some(r=>r.character===targetCharacter)) return strict;
    const original=recognizeElastic(strokes,targetCharacter,templates);
    const regularized=regularizeEnclosure(normalize(strokes));
    const alternative=regularized?recognizeElastic(regularized,targetCharacter,templates):null;
    if(!original)return alternative||strict;
    if(!alternative || original.recognized===alternative.recognized)return original;
    if(alternative.score-original.score>0.08)return alternative;
    if(original.score-alternative.score>0.08)return original;
    return strict;
  }
  root.KotobaHandwriting = Object.freeze({ prepare, recognize });
})(globalThis);
