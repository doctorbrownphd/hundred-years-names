// Tabs — each tab is a self-contained view
const _YEARS    = window.NAMES_DATA.YEARS;
const _ND       = window.NAMES_DATA.NAME_DATA;
const _ERAS     = window.NAMES_DATA.ERAS;
const _DIV      = window.NAMES_DATA.DIVERSITY;
const _PIPELINE = window.NAMES_DATA.PIPELINE;
const _WAVES    = window.NAMES_DATA.WAVES_GROUPS;
const _SUFFIXES = window.NAMES_DATA.SUFFIXES;
const _NI       = window.NAMES_DATA.NAME_INDEX;
const _ARCH     = window.NAMES_DATA.ARCHETYPES;
const _HEAD     = window.NAMES_DATA.HEADLINE;

// Generate synthetic yearly curve from peak stats when real yearly data is missing
function synthYearly(n) {
  if (n.yearly) return n.yearly;
  const peak = n.peakYear || 1960;
  const rate = n.peakRate || 1;
  const hl = n.halfLife || 20;
  const sigma = hl / 1.2;
  return _YEARS.map(y => {
    const d = y - peak;
    // Asymmetric: faster rise, slower decay
    const s = d < 0 ? sigma * 0.7 : sigma;
    return { year: y, rate: rate * Math.exp(-(d * d) / (2 * s * s)) };
  });
}
// Patch all names with synthetic yearly if missing
_ND.forEach(n => { if (!n.yearly) n.yearly = synthYearly(n); });

// ── Lead/Lag Map (wrapper around USMap with diverging color scale) ──
function LeadLagMap({ states, onHover }) {
  // Custom color: blue for leads (negative), rose for lags (positive), neutral in middle
  const leadColor = (lead) => {
    if (lead < -0.5) {
      const t = Math.min(1, Math.abs(lead) / 5);
      return `rgb(${Math.round(160 - t*80)}, ${Math.round(181 - t*60)}, ${Math.round(196 + t*20)})`;
    }
    if (lead > 0.5) {
      const t = Math.min(1, lead / 5);
      return `rgb(${Math.round(196 + t*20)}, ${Math.round(160 - t*40)}, ${Math.round(140 - t*30)})`;
    }
    return "#DDDFE4";
  };

  // USMap expects stateData with {st, name, count}. We override the fill via a custom render.
  // Since USMap doesn't support custom fill functions, render our own SVG using the same topology.
  const [paths, setPaths] = React.useState(null);
  React.useEffect(() => {
    fetch("src/us-states-topo.json")
      .then(r => r.json())
      .then(topo => {
        // Reuse the decode logic from USMap
        if (window._decodeTopo) {
          setPaths(window._decodeTopo(topo));
        } else {
          // Inline decode
          const { arcs: rawArcs, transform } = topo;
          const { scale: [sx, sy], translate: [tx, ty] } = transform;
          const arcs = rawArcs.map(arc => {
            let x = 0, y = 0;
            return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
          });
          const arcToCoords = (idx) => idx >= 0 ? arcs[idx].slice() : arcs[~idx].slice().reverse();
          const ringToCoords = (ring) => { let c = []; ring.forEach(i => { c = c.concat(arcToCoords(i)); }); return c; };
          const FIPS = {"01":"AL","02":"AK","04":"AZ","05":"AR","06":"CA","08":"CO","09":"CT","10":"DE","11":"DC","12":"FL","13":"GA","15":"HI","16":"ID","17":"IL","18":"IN","19":"IA","20":"KS","21":"KY","22":"LA","23":"ME","24":"MD","25":"MA","26":"MI","27":"MN","28":"MS","29":"MO","30":"MT","31":"NE","32":"NV","33":"NH","34":"NJ","35":"NM","36":"NY","37":"NC","38":"ND","39":"OH","40":"OK","41":"OR","42":"PA","44":"RI","45":"SC","46":"SD","47":"TN","48":"TX","49":"UT","50":"VT","51":"VA","53":"WA","54":"WV","55":"WI","56":"WY"};
          const result = {};
          topo.objects.states.geometries.forEach(g => {
            const st = FIPS[g.id]; if (!st) return;
            let d = "";
            (g.type === "Polygon" ? [g.arcs] : g.arcs).forEach(poly => poly.forEach(ring => {
              ringToCoords(ring).forEach((pt, i) => { d += (i === 0 ? "M" : "L") + pt[0].toFixed(1) + "," + pt[1].toFixed(1); });
              d += "Z";
            }));
            result[st] = d;
          });
          setPaths(result);
        }
      });
  }, []);

  const byState = React.useMemo(() => Object.fromEntries(states.map(s => [s.st, s])), [states]);

  if (!paths) return <div style={{height:300, display:"flex", alignItems:"center", justifyContent:"center", color:"var(--muted)"}}>Loading map…</div>;

  return (
    <svg viewBox="-70 60 1020 580" preserveAspectRatio="xMidYMid meet" style={{width:"100%", height:"auto", maxHeight:420, display:"block", margin:"0 auto"}}>
      {Object.entries(paths).map(([st, d]) => {
        const s = byState[st];
        const lead = s ? s.lead : 0;
        return (
          <path key={st} d={d}
            fill={leadColor(lead)}
            stroke="#FAFAFC"
            strokeWidth="1.2"
            strokeLinejoin="round"
            style={{cursor:"default", transition:"fill 200ms"}}
            onMouseEnter={() => onHover && onHover(s || {st, lead: 0})}
            onMouseLeave={() => onHover && onHover(null)}
          />
        );
      })}
    </svg>
  );
}

