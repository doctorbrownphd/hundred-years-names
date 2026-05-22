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
        <div>
          <div className="series">
            <span>One Hundred Years</span>
            <span className="sep">·</span>
            <span>Entry 02</span>
            <span className="sep">·</span>
            <span>Names</span>
          </div>
          <h1>A Century of <em>American Names</em>.</h1>
          <div className="sub">
            144 years of birth certificates, read as a cultural record.
            Every name a wave, every wave a generation.
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

      <footer className="colophon">
        <div>
          Set in EB Garamond &amp; IBM Plex Mono. Charts hand-drawn in SVG.
          Built in the spirit of Tufte's <em>Visual Display of Quantitative Information</em>.
          A One Hundred Years series entry.
        </div>
        <div className="mono">© 2026 · ONEHUNDREDYEARS.REPORT</div>
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
