/* ============================================================
   Lantern — Domain types
   ------------------------------------------------------------
   These interfaces ARE the data contract. Anything that wants to
   feed Lantern real data (the parser, the guild API, the local
   persistence layer) must produce values that satisfy these
   shapes. See CONTRACTS.md for how the pieces connect.
   ============================================================ */

/* ---------- Identity & roster ---------- */

/** A combat role bucket. Drives layout grouping and role tints. */
export type Role = "heal" | "tank" | "dps";

/** The signed-in player. Comes from the identity layer. */
export interface Player {
  name: string;
  class: string;
  /** Hue (0–360) used for the player's avatar tint. */
  classHue: number;
  /** CSS custom-property reference for the class color. */
  classColor: string;
  spec: string;
  /** Human-facing role label, e.g. "Healer". */
  role: string;
  guild: string;
  realm: string;
}

/** A raider present on a given raid night. */
export interface RosterMember {
  name: string;
  cls: string;
  spec: string;
  role: Role;
  /** Hue (0–360) for the avatar tint. */
  hue: number;
  /** True when this raider was playing an alt character. */
  alt: boolean;
  /** True for the signed-in player's own row. */
  you?: boolean;
}

/* ---------- Raids ---------- */

export type BossStatus = "killed" | "wipe" | "skip";

/** A boss encounter within a raid night. */
export interface Boss {
  /** 1-based boss order in the zone. */
  n: number;
  name: string;
  /** Attempt count this night. */
  atts: number;
  status: BossStatus;
  /** Kill time as "M:SS", or "—" when not killed. */
  time: string;
}

/** Full detail for one raid night. */
export interface Raid {
  /** Stable id — currently the raid date, e.g. "2026-05-12". */
  id: string;
  date: string;
  dateShort: string;
  zone: string;
  difficulty: string;
  duration: string;
  /** Human "time ago" the parse completed. */
  parsed: string;
  yourRole: string;
  /** Spec the player swapped to mid-raid, or null. */
  swappedTo: string | null;
  yourDeaths: number;
  raidDeaths: number;
  pulls: number;
  kills: number;
  bosses: Boss[];
}

/** A compact raid-history row for the /raids list. */
export interface RaidSummary {
  id: string;
  date: string;
  day: string;
  title: string;
  bosses: string;
  deaths: number;
  swap: string | null;
  parsed: boolean;
  contributed: boolean;
}

export type PullStatus = "kill" | "wipe";

/** A single pull (attempt) on the raid-review timeline. */
export interface Pull {
  id: string;
  /** 1-based boss order this pull belongs to. */
  boss: number;
  /** Attempt number against that boss. */
  n: number;
  status: PullStatus;
  /** Pull duration in seconds. */
  dur: number;
  /** Start offset in seconds from raid start. */
  start: number;
  /** End offset in seconds from raid start. */
  end: number;
  selected?: boolean;
}

export type PullEventKind = "cd" | "save" | "death";

/** A player event within a pull (cooldown, save, death). */
export interface PullEvent {
  /** Offset in seconds from pull start. */
  t: number;
  kind: PullEventKind;
  label: string;
  /** Glyph rendered in the timeline marker. */
  ico: string;
}

/* ---------- Moments ---------- */

export type MomentKind =
  | "death"
  | "save"
  | "swap"
  | "feast"
  | "collapse"
  | "comeback";

/** Which direction a follow-up question explores. */
export type QuestionDirection =
  | "what-if"
  | "received"
  | "impact"
  | "team"
  | "self"
  | "context";

export interface MomentQuestion {
  q: string;
  direction: QuestionDirection;
  /** Optional cohort scenario id this question should pre-select. */
  scenario?: string;
}

export interface MomentLeadStep {
  /** Display timestamp, free-form (e.g. "04:28.6", "pre-raid"). */
  t: string;
  text: string;
}

/**
 * A narratively-framed event worth descending into — a death, a
 * save, a swap, a feast. The MomentDrawer renders one of these.
 */
export interface Moment {
  id: string;
  /** Wall-clock time of night, "HH:MM". */
  t: string;
  kind: MomentKind;
  /** 1–5 — higher sorts first and gets larger treatment. */
  weight: number;
  title: string;
  short: string;
  /** Context line, e.g. "Boss 7 · Pull 6 · 04:32 into pull". */
  ctx: string;
  hue: number;
  ico: string;
  pullId: string;
  /** Offset in seconds into the pull where the moment sits. */
  pullT: number;
  /** Cohort scenario this moment belongs to, if any. */
  scenarioId: string | null;
  /** Raiders directly involved. */
  members: string[];
  /** Raiders nearby when it happened. */
  nearby: string[];
  narrative: string;
  lead: MomentLeadStep[];
  aftermath: string;
  questions: MomentQuestion[];
}

