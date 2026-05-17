/* global window */
// Sample data for the prototype. All names abstract.

const PLAYER = {
  name: "Durracktu",
  class: "Priest",
  classHue: 80, // pale ivory
  classColor: "var(--c-priest)",
  spec: "Discipline",
  role: "Healer",
  guild: "Goats After Dark",
  realm: "Stormrage",
};

const ROSTER = [
  { name: "Durracktu", cls: "Priest",  spec: "Disc",      role: "heal", hue: 80,  alt: false, you: true },
  { name: "Veshrin",   cls: "Druid",   spec: "Resto",     role: "heal", hue: 60,  alt: false },
  { name: "Maelka",    cls: "Evoker",  spec: "Preserv.",  role: "heal", hue: 165, alt: false },
  { name: "Karthuun",  cls: "Paladin", spec: "Prot",      role: "tank", hue: 0,   alt: false },
  { name: "Brorvik",   cls: "DK",      spec: "Blood",     role: "tank", hue: 25,  alt: false },
  { name: "Sirelle",   cls: "Mage",    spec: "Frost",     role: "dps",  hue: 220, alt: false },
  { name: "Olben",     cls: "Hunter",  spec: "BM",        role: "dps",  hue: 130, alt: false },
  { name: "Pyrrhic",   cls: "Warlock", spec: "Destro",    role: "dps",  hue: 295, alt: false },
  { name: "Tenrai",    cls: "Monk",    spec: "Windwalker",role: "dps",  hue: 165, alt: false },
  { name: "Ashreon",   cls: "DH",      spec: "Havoc",     role: "dps",  hue: 320, alt: true },
  { name: "Volgrim",   cls: "Shaman",  spec: "Enhance",   role: "dps",  hue: 245, alt: false },
  { name: "Iridessa",  cls: "Rogue",   spec: "Sub",       role: "dps",  hue: 90,  alt: false },
  { name: "Bran",      cls: "Warrior", spec: "Arms",      role: "dps",  hue: 75,  alt: true },
];

const LATEST_RAID = {
  id: "2026-05-12",
  date: "Tuesday, May 12, 2026",
  dateShort: "12 May",
  zone: "Undermine",
  difficulty: "Heroic",
  duration: "3h 14m",
  parsed: "2:47 ago",
  yourRole: "Healer · Discipline",
  swappedTo: "Holy",
  yourDeaths: 1,
  raidDeaths: 38,
  pulls: 19,
  kills: 6,
  bosses: [
    { n: 1, name: "Vexie & Geargrinder",   atts: 1, status: "killed", time: "8:21" },
    { n: 2, name: "Cauldron of Carnage",   atts: 2, status: "killed", time: "12:05" },
    { n: 3, name: "Rik Reverb",            atts: 1, status: "killed", time: "9:40" },
    { n: 4, name: "Stix Bunkjunker",       atts: 3, status: "killed", time: "11:18" },
    { n: 5, name: "Sprocketmonger",        atts: 1, status: "killed", time: "10:02" },
    { n: 6, name: "One-Armed Bandit",      atts: 4, status: "killed", time: "13:55" },
    { n: 7, name: "Mug'Zee, Heads of Sec.",atts: 7, status: "wipe",   time: "—" },
    { n: 8, name: "Chrome King Gallywix",  atts: 0, status: "skip",   time: "—" },
  ],
};

