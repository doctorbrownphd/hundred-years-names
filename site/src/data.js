// One Hundred Years of American Names — synthetic but plausible data
// All rates are per 1,000 births. Year range: 1880–2024.

const START = 1880;
const END = 2024;
const YEARS = Array.from({length: END - START + 1}, (_, i) => START + i);

// Curve generators
function gauss(year, peak, rate, width, skew = 0) {
  const d = year - peak;
  const w = d < 0 ? width * (1 + skew) : width * (1 - skew * 0.5);
  return rate * Math.exp(-(d * d) / (2 * w * w));
}
function rightSkew(year, riseStart, peak, rate, decayHalf) {
  if (year < riseStart) return 0;
  if (year <= peak) {
    const t = (year - riseStart) / (peak - riseStart);
    return rate * Math.pow(t, 2.2);
  }
  const d = year - peak;
  return rate * Math.pow(0.5, d / decayHalf);
}
function steady(year, baseline, slope = 0, peakYear = 1950, dip = 0) {
  const drift = baseline + slope * (year - 1880);
  const d = year - peakYear;
  return Math.max(0.05, drift - dip * Math.exp(-(d * d) / 1500));
}
function flash(year, eventYear, peakRate, decayHalf) {
  if (year < eventYear) return year < eventYear - 2 ? 0 : 0.005;
  return peakRate * Math.pow(0.5, (year - eventYear) / decayHalf);
}
function bimodal(year, p1, r1, w1, p2, r2, w2) {
  return Math.max(gauss(year, p1, r1, w1), gauss(year, p2, r2, w2));
}

