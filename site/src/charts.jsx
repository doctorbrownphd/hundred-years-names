// Charts — Tufte-style: minimal axes, no chartjunk, sparklines + small multiples
// All charts read from window.NAMES_DATA

const _YEARS = window.NAMES_DATA.YEARS;
const _NAME_DATA = window.NAMES_DATA.NAME_DATA;
const _ERAS_C = window.NAMES_DATA.ERAS;
const _DIVERSITY = window.NAMES_DATA.DIVERSITY;
const _NAME_INDEX = window.NAMES_DATA.NAME_INDEX;
const ERA_COLOR = Object.fromEntries(_ERAS_C.map(e => [e.id, e.color]));
ERA_COLOR.flash = "#a14545";
ERA_COLOR.killed = "#6f5a4a";
ERA_COLOR.steady = "#c4bda9";

// === Sparkline =========================================================
function Sparkline({ data, width = 180, height = 28, color = "#d4a64a", peak = true, fill = false, baselineYear, peakLabel = false }) {
  if (!data || !data.length) return null;
  const max = Math.max(...data.map(d => d.rate));
  if (max === 0) return <svg width={width} height={height} />;
  const xs = (i) => (i / (data.length - 1)) * width;
  const ys = (v) => height - 2 - (v / max) * (height - 4);
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(2)},${ys(d.rate).toFixed(2)}`).join(" ");
  const peakIdx = data.reduce((b, d, i) => d.rate > data[b].rate ? i : b, 0);
  return (
    <svg width={width} height={height} style={{display:"block", overflow:"visible"}}>
      {fill && <path d={`${path} L${width},${height} L0,${height} Z`} fill={color} opacity="0.12" />}
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" />
      {peak && <circle cx={xs(peakIdx)} cy={ys(data[peakIdx].rate)} r="2" fill={color} />}
      {peakLabel && (
        <text x={xs(peakIdx)} y={ys(data[peakIdx].rate) - 5} textAnchor="middle"
              fill={color} fontFamily="IBM Plex Mono" fontSize="9">
          {data[peakIdx].year}
        </text>
      )}
    </svg>
  );
}

// === Inline mini wave (for stat cards) ================================
function MiniLine({ values, width = 180, height = 28, color = "#d4a64a", invert = false }) {
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const path = values.map((v, i) => {
    const x = (i / (values.length - 1)) * width;
    const y = invert
      ? 2 + ((v - min) / range) * (height - 4)
      : height - 2 - ((v - min) / range) * (height - 4);
    return `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`;
  }).join(" ");
  return (
    <svg width={width} height={height} style={{display:"block"}}>
      <path d={path} fill="none" stroke={color} strokeWidth="1.2" />
    </svg>
  );
}

// === The Landscape — stacked area, top N names =========================
function Landscape({ width = 940, height = 360, selectedEra = null, onHover, hoverYear }) {
  // Pick top ~26 names by total rate
  const ranked = [..._NAME_DATA]
    .filter(n => n.peakRate > 1.0 || ["Jennifer","Emma","Olivia","Aiden"].includes(n.name))
    .sort((a, b) => b.peakRate - a.peakRate)
    .slice(0, 26);

  // Sort by peak year so the ribbon flows left-to-right by era
  ranked.sort((a, b) => a.peakYear - b.peakYear);

  // Build stacked series
  const stacks = _YEARS.map((y, yi) => {
    let acc = 0;
    return ranked.map(n => {
      const v = n.yearly[yi].rate;
      const lower = acc; acc += v;
      return { lower, upper: acc };
    });
  });
  const maxTotal = Math.max(...stacks.map(col => col[col.length - 1].upper));

  const left = 36, right = 16, top = 14, bottom = 28;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const xs = (yi) => left + (yi / (_YEARS.length - 1)) * innerW;
  const ys = (v) => top + innerH - (v / maxTotal) * innerH;

  const paths = ranked.map((n, ni) => {
    const up = _YEARS.map((_, yi) => `${xs(yi).toFixed(2)},${ys(stacks[yi][ni].upper).toFixed(2)}`);
    const lo = _YEARS.map((_, yi) => `${xs(yi).toFixed(2)},${ys(stacks[yi][ni].lower).toFixed(2)}`).reverse();
    return `M${up.join(" L")} L${lo.join(" L")} Z`;
  });

  const dim = selectedEra ? (era) => era === selectedEra ? 1 : 0.18 : () => 1;

  // Labels: place a few key names at their peak position
  const labelPicks = ["Mary", "Linda", "Jennifer", "Emma", "Olivia"];
  const labels = ranked
    .map((n, ni) => ({ n, ni }))
    .filter(({n}) => labelPicks.includes(n.name))
    .map(({n, ni}) => {
      const yi = _YEARS.indexOf(n.peakYear);
      const mid = (stacks[yi][ni].lower + stacks[yi][ni].upper) / 2;
      return { name: n.name, x: xs(yi), y: ys(mid), era: n.era };
    });

  // Decade ticks
  const decades = [1880, 1900, 1920, 1940, 1960, 1980, 2000, 2020];

  return (
    <svg width={width} height={height} style={{display:"block", overflow:"visible"}}
         onMouseLeave={() => onHover && onHover(null)}
         onMouseMove={(e) => {
           if (!onHover) return;
           const r = e.currentTarget.getBoundingClientRect();
           const x = e.clientX - r.left;
           const yi = Math.round(((x - left) / innerW) * (_YEARS.length - 1));
           if (yi >= 0 && yi < _YEARS.length) onHover(_YEARS[yi]);
         }}>
      {/* y-axis ticks (faint) */}
      {[10, 20, 30, 40, 50].map(v => v <= maxTotal && (
        <g key={v}>
          <line x1={left} x2={width - right} y1={ys(v)} y2={ys(v)} className="grid-line" />
          <text x={left - 6} y={ys(v) + 3} textAnchor="end" className="axis-text">{v}</text>
        </g>
      ))}
      <text x={left - 6} y={top + 8} textAnchor="end" className="axis-text">per 1k</text>

      {/* Stacked areas */}
      {ranked.map((n, ni) => (
        <path key={n.name} d={paths[ni]}
              fill={ERA_COLOR[n.era] || "#888"}
              fillOpacity={dim(n.era) * 0.7}
              stroke={ERA_COLOR[n.era] || "#888"}
              strokeOpacity={dim(n.era) * 0.35}
              strokeWidth="0.4" />
      ))}

      {/* Decade ticks */}
      {decades.map(d => (
        <g key={d}>
          <line x1={xs(d - 1880)} x2={xs(d - 1880)}
                y1={top + innerH} y2={top + innerH + 4} className="axis-tick" />
          <text x={xs(d - 1880)} y={top + innerH + 16} textAnchor="middle" className="axis-text">{d}</text>
        </g>
      ))}

      {/* Hover line */}
      {hoverYear && (() => {
        const yi = _YEARS.indexOf(hoverYear);
        if (yi < 0) return null;
        return (
          <g>
            <line x1={xs(yi)} x2={xs(yi)} y1={top} y2={top + innerH}
                  stroke="#e8e0cf" strokeOpacity="0.4" strokeWidth="1" />
            <text x={xs(yi)} y={top - 4} textAnchor="middle"
                  fill="#d4a64a" fontFamily="IBM Plex Mono" fontSize="10" letterSpacing="0.08em">
              {hoverYear}
            </text>
          </g>
        );
      })()}

      {/* Name labels at peaks */}
      {labels.map(l => (
        <text key={l.name} x={l.x} y={l.y + 4} textAnchor="middle"
              fill="#13110d" fontFamily="EB Garamond" fontSize="12.5"
              fontStyle="italic" stroke="#13110d" strokeWidth="2" paintOrder="stroke">
          <tspan fill="#13110d">{l.name}</tspan>
        </text>
      ))}
      {labels.map(l => (
        <text key={l.name + "-2"} x={l.x} y={l.y + 4} textAnchor="middle"
              fill="#13110d" fontFamily="EB Garamond" fontSize="12.5" fontStyle="italic">
          {l.name}
        </text>
      ))}
    </svg>
  );
}

// === Full wave chart for a single name with annotations ================
function WaveChart({ name, width = 920, height = 280, annotations = [], color = "#d4a64a" }) {
  const n = _NAME_INDEX[name.toLowerCase()];
  if (!n) return null;
  const data = n.yearly;
  const max = Math.max(...data.map(d => d.rate)) * 1.12 || 1;
  const left = 44, right = 18, top = 22, bottom = 30;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  const xs = (yi) => left + (yi / (data.length - 1)) * innerW;
  const ys = (v) => top + innerH - (v / max) * innerH;
  const path = data.map((d, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(2)},${ys(d.rate).toFixed(2)}`).join(" ");
  const fillPath = `${path} L${xs(data.length - 1)},${ys(0)} L${xs(0)},${ys(0)} Z`;
  const peakIdx = data.reduce((b, d, i) => d.rate > data[b].rate ? i : b, 0);
  const decades = [1880, 1900, 1920, 1940, 1960, 1980, 2000, 2020];

  // Smart y-axis ticks
  const niceMax = Math.ceil(max);
  const tickStep = niceMax <= 1 ? 0.2 : niceMax <= 3 ? 0.5 : niceMax <= 6 ? 1 : 2;
  const ticks = [];
  for (let t = tickStep; t < max; t += tickStep) ticks.push(+t.toFixed(2));

  return (
    <svg width={width} height={height} style={{display:"block", overflow:"visible"}}>
      {/* Y grid */}
      {ticks.map(t => (
        <g key={t}>
          <line x1={left} x2={width - right} y1={ys(t)} y2={ys(t)} className="grid-line" />
          <text x={left - 8} y={ys(t) + 3} textAnchor="end" className="axis-text">{t}</text>
        </g>
      ))}
      <text x={left - 8} y={top + 8} textAnchor="end" className="axis-text">per 1k</text>

      {/* Fill + line */}
      <path d={fillPath} fill={color} opacity="0.16" />
      <path d={path} fill="none" stroke={color} strokeWidth="1.6" />

      {/* Peak marker */}
      <circle cx={xs(peakIdx)} cy={ys(data[peakIdx].rate)} r="3" fill={color} />
      <text x={xs(peakIdx)} y={ys(data[peakIdx].rate) - 9}
            textAnchor="middle" fill={color}
            fontFamily="IBM Plex Mono" fontSize="10" letterSpacing="0.08em">
        peak · {data[peakIdx].year}
      </text>

      {/* X decade ticks */}
      {decades.map(d => (
        <g key={d}>
          <line x1={xs(d - 1880)} x2={xs(d - 1880)}
                y1={top + innerH} y2={top + innerH + 4} className="axis-tick" />
          <text x={xs(d - 1880)} y={top + innerH + 16} textAnchor="middle" className="axis-text">{d}</text>
        </g>
      ))}

      {/* Annotations */}
      {annotations.map((a, i) => {
        const yi = _YEARS.indexOf(a.year);
        if (yi < 0) return null;
        const v = data[yi].rate;
        const x = xs(yi);
        const y = ys(v);
        const ly = a.up ? y - 36 : y + 32;
        return (
          <g key={i}>
            <line x1={x} y1={y - 4} x2={x} y2={ly + (a.up ? 6 : -10)} className="note-line" />
            <circle cx={x} cy={y} r="2.5" fill="#e8e0cf" />
            <text x={x + 5} y={ly} className="note-text">{a.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

// === Heatmap (signature viz) ===========================================
function Heatmap({ names, onSelect, selected, decadeWidth = 56 }) {
  // Sort by peak decade so eras visually emerge
  const rows = [...names].sort((a, b) => a.peakYear - b.peakYear);
  const decades = Array.from({length: 15}, (_, i) => 1880 + i * 10); // 1880..2020
  // Find global max for color scale
  const maxRate = Math.max(...rows.flatMap(n => decades.map(d => decadeAvg(n, d))));

  function decadeAvg(n, d) {
    let sum = 0, c = 0;
    for (let y = d; y < d + 10 && y <= 2024; y++) {
      const idx = y - 1880;
      if (n.yearly[idx]) { sum += n.yearly[idx].rate; c++; }
    }
    return c ? sum / c : 0;
  }

  function color(v) {
    const t = Math.min(1, v / maxRate);
    if (t < 0.02) return "#1a1812";
    // amber gradient
    const lerp = (a, b, k) => Math.round(a + (b - a) * k);
    const stops = [
      [33, 29, 20],
      [107, 74, 26],
      [212, 166, 74],
      [246, 220, 156]
    ];
    const idx = Math.min(stops.length - 2, Math.floor(t * (stops.length - 1)));
    const k = t * (stops.length - 1) - idx;
    const c = [0,1,2].map(i => lerp(stops[idx][i], stops[idx+1][i], k));
    return `rgb(${c[0]},${c[1]},${c[2]})`;
  }

  return (
    <div className="heatmap">
      <div className="heatmap-row head" style={{gridTemplateColumns: `100px 1fr`}}>
        <div className="lbl">x</div>
        <div className="cells">
          {decades.map(d => <div key={d} className="yr-tick">{d}</div>)}
        </div>
      </div>
      {rows.map(n => (
        <div key={n.name} className={`heatmap-row ${selected === n.name ? "selected" : ""}`}
             style={{gridTemplateColumns: `100px 1fr`, cursor: "pointer"}}
             onClick={() => onSelect && onSelect(n.name)}>
          <div className="lbl">{n.name}</div>
          <div className="cells">
            {decades.map(d => (
              <div key={d} className="cell" style={{background: color(decadeAvg(n, d))}} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// === Diversity / entropy chart ========================================
function DiversityChart({ width = 460, height = 160 }) {
  const data = _DIVERSITY;
  const left = 36, right = 12, top = 14, bottom = 22;
  const innerW = width - left - right;
  const innerH = height - top - bottom;
  // Two series: top10 share (left axis, 0..0.4) + entropy (right, 6..10.5)
  const t10Max = 0.40;
  const xs = (yi) => left + (yi / (data.length - 1)) * innerW;
  const ys10 = (v) => top + innerH - (v / t10Max) * innerH;
  const path10 = data.map((d, i) => `${i === 0 ? "M" : "L"}${xs(i).toFixed(2)},${ys10(d.top10Share).toFixed(2)}`).join(" ");

  return (
    <svg width={width} height={height} style={{display:"block", overflow:"visible"}}>
      {[0.1, 0.2, 0.3].map(t => (
        <g key={t}>
          <line x1={left} x2={width - right} y1={ys10(t)} y2={ys10(t)} className="grid-line" />
          <text x={left - 6} y={ys10(t) + 3} textAnchor="end" className="axis-text">{(t * 100).toFixed(0)}%</text>
        </g>
      ))}
      <text x={left - 6} y={top + 8} textAnchor="end" className="axis-text">top 10</text>
      <path d={`${path10} L${xs(data.length - 1)},${ys10(0)} L${xs(0)},${ys10(0)} Z`}
            fill="#d4a64a" opacity="0.14" />
      <path d={path10} fill="none" stroke="#d4a64a" strokeWidth="1.5" />
      {/* peak label */}
      {(() => {
        const pi = data.reduce((b, d, i) => d.top10Share > data[b].top10Share ? i : b, 0);
        return (
          <g>
            <circle cx={xs(pi)} cy={ys10(data[pi].top10Share)} r="2.5" fill="#d4a64a" />
            <text x={xs(pi)} y={ys10(data[pi].top10Share) - 8}
                  textAnchor="middle" fill="#d4a64a"
                  fontFamily="IBM Plex Mono" fontSize="9.5">
              {data[pi].year} · {(data[pi].top10Share*100).toFixed(0)}%
            </text>
          </g>
        );
      })()}
      {[1900, 1940, 1980, 2020].map(d => (
        <g key={d}>
          <text x={xs(d - 1880)} y={top + innerH + 14} textAnchor="middle" className="axis-text">{d}</text>
        </g>
      ))}
    </svg>
  );
}

// === Suffix small multiples ===========================================
function SuffixPanel({ suffix, peak, label, color = "#d4a64a" }) {
  // Generate a synthetic suffix curve
  const data = _YEARS.map(y => {
    const d = y - peak;
    const w = peak < 1960 ? 18 : 14;
    return { year: y, rate: Math.exp(-(d * d) / (2 * w * w)) };
  });
  return (
    <div className="panel">
      <div className="sx">{suffix}</div>
      <div className="ex">{label}</div>
      <Sparkline data={data} width={140} height={36} color={color} fill />
      <div className="pk">PEAK · {peak}</div>
    </div>
  );
}

// Export
Object.assign(window, { Sparkline, MiniLine, Landscape, WaveChart, Heatmap, DiversityChart, SuffixPanel, ERA_COLOR });