const MOMENTS = [
  {
    id: "m4",
    t: "22:11",
    kind: "death",
    weight: 4,
    title: "Caught by Cluster Bomb in phase 3",
    short: "Pull 6 · 04:32 · the mechanic worth replaying",
    ctx: "Boss 7 · Pull 6 · 04:32 into pull",
    hue: 25,
    ico: "✕",
    pullId: "p18",
    pullT: 272,
    scenarioId: "collapse",
    members: ["Durracktu"],
    nearby: ["Karthuun", "Brorvik", "Sirelle", "Olben", "Pyrrhic"],
    narrative: "Penance was still channeling when the marker dropped. Cancel-cast would have cleared the radius in time. Three other raiders had already moved; the cast finished a fraction late and Cluster Bomb landed for 487k.",
    lead: [
      { t: "04:28.6", text: "Marker spawned under your position" },
      { t: "04:28.6", text: "Penance still channeling — 1.4s remaining" },
      { t: "04:31.8", text: "Three other raiders cleared the radius" },
      { t: "04:32.5", text: "Impact · Pain Suppression on cooldown" },
    ],
    aftermath: "Healing collapsed 14s later when Maelka was caught between adds during your battle-rez. Wipe at 06:18.",
    questions: [
      { q: "Could I have lived if I had cancel-cast at 04:28?",            direction: "what-if" },
      { q: "Who tried to save me in the last four seconds?",              direction: "received", scenario: "collapse" },
      { q: "Did anyone else die because I went down?",                    direction: "impact",   scenario: "collapse" },
    ],
  },
  {
    id: "m2",
    t: "22:03",
    kind: "save",
    weight: 5,
    title: "Pain Suppression saved Karthuun at 6% HP",
    short: "Pull 6 · 02:42 · the save that held add wave 2",
    ctx: "Boss 7 · Pull 6 · add wave 2",
    hue: 165,
    ico: "✚",
    pullId: "p18",
    pullT: 162,
    scenarioId: "extcd",
    members: ["Durracktu", "Karthuun"],
    nearby: ["Karthuun", "Brorvik", "Veshrin"],
    narrative: "Karthuun was at 6% with the second swing of add wave 2 incoming. You committed Pain Suppression with 0.3s of margin. He survived the next swing at 11%.",
    lead: [
      { t: "02:39", text: "Karthuun took swing 1 of add wave 2" },
      { t: "02:40", text: "Karthuun → 12% HP" },
      { t: "02:41", text: "You committed Pain Suppression" },
      { t: "02:42", text: "Karthuun took swing 2 at 6% HP — survived at 11%" },
    ],
    aftermath: "The external CD chain held both tanks through the rest of the wave. Brorvik used Icebound Fortitude on instinct at 02:48.",
    questions: [
      { q: "What if I'd held PS for the phase 3 collapse instead?",        direction: "what-if" },
      { q: "Did this cooldown overlap with another healer's?",             direction: "team", scenario: "extcd" },
      { q: "Who else could have caught this with their cooldowns?",        direction: "team", scenario: "extcd" },
    ],
  },
  {
    id: "m5",
    t: "22:14",
    kind: "save",
    weight: 4,
    title: "The cohort held the raid together for 21 more seconds",
    short: "Pull 6 · 04:45 · the response after the spread mechanic landed",
    ctx: "Boss 7 · Pull 6 · phase 3 transition",
    hue: 165,
    ico: "✚",
    pullId: "p18",
    pullT: 285,
    scenarioId: "collapse",
    members: ["Veshrin", "Durracktu"],
    nearby: ["Veshrin", "Karthuun", "Brorvik"],
    narrative: "After the spread mechanic resolved, Veshrin chain-cast Tranquility, then Ironbark on Karthuun, then a battle-rez. The raid held together 21 seconds longer than the parse suggests it should have.",
    lead: [
      { t: "04:32", text: "You died" },
      { t: "04:34", text: "Veshrin began Tranquility" },
      { t: "04:38", text: "Veshrin Ironbark → Karthuun" },
      { t: "04:42", text: "Veshrin started battle-rez on you" },
      { t: "04:46", text: "Maelka caught between two adds — died" },
    ],
    aftermath: "Wipe at 06:18 — but the comeback attempt got the raid to 14% before adds overwhelmed the tank line.",
    questions: [
      { q: "How did Veshrin keep the tanks alive after my death?",          direction: "received", scenario: "collapse" },
      { q: "Was the battle-rez worth Maelka's risk?",                       direction: "what-if",  scenario: "collapse" },
      { q: "What was the actual cause of the wipe — my death, or what came after?", direction: "self", scenario: "collapse" },
    ],
  },
  {
    id: "m1",
    t: "21:14",
    kind: "swap",
    weight: 3,
    title: "Swapped to Holy for progression",
    short: "Pull 6 · pre-pull · the quiet decision that mattered",
    ctx: "Boss 7 · Pull 6 · pre-pull",
    hue: 60,
    ico: "↻",
    pullId: "p18",
    pullT: 0,
    scenarioId: null,
    members: ["Durracktu"],
    nearby: [],
    narrative: "You'd been Disc all night. Karthuun called for more raw throughput on pull 6. You re-specced to Holy in the break — eighteen minutes of preparation invisible from the log.",
    lead: [
      { t: "pre-raid", text: "Talents and gear set for Disc Priest" },
      { t: "between pulls", text: "Karthuun: 'more raw HPS for the prog pull?'" },
      { t: "20:48",   text: "You committed to Holy spec — 4 minute prep" },
    ],
    aftermath: "Holy Word: Sanctify covered the add waves Disc couldn't have spot-healed. It's the kind of contribution the raw log can't see.",
    questions: [
      { q: "How much did the Holy spec change my heal output on this pull?", direction: "self" },
      { q: "Would Disc have caught the same saves?",                          direction: "what-if" },
    ],
  },
  {
    id: "m3",
    t: "20:48",
    kind: "feast",
    weight: 2,
    title: "Dropped Cauldron of the Pooled Knowledge",
    short: "Pre-pull · the rune that quietly saved a wipe",
    ctx: "Pre-pull · Boss 6",
    hue: 90,
    ico: "✦",
    pullId: "p12",
    pullT: 0,
    scenarioId: null,
    members: ["Durracktu"],
    nearby: [],
    narrative: "You brought and dropped the Cauldron. Twelve raiders used it. It's the sort of thing nobody thanks anyone for in the moment — but it added 4% raid throughput on the kill pull.",
    lead: [],
    aftermath: "One-Armed Bandit kill came on the fourth pull. Three raiders had Cauldron buff active in the final 90 seconds.",
    questions: [
      { q: "What was the Cauldron's actual contribution to that kill?", direction: "team" },
    ],
  },
];

const RETRO_EXCERPT = {
  excerpt: "Good correction on phase transitions tonight. Way better positioning discipline after pull 4. Special thanks to those who swapped roles for progression — it's the kind of quiet generosity that makes the difference between a wipe and a kill.",
  author: "Karthuun",
  role: "Raid Lead",
  postedAgo: "2 hours ago",
  read: false,
};

const SUPPORT_ACTIONS = [
  { who: "Maelka",   what: "Provided feast for the raid",      ico: "✦", hue: 90 },
  { who: "Durracktu",what: "Swapped to Holy for progression",  ico: "↻", hue: 60, isYou: true },
  { who: "Brorvik",  what: "Brought Vantus Rune stack",        ico: "✚", hue: 165 },
  { who: "Iridessa", what: "Provided Cauldron",                ico: "✦", hue: 90 },
  { who: "Ashreon",  what: "Alt-swapped from main DK",         ico: "↻", hue: 60 },
  { who: "Veshrin",  what: "Stayed late for progression pulls",ico: "✚", hue: 165 },
];

const RAID_HISTORY = [
  { id: "2026-05-12", date: "12 May", day: "Tue", title: "Undermine — Heroic", bosses: "6/8 killed · 1 progression",
    deaths: 1, swap: "Disc → Holy", parsed: true, contributed: false },
  { id: "2026-05-08", date: "08 May", day: "Fri", title: "Undermine — Heroic", bosses: "5/8 killed",
    deaths: 3, swap: null, parsed: true, contributed: true },
  { id: "2026-05-05", date: "05 May", day: "Tue", title: "Undermine — Heroic", bosses: "4/8 killed · 2 progression",
    deaths: 5, swap: null, parsed: true, contributed: true },
  { id: "2026-05-01", date: "01 May", day: "Fri", title: "Undermine — Heroic", bosses: "4/8 killed",
    deaths: 2, swap: "Disc → Holy", parsed: true, contributed: true },
  { id: "2026-04-29", date: "29 Apr", day: "Tue", title: "Undermine — Heroic", bosses: "3/8 killed · 1 progression",
    deaths: 4, swap: null, parsed: true, contributed: true },
  { id: "2026-04-25", date: "25 Apr", day: "Fri", title: "Undermine — Normal clear",bosses: "8/8 killed",
    deaths: 0, swap: null, parsed: true, contributed: true },
];