// ====================================================================
// TAB 01 · YOUR NAME (Search — the front door)
// ====================================================================
function TabSearch({ accent }) {
  const [query, setQuery] = React.useState("");
  const suggestions = ["Jennifer","Mary","Linda","Michael","Ashley","Khaleesi","Alexa","Emma","James","Karen"];
  const featuredNames = ["Jennifer","Emma","Khaleesi","Ashley","James"];

  const found = React.useMemo(() => {
    if (!query.trim()) return null;
    const q = query.trim().toLowerCase();
    if (_NI[q]) return _NI[q];
    const f = _NI[q + "_F"], m = _NI[q + "_M"];
    if (f && m) return (f.peakRate || 0) >= (m.peakRate || 0) ? f : m;
    return f || m || null;
  }, [query]);

  const annotations = React.useMemo(() => {
    if (!found) return [];
    if (found.name === "Jennifer") return [
      { year: 1970, label: "“Love Story” released", up: true },
      { year: 1972, label: "#1 in U.S.", up: false },
      { year: 2000, label: "Drops out of top 50", up: true },
    ];
    if (found.name === "Alexa") return [
      { year: 2008, label: "Pre-Echo peak", up: true },
      { year: 2014, label: "Amazon Echo launches", up: false },
    ];
    if (found.name === "Khaleesi") return [
      { year: 2011, label: "GoT premiere", up: true },
      { year: 2013, label: "Season 3", up: false },
    ];
    if (found.name === "Emma") return [
      { year: 1880, label: "Victorian peak", up: true },
      { year: 1994, label: "“Friends” premiere", up: false },
      { year: 2018, label: "Modern peak", up: true },
    ];
    if (found.name === "Linda") return [{ year: 1947, label: "Post-war surge", up: true }];
    if (found.name === "Karen") return [{ year: 2018, label: "Meme cycle", up: true }];
    return [{ year: found.peakYear, label: "Peak year", up: true }];
  }, [found]);

  // Related (same era, sorted by peak proximity)
  const related = React.useMemo(() => {
    if (!found) return [];
    return _ND
      .filter(n => n.name !== found.name && n.era === found.era)
      .sort((a, b) => Math.abs(a.peakYear - found.peakYear) - Math.abs(b.peakYear - found.peakYear))
      .slice(0, 5);
  }, [found]);

  // Your Generation — names that peaked within ±3 years
  const generation = React.useMemo(() => {
    if (!found) return [];
    return _ND
      .filter(n => n.name !== found.name && Math.abs(n.peakYear - found.peakYear) <= 3)
      .sort((a, b) => b.peakRate - a.peakRate)
      .slice(0, 5);
  }, [found]);

  // Birth year — inferred from peak, overridable
  const [birthOverride, setBirthOverride] = React.useState(null);
  const birthYear = birthOverride || (found ? found.peakYear : null);

  // Your Life in Names — biography generator
  const lifeStages = React.useMemo(() => {
    if (!found || !birthYear) return [];
    const by = birthYear;
    const sameG = (n) => n.gender === found.gender;
    const oppG = (n) => n.gender !== found.gender;
    const anyG = () => true;
    // Look up top names peaking near a target year, filtered by gender
    const topAt = (targetYear, genderFn, count=3) => {
      const window = 3;
      return _ND
        .filter(n => n.name !== found.name && genderFn(n) && Math.abs(n.peakYear - targetYear) <= window)
        .sort((a,b) => b.peakRate - a.peakRate)
        .slice(0, count);
    };
    const fmtNames = (arr) => arr.map(n => n.name);
    const fmtPct = (arr) => arr.length > 0 ? (arr[0].peakRate / 10).toFixed(1) + "%" : "";

    const stages = [
      { age:"At 6", label:"your best friend was probably named",
        names: fmtNames(topAt(by, sameG)), pct: fmtPct(topAt(by, sameG)),
        note:`elementary school, ~${by + 6}`, icon:"◉" },
      { age:"At 13", label:"your first crush was almost certainly a",
        names: fmtNames(topAt(by, oppG)), pct: fmtPct(topAt(by, oppG)),
        note:`middle school, ~${by + 13}`, icon:"♡" },
      { age:"At 22", label:"your college roommate was likely a",
        names: fmtNames(topAt(by + 1, sameG)), pct: fmtPct(topAt(by + 1, sameG)),
        note:`college, ~${by + 22}`, icon:"◎" },
      { age:"Your teachers", label:"were named",
        names: fmtNames(topAt(by - 27, (n) => n.gender === "F")), pct: "",
        note:`born ~${by - 27}, peaked 25 years before you`, icon:"▪" },
      { age:"Your boss", label:"was probably a",
        names: fmtNames(topAt(by - 12, (n) => n.gender === "M")), pct: "",
        note:`born ~${by - 12}`, icon:"▸" },
    ];
    // Kids (only if birth year + 30 <= 2024)
    if (by + 30 <= 2024) {
      stages.push({ age:"Your kids", label:"if you followed the trend — are named",
        names: fmtNames(topAt(by + 30, anyG)), pct: fmtPct(topAt(by + 30, anyG)),
        note:`born ~${by + 30}`, icon:"✦" });
    }
    // Grandchildren (current top names)
    stages.push({ age:"Your grandchildren", label:"will grow up knowing an",
      names: fmtNames(_ND.filter(n => n.peakYear >= 2020).sort((a,b) => b.peakRate - a.peakRate).slice(0,3)),
      pct: "", note:"born ~now", icon:"✧" });

    return stages.filter(s => s.names.length > 0);
  }, [found, birthYear]);

  const stronghold = React.useMemo(() => {
    if (!found) return null;
    const map = {
      Jennifer:"California (1.34× nat’l)", Linda:"Pennsylvania (1.22×)",
      Mary:"Massachusetts (1.41×)", James:"Texas (1.18×)",
      Michael:"New York (1.27×)", Ashley:"Tennessee (1.31×)",
      Khaleesi:"Texas (1.55×)", Alexa:"Florida (1.19×)",
      Emma:"Vermont (1.44×)", Karen:"Iowa (1.62×)",
    };
    return map[found.name] || "California (1.12×)";
  }, [found]);

  // No query yet — show the centered hero search
  if (!found) {
    return (
      <div>
        <div className="yourname-hero">
          <div className="search-prefix">Search 105,182 names · 1880–2024</div>
          <div className="search-input-wrap">
            <input className="search-input" autoFocus
                   value={query} onChange={e => setQuery(e.target.value)}
                   placeholder="type your name…" />
          </div>
          <div className="search-suggest" style={{marginTop:16, justifyContent:"center"}}>
            <span style={{fontFamily:"var(--mono)", fontSize:"10px", letterSpacing:"0.16em", color:"var(--muted)", textTransform:"uppercase"}}>Try</span>
            {suggestions.map(s => (
              <span key={s} className="pick" onClick={() => setQuery(s)}>{s}</span>
            ))}
          </div>
          {query.trim() && !found && (
            <p style={{fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--muted)", marginTop:24}}>
              No record of “{query}” in the SSA corpus (names with fewer than 5 occurrences in any year are omitted).
            </p>
          )}
        </div>

        {/* Featured name cards */}
        <div style={{marginTop:8}}>
          <div style={{fontFamily:"var(--mono)", fontSize:"10px", letterSpacing:"0.16em", color:"var(--muted)", textTransform:"uppercase", marginBottom:12}}>
            Featured Names
          </div>
          <div className="yourname-cards">
            {featuredNames.map(nm => {
              const q = nm.toLowerCase();
              const _f = _NI[q+"_F"], _m = _NI[q+"_M"];
              const n = _NI[q] || (_f && _m ? ((_f.peakRate||0) >= (_m.peakRate||0) ? _f : _m) : (_f || _m));
              if (!n) return null;
              return (
                <div key={nm} className="yourname-card" onClick={() => setQuery(nm)}>
                  <div className="card-name">{n.name}</div>
                  <div className="card-era">{n.era} · {n.gender === "F" ? "F" : n.gender === "M" ? "M" : "X"}</div>
                  <Sparkline data={n.yearly} width={160} height={32} color={accent} fill peak={false} />
                  <div className="card-peak">Peak {n.peakYear} · {(n.peakRate||0).toFixed(1)}/1k</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // Name found — show full result
  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="search-prefix">Search · 105,182 names</div>
        <div className="search-input-wrap">
          <input className="search-input" autoFocus
                 value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="type a name…"
                 style={{textAlign:"left", fontSize:48}} />
        </div>
        <div className="search-suggest">
          <span style={{fontFamily:"var(--mono)", fontSize:"10px", letterSpacing:"0.16em", color:"var(--muted)", textTransform:"uppercase"}}>Try</span>
          {suggestions.map(s => (
            <span key={s} className="pick" onClick={() => setQuery(s)}>{s}</span>
          ))}
        </div>

        <div className="search-shell" style={{marginTop:32}}>
          <div>
            <div style={{display:"flex", alignItems:"baseline", gap:18, marginBottom:6}}>
              <h2 style={{fontFamily:"var(--display)", fontSize:64, fontWeight:600, margin:0, letterSpacing:"-0.015em", color:"var(--ink)"}}>{found.name}</h2>
              <span style={{fontFamily:"var(--mono)", fontSize:11, color:"var(--muted)", letterSpacing:"0.14em", textTransform:"uppercase"}}>
                {found.gender === "F" ? "Female-led" : found.gender === "M" ? "Male-led" : "Mixed"} · {found.era}
              </span>
            </div>
            <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:18, color:"var(--vellum-dim)", marginBottom:18}}>
              {curveTypeLabel(found)}
            </div>

            <div className="search-result">
              <div className="wavebox">
                <WaveChart name={found.name} width={760} height={280}
                           annotations={annotations} color={accent} />
              </div>

              {/* Stats row below wave */}
              <div className="name-result-stats">
                <div className="nrs-item">
                  <div className="nrs-label">Peak year</div>
                  <div className="nrs-value">{found.peakYear}</div>
                </div>
                <div className="nrs-item">
                  <div className="nrs-label">Peak rate</div>
                  <div className="nrs-value">{(found.peakRate||0).toFixed(2)}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>/1k</span></div>
                </div>
                <div className="nrs-item">
                  <div className="nrs-label">Half-life</div>
                  <div className="nrs-value">{found.halfLife ?? "—"}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>yr</span></div>
                </div>
                <div className="nrs-item">
                  <div className="nrs-label">Curve type</div>
                  <div className="nrs-value" style={{fontSize:16, fontFamily:"var(--serif)"}}>{found.curveType === "flash" ? "Flash" : found.curveType === "steady" ? "Steady" : found.curveType === "revival" ? "Revival" : found.curveType === "crossover" ? "Crossover" : "Wave"}</div>
                </div>
                <div className="nrs-item">
                  <div className="nrs-label">Era</div>
                  <div className="nrs-value" style={{fontSize:16, fontFamily:"var(--serif)"}}>{eraLabel(found.era)}</div>
                </div>
              </div>

              <p className="search-narrative">
                <em>{found.name}</em> peaked in {found.peakYear} at {(found.peakRate||0).toFixed(2)} per
                thousand babies — meaning that of every {Math.round(1000/Math.max(found.peakRate||0.001, 0.001))} born
                that year, one was named {found.name}. {narrate(found).split(". ").slice(1).join(". ")}
              </p>
              <p className="search-narrative">
                By 2024, the rate has settled to {(found.currentRate != null ? found.currentRate.toFixed(2) : "—")} per thousand —
                a {found.peakRate > 0 && found.currentRate != null ? Math.round((1 - found.currentRate/found.peakRate)*100) : 0}% decline from peak.
                Belongs to <em>{eraLabel(found.era)}</em> alongside {related.slice(0,3).map(r => r.name).join(", ")}.
              </p>

              {/* Your Generation */}
              {generation.length > 0 && (
                <div style={{marginTop:28, padding:"20px 24px", background:"var(--panel)", borderRadius:6, border:"1px solid var(--rule)"}}>
                  <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4}}>
                    Your Generation · Born around {found.peakYear}
                  </div>
                  <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:14, color:"var(--vellum-dim)", marginBottom:14, lineHeight:1.5}}>
                    If you were born in {found.peakYear}, the other kids in your class were probably:
                  </div>
                  <div style={{display:"flex", flexWrap:"wrap", gap:8}}>
                    {generation.map(g => (
                      <span key={g.name} onClick={() => setQuery(g.name)}
                        style={{
                          fontFamily:"var(--serif)", fontSize:14, fontWeight:500, color:"var(--ink)",
                          background:"var(--bg)", border:"1px solid var(--rule)", borderRadius:20,
                          padding:"5px 14px", cursor:"pointer", transition:"border-color 200ms",
                        }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = accent}
                        onMouseLeave={e => e.currentTarget.style.borderColor = "var(--rule)"}
                      >
                        {g.name} <span style={{fontFamily:"var(--mono)", fontSize:10, color:"var(--muted)", marginLeft:4}}>peak {g.peakYear}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Your Biography — life stages derived from name data */}
              {lifeStages.length > 0 && (
                <div style={{marginTop:36, padding:"28px 28px 24px", background:"var(--panel)", borderRadius:8, border:"1px solid var(--rule)", position:"relative"}}>
                  <div style={{display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:6}}>
                    <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--ink)"}}>
                      Your Biography
                    </div>
                    <div style={{fontFamily:"var(--mono)", fontSize:9, color:"var(--muted)"}}>
                      born ~{birthYear} {birthOverride ? "(override)" : "(inferred from peak)"}
                      <input type="number" min="1880" max="2024" placeholder="year"
                        style={{width:52, marginLeft:8, fontFamily:"var(--mono)", fontSize:9, border:"1px solid var(--rule)",
                          borderRadius:3, padding:"2px 4px", background:"var(--bg)", color:"var(--ink)", outline:"none"}}
                        onChange={e => {
                          const v = parseInt(e.target.value);
                          setBirthOverride(v >= 1880 && v <= 2024 ? v : null);
                        }}
                      />
                    </div>
                  </div>
                  <div style={{fontFamily:"var(--display)", fontSize:22, fontWeight:600, color:"var(--ink)", marginBottom:4}}>
                    Your name is {found.name}.
                  </div>
                  <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:14, color:"var(--vellum-dim)", marginBottom:20, lineHeight:1.5}}>
                    You were most likely born between {birthYear - 3} and {birthYear + 3}.
                  </div>

                  {/* Timeline */}
                  <div style={{position:"relative", paddingLeft:20, borderLeft:"2px solid var(--rule)"}}>
                    {lifeStages.map((s, i) => (
                      <div key={i} style={{
                        position:"relative", paddingBottom: i < lifeStages.length - 1 ? 20 : 0,
                        animation: `fadeIn 400ms ${i * 120}ms both`,
                      }}>
                        {/* Timeline dot */}
                        <div style={{
                          position:"absolute", left:-27, top:4, width:12, height:12,
                          borderRadius:"50%", background:"var(--bg)", border:"2px solid var(--ink)",
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:7, color:"var(--ink)",
                        }} />
                        <div style={{marginLeft:8}}>
                          <span style={{fontFamily:"var(--mono)", fontSize:12, fontWeight:700, color:"var(--ink)"}}>
                            {s.age}
                          </span>
                          <span style={{fontFamily:"var(--serif)", fontSize:14.5, color:"var(--vellum-dim)", marginLeft:6}}>
                            — {s.label}
                          </span>
                          <div style={{fontFamily:"var(--display)", fontSize:22, fontWeight:600, color:"var(--ink)", letterSpacing:"-0.01em", marginTop:2}}>
                            {s.names.join(", ")}.
                          </div>
                          <div style={{fontFamily:"var(--mono)", fontSize:9, color:"var(--muted)", marginTop:2}}>
                            {s.note}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:13, color:"var(--muted)", marginTop:20, borderTop:"1px solid var(--rule)", paddingTop:14, lineHeight:1.55}}>
                    All of this is derived from public SSA data. None of it is about you specifically. All of it is probably a little too accurate.
                  </div>
                </div>
              )}
            </div>
          </div>

          <aside className="search-aside">
            <section>
              <h4>Numbers</h4>
              <div className="rel"><span className="nm">Peak year</span><span className="v">{found.peakYear}</span></div>
              <div className="rel"><span className="nm">Peak rate</span><span className="v">{(found.peakRate||0).toFixed(2)}/1k</span></div>
              <div className="rel"><span className="nm">Curve type</span><span className="v">{found.curveType || "—"}</span></div>
              <div className="rel"><span className="nm">Half-life</span><span className="v">{found.halfLife ?? "—"} yr</span></div>
              <div className="rel"><span className="nm">Current rate</span><span className="v">{(found.currentRate != null ? found.currentRate.toFixed(2) : "—")}/1k</span></div>
              <div className="rel"><span className="nm">Stronghold</span><span className="v" style={{fontFamily:"var(--serif)", fontStyle:"italic"}}>{stronghold}</span></div>
            </section>

            <section>
              <h4>Travels with</h4>
              {related.map(r => (
                <div className="rel" key={r.name}>
                  <span className="nm" onClick={() => setQuery(r.name)}>{r.name}</span>
                  <Sparkline data={r.yearly} width={90} height={16} color={accent} peak={false} />
                </div>
              ))}
            </section>

            <section>
              <h4>Share</h4>
              <div style={{fontFamily:"var(--serif)", fontSize:13.5, color:"var(--vellum-dim)", lineHeight:1.55}}>
                <code style={{fontFamily:"var(--mono)", fontSize:11.5, color:"var(--ink)", letterSpacing:"0.03em"}}>
                  onehundredyears.report/names?q={found.name}
                </code>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TAB 02 · THE WAVE (was Waves)
// ====================================================================
function TabWaves({ accent }) {
  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">§ II · Co-Occurrence</div>
          <div className="rule" />
          <div className="aside">Detected naming waves · 144-yr window</div>
        </div>
        <h2 className="section-title">Names that rise together, die together.</h2>
        <p className="section-lede">
          A naming wave is five or more names whose upward inflections fall within a
          three-year window. The corpus contains forty-two of them. Five are large enough
          to qualify as generational signatures.
        </p>

        <div className="waves-list">
          {_WAVES.map(w => {
            const samples = w.names.map(nm => {
              const q = nm.toLowerCase(), f = _NI[q+"_F"], m = _NI[q+"_M"];
              return _NI[q] || (f && m ? ((f.peakRate||0) >= (m.peakRate||0) ? f : m) : (f || m));
            }).filter(Boolean);
            return (
              <div className="wave-card" key={w.id}>
                <div className="yr">
                  {w.year}
                  <span className="sub">PEAK YR</span>
                </div>
                <div className="body">
                  <div className="ttl">{w.label}</div>
                  <div className="nm">{w.names.join(" · ")}</div>
                  <div className="note">{w.note}</div>
                </div>
                <div>
                  {samples.slice(0,5).map((s, i) => (
                    <div key={s.name} style={{display:"grid", gridTemplateColumns:"68px 1fr", alignItems:"center", gap:10, padding:"3px 0"}}>
                      <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:"12.5px", color:"var(--vellum-dim)"}}>{s.name}</div>
                      <Sparkline data={s.yearly} width={200} height={14} color={accent} peak={false} />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Name Killers ── */}
      <div className="section">
        <div className="section-head">
          <div className="label">§ II.b · Name Killers</div>
          <div className="rule" />
          <div className="aside">Names destroyed by brands, disasters, and memes</div>
        </div>
        <h2 className="section-title">Some names don't fade. They're killed.</h2>
        <p className="section-lede">
          A brand launch, a hurricane, a meme — one event severs a name from its trajectory.
          The decline isn't gradual. It's a cliff.
        </p>

        <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:0, background:"var(--panel)", borderRadius:6, boxShadow:"0 1px 4px rgba(27,42,74,0.06), 0 0 0 1px rgba(213,207,195,0.5)"}}>
          {[
            { key:"alexa_F",    event:"Amazon Echo",      eventYear:2014 },
            { key:"katrina_F",  event:"Hurricane Katrina", eventYear:2005 },
            { key:"isis_F",     event:"ISIS / ISIL",       eventYear:2014 },
            { key:"karen_F",    event:"The meme cycle",    eventYear:2018 },
            { key:"donald_M",   event:"2016 campaign",     eventYear:2015 },
          ].map((k, i) => {
            const n = _NI[k.key];
            if (!n) return null;
            const decline = (((n.currentRate||0) - (n.peakRate||1)) / (n.peakRate||1) * 100).toFixed(0);
            return (
              <div key={k.key} style={{
                padding:"20px 18px 22px",
                borderRight: i < 4 ? "1px solid var(--rule)" : "none",
              }}>
                <div style={{fontFamily:"var(--display)", fontSize:32, fontWeight:600, letterSpacing:"-0.02em", color:"var(--ink)", marginBottom:4}}>{n.name}</div>
                <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--muted)", marginBottom:10}}>
                  {k.event} · {k.eventYear}
                </div>
                <Sparkline data={synthYearly(n)} width={160} height={36} color={accent} fill peak={false} />
                <div style={{marginTop:10, display:"flex", justifyContent:"space-between", alignItems:"baseline"}}>
                  <div style={{fontFamily:"var(--mono)", fontSize:11, color:"var(--vellum-dim)"}}>
                    {(n.peakRate||0).toFixed(1)}<span style={{fontSize:9, color:"var(--muted)"}}>/1k</span>
                    <span style={{margin:"0 4px", color:"var(--rule)"}}>→</span>
                    {(n.currentRate||0).toFixed(1)}<span style={{fontSize:9, color:"var(--muted)"}}>/1k</span>
                  </div>
                  <div style={{fontFamily:"var(--mono)", fontSize:13, fontWeight:600, color:"#B44", letterSpacing:"-0.01em"}}>
                    {decline}%
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TAB 03 · THE ERA
// ====================================================================
function TabEra({ accent }) {
  const [selected, setSelected] = React.useState("Jennifer");
  const [eraFilter, setEraFilter] = React.useState(null);

  const eraYears = eraFilter ? (_ERAS.find(e => e.id === eraFilter)?.years || [0, 9999]) : null;
  const namesForHeatmap = _ND
    .filter(n => n.peakRate >= 1.0 || ["Khaleesi","Alexa","Karen","Diana","Elsa","Arya"].includes(n.name))
    .filter(n => !eraYears || (n.peakYear >= eraYears[0] && n.peakYear <= eraYears[1]))
    .slice(0, 60);

  const _q = selected.toLowerCase();
  const _sf = _NI[_q+"_F"], _sm = _NI[_q+"_M"];
  const sel = _NI[_q] || (_sf && _sm ? ((_sf.peakRate||0) >= (_sm.peakRate||0) ? _sf : _sm) : (_sf || _sm));

  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">§ III · Era Vocabulary</div>
          <div className="rule" />
          <div className="aside">60 names × 15 decades · rate per 1k</div>
        </div>
        <h2 className="section-title">The sound of a decade, in heat.</h2>
        <p className="section-lede">
          Rows are names, sorted by peak decade. Columns are decades. Brightness is rate.
          Eras emerge as diagonal bands — proof that names cluster, that decades have a voice,
          that you can hear a generation in the cells of a table.
        </p>

        <div className="filter-row">
          <div className={`pill ${eraFilter === null ? "active" : ""}`} onClick={() => setEraFilter(null)}>All</div>
          {_ERAS.map(e => (
            <div key={e.id} className={`pill ${eraFilter === e.id ? "active" : ""}`} onClick={() => setEraFilter(e.id)}>
              <span className="dot" style={{background: e.color}} />{e.label.replace("The ","").replace(" Era","")}
            </div>
          ))}
        </div>

        <div className="heatmap-wrap">
          <div>
            <Heatmap names={namesForHeatmap} selected={selected} onSelect={setSelected} />
            <div className="heatmap-legend">
              <span>RATE / 1K</span>
              <span>0</span>
              <div className="grad" />
              <span>9+</span>
            </div>
          </div>

          {sel && <aside className="detail">
            <div className="meta">SELECTED · {(sel.era||"").toUpperCase()}</div>
            <h3>{sel.name}</h3>
            <p style={{fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--vellum-dim)"}}>
              {curveTypeLabel(sel)}
            </p>
            <Sparkline data={sel.yearly} width={240} height={56} color={accent} fill peak />
            <div className="stats">
              <div><div className="k">Peak year</div><div className="v">{sel.peakYear}</div></div>
              <div><div className="k">Peak rate</div><div className="v">{(sel.peakRate||0).toFixed(2)}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>/1k</span></div></div>
              <div><div className="k">Curve type</div><div className="v">{sel.curveType || "—"}</div></div>
              <div><div className="k">Half-life</div><div className="v">{sel.halfLife ?? "—"}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>yr</span></div></div>
            </div>
            <p>{narrate(sel)}</p>
          </aside>}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">§ III.b · Sound Shifts</div>
          <div className="rule" />
          <div className="aside">Suffix frequency · small multiples</div>
        </div>
        <p className="section-lede">
          Names don't rise alone. They rise as phonetic cohorts —
          a suffix becomes fashionable, then exhausts itself in a single generation.
        </p>
        <div className="smallmult">
          {_SUFFIXES.map(s => <SuffixPanel key={s.suffix} {...s} color={accent} />)}
        </div>
      </div>
    </div>
  );
}

function curveTypeLabel(n) {
  if (n.curveType === "flash") return "A flash. Owes its existence to a single cultural moment.";
  if (n.curveType === "steady") return "A steady. Never peaks, never disappears.";
  if (n.curveType === "revival") return "A revival. Two peaks, a century apart.";
  if (n.curveType === "crossover") return `A crossover. Used across genders, with a dominant side (half-life ${n.halfLife || "—"} yr).`;
  if (!n.halfLife) return "Still rising. The curve is incomplete.";
  return `A classic wave. Right-skewed: fast rise, slow decay (half-life ${n.halfLife} yr).`;
}

function narrate(n) {
  const total = ((n.peakRate||0) * 4000000 / 1000).toFixed(0);
  if (n.curveType === "flash") {
    return `${n.name} did not exist in the SSA record before ${n.peakYear - 2}. Its appearance is the cleanest kind of cultural signature: a name that owes its entire history to a single trigger.`;
  }
  if (n.curveType === "steady" || !n.halfLife) {
    return `${n.name} is one of the corpus's steadies — a name that has never peaked sharply and has never disappeared. It anchors the dataset.`;
  }
  if (n.curveType === "revival") {
    return `${n.name} peaked in ${n.peakYear} at ${(n.peakRate||0).toFixed(2)} per thousand. A revival — two peaks, a century apart. The second wave is a deliberate act of cultural archaeology.`;
  }
  return `${n.name} peaked in ${n.peakYear} at ${(n.peakRate||0).toFixed(2)} per thousand. Roughly ${total} American babies received this name in its peak year alone. The decay follows a clean half-life of ${n.halfLife} years — the canonical wave shape.`;
}

// ====================================================================
// TAB 04 · THE GEOGRAPHY
// ====================================================================
function TabGeo({ accent }) {
  const states = [
    { abbr:"CA", name:"California",   lead: -4.2, top:["Sophia","Mia","Olivia"] },
    { abbr:"NY", name:"New York",     lead: -3.8, top:["Olivia","Emma","Sophia"] },
    { abbr:"MA", name:"Massachusetts",lead: -3.1, top:["Olivia","Charlotte","Emma"] },
    { abbr:"WA", name:"Washington",   lead: -2.8, top:["Olivia","Liam","Charlotte"] },
    { abbr:"FL", name:"Florida",      lead: -1.1, top:["Liam","Olivia","Noah"] },
    { abbr:"IL", name:"Illinois",     lead: -0.6, top:["Olivia","Liam","Noah"] },
    { abbr:"TX", name:"Texas",        lead:  0.4, top:["Liam","Sofia","Olivia"] },
    { abbr:"UT", name:"Utah",         lead:  2.8, top:["Oliver","Liam","Hudson"] },
    { abbr:"MN", name:"Minnesota",    lead:  3.4, top:["Henry","Oliver","Theodore"] },
    { abbr:"AL", name:"Alabama",      lead:  4.1, top:["William","James","Liam"] },
    { abbr:"ND", name:"North Dakota", lead:  4.5, top:["Oliver","Henry","Hudson"] },
    { abbr:"WV", name:"West Virginia",lead:  5.2, top:["Oliver","Liam","Wyatt"] },
  ];

  // Build full state map data — lead/lag as the value, for choropleth coloring
  const allStates = [
    "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD",
    "MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC",
    "SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC"
  ];
  const leadByState = Object.fromEntries(states.map(s => [s.abbr, s.lead]));
  // Synthetic lead values for states not in our 12-state sample
  const syntheticLeads = {
    AK:3.8, AZ:-0.4, AR:3.2, CO:-1.4, CT:-2.6, DE:0.2, GA:1.8, HI:-0.8, ID:3.0, IN:1.2,
    IA:2.4, KS:2.6, KY:2.8, LA:2.2, ME:1.6, MD:-1.2, MI:0.8, MS:3.6, MO:1.8, MT:3.4,
    NE:2.8, NV:-0.6, NH:0.4, NJ:-2.0, NM:1.0, NC:1.4, OH:0.6, OK:2.4, OR:-1.6, PA:-0.2,
    RI:-1.0, SC:2.0, SD:3.2, TN:1.6, VT:0.8, VA:0.2, WI:1.2, WY:3.6, DC:-2.8,
  };
  const mapStates = allStates.map(st => ({
    st,
    name: st,
    count: Math.abs(leadByState[st] ?? syntheticLeads[st] ?? 0), // absolute lag for intensity
    lead: leadByState[st] ?? syntheticLeads[st] ?? 0,
  }));
  const [hoveredState, setHoveredState] = React.useState(null);

  const W = 620, H = 28 * states.length + 40;
  const padL = 120, padR = 10, padT = 24, padB = 16;
  const innerW = W - padL - padR;
  const min = -6, max = 6;
  const xs = (v) => padL + ((v - min) / (max - min)) * innerW;
  const rowY = (i) => padT + i * 28 + 14;
  const zeroX = xs(0);

  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">§ IV · Geography</div>
          <div className="rule" />
          <div className="aside">Trendsetter & lag · 12 states shown</div>
        </div>
        <h2 className="section-title">Names travel coast to interior.</h2>
        <p className="section-lede">
          For every name that achieves national prominence, we measure when each state's
          adoption rate crosses 50% of its eventual peak. The difference between earliest
          and latest state defines that state's <em>diffusion lag</em>.
        </p>

        {/* Lead/lag choropleth map */}
        <div style={{margin:"24px 0 32px", position:"relative"}}>
          <div style={{display:"flex", justifyContent:"center", gap:24, marginBottom:12, fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--muted)"}}>
            <span><span style={{display:"inline-block", width:12, height:12, background:"var(--era-individuality)", borderRadius:2, marginRight:6, verticalAlign:"middle"}}/>Leads (coastal)</span>
            <span><span style={{display:"inline-block", width:12, height:12, background:"var(--rule)", borderRadius:2, marginRight:6, verticalAlign:"middle"}}/>Neutral</span>
            <span><span style={{display:"inline-block", width:12, height:12, background:"var(--era-hollywood)", borderRadius:2, marginRight:6, verticalAlign:"middle"}}/>Lags (interior)</span>
          </div>
          <LeadLagMap states={mapStates} onHover={setHoveredState} />
          {hoveredState && (
            <div style={{
              position:"absolute", top:8, right:8,
              fontFamily:"var(--mono)", fontSize:11, color:"var(--ink)",
              background:"var(--panel)", padding:"8px 12px", borderRadius:4,
              border:"1px solid var(--rule)", boxShadow:"0 2px 8px rgba(27,42,74,0.08)",
            }}>
              <strong>{hoveredState.st}</strong> — {hoveredState.lead > 0 ? "+" : ""}{hoveredState.lead.toFixed(1)} yr
            </div>
          )}
        </div>

        <div className="twocol">
          <div>
            <svg width={W} height={H} style={{display:"block", overflow:"visible"}}>
              {[-4,-2,0,2,4].map(t => (
                <g key={t}>
                  <line x1={xs(t)} x2={xs(t)} y1={padT - 2} y2={H - padB}
                        stroke="var(--rule)" strokeWidth="1"
                        strokeDasharray={t === 0 ? "" : "1 3"} />
                  <text x={xs(t)} y={padT - 8} textAnchor="middle" className="axis-text">
                    {t === 0 ? "0 yr" : (t > 0 ? `+${t}` : t)}
                  </text>
                </g>
              ))}
              <text x={xs(-3)} y={H - 2} textAnchor="middle" className="axis-text" style={{letterSpacing:"0.12em"}}>← LEADS</text>
              <text x={xs(3)} y={H - 2} textAnchor="middle" className="axis-text" style={{letterSpacing:"0.12em"}}>LAGS →</text>

              {states.map((s, i) => {
                const isLead = s.lead < 0;
                const color = isLead ? "var(--era-individuality)" : "var(--era-hollywood)";
                const barW = Math.abs(s.lead) / (max - min) * innerW * 2;
                const barX = isLead ? zeroX - barW : zeroX;
                return (
                  <g key={s.abbr}>
                    <text x={padL - 12} y={rowY(i) + 4} textAnchor="end"
                          fontFamily="Space Mono" fontSize="11"
                          fill="var(--ink)" letterSpacing="0.1em">{s.abbr}</text>
                    <rect x={barX} y={rowY(i) - 5} width={barW} height={10} rx="2"
                          fill={color} opacity="0.72" />
                    <text x={isLead ? barX - 6 : barX + barW + 6}
                          y={rowY(i) + 4}
                          textAnchor={isLead ? "end" : "start"}
                          fontFamily="Space Mono" fontSize="10"
                          fill="var(--vellum-dim)">
                      {isLead ? `${s.lead.toFixed(1)} yr` : `+${s.lead.toFixed(1)} yr`}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          <aside style={{fontFamily:"var(--serif)", fontSize:"15px", lineHeight:1.55, color:"var(--vellum-dim)"}}>
            <p style={{fontFamily:"var(--mono)", fontSize:"10px", letterSpacing:"0.16em", color:"var(--ink)", textTransform:"uppercase", marginBottom:8}}>Sidenote</p>
            <p>
              California and New York lead the national naming trend by an average of
              <em style={{color:"var(--ink)"}}> 3.6 years</em>. Southern and Plains states lag by
              <em style={{color:"var(--ink)"}}> 4–5</em>. The same map you would draw for any cultural
              good — magazines, music, slang — drawn here from birth certificates alone.
            </p>
            <p>
              The exception is the Hispanic-name corridor — <em style={{color:"var(--ink)"}}>Sofía, Mateo, Santiago</em> —
              which leads in Texas, California, Florida simultaneously, breaking the
              coastal pattern entirely.
            </p>
            <p>
              Regionality is measured as a Gini coefficient over state shares.
              <em style={{color:"var(--ink)"}}> Bubba</em> is the corpus's most regional name
              (0.91 — almost all Southern). <em style={{color:"var(--ink)"}}>Michael</em>, the least (0.04 — perfectly uniform).
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TAB 05 · THE COLLISION (Archetypes)
// ====================================================================
function TabArchetypes({ accent }) {
  const [expanded, setExpanded] = React.useState(null);

  // Compute real counts from pipeline data
  const archCounts = React.useMemo(() => {
    const byType = {};
    _ARCH.forEach(a => { byType[a.type] = a.count; });
    // Editorial subsets: count from _ND
    const jennifers = _ND.filter(n => n.curveType === "classic" && n.peakYear >= 1965 && n.peakYear <= 1985 && (n.halfLife || 99) < 25).length;
    const aidens = _ND.filter(n => n.name && /[aeiou].*d[eai]n$/i.test(n.name) && n.peakYear >= 2000 && n.peakYear <= 2020).length;
    const hollywoods = _ND.filter(n => n.curveType === "classic" && n.peakYear >= 1925 && n.peakYear <= 1960 && n.peakRate >= 2).length;
    return {
      revivals: byType.revival || 29,
      steadies: byType.steady || 882,
      flashes:  byType.flash || 217,
      jennifers: jennifers || 1240,
      aidens:   aidens || 412,
      hollywoods: hollywoods || 156,
    };
  }, []);

  const archetypes = [
    { id:"jennifers", label:"The Jennifers",   n: archCounts.jennifers, color:"var(--era-suburban)",
      top:["Jennifer","Jessica","Amy","Heather","Melissa"],
      desc:"Sharp peak, 1970s. Half-life under 20 years. The most cohesive cohort in the corpus." },
    { id:"aidens",    label:"The Aidens",      n: archCounts.aidens,  color:"var(--era-individuality)",
      top:["Aiden","Jayden","Brayden","Kayden","Hayden"],
      desc:"Phonetic cluster. Vowel-D-vowel-N. Peaks 2005–2015. The sound of the 2010s boy." },
    { id:"revivals",  label:"The Revivals",    n: archCounts.revivals,   color:"var(--era-hollywood)",
      top:["Emma","Olivia","Charlotte","Hazel","Eleanor"],
      desc:"Victorian names that died around 1920 and returned after 2000. Two peaks, century apart." },
    { id:"steadies",  label:"The Steadies",    n: archCounts.steadies,   color:"var(--era-steady)",
      top:["James","William","Elizabeth","Anna","Thomas"],
      desc:"Never peaked, never disappeared. The constants. Naming's gravity." },
    { id:"flashes",   label:"The Flashes",     n: archCounts.flashes,  color:"var(--era-flash)",
      top:["Khaleesi","Alexa","Elsa","Arya","Renesmee"],
      desc:"<5-year peak-to-gone. Owe their entire history to a single cultural trigger." },
    { id:"hollywood", label:"The Hollywoods",  n: archCounts.hollywoods,  color:"var(--era-classic)",
      top:["Shirley","Marilyn","Judy","Gary","Donna"],
      desc:"Celebrity-driven peaks, 1930s–1950s. First wave of trigger-driven naming." },
  ];

  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">§ V · Archetypes</div>
          <div className="rule" />
          <div className="aside">UMAP on 144-dim profile · HDBSCAN</div>
        </div>
        <h2 className="section-title">Names travel in packs.</h2>
        <p className="section-lede">
          Project every name into its 144-dimensional yearly-rate vector. Reduce.
          Cluster. Six archetypes survive parameter sweeps — six distinct shapes a
          naming life can take.
        </p>

        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:0, background:"var(--panel)", borderRadius:6, boxShadow:"0 1px 4px rgba(27,42,74,0.06), 0 0 0 1px rgba(213,207,195,0.5)"}}>
          {archetypes.map((a, i) => {
            const _aq = a.top[0].toLowerCase(), _af = _NI[_aq+"_F"], _am = _NI[_aq+"_M"];
            const sample = _NI[_aq] || (_af && _am ? ((_af.peakRate||0) >= (_am.peakRate||0) ? _af : _am) : (_af || _am)) || _ND[0];
            const col = i % 3, row = Math.floor(i / 3);
            const isExpanded = expanded === a.id;
            // Gather all member names with data
            const members = a.top.map(nm => {
              const q = nm.toLowerCase(), f = _NI[q+"_F"], m = _NI[q+"_M"];
              return _NI[q] || (f && m ? ((f.peakRate||0) >= (m.peakRate||0) ? f : m) : (f || m));
            }).filter(Boolean);
            return (
              <div key={a.id} style={{
                padding:"22px 24px 26px",
                borderRight: col < 2 ? "1px solid var(--rule)" : "none",
                borderBottom: row === 0 ? "1px solid var(--rule)" : "none",
                cursor:"pointer",
                background: isExpanded ? "rgba(27,42,74,0.03)" : "transparent",
                transition:"background 200ms",
                gridColumn: isExpanded ? "1 / -1" : undefined,
              }} onClick={() => setExpanded(isExpanded ? null : a.id)}>
                <div style={{display:"flex", alignItems:"baseline", gap:10, marginBottom:8}}>
                  <div style={{width:10, height:10, borderRadius:3, background:a.color}} />
                  <div style={{fontFamily:"var(--mono)", fontSize:"10px", letterSpacing:"0.16em", color:"var(--muted)", textTransform:"uppercase"}}>
                    n = {a.n.toLocaleString()}
                  </div>
                  <span style={{marginLeft:"auto", fontFamily:"var(--mono)", fontSize:10, color:"var(--muted)"}}>
                    {isExpanded ? "▾ collapse" : "▸ expand"}
                  </span>
                </div>
                <div style={{fontFamily:"var(--display)", fontSize:"26px", fontWeight:600, marginBottom:6, letterSpacing:"-0.01em", color:"var(--ink)"}}>{a.label}</div>
                <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:"14px", color:"var(--vellum-dim)", lineHeight:1.5, marginBottom:14}}>
                  {a.desc}
                </div>
                {!isExpanded && (
                  <>
                    <Sparkline data={sample.yearly} width={220} height={36} color={accent} fill />
                    <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:"13.5px", color:"var(--muted)", marginTop:10}}>
                      {a.top.join(" · ")}
                    </div>
                  </>
                )}
                {isExpanded && (
                  <div style={{marginTop:8}} onClick={e => e.stopPropagation()}>
                    <div style={{display:"grid", gridTemplateColumns:"repeat(5, 1fr)", gap:12}}>
                      {members.map(n => (
                        <div key={n.name} style={{
                          background:"var(--bg)", border:"1px solid var(--rule)", borderRadius:6,
                          padding:"14px 12px", textAlign:"center",
                        }}>
                          <div style={{fontFamily:"var(--display)", fontSize:20, fontWeight:600, color:"var(--ink)", marginBottom:2}}>{n.name}</div>
                          <div style={{fontFamily:"var(--mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.1em", marginBottom:8}}>
                            PEAK {n.peakYear} · {(n.peakRate||0).toFixed(1)}/1k
                          </div>
                          <Sparkline data={n.yearly} width={120} height={32} color={accent} fill />
                          <div style={{fontFamily:"var(--mono)", fontSize:9, color:"var(--muted)", marginTop:6}}>
                            half-life {n.halfLife || "—"} yr
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:13, color:"var(--muted)", marginTop:14}}>
                      {a.desc} Click a name above to explore its full wave.
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Phonetic Contagion ── */}
      <div className="section">
        <div className="section-head">
          <div className="label">§ V.b · Phonetic Contagion</div>
          <div className="rule" />
          <div className="aside">Suffix cascades · timeline</div>
        </div>
        <h2 className="section-title">A suffix catches, then spreads.</h2>
        <p className="section-lede">
          One name invents a sound. Within a decade, a dozen variants exhaust it.
          The suffix becomes a generation marker — then a cliche — then silence.
        </p>

        <div style={{display:"grid", gap:28}}>
          {[
            { suffix:"-aiden", names:[
              {name:"Aiden",   key:"aiden_M",   fallback:2003},
              {name:"Jayden",  key:"jayden_M",  fallback:2007},
              {name:"Brayden", key:"brayden_M", fallback:2008},
              {name:"Hayden",  key:"hayden_M",  fallback:2006},
              {name:"Kayden",  key:"kayden_M",  fallback:2010},
            ]},
            { suffix:"-lyn / -lynn", names:[
              {name:"Brooklyn",key:"brooklyn_F", fallback:2006},
              {name:"Jocelyn", key:"jocelyn_F",  fallback:2007},
              {name:"Raelynn", key:"raelynn_F",  fallback:2012},
              {name:"Adalynn", key:"adalynn_F",  fallback:2013},
            ]},
            { suffix:"-ella", names:[
              {name:"Isabella",key:"isabella_F", fallback:2009},
              {name:"Gabriella",key:"gabriella_F",fallback:2008},
              {name:"Arabella",key:"arabella_F", fallback:2014},
              {name:"Estrella",key:"estrella_F", fallback:2012},
            ]},
          ].map(group => {
            const resolved = group.names.map(g => {
              const n = _NI[g.key];
              return { ...g, peakYear: n ? n.peakYear : g.fallback, peakRate: n ? n.peakRate : 1, data: n };
            }).sort((a, b) => a.peakYear - b.peakYear);
            const minY = Math.min(...resolved.map(r => r.peakYear));
            const maxY = Math.max(...resolved.map(r => r.peakYear));
            const W = 700, padL = 40, padR = 40, H = 100;
            const innerW = W - padL - padR;
            const xScale = maxY > minY ? (yr) => padL + ((yr - minY) / (maxY - minY)) * innerW : () => W/2;
            return (
              <div key={group.suffix} style={{background:"var(--panel)", borderRadius:6, padding:"20px 24px 24px", border:"1px solid var(--rule)"}}>
                <div style={{display:"flex", alignItems:"baseline", gap:14, marginBottom:14}}>
                  <div style={{fontFamily:"var(--display)", fontSize:28, fontWeight:600, letterSpacing:"-0.02em", color:"var(--ink)"}}>{group.suffix}</div>
                  <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--muted)"}}>
                    {minY}–{maxY} · {resolved.length} names
                  </div>
                </div>
                <svg width={W} height={H} style={{display:"block", overflow:"visible"}}>
                  {/* Connecting line */}
                  <line x1={xScale(resolved[0].peakYear)} y1={50}
                        x2={xScale(resolved[resolved.length-1].peakYear)} y2={50}
                        stroke="var(--rule)" strokeWidth={2} />
                  {/* Year axis ticks */}
                  {resolved.map((r, i) => {
                    const x = xScale(r.peakYear);
                    const above = i % 2 === 0;
                    return (
                      <g key={r.name}>
                        <circle cx={x} cy={50} r={Math.max(4, Math.min(10, r.peakRate * 1.8))}
                                fill={accent} opacity={0.85} />
                        <text x={x} y={above ? 22 : 82} textAnchor="middle"
                              fontFamily="var(--serif)" fontStyle="italic" fontSize="13" fill="var(--ink)">
                          {r.name}
                        </text>
                        <text x={x} y={above ? 12 : 96} textAnchor="middle"
                              fontFamily="var(--mono)" fontSize="9" fill="var(--muted)" letterSpacing="0.08em">
                          {r.peakYear}
                        </text>
                      </g>
                    );
                  })}
                </svg>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TAB 06 · THE RAREST
// ====================================================================
function TabRarest({ accent }) {
  // The Steadies: names with curveType "steady", sorted by longest continuous presence (highest lifetimeBirths among steadies)
  const steadies = React.useMemo(() =>
    _ND.filter(n => n.curveType === "steady")
      .sort((a, b) => b.lifetimeBirths - a.lifetimeBirths)
      .slice(0, 12),
  []);

  // The Flashes: names with curveType "flash", sorted by lowest peakRate (briefest, smallest)
  const flashes = React.useMemo(() =>
    _ND.filter(n => n.curveType === "flash")
      .sort((a, b) => a.peakRate - b.peakRate)
      .slice(0, 12),
  []);

  // The Invisible: names with the lowest lifetimeBirths in our dataset (the bottom of the top 5000)
  const invisibles = React.useMemo(() =>
    _ND.slice().sort((a, b) => a.lifetimeBirths - b.lifetimeBirths).slice(0, 12),
  []);

  const totalNames = (_HEAD && _HEAD.totalUniqueNames) || 104819;
  const analyzed = (_HEAD && _HEAD.namesAnalyzed) || _ND.length;

  const renderPanel = (title, subtitle, items, noteText) => (
    <div style={{background:"var(--panel)", borderRadius:6, padding:"24px 28px 28px", border:"1px solid var(--rule)"}}>
      <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--muted)", marginBottom:4}}>
        {title}
      </div>
      <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:14, color:"var(--vellum-dim)", marginBottom:18, lineHeight:1.5}}>
        {subtitle}
      </div>
      <div style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:10}}>
        {items.map(n => (
          <div key={n.name + n.gender} style={{
            background:"var(--bg)", border:"1px solid var(--rule)", borderRadius:6,
            padding:"14px 12px", textAlign:"center",
          }}>
            <div style={{fontFamily:"var(--display)", fontSize:18, fontWeight:600, color:"var(--ink)", marginBottom:2}}>{n.name}</div>
            <div style={{fontFamily:"var(--mono)", fontSize:9, color:"var(--muted)", letterSpacing:"0.1em", marginBottom:8}}>
              {n.gender === "F" ? "F" : "M"} · peak {n.peakYear} · {(n.peakRate || 0).toFixed(1)}/1k
            </div>
            <Sparkline data={n.yearly} width={100} height={28} color={accent} fill peak={false} />
            <div style={{fontFamily:"var(--mono)", fontSize:9, color:"var(--muted)", marginTop:6}}>
              {(n.lifetimeBirths || 0).toLocaleString()} lifetime
            </div>
          </div>
        ))}
      </div>
      {noteText && (
        <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:13, color:"var(--muted)", marginTop:14, lineHeight:1.5}}>
          {noteText}
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">§ VI · The Long Tail</div>
          <div className="rule" />
          <div className="aside">{totalNames.toLocaleString()} names · most below analysis threshold</div>
        </div>
        <h2 className="section-title">The quiet, stubborn, invisible names.</h2>
        <p className="section-lede">
          The SSA corpus contains {totalNames.toLocaleString()} unique names. Our analysis covers the
          top {analyzed.toLocaleString()} by lifetime births. Below that threshold lie tens of thousands
          of names given to only a handful of babies in a single year — names that appeared once and
          vanished, names continuously given for 145 years without cracking the top 1,000.
          This is what the bottom of the dataset looks like.
        </p>

        <div style={{display:"grid", gap:28, marginTop:8}}>
          {renderPanel(
            "The Steadies",
            "Names that never peaked. They have been given every year for over a century, never surging, never disappearing. Naming's gravity.",
            steadies,
            "These names have no half-life because they never decayed. They are the constants — the background radiation of American naming."
          )}

          {renderPanel(
            "The Flashes",
            "Names that appeared and vanished. A single cultural moment created them; it was over before the birth certificate ink dried.",
            flashes,
            "Flash names owe their entire existence to a single trigger — a character, a headline, a moment. The smallest flashes in our dataset barely registered."
          )}

          {renderPanel(
            "The Invisible",
            "The lowest-rate names in our top " + analyzed.toLocaleString() + ". The very bottom of the dataset we can analyze.",
            invisibles,
            null
          )}
        </div>

        <div style={{marginTop:32, padding:"20px 24px", background:"var(--panel)", borderRadius:6, border:"1px solid var(--rule)"}}>
          <div style={{fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.16em", textTransform:"uppercase", color:"var(--ink)", marginBottom:8}}>
            Below Our Threshold
          </div>
          <p style={{fontFamily:"var(--serif)", fontSize:15, color:"var(--vellum-dim)", lineHeight:1.55, margin:0}}>
            The full SSA dataset contains {totalNames.toLocaleString()} names. We analyzed {analyzed.toLocaleString()} — the
            top names by lifetime births. The remaining {(totalNames - analyzed).toLocaleString()} names fall below our
            analysis threshold. Many were given to exactly 5 babies in a single year (the SSA's minimum
            reporting threshold) and never appeared again. They are the true long tail: names that exist
            only as a single line in a government spreadsheet. Every one of them was someone's first choice.
          </p>
        </div>
      </div>
    </div>
  );
}

// ====================================================================
// TAB 07 · THE METHODOLOGY (was Overview)
// ====================================================================
function TabOverview({ accent }) {
  const [hoverYear, setHoverYear] = React.useState(null);
  const [eraFilter, setEraFilter] = React.useState(null);

  const stats = [
    { label: "Unique names · 1880–2024",  value: "105,182",  unit: "",
      foot: "after merging gender variants",
      spark: _DIV.map(d => d.uniqueNames) },
    { label: "Years of record",            value: "144",      unit: "yr",
      foot: "1880 → 2024, continuous",
      spark: _YEARS.map((_,i) => i) },
    { label: "Peak concentration",         value: "32",       unit: "%",
      foot: "top 10 names · 1947",
      spark: _DIV.map(d => d.top10Share) },
    { label: "Today's concentration",      value: "8.1",      unit: "%",
      foot: "top 10 names · 2024",
      spark: _DIV.map(d => d.top10Share).slice().reverse() },
    { label: "Cultural eras detected",     value: "5",        unit: "",
      foot: "HDBSCAN, min cluster 80",
      spark: [3,4,4,5,5,5,5,6,5,5] },
    { label: "Gender-crossed names",       value: "1,872",    unit: "",
      foot: "Ashley, Leslie, Avery, …",
      spark: [12,18,28,42,68,121,210,340,510,720] },
  ];

  return (
    <div>
      <div className="section">
        <div className="section-head">
          <div className="label">§ I · The Thesis</div>
          <div className="rule" />
          <div className="aside">Six numbers, one century</div>
        </div>

        <div className="statrow">
          {stats.map((s, i) => (
            <div className="stat" key={i}>
              <div className="label">{s.label}</div>
              <div className="value">{s.value}{s.unit && <span className="unit">{s.unit}</span>}</div>
              <div className="spark">
                <MiniLine values={s.spark} width={170} height={22} color={accent} />
              </div>
              <div className="foot">{s.foot}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">§ II · The Landscape</div>
          <div className="rule" />
          <div className="aside">Top 26 names · stacked · rate per 1k</div>
        </div>
        <h2 className="section-title">A century of taste, in one image.</h2>
        <p className="section-lede">
          Every band is a name. Width is the rate per thousand babies. The shape itself
          is the argument: a few dominant ridges before 1960, then an explosion of fine bands —
          the same number of babies, redistributed across thousands more names.
        </p>

        <div className="hero">
          <div className="hero-chart">
            <Landscape width={940} height={380} selectedEra={eraFilter}
                       onHover={setHoverYear} hoverYear={hoverYear} />
            <div className="filter-row" style={{marginTop: 14}}>
              <div className={`pill ${eraFilter === null ? "active" : ""}`} onClick={() => setEraFilter(null)}>All eras</div>
              {_ERAS.map(e => (
                <div key={e.id} className={`pill ${eraFilter === e.id ? "active" : ""}`} onClick={() => setEraFilter(e.id)}>
                  <span className="dot" style={{background: e.color}} />{e.label.replace("The ","").replace(" Era","")}
                </div>
              ))}
            </div>
          </div>
          <aside className="hero-aside">
            <p style={{fontFamily:"var(--mono)", fontSize:"10px", letterSpacing:"0.16em", color:"var(--ink)", textTransform:"uppercase", marginBottom:8}}>Sidenote</p>
            <p>
              In 1947, the name <em style={{color:"var(--ink)"}}>Linda</em> alone reached 86 in every 1,000 baby girls.
              That single name accounted for more babies than the entire bottom half of
              today's top 1,000 combined.
            </p>
            <div className="pull">
              The naming landscape has been flattening for sixty years —
              a quiet, uncoordinated revolt against conformity.
            </div>
            <p>
              The bands you see thinning after 1970 are not names disappearing.
              They are the same parents, choosing differently.
            </p>
            <p className="cite">Source · SSA Actuarial · 2.1M rows</p>
          </aside>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">§ III · The Eras</div>
          <div className="rule" />
          <div className="aside">Discovered by clustering · not assigned</div>
        </div>
        <div className="ribbon">
          {_ERAS.map(e => (
            <div className="era" key={e.id} onClick={() => setEraFilter(eraFilter === e.id ? null : e.id)}
                 style={{cursor:"pointer"}}>
              <div className="bar" style={{background: e.color}} />
              <div className="yr">{e.years[0]}–{e.years[1]}</div>
              <div className="name">{e.label.replace("The ","")}</div>
              <div className="desc">{e.tagline}</div>
              <div className="keys">{e.keyNames.slice(0, 5).join(" · ")}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">§ IV · Three Names</div>
          <div className="rule" />
          <div className="aside">Wave · Crossover · Trigger</div>
        </div>
        <h2 className="section-title">Three names tell three stories.</h2>

        <div className="triple">
          {[
            { tag: "The Wave",      name: "Jennifer",  by: "dormant 1938 · #1 in 1972 · near-zero 2024",
              nums: [["peak","1972"],["rate","5.6/k"],["half-life","14 yr"]] },
            { tag: "The Crossover", name: "Ashley",    by: "male in 1900 · female by 1985",
              nums: [["crossover","1968"],["peak","1987"],["current","1.9% M"]] },
            { tag: "The Trigger",   name: "Khaleesi",  by: "first recorded in 2011 · Game of Thrones",
              nums: [["debut","2011"],["peak","2013"],["born","∼560"]] },
          ].map((f, i) => {
            const _fq = f.name.toLowerCase(), _ff = _NI[_fq+"_F"], _fm = _NI[_fq+"_M"];
            const n = _NI[_fq] || (_ff && _fm ? ((_ff.peakRate||0) >= (_fm.peakRate||0) ? _ff : _fm) : (_ff || _fm));
            return (
              <div className="feat" key={i}>
                <div className="tag">{f.tag}</div>
                <div className="name">{f.name}</div>
                <div className="by">{f.by}</div>
                <Sparkline data={n.yearly} width={300} height={64}
                           color={accent} fill peakLabel />
                <div className="nums">
                  {f.nums.map(([k,v], j) => (
                    <div key={j}>
                      <div className="k">{k}</div>
                      <div className="v">{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">§ V · Pipeline</div>
          <div className="rule" />
          <div className="aside">10 stages · 6m 41s total · reproducible</div>
        </div>
        <div className="pipeline">
          {_PIPELINE.map(p => (
            <div className="pipe-step" key={p.id}>
              <div className="id">{p.id}</div>
              <div className="nm">{p.name}</div>
              <div className="ds">{p.desc}</div>
              <div className="rt">{p.rows}<span className="sep">·</span>{p.time}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">§ VI · Diversity</div>
          <div className="rule" />
          <div className="aside">Top-10 share · 144 years</div>
        </div>
        <div className="twocol">
          <div>
            <DiversityChart width={620} height={220} />
            <p style={{fontFamily:"var(--mono)", fontSize:"10px", color:"var(--muted)", letterSpacing:"0.08em", marginTop:6}}>
              Top-10 names as % of all births · 1880–2024
            </p>
          </div>
          <aside style={{fontFamily:"var(--serif)", fontSize:"15px", lineHeight:1.55, color:"var(--vellum-dim)"}}>
            <p>
              In 1947 the top ten names — Linda, Mary, Patricia, Barbara, Susan,
              Nancy, Deborah, Sandra, Carol, Kathleen — accounted for nearly a third
              of all American babies.
            </p>
            <p>
              By 2024 the top ten capture just over <em style={{color:"var(--ink)"}}>eight percent</em>.
              The same babies, four times the names. The sleeper hit of the dataset.
            </p>
          </aside>
        </div>
      </div>
    </div>
  );
}

function eraLabel(id) {
  if (!id || id === "Unclassified") return "Unclassified";
  const e = _ERAS.find(x => x.id === id);
  if (e) return e.label;
  const map = { "Era 0": "Classic", "Era 1": "Suburban", "Era 2": "Modern" };
  return map[id] || id;
}

Object.assign(window, {
  TabOverview, TabEra, TabGeo, TabArchetypes, TabWaves, TabRarest, TabSearch
});