// Per-name yearly series builders
const NAMES = [
  // === STEADIES ===
  { name: "James", sex: "M", era: "steady", build: y => steady(y, 5.2, -0.012, 1950, 1.0) },
  { name: "John", sex: "M", era: "classic", build: y => steady(y, 7.5, -0.04, 1900, 1.5) },
  { name: "William", sex: "M", era: "steady", build: y => steady(y, 5.8, -0.02, 1910, 0.5) },
  { name: "Elizabeth", sex: "F", era: "steady", build: y => steady(y, 3.5, -0.005, 1940, 0.6) },
  { name: "Robert", sex: "M", era: "suburban", build: y => gauss(y, 1935, 6.4, 28) },
  { name: "Charles", sex: "M", era: "classic", build: y => gauss(y, 1905, 4.1, 32) + 0.3 },

  // === CLASSIC ERA ===
  { name: "Mary", sex: "F", era: "classic", build: y => gauss(y, 1920, 9.4, 30, -0.15) },
  { name: "Helen", sex: "F", era: "classic", build: y => gauss(y, 1915, 4.8, 18) },
  { name: "Dorothy", sex: "F", era: "classic", build: y => gauss(y, 1924, 5.6, 14) },
  { name: "Margaret", sex: "F", era: "classic", build: y => gauss(y, 1915, 4.3, 22) },
  { name: "George", sex: "M", era: "classic", build: y => gauss(y, 1910, 4.0, 24) },
  { name: "Frank", sex: "M", era: "classic", build: y => gauss(y, 1895, 3.6, 22) },
  { name: "Ruth", sex: "F", era: "classic", build: y => gauss(y, 1918, 3.8, 15) },

  // === HOLLYWOOD ERA ===
  { name: "Shirley", sex: "F", era: "hollywood", build: y => gauss(y, 1936, 5.3, 9) },
  { name: "Gary", sex: "M", era: "hollywood", build: y => gauss(y, 1948, 4.6, 14) },
  { name: "Marilyn", sex: "F", era: "hollywood", build: y => gauss(y, 1940, 2.9, 12) },
  { name: "Judy", sex: "F", era: "hollywood", build: y => gauss(y, 1944, 2.4, 11) },
  { name: "Donna", sex: "F", era: "hollywood", build: y => gauss(y, 1950, 3.3, 13) },

  // === SUBURBAN ERA ===
  { name: "Linda", sex: "F", era: "suburban", build: y => gauss(y, 1949, 8.6, 9) },
  { name: "Susan", sex: "F", era: "suburban", build: y => gauss(y, 1958, 4.7, 13) },
  { name: "Karen", sex: "F", era: "suburban", build: y => bimodal(y, 1965, 4.4, 12, 2018, 0.08, 4) - (y >= 2018 ? 0.25 : 0) },
  { name: "Patricia", sex: "F", era: "suburban", build: y => gauss(y, 1952, 5.4, 17) },
  { name: "Michael", sex: "M", era: "suburban", build: y => gauss(y, 1968, 7.9, 22) },
  { name: "David", sex: "M", era: "suburban", build: y => gauss(y, 1960, 6.2, 20) },
  { name: "Lisa", sex: "F", era: "suburban", build: y => gauss(y, 1965, 5.4, 11) },
  { name: "Debra", sex: "F", era: "suburban", build: y => gauss(y, 1955, 3.1, 8) },

  // === INDIVIDUALITY ERA ===
  { name: "Jennifer", sex: "F", era: "individuality", build: y => rightSkew(y, 1938, 1972, 5.6, 14) },
  { name: "Jessica", sex: "F", era: "individuality", build: y => gauss(y, 1987, 4.9, 9) },
  { name: "Amy", sex: "F", era: "individuality", build: y => gauss(y, 1975, 3.2, 9) },
  { name: "Heather", sex: "F", era: "individuality", build: y => gauss(y, 1975, 3.0, 8) },
  { name: "Melissa", sex: "F", era: "individuality", build: y => gauss(y, 1978, 3.4, 10) },
  { name: "Ashley", sex: "F", era: "individuality", build: y => gauss(y, 1987, 4.6, 11) },
  { name: "Brittany", sex: "F", era: "individuality", build: y => gauss(y, 1989, 2.9, 7) },
  { name: "Brandon", sex: "M", era: "individuality", build: y => gauss(y, 1990, 3.4, 9) },
  { name: "Tiffany", sex: "F", era: "individuality", build: y => gauss(y, 1988, 2.4, 6) },
  { name: "Crystal", sex: "F", era: "individuality", build: y => gauss(y, 1982, 2.2, 7) },

  // === UNIQUE ERA ===
  { name: "Emma", sex: "F", era: "unique", build: y => bimodal(y, 1885, 2.8, 14, 2018, 2.4, 12) },
  { name: "Olivia", sex: "F", era: "unique", build: y => rightSkew(y, 1990, 2020, 2.2, 30) },
  { name: "Liam", sex: "M", era: "unique", build: y => rightSkew(y, 1998, 2020, 2.0, 30) },
  { name: "Aiden", sex: "M", era: "unique", build: y => gauss(y, 2012, 2.1, 8) },
  { name: "Sophia", sex: "F", era: "unique", build: y => rightSkew(y, 1995, 2015, 1.9, 22) },
  { name: "Charlotte", sex: "F", era: "unique", build: y => bimodal(y, 1890, 1.1, 14, 2021, 1.6, 10) },
  { name: "Mason", sex: "M", era: "unique", build: y => gauss(y, 2013, 1.8, 9) },
  { name: "Isabella", sex: "F", era: "unique", build: y => gauss(y, 2010, 2.0, 11) },
  { name: "Noah", sex: "M", era: "unique", build: y => rightSkew(y, 1995, 2018, 1.9, 30) },

  // === FLASH / TRIGGER ===
  { name: "Khaleesi", sex: "F", era: "flash", build: y => y >= 2011 ? flash(y, 2013, 0.06, 14) : 0 },
  { name: "Arya", sex: "F", era: "flash", build: y => y >= 2010 ? rightSkew(y, 2010, 2018, 0.34, 40) : 0 },
  { name: "Elsa", sex: "F", era: "flash", build: y => y >= 2012 ? flash(y, 2014, 0.18, 6) + (y < 2013 ? 0.02 : 0.03) : 0 },
  { name: "Alexa", sex: "F", era: "killed", build: y => y < 2014 ? gauss(y, 2008, 1.4, 9) : 1.4 * Math.pow(0.5, (y - 2014) / 2.2) },
  { name: "Katrina", sex: "F", era: "killed", build: y => y < 2005 ? gauss(y, 1988, 1.6, 10) : 0.6 * Math.pow(0.5, (y - 2005) / 3) },
  { name: "Diana", sex: "F", era: "flash", build: y => gauss(y, 1982, 1.6, 8) },
  { name: "Barack", sex: "M", era: "flash", build: y => y >= 2007 ? flash(y, 2009, 0.05, 4) : 0 },
];