// Pulls within the latest raid, used in the review page.
const RAID_PULLS = [
  { id: "p1", boss: 1, n: 1, status: "kill", dur: 308, start: 0,    end: 308 },
  { id: "p2", boss: 2, n: 1, status: "wipe", dur: 245, start: 380,  end: 625 },
  { id: "p3", boss: 2, n: 2, status: "kill", dur: 312, start: 700,  end: 1012 },
  { id: "p4", boss: 3, n: 1, status: "kill", dur: 290, start: 1080, end: 1370 },
  { id: "p5", boss: 4, n: 1, status: "wipe", dur: 180, start: 1440, end: 1620 },
  { id: "p6", boss: 4, n: 2, status: "wipe", dur: 220, start: 1700, end: 1920 },
  { id: "p7", boss: 4, n: 3, status: "kill", dur: 410, start: 2000, end: 2410 },
  { id: "p8", boss: 5, n: 1, status: "kill", dur: 295, start: 2480, end: 2775 },
  { id: "p9", boss: 6, n: 1, status: "wipe", dur: 160, start: 2840, end: 3000 },
  { id: "p10",boss: 6, n: 2, status: "wipe", dur: 230, start: 3070, end: 3300 },
  { id: "p11",boss: 6, n: 3, status: "wipe", dur: 250, start: 3370, end: 3620 },
  { id: "p12",boss: 6, n: 4, status: "kill", dur: 380, start: 3690, end: 4070 },
  { id: "p13",boss: 7, n: 1, status: "wipe", dur: 140, start: 4150, end: 4290 },
  { id: "p14",boss: 7, n: 2, status: "wipe", dur: 200, start: 4360, end: 4560 },
  { id: "p15",boss: 7, n: 3, status: "wipe", dur: 250, start: 4630, end: 4880 },
  { id: "p16",boss: 7, n: 4, status: "wipe", dur: 295, start: 4950, end: 5245 },
  { id: "p17",boss: 7, n: 5, status: "wipe", dur: 340, start: 5320, end: 5660 },
  { id: "p18",boss: 7, n: 6, status: "wipe", dur: 380, start: 5740, end: 6120, selected: true },
  { id: "p19",boss: 7, n: 7, status: "wipe", dur: 410, start: 6200, end: 6610 },
];

// Events for the selected pull (Boss 7 · Pull 6, the 'progression' pull).
const PULL_EVENTS = [
  { t: 0,    kind: "cd",    label: "Pre-pull · Power Word: Fortitude", ico: "✦" },
  { t: 32,   kind: "cd",    label: "Pain Suppression on Karthuun",     ico: "✚" },
  { t: 84,   kind: "save",  label: "Saved Sirelle (12% HP)",           ico: "✚" },
  { t: 142,  kind: "cd",    label: "Power Word: Barrier",              ico: "✦" },
  { t: 178,  kind: "save",  label: "Saved Olben from Cluster",         ico: "✚" },
  { t: 245,  kind: "cd",    label: "Rapture window opened",            ico: "✦" },
  { t: 272,  kind: "death", label: "Caught by Cluster Bomb",           ico: "✕" },
  { t: 340,  kind: "save",  label: "Resurrected by Veshrin",           ico: "✚" },
];

const ASK_HISTORY = [
  { id: "q1", q: "Why did movement collapse during phase 3?", t: "8m ago", encounter: "Mug'Zee · Pull 6" },
  { id: "q2", q: "Show healing cooldown overlap on pull 6.",  t: "21m ago", encounter: "Mug'Zee · Pull 6" },
  { id: "q3", q: "What killed me on pull 6?",                 t: "34m ago", encounter: "Mug'Zee · Pull 6" },
  { id: "q4", q: "When did I swap from Disc to Holy?",        t: "1h ago",  encounter: "Mug'Zee · Pull 6" },
];

const ASK_SUGGESTIONS = [
  "What killed me on pull 6?",
  "Show healing cooldown overlap during phase 3.",
  "Where did movement collapse during phase 3?",
  "Compare my deaths across the night.",
  "When did support actions cluster?",
  "Who took the most avoidable damage on Boss 6?",
];

// Demo answer for the selected question.
const ASK_DEMO_QUESTION = "What killed me on pull 6?";
const ASK_DEMO_ANSWER = {
  question: "What killed me on pull 6?",
  trace: [
    { state: "done", label: "Located pull",         detail: "Mug'Zee · Pull 6 · 06:20 duration" },
    { state: "done", label: "Filtered to player",   detail: "Durracktu (Disc Priest)" },
    { state: "done", label: "Scanned combat log",   detail: "4 ability events in 3s prior to death" },
    { state: "done", label: "Read encounter timeline", detail: "Cluster Bomb cast group (3 casts)" },
    { state: "done", label: "Cross-referenced movement", detail: "Replay frames 04:30.2 – 04:32.7" },
  ],
  // body is split into nodes so we can interleave inline citations
  body: [
    "You died at ", { cite: "04:32", ref: "replay", t: 272 }, " on pull 6, four minutes thirty-two seconds into the pull. Death was caused by a single instance of ",
    { cite: "Cluster Bomb · 487k", ref: "log" }, " landing on you while you were stationary.",
    "br",
    "Before death you were channeling ", { cite: "Penance", ref: "log" }, " on Karthuun for 1.4 seconds. ",
    "Cluster Bomb has a 4-second cast and a visible ground marker; the marker appeared at ", { cite: "04:28.6", ref: "replay", t: 268 }, " and you remained inside it.",
    "br",
    "Three other raiders moved out within 0.8s of the marker spawn. You did not move until impact at ", { cite: "04:32.5", ref: "replay", t: 272 }, ".",
    "br-strong",
    { kind: "callout",
      title: "Most likely cause",
      body: "Channeled cast was not cancelled when the marker appeared under you. Pain Suppression was on cooldown (used 50s prior). No other defensive was available." },
  ],
  sources: [
    { type: "Replay", label: "Mug'Zee · Pull 6", t: "04:28 – 04:33" },
    { type: "Log",    label: "Combat log line 14,028 – 14,056" },
    { type: "Encounter", label: "Cluster Bomb · ability metadata" },
  ],
};

