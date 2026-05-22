// Main app — masthead, tab nav, tab routing, Tweaks
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "palette": "amber",
  "density": "regular",
  "showGrain": true,
  "tab": "overview"
}/*EDITMODE-END*/;

const PALETTES = {
  amber:  { accent: "#d4a64a", bg: "#13110d" },
  oxblood:{ accent: "#a14545", bg: "#13110d" },
  moss:   { accent: "#8fa05a", bg: "#13110d" },
  vellum: { accent: "#c4bda9", bg: "#13110d" },
};

const TABS = [
  { id: "overview",   num: "01", label: "Overview" },
  { id: "era",        num: "02", label: "Era Names" },
  { id: "geo",        num: "03", label: "Geography" },
  { id: "archetypes", num: "04", label: "Archetypes" },
  { id: "waves",      num: "05", label: "Waves" },
  { id: "validation", num: "06", label: "Validation" },
  { id: "search",     num: "07", label: "Name Stories" },
];

function App() {
  const [tweaks, setTweak] = useTweaks(TWEAK_DEFAULTS);
  const [active, setActive] = React.useState(tweaks.tab || "overview");

  React.useEffect(() => { setActive(tweaks.tab || "overview"); }, [tweaks.tab]);

  const palette = PALETTES[tweaks.palette] || PALETTES.amber;
  React.useEffect(() => {
    document.documentElement.style.setProperty("--amber", palette.accent);
  }, [palette.accent]);

  const today = new Date(2026, 4, 21);
  const dateStr = today.toLocaleDateString("en-US", { year:"numeric", month:"long", day:"numeric" });

  function go(tab) {
    setActive(tab);
    setTweak("tab", tab);
  }

  return (
    <div className="shell" style={{
      fontSize: tweaks.density === "compact" ? "16px" : "17px"
    }} data-screen-label={`07 ${TABS.find(t => t.id === active)?.label}`}>
      <header className="masthead">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 18 }}>
          {/* Chronicle decade ruler icon */}
          <a href="https://onehundredyears.report" style={{ textDecoration: "none", display: "flex", alignItems: "center", flexShrink: 0, marginTop: 4 }}>
            <svg width="14" height="56" viewBox="0 0 18 72" style={{ marginRight: 0 }}>
              <line x1="0" y1="0" x2="0" y2="72" stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
              <line x1="0" y1="0"  x2="12" y2="0"  stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
              <line x1="0" y1="8"  x2="7"  y2="8"  stroke="var(--amber, #d4a64a)" strokeWidth="0.8"/>
              <line x1="0" y1="16" x2="7"  y2="16" stroke="var(--amber, #d4a64a)" strokeWidth="0.8"/>
              <line x1="0" y1="24" x2="12" y2="24" stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
              <line x1="0" y1="32" x2="7"  y2="32" stroke="var(--amber, #d4a64a)" strokeWidth="0.8"/>
              <line x1="0" y1="40" x2="7"  y2="40" stroke="var(--amber, #d4a64a)" strokeWidth="0.8"/>
              <line x1="0" y1="48" x2="12" y2="48" stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
              <line x1="0" y1="56" x2="7"  y2="56" stroke="var(--amber, #d4a64a)" strokeWidth="0.8"/>
              <line x1="0" y1="64" x2="7"  y2="64" stroke="var(--amber, #d4a64a)" strokeWidth="0.8"/>
              <line x1="0" y1="72" x2="12" y2="72" stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
            </svg>
          </a>
          <div>
            <div className="series" style={{ fontFamily: "'Cormorant Garamond', var(--serif, Georgia)", fontWeight: 600, letterSpacing: "0.25em", fontSize: 10 }}>
              <span>One Hundred Years of</span>
            </div>
            <h1 style={{ fontFamily: "'Playfair Display', var(--serif, Georgia)" }}>A Century of <em>American Names</em>.</h1>
            <div className="sub">
              144 years of birth certificates, read as a cultural record.
              Every name a wave, every wave a generation.
            </div>
          </div>
        </div>
        <div className="meta">
          <div><span className="k">SOURCE</span> &nbsp;<span className="v">SSA · 1880–2024</span></div>
          <div><span className="k">ROWS</span>   &nbsp;<span className="v">2,082,469</span></div>
          <div><span className="k">RUN</span>    &nbsp;<span className="v">{dateStr}</span></div>
          <div><span className="k">BUILD</span>  &nbsp;<span className="v">v0.4.1 · names@a3f08c</span></div>
        </div>
      </header>

      <nav className="tabs">
        {TABS.map(t => (
          <div key={t.id} className={`tab ${active === t.id ? "active" : ""}`}
               onClick={() => go(t.id)} data-screen-label={`${t.num} ${t.label}`}>
            <span className="num">{t.num}</span>
            <span>{t.label}</span>
          </div>
        ))}
      </nav>

      <main>
        {active === "overview"   && <TabOverview accent={palette.accent} />}
        {active === "era"        && <TabEra accent={palette.accent} />}
        {active === "geo"        && <TabGeo accent={palette.accent} />}
        {active === "archetypes" && <TabArchetypes accent={palette.accent} />}
        {active === "waves"      && <TabWaves accent={palette.accent} />}
        {active === "validation" && <TabValidation accent={palette.accent} />}
        {active === "search"     && <TabSearch accent={palette.accent} />}
      </main>

      <footer className="colophon" style={{ display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
        <a href="https://onehundredyears.report" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
          <svg width="12" height="36" viewBox="0 0 18 72">
            <line x1="0" y1="0" x2="0" y2="72" stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
            <line x1="0" y1="0"  x2="12" y2="0"  stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
            <line x1="0" y1="24" x2="12" y2="24" stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
            <line x1="0" y1="48" x2="12" y2="48" stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
            <line x1="0" y1="72" x2="12" y2="72" stroke="var(--amber, #d4a64a)" strokeWidth="1.5"/>
          </svg>
          <span style={{ fontFamily: "'Cormorant Garamond', Georgia", fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", opacity: 0.7 }}>
            One Hundred Years
          </span>
        </a>
        <div style={{ marginLeft: "auto", display: "flex", gap: 18, alignItems: "center", fontFamily: "var(--mono, monospace)", fontSize: 10, letterSpacing: "0.1em", opacity: 0.5 }}>
          <span>MIT</span>
          <a href="https://github.com/doctorbrownphd/hundred-years-names" target="_blank" rel="noopener" style={{ textDecoration: "none", color: "inherit" }}>GitHub</a>
        </div>
      </footer>

      <TweaksPanel title="Tweaks" defaultPos={{right: 24, bottom: 24}}>
        <TweakSection label="Palette">
          <TweakColor
            label="Accent"
            value={PALETTES[tweaks.palette].accent}
            onChange={(hex) => {
              const k = Object.keys(PALETTES).find(k => PALETTES[k].accent === hex) || "amber";
              setTweak("palette", k);
            }}
            options={["#d4a64a","#a14545","#8fa05a","#c4bda9"]}
          />
        </TweakSection>
        <TweakSection label="Reading">
          <TweakRadio
            label="Density"
            value={tweaks.density}
            onChange={(v) => setTweak("density", v)}
            options={[{value:"regular", label:"Regular"},{value:"compact", label:"Compact"}]}
          />
          <TweakToggle
            label="Paper grain"
            value={tweaks.showGrain}
            onChange={(v) => {
              setTweak("showGrain", v);
              const el = document.getElementById("grain-style");
              if (el) el.textContent = v
                ? `body::before { opacity: 1; }`
                : `body::before { opacity: 0; }`;
            }}
          />
        </TweakSection>
        <TweakSection label="Jump to tab">
          <TweakSelect
            label="Tab"
            value={tweaks.tab}
            onChange={(v) => { setTweak("tab", v); setActive(v); }}
            options={TABS.map(t => ({ value: t.id, label: `${t.num} · ${t.label}` }))}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

// Custom TweakColor wrapper that handles palette mapping
function _coerceTweakColor() {} // noop — using stock TweakColor

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