// Build full time series for each name
const NAME_DATA = NAMES.map(n => {
  const yearly = YEARS.map(y => {
    const rate = Math.max(0, n.build(y));
    return { year: y, rate: +rate.toFixed(3) };
  });
  const peakIdx = yearly.reduce((best, d, i) => d.rate > yearly[best].rate ? i : best, 0);
  const peak = yearly[peakIdx];
  // Half-life
  const halfTarget = peak.rate / 2;
  let halfLife = null;
  for (let i = peakIdx + 1; i < yearly.length; i++) {
    if (yearly[i].rate <= halfTarget) { halfLife = yearly[i].year - peak.year; break; }
  }
  // Rise
  let firstIdx = yearly.findIndex(d => d.rate >= 0.05);
  const riseTime = firstIdx >= 0 && firstIdx < peakIdx ? peak.year - yearly[firstIdx].year : null;
  return {
    name: n.name, sex: n.sex, era: n.era,
    yearly,
    peakYear: peak.year, peakRate: peak.rate,
    halfLife, riseTime,
    currentRate: yearly[yearly.length - 1].rate,
  };
});

// Eras
const ERAS = [
  { id: "classic",       label: "The Classic Era",        years: [1880, 1920], color: "#a08456",
    tagline: "Biblical & traditional. Mary, John, William, James dominate. Top 10 captures ~32% of all babies.",
    keyNames: ["Mary", "John", "William", "Helen", "George", "Margaret"] },
  { id: "hollywood",     label: "The Hollywood Era",      years: [1920, 1950], color: "#b96f4a",
    tagline: "Celebrity influence begins. Shirley (Temple), Gary (Cooper), Marilyn. The first cultural triggers.",
    keyNames: ["Shirley", "Gary", "Marilyn", "Judy", "Donna"] },
  { id: "suburban",      label: "The Suburban Era",       years: [1950, 1970], color: "#d4a64a",
    tagline: "Conformity peak. Linda alone reaches 8.6/1k. Highest name concentration in 144 years.",
    keyNames: ["Linda", "Michael", "Susan", "David", "Patricia", "Karen"] },
  { id: "individuality", label: "The Individuality Era",  years: [1970, 1995], color: "#8fa05a",
    tagline: "Names cycle faster. Soap operas, sitcoms drive adoption. Jennifer, Jessica, Amy travel as a pack.",
    keyNames: ["Jennifer", "Jessica", "Ashley", "Brittany", "Brandon", "Heather"] },
  { id: "unique",        label: "The Unique Era",         years: [1995, 2024], color: "#6f8aa8",
    tagline: "No single name dominates. Top 10 share collapses to 8%. Naming entropy at all-time high.",
    keyNames: ["Emma", "Liam", "Olivia", "Noah", "Aiden", "Sophia"] },
];

// Yearly diversity / top-10 share
const DIVERSITY = YEARS.map(year => {
  const t = (year - 1880) / (2024 - 1880);
  // Top-10 share: peaks 1950 ~32%, drops to 8% by 2024
  const top10 = 0.10 + 0.22 * Math.exp(-Math.pow((year - 1950) / 28, 2)) - 0.04 * Math.max(0, (year - 1990) / 34);
  // Entropy rises (more unique names)
  const entropy = 6.2 + 4.1 * (1 / (1 + Math.exp(-(year - 1968) / 12)));
  const uniqueNames = Math.round(8000 + 27000 * (1 / (1 + Math.exp(-(year - 1972) / 14))));
  return { year, top10Share: +top10.toFixed(3), entropy: +entropy.toFixed(2), uniqueNames };
});