const SETTINGS_GROUPS = [
  { id: "local", title: "Local services",
    items: [
      { label: "Parser", desc: "Combat log parser", value: "v0.18.2 · running", state: "ok", code: true },
      { label: "Ollama", desc: "Local language model service", value: "Connected · localhost:11434", state: "ok", code: true },
      { label: "Model",  desc: "Active model for /ask", value: "llama3.1:70b-instruct-q4", state: "ok", code: true },
      { label: "Replay cache", desc: "On-disk encounter cache", value: "412 MB used · 18 encounters", state: "ok" },
    ] },
  { id: "storage", title: "Storage",
    items: [
      { label: "Local raid archive", desc: "Combat logs retained on this machine", value: "1.4 GB · 47 raids", state: "ok" },
      { label: "Log directory", desc: "Where Lantern reads combat logs from", value: "~/Library/Application Support/WoW/_retail_/Logs", code: true },
      { label: "Auto-prune after", desc: "Logs older than this are compressed", value: "90 days" },
    ] },
  { id: "privacy", title: "Privacy & contribution",
    items: [
      { label: "Default upload behavior", desc: "When you parse a new raid", value: "Ask each time", toggle: false },
      { label: "Include movement traces", desc: "Allows replay reconstruction guild-side", value: "Off by default", toggle: false },
      { label: "Include /ask transcripts", desc: "AI conversations stay local unless you opt in", value: "Local only", toggle: false },
    ] },
];

const PACKAGE_ITEMS = [
  { kind: "dir", path: "raid/2026-05-12/", note: "" },
  { kind: "file", path: "  parsed.encounters.json", sz: "284 KB", upload: true, tag: "upload",
    desc: "Boss kills, attempts, durations" },
  { kind: "file", path: "  pull-summaries.json",   sz: "61 KB",  upload: true, tag: "upload",
    desc: "Damage / heal / death totals per pull" },
  { kind: "file", path: "  support-events.json",   sz: "8 KB",   upload: true, tag: "upload",
    desc: "Feast, cauldron, role swaps, alt swaps" },
  { kind: "file", path: "  movement.trace.bin",    sz: "12.4 MB",upload: false, tag: "optional",
    desc: "Movement frames · enables replay reconstruction" },
  { kind: "file", path: "  raw.combatlog.gz",      sz: "180 MB", upload: false, tag: "local",
    desc: "Stays on this machine" },
  { kind: "file", path: "  ask.transcripts.json",  sz: "4 KB",   upload: false, tag: "local",
    desc: "AI questions you asked — stays local" },
];

const CONSENT = [
  { id: "summary", label: "Include encounter & pull summaries",
    desc: "What's recorded: kill/wipe outcomes, durations, attempt counts. No combat log lines.", on: true },
  { id: "support", label: "Include support contributions",
    desc: "Feast, cauldron, role swaps, alt swaps. Preserved as continuity signals in the chronicle.", on: true },
  { id: "movement", label: "Include movement traces",
    desc: "Enables the advanced replay surface to reconstruct this raid. Increases upload size.", on: false },
  { id: "retro", label: "Allow my notes to be quoted in the retrospective",
    desc: "Your written reflections (if any) can be quoted by the raid leader in the human-authored retro.", on: true },
  { id: "ask", label: "Share /ask transcripts with the guild",
    desc: "Off by default. AI exploration stays local unless you opt in.", on: false },
];

/* ============================================================
   Cohort layer — ephemeral, contextual selections
   ============================================================ */

// Quick filters available in the replay surface.
const COHORT_PRESETS = [
  { id: "healers",  label: "Healers",          ico: "✚",
    pick: r => r.filter(p => p.role === "heal").map(p => p.name) },
  { id: "tanks",    label: "Tanks",            ico: "▣",
    pick: r => r.filter(p => p.role === "tank").map(p => p.name) },
  { id: "melee",    label: "Melee cluster",    ico: "✕",
    pick: r => r.filter(p => ["Rogue","Monk","DH","Warrior","Paladin","DK","Shaman"].includes(p.cls) && p.role === "dps").map(p => p.name).slice(0, 5) },
  { id: "ranged",   label: "Ranged cluster",   ico: "✦",
    pick: r => r.filter(p => ["Mage","Warlock","Hunter","Evoker"].includes(p.cls)).map(p => p.name) },
  { id: "support",  label: "Support cohort",   ico: "↻",
    pick: () => ["Durracktu","Maelka","Brorvik","Ashreon","Iridessa","Veshrin"] },
  { id: "extcd",    label: "External CD chain",ico: "✚",
    pick: () => ["Durracktu","Karthuun","Brorvik","Veshrin"] },
];

// Three fully mocked cohort scenarios used in the prototype.
const COHORT_SCENARIOS = {
  collapse: {
    id: "collapse",
    title: "Phase 3 healing collapse",
    members: ["Durracktu", "Veshrin", "Maelka"],
    range: [240, 320],
    pullId: "p18",
    pullLabel: "Mug'Zee · Pull 6",
    t: 272,
    summary: "Three healers — the moment two died within four seconds and the raid fell.",
  },
  extcd: {
    id: "extcd",
    title: "External CD chain · add wave 1",
    members: ["Durracktu", "Karthuun", "Brorvik", "Veshrin"],
    range: [28, 92],
    pullId: "p18",
    pullLabel: "Mug'Zee · Pull 6",
    t: 32,
    summary: "Four overlapping externals kept both tanks alive through the first add wave.",
  },
  spread: {
    id: "spread",
    title: "Ranged spread · Cluster Bombs",
    members: ["Sirelle", "Olben", "Pyrrhic", "Volgrim"],
    range: [200, 280],
    pullId: "p18",
    pullLabel: "Mug'Zee · Pull 6",
    t: 248,
    summary: "Ranged spread for Cluster Bomb — three moved on time, one stayed channeling.",
  },
};