/* ---------- Chronicle (retro) ---------- */

/** An excerpt from a raid-lead-authored retrospective on Hearth. */
export interface RetroExcerpt {
  excerpt: string;
  author: string;
  role: string;
  postedAgo: string;
  read: boolean;
}

/* ---------- Support ---------- */

/** A logged support contribution (feast, cauldron, swap, alt). */
export interface SupportAction {
  who: string;
  what: string;
  ico: string;
  hue: number;
  isYou?: boolean;
}

/* ---------- Cohorts ---------- */

/** A quick roster filter in the replay surface. */
export interface CohortPreset {
  id: string;
  label: string;
  ico: string;
  /** Member names this preset selects (resolved server-side). */
  members: string[];
}

/** A pre-built coordination scenario the prototype can jump to. */
export interface CohortScenario {
  id: string;
  title: string;
  members: string[];
  /** [start, end] seconds within the pull. */
  range: [number, number];
  pullId: string;
  pullLabel: string;
  /** Seek time in seconds. */
  t: number;
  summary: string;
}

export interface CDChoreographyEvent {
  t: number;
  label: string;
  ico: string;
  hue: number;
  /** Marks a defensive committed late. */
  late?: boolean;
}

export interface CDChoreographyRow {
  name: string;
  events: CDChoreographyEvent[];
}

export interface CohesionPoint {
  /** Seconds. */
  t: number;
  /** Mean pairwise distance (yards). */
  d: number;
  /** Optional event label drawn on the cohesion graph. */
  marker?: string;
}

export type CoordinationKind =
  | "stack-break"
  | "support-chain"
  | "death"
  | "collapse"
  | "save"
  | "spread"
  | "divergence"
  | "comeback";

export interface CoordinationEvent {
  t: number;
  kind: CoordinationKind;
  label: string;
}

export interface CohortDeath {
  who: string;
  t: number;
  cause: string;
  note: string;
}

export interface CohortRecovery {
  who: string;
  t: number;
  by: string;
  note: string;
}

/** The analysis cards rendered for a cohort scenario. */
export interface CohortCardSet {
  cdChoreography: CDChoreographyRow[];
  cohesion: CohesionPoint[];
  coordination: CoordinationEvent[];
  deaths: CohortDeath[];
  recoveries: CohortRecovery[];
}

export type CoordMarkerKind =
  | "support-chain"
  | "stack-break"
  | "collapse"
  | "comeback";

/** A coordination annotation pinned to a pull on the raid timeline. */
export interface CoordMarker {
  pullId: string;
  kind: CoordMarkerKind;
  label: string;
  scenarioId: string | null;
  note: string;
}

/** A calm, narrative coordination highlight for the Home page. */
export interface CoordinationHighlight {
  ico: string;
  hue: number;
  title: string;
  detail: string;
  /** Cohort scenario id to open. */
  cohort: string;
}

/* ---------- Workshop (local AI) ---------- */

/** Where a cited fact came from. */
export type SourceRef = "replay" | "log" | "encounter";

/** An inline citation node inside an answer body. */
export interface CiteNode {
  cite: string;
  ref: SourceRef;
  /** Replay seek target in seconds (only for ref === "replay"). */
  t?: number;
}

/** A highlighted callout block inside an answer body. */
export interface CalloutNode {
  kind: "callout";
  title: string;
  body: string;
}

/**
 * An answer body is an ordered list of nodes. Plain strings are
 * prose; the sentinel strings "br" / "br-strong" are spacers.
 */
export type AnswerBodyNode = string | CiteNode | CalloutNode;

/** One step in the query-plan trace shown above an answer. */
export interface TraceStep {
  state: "done";
  label: string;
  detail: string;
}

/** A source row listed beneath an answer. */
export interface AnswerSource {
  type: string;
  label: string;
  t?: string;
}

/** A complete Workshop answer. */
export interface WorkshopAnswer {
  question: string;
  /** Set when the answer was scoped to a cohort scenario. */
  cohortId?: string;
  trace: TraceStep[];
  body: AnswerBodyNode[];
  sources: AnswerSource[];
}

/** A past question in local /ask history. */
export interface AskHistoryItem {
  id: string;
  q: string;
  t: string;
  encounter: string;
}

/* ---------- Settings ---------- */

export interface SettingItem {
  label: string;
  desc: string;
  value?: string;
  state?: "ok";
  /** Render value in a monospace code chip. */
  code?: boolean;
  /** Present (true/false) when the row carries a toggle control. */
  toggle?: boolean;
}

export interface SettingsGroup {
  id: string;
  title: string;
  items: SettingItem[];
}

/* ---------- Contribute ---------- */

export type PackageItemKind = "dir" | "file";
export type PackageTag = "upload" | "optional" | "local";