// Validation events
const VALIDATION = [
  { event: "Shirley Temple peak fame",    year: 1935, name: "Shirley", expected: "surge",    detected: true,  delta: "+340%" },
  { event: "WWII era — Linda explosion",  year: 1947, name: "Linda",   expected: "surge",    detected: true,  delta: "+820%" },
  { event: "\u201cLove Story\u201d film",                 year: 1970, name: "Jennifer",expected: "#1",       detected: true,  delta: "peak 1972" },
  { event: "Princess Diana wedding",       year: 1981, name: "Diana",   expected: "surge",    detected: true,  delta: "+62%"  },
  { event: "\u201cFriends\u201d premiere",                year: 1994, name: "Emma",    expected: "revival",  detected: true,  delta: "+210%" },
  { event: "Hurricane Katrina",            year: 2005, name: "Katrina", expected: "collapse", detected: true,  delta: "-89%"  },
  { event: "\u201cGame of Thrones\u201d S01",             year: 2011, name: "Khaleesi",expected: "appear",   detected: true,  delta: "0 → 560" },
  { event: "Frozen release",               year: 2013, name: "Elsa",    expected: "surge",    detected: true,  delta: "+1100%" },
  { event: "Amazon Echo launch",           year: 2014, name: "Alexa",   expected: "collapse", detected: true,  delta: "-95%"  },
  { event: "\u201cKaren\u201d meme cycle",                year: 2018, name: "Karen",   expected: "collapse", detected: true,  delta: "-73%"  },
];

// Pipeline stages
const PIPELINE = [
  { id: "00", name: "acquire",     desc: "SSA zip → parquet",            rows: "2.1M",    time: "0:42" },
  { id: "01", name: "clean",       desc: "normalize + rate per 1k",      rows: "2.1M",    time: "0:18" },
  { id: "02", name: "waves",       desc: "rise/peak/decay fits",         rows: "105k",    time: "1:08" },
  { id: "03", name: "eras",        desc: "temporal-profile clustering",  rows: "105k",    time: "0:54" },
  { id: "04", name: "contagion",   desc: "trigger detection",            rows: "1,420",   time: "0:31" },
  { id: "05", name: "diversity",   desc: "Shannon entropy / year",       rows: "144",     time: "0:04" },
  { id: "06", name: "gender",      desc: "crossover detection",          rows: "1,872",   time: "0:09" },
  { id: "07", name: "uniqueness",  desc: "per-name-year rarity",         rows: "2.1M",    time: "0:22" },
  { id: "08", name: "geography",   desc: "state-level Gini",             rows: "32M",     time: "3:11" },
  { id: "09", name: "validate",    desc: "cross-ref cultural events",    rows: "92",      time: "0:02" },
];

// Co-rising waves
const WAVES_GROUPS = [
  { id: "jennifer", label: "The Jennifer Wave",  year: 1972, names: ["Jennifer","Jessica","Amy","Heather","Melissa"], note: "Five names peak within a five-year window. Most concentrated generational signature in the corpus." },
  { id: "linda",    label: "The Linda Surge",    year: 1949, names: ["Linda","Patricia","Susan","Donna","Judy"],       note: "Post-war suburban formation. Linda alone hits 8.6 per thousand." },
  { id: "ashley",   label: "The Ashley Cohort",  year: 1988, names: ["Ashley","Jessica","Brittany","Tiffany","Crystal"],note: "Soap opera era. -ley / -ny / -al suffix cluster." },
  { id: "revival",  label: "The Victorian Revival",year: 2015,names: ["Emma","Olivia","Charlotte","Sophia","Isabella"],note: "Names that died in 1920 reborn 100 years later. Reader, your great-grandmother is back." },
  { id: "aiden",    label: "The -aiden Explosion",year: 2010, names: ["Aiden","Mason","Noah","Liam","Jayden"],         note: "Phonetic cluster. Vowel-D-vowel-N becomes the sound of the 2010s boy." },
];

// Suffix trends
const SUFFIXES = [
  { suffix: "-lyn",  peak: 2005, label: "Madelyn, Brooklyn" },
  { suffix: "-den",  peak: 2012, label: "Aiden, Jayden" },
  { suffix: "-ella", peak: 2017, label: "Isabella, Stella" },
  { suffix: "-ie",   peak: 1925, label: "Bessie, Mamie" },
  { suffix: "-een",  peak: 1955, label: "Doreen, Maureen" },
  { suffix: "-a",    peak: 2018, label: "Emma, Olivia, Mia" },
];

// Lookup index
const NAME_INDEX = Object.fromEntries(NAME_DATA.map(n => [n.name.toLowerCase(), n]));

window.NAMES_DATA = {
  YEARS, NAME_DATA, ERAS, DIVERSITY, VALIDATION, PIPELINE,
  WAVES_GROUPS, SUFFIXES, NAME_INDEX,
};