// Cohort cards content — pre-built per scenario so the analysis reads as
// considered observation rather than autogenerated metric soup.

const COHORT_CARDS = {
  collapse: {
    cdChoreography: [
      { name: "Durracktu", events: [
        { t: 32, label: "Pain Suppression", ico: "✚", hue: 60 },
        { t: 142, label: "Power Word: Barrier", ico: "✦", hue: 60 },
        { t: 245, label: "Rapture", ico: "✦", hue: 60 },
      ]},
      { name: "Veshrin",  events: [
        { t: 56,  label: "Tranquility", ico: "✦", hue: 90 },
        { t: 196, label: "Ironbark", ico: "✚", hue: 90 },
        { t: 268, label: "Tranquility (rec)", ico: "✦", hue: 90 },
      ]},
      { name: "Maelka",   events: [
        { t: 88,  label: "Dream Breath", ico: "✦", hue: 165 },
        { t: 212, label: "Time Dilation", ico: "✚", hue: 165 },
      ]},
    ],
    cohesion: [
      { t: 0,   d: 28 }, { t: 30, d: 22 }, { t: 60, d: 19 }, { t: 90, d: 24 },
      { t: 120, d: 18 }, { t: 150, d: 20 }, { t: 180, d: 22 }, { t: 210, d: 30 },
      { t: 240, d: 48 }, { t: 260, d: 62 }, { t: 272, d: 58, marker: "Durracktu dies" },
      { t: 286, d: 64, marker: "Maelka dies" }, { t: 300, d: 70 }, { t: 320, d: 64 },
    ],
    coordination: [
      { t: 245, kind: "stack-break", label: "Stack broke for spread mechanic" },
      { t: 268, kind: "support-chain", label: "Tranquility recommitted late" },
      { t: 272, kind: "death", label: "Cluster Bomb killed Durracktu" },
      { t: 286, kind: "death", label: "Maelka caught by adds" },
      { t: 290, kind: "collapse", label: "Healing collapse — tanks took 4 unhealed hits" },
    ],
    deaths: [
      { who: "Durracktu", t: 272, cause: "Cluster Bomb (avoidable)", note: "Channeling Penance — did not move" },
      { who: "Maelka",    t: 286, cause: "Add melee swing", note: "Caught between two adds while reviving" },
    ],
    recoveries: [],
  },
  extcd: {
    cdChoreography: [
      { name: "Durracktu", events: [
        { t: 32, label: "Pain Suppression → Karthuun", ico: "✚", hue: 60 },
        { t: 64, label: "Power Word: Barrier", ico: "✦", hue: 60 },
      ]},
      { name: "Karthuun",  events: [
        { t: 30, label: "Ardent Defender (self)", ico: "▣", hue: 0 },
        { t: 72, label: "Guardian of Ancient Kings", ico: "▣", hue: 0 },
      ]},
      { name: "Brorvik",   events: [
        { t: 48, label: "Vampiric Blood (self)", ico: "▣", hue: 25 },
        { t: 78, label: "Icebound Fortitude", ico: "▣", hue: 25 },
      ]},
      { name: "Veshrin",   events: [
        { t: 36, label: "Ironbark → Karthuun", ico: "✚", hue: 90 },
        { t: 56, label: "Ironbark → Brorvik", ico: "✚", hue: 90 },
      ]},
    ],
    cohesion: [
      { t: 28, d: 8 }, { t: 40, d: 9 }, { t: 50, d: 11 }, { t: 60, d: 10 },
      { t: 70, d: 8 }, { t: 80, d: 12 }, { t: 92, d: 9 },
    ],
    coordination: [
      { t: 30, kind: "support-chain", label: "Tank externals overlapped within 2.4s" },
      { t: 32, kind: "save", label: "Pain Suppression caught Karthuun at 18%" },
      { t: 56, kind: "support-chain", label: "Ironbark handed off mid-wave" },
      { t: 78, kind: "save", label: "Brorvik survived swing 2 with 6% HP" },
    ],
    deaths: [],
    recoveries: [
      { who: "Karthuun", t: 32, by: "Durracktu", note: "Pain Suppression caught 18% HP" },
      { who: "Brorvik",  t: 78, by: "Brorvik (self)", note: "Icebound Fortitude on instinct" },
    ],
  },
  spread: {
    cdChoreography: [
      { name: "Sirelle", events: [
        { t: 215, label: "Ice Block (preemptive)", ico: "▣", hue: 220 },
      ]},
      { name: "Olben",   events: [
        { t: 220, label: "Disengage → spread", ico: "↻", hue: 130 },
      ]},
      { name: "Pyrrhic", events: [
        { t: 224, label: "Demonic Circle: Teleport", ico: "↻", hue: 295 },
      ]},
      { name: "Volgrim", events: [
        { t: 248, label: "Spirit Walk (late)", ico: "↻", hue: 245, late: true },
      ]},
    ],
    cohesion: [
      { t: 200, d: 6 }, { t: 210, d: 8 }, { t: 215, d: 14 },
      { t: 220, d: 24 }, { t: 230, d: 38 }, { t: 240, d: 44 },
      { t: 248, d: 32, marker: "Volgrim moves" }, { t: 260, d: 40 }, { t: 280, d: 42 },
    ],
    coordination: [
      { t: 215, kind: "spread", label: "Spread mechanic announced" },
      { t: 220, kind: "stack-break", label: "Sirelle, Olben, Pyrrhic moved within 1s" },
      { t: 248, kind: "divergence", label: "Volgrim moved 28s after the marker" },
      { t: 252, kind: "save", label: "Astral Shift saved Volgrim at 22%" },
    ],
    deaths: [],
    recoveries: [
      { who: "Volgrim", t: 252, by: "Volgrim (self)", note: "Astral Shift caught the explosion" },
    ],
  },
};

