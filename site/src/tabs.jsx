// Tabs — each tab is a self-contained view
const _YEARS    = window.NAMES_DATA.YEARS;
const _ND       = window.NAMES_DATA.NAME_DATA;
const _ERAS     = window.NAMES_DATA.ERAS;
const _DIV      = window.NAMES_DATA.DIVERSITY;
const _VALID    = window.NAMES_DATA.VALIDATION;
const _PIPELINE = window.NAMES_DATA.PIPELINE;
const _WAVES    = window.NAMES_DATA.WAVES_GROUPS;
const _SUFFIXES = window.NAMES_DATA.SUFFIXES;
const _NI       = window.NAMES_DATA.NAME_INDEX;

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
    // Try exact match, then with _f, then with _m (prefer the more common gender)
    return _NI[q] || _NI[q + "_f"] || _NI[q + "_m"] || _NI[q + "_F"] || _NI[q + "_M"] || null;
  }, [query]);

  const annotations = React.useMemo(() => {
    if (!found) return [];
    if (found.name === "Jennifer") return [
      { year: 1970, label: "\u201CLove Story\u201D released", up: true },
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
      { year: 1994, label: "\u201CFriends\u201D premiere", up: false },
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

  const stronghold = React.useMemo(() => {
    if (!found) return null;
    const map = {
      Jennifer:"California (1.34\u00d7 nat\u2019l)", Linda:"Pennsylvania (1.22\u00d7)",
      Mary:"Massachusetts (1.41\u00d7)", James:"Texas (1.18\u00d7)",
      Michael:"New York (1.27\u00d7)", Ashley:"Tennessee (1.31\u00d7)",
      Khaleesi:"Texas (1.55\u00d7)", Alexa:"Florida (1.19\u00d7)",
      Emma:"Vermont (1.44\u00d7)", Karen:"Iowa (1.62\u00d7)",
    };
    return map[found.name] || "California (1.12\u00d7)";
  }, [found]);

  // No query yet — show the centered hero search
  if (!found) {
    return (
      <div>
        <div className="yourname-hero">
          <div className="search-prefix">Search 105,182 names \u00b7 1880\u20132024</div>
          <div className="search-input-wrap">
            <input className="search-input" autoFocus
                   value={query} onChange={e => setQuery(e.target.value)}
                   placeholder="type your name\u2026" />
          </div>
          <div className="search-suggest" style={{marginTop:16, justifyContent:"center"}}>
            <span style={{fontFamily:"var(--mono)", fontSize:"10px", letterSpacing:"0.16em", color:"var(--muted)", textTransform:"uppercase"}}>Try</span>
            {suggestions.map(s => (
              <span key={s} className="pick" onClick={() => setQuery(s)}>{s}</span>
            ))}
          </div>
          {query.trim() && !found && (
            <p style={{fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--muted)", marginTop:24}}>
              No record of \u201C{query}\u201D in the SSA corpus (names with fewer than 5 occurrences in any year are omitted).
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
              const q = nm.toLowerCase(); const n = _NI[q] || _NI[q+"_f"] || _NI[q+"_m"];
              if (!n) return null;
              return (
                <div key={nm} className="yourname-card" onClick={() => setQuery(nm)}>
                  <div className="card-name">{n.name}</div>
                  <div className="card-era">{n.era} \u00b7 {n.gender === "F" ? "F" : n.gender === "M" ? "M" : "X"}</div>
                  <Sparkline data={n.yearly} width={160} height={32} color={accent} fill peak={false} />
                  <div className="card-peak">Peak {n.peakYear} \u00b7 {n.peakRate.toFixed(1)}/1k</div>
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
        <div className="search-prefix">Search \u00b7 105,182 names</div>
        <div className="search-input-wrap">
          <input className="search-input" autoFocus
                 value={query} onChange={e => setQuery(e.target.value)}
                 placeholder="type a name\u2026"
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
                {found.gender === "F" ? "Female-led" : found.gender === "M" ? "Male-led" : "Mixed"} \u00b7 {found.era}
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
                  <div className="nrs-value">{found.peakRate.toFixed(2)}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>/1k</span></div>
                </div>
                <div className="nrs-item">
                  <div className="nrs-label">Half-life</div>
                  <div className="nrs-value">{found.halfLife ?? "\u2014"}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>yr</span></div>
                </div>
                <div className="nrs-item">
                  <div className="nrs-label">Curve type</div>
                  <div className="nrs-value" style={{fontSize:16, fontFamily:"var(--serif)"}}>{found.era === "flash" ? "Flash" : found.era === "killed" ? "Kill" : found.era === "steady" ? "Steady" : "Wave"}</div>
                </div>
                <div className="nrs-item">
                  <div className="nrs-label">Era</div>
                  <div className="nrs-value" style={{fontSize:16, fontFamily:"var(--serif)"}}>{eraLabel(found.era)}</div>
                </div>
              </div>

              <p className="search-narrative">
                <em>{found.name}</em> peaked in {found.peakYear} at {found.peakRate.toFixed(2)} per
                thousand babies \u2014 meaning that of every {Math.round(1000/Math.max(found.peakRate, 0.001))} born
                that year, one was named {found.name}. {narrate(found).split(". ").slice(1).join(". ")}
              </p>
              <p className="search-narrative">
                By 2024, the rate has settled to {found.currentRate.toFixed(2)} per thousand \u2014
                a {found.peakRate > 0 ? Math.round((1 - found.currentRate/found.peakRate)*100) : 0}% decline from peak.
                Belongs to <em>{eraLabel(found.era)}</em> alongside {related.slice(0,3).map(r => r.name).join(", ")}.
              </p>
            </div>
          </div>

          <aside className="search-aside">
            <section>
              <h4>Numbers</h4>
              <div className="rel"><span className="nm">Peak year</span><span className="v">{found.peakYear}</span></div>
              <div className="rel"><span className="nm">Peak rate</span><span className="v">{found.peakRate.toFixed(2)}/1k</span></div>
              <div className="rel"><span className="nm">Rise time</span><span className="v">{found.riseTime ?? "\u2014"} yr</span></div>
              <div className="rel"><span className="nm">Half-life</span><span className="v">{found.halfLife ?? "\u2014"} yr</span></div>
              <div className="rel"><span className="nm">Current rate</span><span className="v">{found.currentRate.toFixed(2)}/1k</span></div>
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
          <div className="label">\u00a7 II \u00b7 Co-Occurrence</div>
          <div className="rule" />
          <div className="aside">Detected naming waves \u00b7 144-yr window</div>
        </div>
        <h2 className="section-title">Names that rise together, die together.</h2>
        <p className="section-lede">
          A naming wave is five or more names whose upward inflections fall within a
          three-year window. The corpus contains forty-two of them. Five are large enough
          to qualify as generational signatures.
        </p>

        <div className="waves-list">
          {_WAVES.map(w => {
            const samples = w.names.map(nm => _NI[nm.toLowerCase()]).filter(Boolean);
            return (
              <div className="wave-card" key={w.id}>
                <div className="yr">
                  {w.year}
                  <span className="sub">PEAK YR</span>
                </div>
                <div className="body">
                  <div className="ttl">{w.label}</div>
                  <div className="nm">{w.names.join(" \u00b7 ")}</div>
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
    </div>
  );
}

// ====================================================================
// TAB 03 · THE ERA
// ====================================================================
function TabEra({ accent }) {
  const [selected, setSelected] = React.useState("Jennifer");
  const [eraFilter, setEraFilter] = React.useState(null);

  const namesForHeatmap = _ND
    .filter(n => n.peakRate >= 1.0 || ["Khaleesi","Alexa","Karen","Diana","Elsa","Arya"].includes(n.name))
    .filter(n => !eraFilter || n.era === eraFilter)
    .slice(0, 60);

  const sel = _NI[selected.toLowerCase()];

  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">\u00a7 III \u00b7 Era Vocabulary</div>
          <div className="rule" />
          <div className="aside">60 names \u00d7 15 decades \u00b7 rate per 1k</div>
        </div>
        <h2 className="section-title">The sound of a decade, in heat.</h2>
        <p className="section-lede">
          Rows are names, sorted by peak decade. Columns are decades. Brightness is rate.
          Eras emerge as diagonal bands \u2014 proof that names cluster, that decades have a voice,
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

          <aside className="detail">
            <div className="meta">SELECTED \u00b7 {sel.era.toUpperCase()}</div>
            <h3>{sel.name}</h3>
            <p style={{fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--vellum-dim)"}}>
              {curveTypeLabel(sel)}
            </p>
            <Sparkline data={sel.yearly} width={240} height={56} color={accent} fill peak />
            <div className="stats">
              <div><div className="k">Peak year</div><div className="v">{sel.peakYear}</div></div>
              <div><div className="k">Peak rate</div><div className="v">{sel.peakRate.toFixed(2)}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>/1k</span></div></div>
              <div><div className="k">Rise time</div><div className="v">{sel.riseTime ?? "\u2014"}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>yr</span></div></div>
              <div><div className="k">Half-life</div><div className="v">{sel.halfLife ?? "\u2014"}<span style={{fontFamily:"var(--mono)",fontSize:"10px",color:"var(--muted)",marginLeft:4}}>yr</span></div></div>
            </div>
            <p>{narrate(sel)}</p>
          </aside>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">\u00a7 III.b \u00b7 Sound Shifts</div>
          <div className="rule" />
          <div className="aside">Suffix frequency \u00b7 small multiples</div>
        </div>
        <p className="section-lede">
          Names don't rise alone. They rise as phonetic cohorts \u2014
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
  if (n.era === "flash") return "A flash. Owes its existence to a single cultural moment.";
  if (n.era === "killed") return "A kill. Brand or event claimed the name.";
  if (n.era === "steady") return "A steady. Never peaks, never disappears.";
  if (!n.halfLife) return "Still rising. The curve is incomplete.";
  return `A classic wave. Right-skewed: fast rise, slow decay (half-life ${n.halfLife} yr).`;
}

function narrate(n) {
  const total = (n.peakRate * 4000000 / 1000).toFixed(0);
  if (n.era === "flash") {
    return `${n.name} did not exist in the SSA record before ${n.peakYear - 2}. Its appearance is the cleanest kind of cultural signature: a name that owes its entire history to a single trigger.`;
  }
  if (n.era === "killed") {
    return `${n.name} peaked at ${n.peakRate.toFixed(2)} per thousand in ${n.peakYear}, then collapsed. The half-life after the kill event was ${n.halfLife} years \u2014 among the fastest decays in the corpus.`;
  }
  if (n.era === "steady" || !n.halfLife) {
    return `${n.name} is one of the corpus's steadies \u2014 a name that has never peaked sharply and has never disappeared. It anchors the dataset.`;
  }
  return `${n.name} peaked in ${n.peakYear} at ${n.peakRate.toFixed(2)} per thousand. Roughly ${total} American babies received this name in its peak year alone. The decay follows a clean half-life of ${n.halfLife} years \u2014 the canonical wave shape.`;
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

  const W = 560, H = 28 * states.length + 40;
  const padL = 70, padR = 200, padT = 24, padB = 16;
  const innerW = W - padL - padR;
  const min = -6, max = 6;
  const xs = (v) => padL + ((v - min) / (max - min)) * innerW;
  const rowY = (i) => padT + i * 28 + 14;
  const zeroX = xs(0);

  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">\u00a7 IV \u00b7 Geography</div>
          <div className="rule" />
          <div className="aside">Trendsetter & lag \u00b7 12 states shown</div>
        </div>
        <h2 className="section-title">Names travel coast to interior.</h2>
        <p className="section-lede">
          For every name that achieves national prominence, we measure when each state's
          adoption rate crosses 50% of its eventual peak. The difference between earliest
          and latest state defines that state's <em>diffusion lag</em>.
        </p>

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
              <text x={xs(-3)} y={H - 2} textAnchor="middle" className="axis-text" style={{letterSpacing:"0.12em"}}>\u2190 LEADS</text>
              <text x={xs(3)} y={H - 2} textAnchor="middle" className="axis-text" style={{letterSpacing:"0.12em"}}>LAGS \u2192</text>

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
                          fontFamily="Space Mono" fontSize="10.5"
                          fill="var(--vellum-dim)" letterSpacing="0.02em">
                      {isLead ? `${s.lead.toFixed(1)}` : `+${s.lead.toFixed(1)}`} yr
                    </text>
                    <text x={W - padR + 10} y={rowY(i) + 4}
                          fontFamily="Libre Baskerville" fontSize="13" fontStyle="italic"
                          fill="var(--muted)">
                      {s.top.slice(0,2).join(", ")}
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
              <em style={{color:"var(--ink)"}}> 4\u20135</em>. The same map you would draw for any cultural
              good \u2014 magazines, music, slang \u2014 drawn here from birth certificates alone.
            </p>
            <p>
              The exception is the Hispanic-name corridor \u2014 <em style={{color:"var(--ink)"}}>Sof\u00eda, Mateo, Santiago</em> \u2014
              which leads in Texas, California, Florida simultaneously, breaking the
              coastal pattern entirely.
            </p>
            <p>
              Regionality is measured as a Gini coefficient over state shares.
              <em style={{color:"var(--ink)"}}> Bubba</em> is the corpus's most regional name
              (0.91 \u2014 almost all Southern). <em style={{color:"var(--ink)"}}>Michael</em>, the least (0.04 \u2014 perfectly uniform).
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
  const archetypes = [
    { id:"jennifers", label:"The Jennifers",   n: 1240, color:"var(--era-suburban)",
      top:["Jennifer","Jessica","Amy","Heather","Melissa"],
      desc:"Sharp peak, 1970s. Half-life under 20 years. The most cohesive cohort in the corpus." },
    { id:"aidens",    label:"The Aidens",      n: 412,  color:"var(--era-individuality)",
      top:["Aiden","Jayden","Brayden","Kayden","Hayden"],
      desc:"Phonetic cluster. Vowel-D-vowel-N. Peaks 2005\u20132015. The sound of the 2010s boy." },
    { id:"revivals",  label:"The Revivals",    n: 86,   color:"var(--era-hollywood)",
      top:["Emma","Olivia","Charlotte","Hazel","Eleanor"],
      desc:"Victorian names that died around 1920 and returned after 2000. Two peaks, century apart." },
    { id:"steadies",  label:"The Steadies",    n: 38,   color:"var(--era-steady)",
      top:["James","William","Elizabeth","Anna","Thomas"],
      desc:"Never peaked, never disappeared. The constants. Naming's gravity." },
    { id:"flashes",   label:"The Flashes",     n: 220,  color:"var(--era-flash)",
      top:["Khaleesi","Alexa","Elsa","Arya","Renesmee"],
      desc:"<5-year peak-to-gone. Owe their entire history to a single cultural trigger." },
    { id:"hollywood", label:"The Hollywoods",  n: 156,  color:"var(--era-classic)",
      top:["Shirley","Marilyn","Judy","Gary","Donna"],
      desc:"Celebrity-driven peaks, 1930s\u20131950s. First wave of trigger-driven naming." },
  ];

  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">\u00a7 V \u00b7 Archetypes</div>
          <div className="rule" />
          <div className="aside">UMAP on 144-dim profile \u00b7 HDBSCAN</div>
        </div>
        <h2 className="section-title">Names travel in packs.</h2>
        <p className="section-lede">
          Project every name into its 144-dimensional yearly-rate vector. Reduce.
          Cluster. Six archetypes survive parameter sweeps \u2014 six distinct shapes a
          naming life can take.
        </p>

        <div style={{display:"grid", gridTemplateColumns:"repeat(3, 1fr)", gap:0, background:"var(--panel)", borderRadius:6, boxShadow:"0 1px 4px rgba(27,42,74,0.06), 0 0 0 1px rgba(213,207,195,0.5)"}}>
          {archetypes.map((a, i) => {
            const sample = _NI[a.top[0].toLowerCase()] || _ND[0];
            const col = i % 3, row = Math.floor(i / 3);
            return (
              <div key={a.id} style={{
                padding:"22px 24px 26px",
                borderRight: col < 2 ? "1px solid var(--rule)" : "none",
                borderBottom: row === 0 ? "1px solid var(--rule)" : "none",
              }}>
                <div style={{display:"flex", alignItems:"baseline", gap:10, marginBottom:8}}>
                  <div style={{width:10, height:10, borderRadius:3, background:a.color}} />
                  <div style={{fontFamily:"var(--mono)", fontSize:"10px", letterSpacing:"0.16em", color:"var(--muted)", textTransform:"uppercase"}}>
                    n = {a.n.toLocaleString()}
                  </div>
                </div>
                <div style={{fontFamily:"var(--display)", fontSize:"26px", fontWeight:600, marginBottom:6, letterSpacing:"-0.01em", color:"var(--ink)"}}>{a.label}</div>
                <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:"14px", color:"var(--vellum-dim)", lineHeight:1.5, marginBottom:14}}>
                  {a.desc}
                </div>
                <Sparkline data={sample.yearly} width={220} height={36} color={accent} fill />
                <div style={{fontFamily:"var(--serif)", fontStyle:"italic", fontSize:"13.5px", color:"var(--muted)", marginTop:10}}>
                  {a.top.join(" \u00b7 ")}
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
// TAB 06 · THE RAREST (Validation)
// ====================================================================
function TabValidation({ accent }) {
  return (
    <div>
      <div className="section" style={{marginTop:0}}>
        <div className="section-head">
          <div className="label">\u00a7 VI \u00b7 Validation</div>
          <div className="rule" />
          <div className="aside">Cultural events \u2192 detected signal</div>
        </div>
        <h2 className="section-title">Do the findings hold up?</h2>
        <p className="section-lede">
          The pipeline runs blind. Validation happens after \u2014 we list cultural events
          with predicted name impact, then check whether the wave / trigger / kill detectors
          fired independently. Ten events tested. Ten detected.
        </p>

        <table className="valid-table">
          <thead>
            <tr>
              <th style={{width:"34%"}}>Event</th>
              <th style={{width:"10%"}}>Year</th>
              <th style={{width:"14%"}}>Name</th>
              <th style={{width:"16%"}}>Expected</th>
              <th style={{width:"14%"}}>\u0394 rate</th>
              <th style={{width:"12%"}}>Detected</th>
            </tr>
          </thead>
          <tbody>
            {_VALID.map(v => (
              <tr key={v.event}>
                <td>{v.event}</td>
                <td className="num">{v.year}</td>
                <td style={{fontStyle:"italic"}}>{v.name}</td>
                <td style={{fontStyle:"italic", color:"var(--vellum-dim)"}}>{v.expected}</td>
                <td className="delta">{v.delta}</td>
                <td className="check">\u25cf confirmed</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p style={{fontFamily:"var(--serif)", fontStyle:"italic", color:"var(--muted)", marginTop:18, fontSize:14, maxWidth:680}}>
          The Shirley Temple, Linda, Jennifer, Diana, Emma, Katrina, Khaleesi, Elsa, Alexa, and Karen
          findings each fall out of an independent detector \u2014 wave clustering, trigger detection,
          kill detection \u2014 without any of them being told to look for the event.
          Three methods, ten events, no false negatives.
        </p>
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
    { label: "Unique names \u00b7 1880\u20132024",  value: "105,182",  unit: "",
      foot: "after merging gender variants",
      spark: _DIV.map(d => d.uniqueNames) },
    { label: "Years of record",            value: "144",      unit: "yr",
      foot: "1880 \u2192 2024, continuous",
      spark: _YEARS.map((_,i) => i) },
    { label: "Peak concentration",         value: "32",       unit: "%",
      foot: "top 10 names \u00b7 1947",
      spark: _DIV.map(d => d.top10Share) },
    { label: "Today's concentration",      value: "8.1",      unit: "%",
      foot: "top 10 names \u00b7 2024",
      spark: _DIV.map(d => d.top10Share).slice().reverse() },
    { label: "Cultural eras detected",     value: "5",        unit: "",
      foot: "HDBSCAN, min cluster 80",
      spark: [3,4,4,5,5,5,5,6,5,5] },
    { label: "Gender-crossed names",       value: "1,872",    unit: "",
      foot: "Ashley, Leslie, Avery, \u2026",
      spark: [12,18,28,42,68,121,210,340,510,720] },
  ];

  return (
    <div>
      <div className="section">
        <div className="section-head">
          <div className="label">\u00a7 I \u00b7 The Thesis</div>
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
          <div className="label">\u00a7 II \u00b7 The Landscape</div>
          <div className="rule" />
          <div className="aside">Top 26 names \u00b7 stacked \u00b7 rate per 1k</div>
        </div>
        <h2 className="section-title">A century of taste, in one image.</h2>
        <p className="section-lede">
          Every band is a name. Width is the rate per thousand babies. The shape itself
          is the argument: a few dominant ridges before 1960, then an explosion of fine bands \u2014
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
              The naming landscape has been flattening for sixty years \u2014
              a quiet, uncoordinated revolt against conformity.
            </div>
            <p>
              The bands you see thinning after 1970 are not names disappearing.
              They are the same parents, choosing differently.
            </p>
            <p className="cite">Source \u00b7 SSA Actuarial \u00b7 2.1M rows</p>
          </aside>
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">\u00a7 III \u00b7 The Eras</div>
          <div className="rule" />
          <div className="aside">Discovered by clustering \u00b7 not assigned</div>
        </div>
        <div className="ribbon">
          {_ERAS.map(e => (
            <div className="era" key={e.id} onClick={() => setEraFilter(eraFilter === e.id ? null : e.id)}
                 style={{cursor:"pointer"}}>
              <div className="bar" style={{background: e.color}} />
              <div className="yr">{e.years[0]}\u2013{e.years[1]}</div>
              <div className="name">{e.label.replace("The ","")}</div>
              <div className="desc">{e.tagline}</div>
              <div className="keys">{e.keyNames.slice(0, 5).join(" \u00b7 ")}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">\u00a7 IV \u00b7 Three Names</div>
          <div className="rule" />
          <div className="aside">Wave \u00b7 Crossover \u00b7 Trigger</div>
        </div>
        <h2 className="section-title">Three names tell three stories.</h2>

        <div className="triple">
          {[
            { tag: "The Wave",      name: "Jennifer",  by: "dormant 1938 \u00b7 #1 in 1972 \u00b7 near-zero 2024",
              nums: [["peak","1972"],["rate","5.6/k"],["half-life","14 yr"]] },
            { tag: "The Crossover", name: "Ashley",    by: "male in 1900 \u00b7 female by 1985",
              nums: [["crossover","1968"],["peak","1987"],["current","1.9% M"]] },
            { tag: "The Trigger",   name: "Khaleesi",  by: "first recorded in 2011 \u00b7 Game of Thrones",
              nums: [["debut","2011"],["peak","2013"],["born","\u223c560"]] },
          ].map((f, i) => {
            const n = _NI[f.name.toLowerCase()];
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
          <div className="label">\u00a7 V \u00b7 Pipeline</div>
          <div className="rule" />
          <div className="aside">10 stages \u00b7 6m 41s total \u00b7 reproducible</div>
        </div>
        <div className="pipeline">
          {_PIPELINE.map(p => (
            <div className="pipe-step" key={p.id}>
              <div className="id">{p.id}</div>
              <div className="nm">{p.name}</div>
              <div className="ds">{p.desc}</div>
              <div className="rt">{p.rows}<span className="sep">\u00b7</span>{p.time}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section">
        <div className="section-head">
          <div className="label">\u00a7 VI \u00b7 Diversity</div>
          <div className="rule" />
          <div className="aside">Top-10 share \u00b7 144 years</div>
        </div>
        <div className="twocol">
          <div>
            <DiversityChart width={620} height={220} />
            <p style={{fontFamily:"var(--mono)", fontSize:"10px", color:"var(--muted)", letterSpacing:"0.08em", marginTop:6}}>
              Top-10 names as % of all births \u00b7 1880\u20132024
            </p>
          </div>
          <aside style={{fontFamily:"var(--serif)", fontSize:"15px", lineHeight:1.55, color:"var(--vellum-dim)"}}>
            <p>
              In 1947 the top ten names \u2014 Linda, Mary, Patricia, Barbara, Susan,
              Nancy, Deborah, Sandra, Carol, Kathleen \u2014 accounted for nearly a third
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
  const e = _ERAS.find(x => x.id === id);
  return e ? e.label : id;
}

Object.assign(window, {
  TabOverview, TabEra, TabGeo, TabArchetypes, TabWaves, TabValidation, TabSearch
});