/** A file or directory in the contribution package tree. */
export interface PackageItem {
  kind: PackageItemKind;
  path: string;
  sz?: string;
  upload?: boolean;
  tag: PackageTag;
  desc?: string;
  note?: string;
}

/** A single consent toggle in the contribution flow. */
export interface ConsentItem {
  id: string;
  label: string;
  desc: string;
  on: boolean;
}

/* ---------- Notebook ---------- */

export interface NoteTag {
  id: string;
  label: string;
  hue: number;
}

export type BindingKind = "cohort" | "raid" | "pull" | "encounter";

/** Anchors a note or observation to a place in the data. */
export interface NoteBinding {
  kind: BindingKind;
  label: string;
  scenarioId?: string;
  raidId?: string;
  pullId?: string;
  encounterId?: string;
}

/** A personal, local-only notebook entry. */
export interface Note {
  id: string;
  text: string;
  tags: string[];
  binding: NoteBinding | null;
  /** Human "time ago" string. */
  createdAt: string;
  pinned?: boolean;
}

/** Seed shape for creating a new note. */
export interface NoteDraft {
  text: string;
  tags?: string[];
  binding?: NoteBinding | null;
}

/* ---------- Observations ---------- */

export interface RaidLead {
  name: string;
  role: string;
  pavatar_hue: number;
}

export interface ObservationKind {
  id: string;
  label: string;
  desc: string;
  hue: number;
}

export type ObservationStatus = "shared" | "referenced" | "withdrawn";

/** A shared interpretation of raid evidence. */
export interface Observation {
  id: string;
  status: ObservationStatus;
  sharedAt: string;
  raidId: string;
  kind: string;
  title: string;
  description: string;
  credits: string[];
  binding: NoteBinding | null;
  sources: string[];
  fromNoteId?: string | null;
  viewers?: number;
  referencedAt?: string;
  referencedIn?: string;
  withdrawnAt?: string;
}

/** Seed shape for sharing a new observation. */
export interface ObservationDraft {
  kind?: string;
  title?: string;
  description?: string;
  credits?: string[];
  binding?: NoteBinding | null;
  sources?: string[];
  fromNoteId?: string | null;
}

/* ---------- Glossary ---------- */

export interface GlossaryEntry {
  label: string;
  short: string;
  long?: string;
}

export type Glossary = Record<string, GlossaryEntry>;

/* ---------- Tweaks (UI preferences) ---------- */

export type Theme = "dark" | "light" | "gad";
export type Density = "comfortable" | "compact";
export type HomeLayout = "timeline" | "moments" | "roster";
export type AiTone = "trace" | "minimal" | "tool";

export interface Tweaks {
  density: Density;
  homeLayout: HomeLayout;
  aiTone: AiTone;
  showSupport: boolean;
  theme: Theme;
}

/* ---------- Ephemeral runtime state ---------- */

/**
 * The current cohort selection. Ephemeral — it lives only while the
 * player is inspecting and is carried between Replay / Workshop /
 * Moment surfaces. Never persisted.
 */
export interface CohortContext {
  scenarioId: string | null;
  members: string[];
  range: [number, number];
  pullId: string;
  pullLabel: string;
  t: number;
  momentId?: string;
  momentTitle?: string;
  /** Internal: timestamp used to resolve question-vs-context races. */
  _arrivedAt?: number;
}

/* ---------- Health ---------- */

/** Live status of the local services behind the app. */
export interface HealthStatus {
  ok: boolean;
  ollama: {
    reachable: boolean;
    endpoint: string;
    models: string[];
  };
  parser: {
    state: string;
    lastParse: string;
  };
  replayCache: {
    sizeMb: number;
    encounters: number;
  };
}

/* ---------- Session snapshot ---------- */

/**
 * Everything Lantern loads from the local archive at startup. A
 * real implementation can split this into lazy per-raid loads
 * (see CONTRACTS.md) — the prototype loads it all at once because
 * the local archive is small and the app is local-first.
 */
export interface SessionSnapshot {
  player: Player;
  roster: RosterMember[];
  latestRaid: Raid;
  raidHistory: RaidSummary[];
  pulls: Pull[];
  pullEvents: PullEvent[];
  moments: Moment[];
  retroExcerpt: RetroExcerpt;
  supportActions: SupportAction[];
  cohortPresets: CohortPreset[];
  cohortScenarios: Record<string, CohortScenario>;
  cohortCards: Record<string, CohortCardSet>;
  coordMarkers: CoordMarker[];
  coordinationHighlights: CoordinationHighlight[];
  askHistory: AskHistoryItem[];
  askSuggestions: string[];
  cohortSuggestions: string[];
  settingsGroups: SettingsGroup[];
  packageItems: PackageItem[];
  consent: ConsentItem[];
  noteTags: NoteTag[];
  observationKinds: ObservationKind[];
  raidLeads: RaidLead[];
  glossary: Glossary;
}