/* ============================================================
   Workshop — additional cohort-aware answers
   ============================================================ */

const WORKSHOP_ANSWERS = {
  // Default single-player demo (used by /ask)
  "what killed me on pull 6?": ASK_DEMO_ANSWER,

  "why did this cohort collapse?": {
    question: "Why did this cohort collapse?",
    cohortId: "collapse",
    trace: [
      { state: "done", label: "Resolved cohort",       detail: "3 healers · Durracktu, Veshrin, Maelka" },
      { state: "done", label: "Located timeline range",detail: "Mug'Zee · Pull 6 · 04:00 – 05:20" },
      { state: "done", label: "Filtered combat log",   detail: "61 events involving cohort members" },
      { state: "done", label: "Computed proximity",    detail: "Mean pairwise distance over 80s window" },
      { state: "done", label: "Cross-referenced replay",detail:"Frames 04:00.0 – 05:20.0" },
    ],
    body: [
      "The cohort held together until ", { cite: "04:00", ref: "replay", t: 240 }, ", when phase 3 began and Cluster Bombs forced a spread. ",
      "Average pairwise distance rose from ", { cite: "20 yd → 62 yd", ref: "log" }, " in eighteen seconds.",
      "br",
      "During the spread, Durracktu remained inside a marker and died at ", { cite: "04:32", ref: "replay", t: 272 }, ". ",
      "Veshrin committed Tranquility 18 seconds late, at ", { cite: "04:28", ref: "log" }, " — by then the cohort was beyond healing range of each other.",
      "br",
      "Maelka attempted a battle-resurrection at ", { cite: "04:46", ref: "replay", t: 286 }, " and was caught between two adds.",
      "br-strong",
      { kind: "callout",
        title: "Most likely cause",
        body: "The cohort collapsed because the spread mechanic pulled it past its own healing radius before any of the three could commit a raid cooldown. Earlier Tranquility (within 8s of marker) would have held the group." },
    ],
    sources: [
      { type: "Replay", label: "Mug'Zee · Pull 6", t: "04:00 – 05:20" },
      { type: "Log",    label: "Combat log line 13,840 – 14,201" },
      { type: "Cohort", label: "Durracktu + Veshrin + Maelka" },
    ],
  },

  "show cooldown overlap during phase transition.": {
    question: "Show cooldown overlap during phase transition.",
    cohortId: "extcd",
    trace: [
      { state: "done", label: "Resolved cohort",        detail: "4 raiders · 1 healer, 2 tanks, 1 healer" },
      { state: "done", label: "Located timeline range", detail: "Mug'Zee · Pull 6 · 00:28 – 01:32" },
      { state: "done", label: "Extracted cast events",  detail: "9 defensive casts in 64s" },
      { state: "done", label: "Computed overlap",       detail: "Pairwise temporal overlap matrix" },
    ],
    body: [
      "During add wave 1 the external cooldown chain landed cleanly. Four defensives overlapped within a ",
      { cite: "26-second window", ref: "log" }, ", and at no point was Karthuun without coverage.",
      "br",
      { kind: "callout",
        title: "Observation",
        body: "Pain Suppression and Ardent Defender overlapped for 6 seconds. Ironbark handed off to Brorvik with a 2-second gap — clean. This is the strongest external chain of the night." },
      "br",
      "Compare to the second add wave at ", { cite: "06:08", ref: "replay", t: 368 }, ", where two of these cooldowns were still on cooldown — the raid wiped 14 seconds later.",
    ],
    sources: [
      { type: "Replay", label: "Mug'Zee · Pull 6", t: "00:28 – 01:32" },
      { type: "Log",    label: "Combat log line 12,402 – 12,488" },
      { type: "Cohort", label: "Durracktu + Karthuun + Brorvik + Veshrin" },
    ],
  },

  "which ranged stayed grouped during spread?": {
    question: "Which ranged stayed grouped during spread?",
    cohortId: "spread",
    trace: [
      { state: "done", label: "Resolved cohort",       detail: "4 ranged DPS" },
      { state: "done", label: "Located mechanic",      detail: "Cluster Bomb spread · 03:35 – 04:40" },
      { state: "done", label: "Read movement frames",  detail: "Frame intervals every 100ms" },
      { state: "done", label: "Computed individual reaction times", detail: "Marker appearance → first lateral movement" },
    ],
    body: [
      "Three of four ranged moved within ",
      { cite: "1.2 seconds", ref: "log" },
      " of the marker. Volgrim moved at ", { cite: "+28s", ref: "replay", t: 248 }, " and survived only because Astral Shift was up.",
      "br",
      "After the spread, the cohort regrouped to a 6-yard radius by ", { cite: "04:48", ref: "replay", t: 288 }, ".",
      "br-strong",
      { kind: "callout",
        title: "Observation",
        body: "The ranged cluster handled the mechanic well. The single divergence cost no death and was followed by a clean regroup. This is a working coordination pattern." },
    ],
    sources: [
      { type: "Replay", label: "Mug'Zee · Pull 6", t: "03:35 – 04:40" },
      { type: "Cohort", label: "Sirelle + Olben + Pyrrhic + Volgrim" },
      { type: "Encounter", label: "Cluster Bomb · mechanic metadata" },
    ],
  },
};

const COHORT_SUGGESTIONS = [
  "Why did this cohort collapse?",
  "Show cooldown overlap during phase transition.",
  "Which ranged stayed grouped during spread?",
  "Compare movement cohesion before and after the spread mechanic.",
  "Who stabilized the group after Durracktu's death?",
  "Show support actions within this selected group.",
];

/* ============================================================
   Home — coordination highlights (calm, narrative)
   ============================================================ */

const COORDINATION_HIGHLIGHTS = [
  { ico: "✚", hue: 165,
    title: "External CD chain held both tanks through add wave 1",
    detail: "Four defensives overlapped within 26 seconds on pull 6.",
    cohort: "extcd" },
  { ico: "↻", hue: 60,
    title: "You moved with the healer line through most of phase 3",
    detail: "Stayed within 12 yards of Veshrin and Maelka for 3:41 of 4:08.",
    cohort: "collapse" },
  { ico: "✦", hue: 90,
    title: "Ranged spread held cleanly on Cluster Bomb",
    detail: "Three of four ranged moved within 1.2s of the marker.",
    cohort: "spread" },
];

/* ============================================================
   Notebook — personal scratchpad. Local-only.
   ============================================================ */

const NOTEBOOK_TAGS = [
  { id: "ask-later",    label: "#ask-later",    hue: 60 },
  { id: "thanks",       label: "#thanks",       hue: 90 },
  { id: "progression",  label: "#progression",  hue: 50 },
  { id: "self",         label: "#self",         hue: 250 },
  { id: "mechanic",     label: "#mechanic",     hue: 25 },
  { id: "cooldowns",    label: "#cooldowns",    hue: 165 },
];

const NOTEBOOK_SEED = [
  {
    id: "n1",
    text: "I keep dying to Cluster Bomb when I'm channeling Penance. Need to bind a cancel-cast macro on Mug'Zee. Maelka mentioned the same problem on the discord \u2014 she found a WeakAura.",
    tags: ["self", "mechanic"],
    binding: { kind: "cohort", scenarioId: "collapse", label: "Phase 3 healing collapse" },
    createdAt: "5 minutes ago",
    pinned: true,
  },
  {
    id: "n2",
    text: "Veshrin's Tranquility went 18 seconds late tonight. Was that a positioning problem, or was she covering something? Ask the model with pull 6 context.",
    tags: ["ask-later", "cooldowns"],
    binding: { kind: "cohort", scenarioId: "collapse", label: "Phase 3 healing collapse" },
    createdAt: "12 minutes ago",
  },
  {
    id: "n3",
    text: "External CD chain on pull 6 was the cleanest of the night. Karthuun's AD into PS into Ironbark hand-off into Brorvik's IBF \u2014 zero gaps. Worth keeping as a reference for future progression.",
    tags: ["cooldowns", "progression"],
    binding: { kind: "cohort", scenarioId: "extcd", label: "External CD chain" },
    createdAt: "34 minutes ago",
  },
  {
    id: "n4",
    text: "Say thanks to Maelka in the next retro \u2014 she's brought Cauldron three raids in a row, and dropped it before progression pulls each time.",
    tags: ["thanks"],
    binding: { kind: "raid", raidId: "2026-05-12", label: "Undermine Heroic \u00b7 12 May" },
    createdAt: "1 hour ago",
  },
  {
    id: "n5",
    text: "Next progression night: pre-position on the left platform before phase 3 transition. The center is where Cluster Bombs always seem to land.",
    tags: ["progression", "mechanic"],
    binding: null,
    createdAt: "yesterday",
  },
  {
    id: "n6",
    text: "Curiosity: do I always die to the same mechanic on Mug'Zee phase 3? Last three raids \u2014 same boss, same phase. Worth checking.",
    tags: ["ask-later", "self"],
    binding: { kind: "encounter", encounterId: "mugzee", label: "Mug'Zee \u00b7 across raids" },
    createdAt: "yesterday",
  },
  {
    id: "n7",
    text: "Rapture window on pull 6 was perfect. Used it right as add wave 2 spawned \u2014 caught the spike heal damage. This is the timing I want to repeat.",
    tags: ["self", "cooldowns"],
    binding: { kind: "pull", raidId: "2026-05-12", pullId: "p18", label: "Mug'Zee \u00b7 Pull 6 \u00b7 04:05" },
    createdAt: "yesterday",
  },
];

/* ============================================================
   Coordination markers — raid review timeline annotations
   ============================================================ */

const COORD_MARKERS = [
  { pullId: "p12", kind: "support-chain", label: "support chain",
    scenarioId: "extcd", note: "Three externals overlapped on the One-Armed Bandit kill." },
  { pullId: "p14", kind: "stack-break",  label: "stack break",
    scenarioId: null, note: "Raid spread two seconds before the marker resolved." },
  { pullId: "p18", kind: "collapse",     label: "collapse",
    scenarioId: "collapse", note: "Phase 3 healing collapse \u2014 selected." },
  { pullId: "p7",  kind: "comeback",     label: "comeback",
    scenarioId: null, note: "Five raiders survived under 8% HP through the Stix kill." },
];

/* ============================================================
   Observations — shared interpretations of raid evidence.
   These are exploratory and discussable. Raid leads MAY reference
   them when authoring retrospectives, but retros are authored
   independently — observations are not retro fragments and never
   become canonical on their own.

   Status:
     shared      — visible in the guild's Observations surface
     referenced  — a raid lead linked it from a published retro
     withdrawn   — author pulled it from the surface
   ============================================================ */

const RAID_LEADS = [
  { name: "Karthuun", role: "Raid Lead",           pavatar_hue: 0 },
  { name: "Veshrin",  role: "Assistant Raid Lead", pavatar_hue: 60 },
];

const OBSERVATION_KINDS = [
  { id: "celebration", label: "Celebration",   desc: "A moment worth marking — a kill, a comeback, a clutch save.", hue: 75 },
  { id: "teamwork",    label: "Teamwork",      desc: "Coordination most people will have missed — handoffs, chains, cover.", hue: 165 },
  { id: "support",     label: "Quiet support", desc: "Feasts, alt-swaps, role-swaps, progression sacrifices.",       hue: 90 },
  { id: "comeback",    label: "Comeback",      desc: "Recovery from a bad pull or near-wipe.",                      hue: 25 },
  { id: "question",    label: "Open question", desc: "Something you noticed and want others to weigh in on.",        hue: 220 },
];

// Backward-compat alias (some imports still reference PROPOSAL_KINDS).
const PROPOSAL_KINDS = OBSERVATION_KINDS;

const OBSERVATIONS_SEED = [
  {
    id: "ob1",
    status: "shared",
    sharedAt: "12 minutes ago",
    raidId: "2026-05-12",
    kind: "teamwork",
    title: "External CD chain on add wave 1 was the cleanest of the night",
    description: "Ardent Defender into Pain Suppression into Ironbark hand-off into Brorvik's Icebound Fortitude. Four overlapping defensives within 26 seconds, zero gaps. Worth a closer look on the replay — maybe a reference for next progression.",
    credits: ["Karthuun", "Durracktu", "Brorvik", "Veshrin"],
    binding: { kind: "cohort", scenarioId: "extcd", label: "External CD chain · Mug'Zee Pull 6" },
    sources: ["replay 00:28–01:32", "log line 12,402–12,488"],
    fromNoteId: "n3",
    viewers: 4,
  },
  {
    id: "ob2",
    status: "referenced",
    sharedAt: "3 days ago",
    raidId: "2026-05-08",
    kind: "support",
    title: "Maelka has brought Cauldron three raids in a row",
    description: "And dropped it before progression each time. Easy to overlook, but it's the kind of quiet generosity that keeps us moving.",
    credits: ["Maelka"],
    binding: null,
    sources: [],
    referencedAt: "2 days ago",
    referencedIn: "Retrospective · Tuesday 5/8",
    viewers: 11,
  },
  {
    id: "ob3",
    status: "withdrawn",
    sharedAt: "1 day ago",
    raidId: "2026-05-12",
    kind: "celebration",
    title: "Stix Bunkjunker kill came back from 5 raiders under 8% HP",
    description: "Five-person clutch. Maelka and Veshrin chained externals while the surviving DPS finished it.",
    credits: ["Maelka", "Veshrin", "Sirelle", "Olben", "Pyrrhic"],
    binding: null,
    sources: [],
    withdrawnAt: "2 hours ago",
  },
];
const PROPOSALS_SEED = OBSERVATIONS_SEED;

/* ============================================================
   Glossary — coordination vocabulary the app uses everywhere
   ============================================================ */

const GLOSSARY = {
  "cohort": {
    label: "Cohort",
    short: "A temporary, contextual group of players you've selected to look at together.",
    long: "Cohorts are ephemeral. They exist only for the moment you're inspecting and disappear when you move on. They're for understanding what happened together — not for friendship lists or persistent groupings.",
  },
  "stack break": {
    label: "Stack break",
    short: "The moment a previously-stacked group separated.",
    long: "Often deliberate (a spread mechanic forcing the raid apart) but sometimes accidental. The replay timeline tags these to make them easy to find.",
  },
  "support chain": {
    label: "Support chain",
    short: "Two or more defensive cooldowns overlapping cleanly to keep a player or raid alive.",
    long: "The cleanest chains have hand-offs with no gap and no over-stacking. Worth marking for the retro when they go well.",
  },
  "collapse": {
    label: "Collapse",
    short: "When a cohort's coordination broke down — usually a healing or positioning failure that led to deaths.",
    long: "Collapses are not failures of individuals. They're the moments worth understanding most carefully, because they reveal coordination assumptions.",
  },
  "comeback": {
    label: "Comeback",
    short: "A pull that survived despite a major setback — multiple players under 8% HP, a tank death, etc.",
    long: "Often heroic and easy to miss in raw numbers. Comebacks are core retrospective material.",
  },
  "divergence": {
    label: "Divergence",
    short: "When a cohort member moved differently from the rest — late to a spread, slow to stack, etc.",
    long: "Not necessarily a mistake. Divergences are facts about how the group moved, surfaced for inspection.",
  },
  "cohesion": {
    label: "Cohesion",
    short: "The mean pairwise distance between cohort members over time — lower means stacked.",
    long: "Cohesion charts show when a group was working together and when it pulled apart. Use them to find the moment a fight became chaotic.",
  },
  "handoff": {
    label: "Handoff",
    short: "When one player's defensive ends as another's begins.",
    long: "Clean handoffs are the hallmark of well-coordinated tank healing. The Workshop can tell you the exact gap (in seconds) between consecutive defensives on the same target.",
  },
  "save": {
    label: "Save",
    short: "A defensive cooldown that arrived in time to prevent a death.",
    long: "Logged automatically when the targeted player's HP would have crossed zero without the cooldown.",
  },
  "swap": {
    label: "Role swap",
    short: "When a player changed spec or role mid-raid — typically for progression.",
    long: "Logged as a support contribution. The chronicle remembers these because they're often quiet sacrifices that don't show up in throughput.",
  },
  "spread": {
    label: "Spread",
    short: "A mechanic that forces the raid to separate — usually because a ground marker would damage anyone nearby.",
    long: "Successful spreads are measured by reaction time (marker → first lateral movement) and final distance between members.",
  },
  "external": {
    label: "External cooldown",
    short: "A defensive cast on someone else rather than self.",
    long: "Examples include Pain Suppression, Ironbark, Blessing of Sacrifice. Externals are the most coordination-dependent defensives in the game.",
  },
  "external cd chain": {
    label: "External CD chain",
    short: "A sequence of external defensives that cover a single damage event without gaps.",
    long: "Often planned. Always inspectable. The cleanest chains are usually proposed for retros.",
  },
};

Object.assign(window, {
  PLAYER, ROSTER, LATEST_RAID, MOMENTS, RETRO_EXCERPT, SUPPORT_ACTIONS,
  RAID_HISTORY, RAID_PULLS, PULL_EVENTS,
  ASK_HISTORY, ASK_SUGGESTIONS, ASK_DEMO_QUESTION, ASK_DEMO_ANSWER,
  SETTINGS_GROUPS, PACKAGE_ITEMS, CONSENT,
  COHORT_PRESETS, COHORT_SCENARIOS, COHORT_CARDS,
  WORKSHOP_ANSWERS, COHORT_SUGGESTIONS, COORDINATION_HIGHLIGHTS,
  NOTEBOOK_TAGS, NOTEBOOK_SEED, COORD_MARKERS,
  RAID_LEADS, PROPOSAL_KINDS, OBSERVATION_KINDS, PROPOSALS_SEED, OBSERVATIONS_SEED,
  GLOSSARY,
});
