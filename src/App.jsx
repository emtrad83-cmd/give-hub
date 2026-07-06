import React, { useEffect, useMemo, useState } from "react";
import { hasSupabaseConfig, supabase } from "./supabaseClient";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Plus,
  Save,
  Search,
  Sparkles,
  Trash2,
  Upload,
  X,
} from "lucide-react";

const STORAGE_KEY = "give-hub-life-os-state-v1";
const SUPABASE_ROW_ID = "evan-main-hub";
const GIVE_HUB_API_URL = import.meta.env.VITE_GIVE_HUB_API_URL || (import.meta.env.PROD ? "https://give-hub-api.onrender.com" : "http://localhost:4000");

const pad = (n) => String(n).padStart(2, "0");
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const addDays = (iso, days) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const prettyDate = (iso, opts = {}) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    ...opts,
  });
const compactDate = (iso) => prettyDate(iso, { weekday: "short", month: "short", day: "numeric", year: undefined });
const monthKey = (iso) => iso.slice(0, 7);
const startOfWeek = (iso) => {
  const d = new Date(`${iso}T12:00:00`);
  const day = d.getDay();
  const offset = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + offset);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const isSameWeek = (iso, baseIso) => {
  const start = startOfWeek(baseIso);
  const end = addDays(start, 6);
  return iso >= start && iso <= end;
};
const money = (value) => `$${Number(value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const uid = () => (crypto?.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`);

const SERVICE_STAGES = [
  "Reach Out",
  "Relationship Build",
  "Identify Tension",
  "Share Sample",
  "Interactive Sample Experience",
  "Video Discussion & Decision",
  "Retail Patron",
  "Retail Patron Care",
  "Wholesale / GIVER IBO",
  "GIVER IBO Candidate",
  "GIVER IBO Onboarding",
  "Active GIVER",
  "Decision Deferred",
  "Not Interested",
];
const PEOPLE_TYPES = ["Prospect", "Retail Patron", "GIVER IBO", "Mentor", "Community", "Partner", "Friend", "Family"];
const RELATIONSHIP_TYPES = [
  "GU Prospect",
  "GU Family",
  "Team EVAN",
  "Tellin' Tales",
  "Magic",
  "Friend",
  "Family",
  "Educator",
  "Parent",
  "Business",
  "Community Leader",
  "Health & Wellness",
  "Personal",
  "Other",
];
const OPPORTUNITY_STATUSES = ["Open", "Won", "Lost", "Paused", "Deferred"];
const CURRENT_TENSIONS = [
  "Energy / fatigue",
  "Sleep / recovery",
  "Weight / fitness",
  "Nutrition / habits",
  "Financial pressure",
  "Time freedom",
  "Work stress",
  "Family support",
  "Purpose / direction",
  "Community / belonging",
  "Business curiosity",
  "Other",
];
const MAGIC_STATUSES = ["New", "Learning", "Active Rotation", "Practice Ready", "Performance Ready"];
const WORKOUT_TYPES = ["Strength", "Cardio", "Mixed", "Mobility"];

const DEFAULT_AFFIRMATIONS = [
  "I am calm, grounded, and safe initiating conversations with people I don’t yet know.",
  "I am someone who finishes small actions daily, and those actions compound into extraordinary impact.",
  "I am trusted because I lead with curiosity, dignity, and integrity.",
  "I am disciplined and consistent, even when conditions are imperfect.",
  "I am the man who executes what he designs and gives others permission to do the same.",
  "I am the first multimillionaire in my family.",
];
const DEFAULT_PROMPTS = [
  "What future am I living into today?",
  "What would the version of me who already has this do today?",
  "What identity am I practicing before the evidence appears?",
  "What does overflow look like in my life right now?",
  "What action today proves I am becoming that person?",
];
const DEFAULT_TRICKS = [
  { id: "shadow-wallet", name: "Shadow Wallet", status: "Active Rotation", performanceReady: false, notes: "" },
  { id: "will-to-read", name: "Will to Read", status: "Learning", performanceReady: false, notes: "" },
  { id: "bwave", name: "B’Wave", status: "Performance Ready", performanceReady: true, notes: "" },
];
const DEFAULT_GOALS = [
  { id: "prosperity", name: "Prosperity", statement: "I live in overflow. Abundance flows to me from multiple sources and I always have more than enough.", status: "Active", nextAction: "Complete today’s highest-leverage GU action." },
  { id: "wellness", name: "Wellness / Fitness", statement: "I am strong, disciplined, and in the best shape of my life. My body is powerful and I treat it that way every day.", status: "Active", nextAction: "Complete today’s workout or recovery commitment." },
  { id: "happiness", name: "Happiness", statement: "I am genuinely happy. I live with joy, presence, and gratitude — and I choose it daily.", status: "Active", nextAction: "Log gratitude and choose presence." },
  { id: "freedom", name: "Freedom", statement: "I am free. My time, my money, and my choices belong to me. I live life on my terms.", status: "Active", nextAction: "Protect focused work time." },
  { id: "wealth", name: "Wealth", statement: "I am wealthy. I am the first multimillionaire in my family and my daily actions reflect that reality.", status: "Active", nextAction: "Track today’s ratios and income activity." },
  { id: "travel", name: "Travel", statement: "I explore the world with ease and joy.", status: "Active", nextAction: "Take one action that creates more freedom." },
  { id: "discipline", name: "Discipline", statement: "I am disciplined and consistent, even when conditions are imperfect.", status: "Active", nextAction: "Finish the next small promise." },
  { id: "magic", name: "Performing Magician", statement: "I practice consistently and become performance ready through small deliberate reps.", status: "Active", nextAction: "Practice one trick for ten focused minutes." },
];
const DEFAULT_TARGETS = {
  dailyReachOuts: 5,
  dailySamples: 3,
  dailySixW: 1,
  weeklyReachOuts: 25,
  weeklySamples: 15,
  weeklySixW: 5,
  monthlyReachOuts: 100,
  monthlySamples: 60,
  monthlySixW: 20,
  weeklyWorkoutDays: 3,
  monthlyIncomeGoal: 10000,
  targetRepertoireSize: 6,
  performanceReadyGoal: 4,
};
const DEFAULT_PEOPLE = [
  { id: "aaron", name: "Aaron Aponte", type: "Prospect", relationshipTypes: ["Friend", "GU Prospect", "Health & Wellness", "Business"], stage: "Relationship Build", currentMission: "Nurture relationship", currentTension: "Business curiosity", opportunityStatus: "Open", lastContact: "", nextStep: "Ask what he’s been investing time/energy in these days.", tags: "fitness, relationship", notes: "Potential business-minded connection.", coachObservation: "Responds best when conversations begin with fitness and real life, not business.", goalConnections: "Prosperity, Wealth, Wellness", highLevelUrl: "" },
  { id: "gloria", name: "Gloria Nash", type: "Prospect", relationshipTypes: ["GU Prospect", "Health & Wellness"], stage: "Share Sample", currentMission: "Share Sample", currentTension: "Energy / fatigue", opportunityStatus: "Open", lastContact: "", nextStep: "Mail sample and schedule follow-up.", tags: "sample", notes: "Address confirmed.", coachObservation: "Sample is the highest-leverage next step.", goalConnections: "Prosperity, Wealth", highLevelUrl: "" },
  { id: "casey", name: "Casey Rudzinski", type: "Prospect", relationshipTypes: ["GU Prospect", "Business"], stage: "GIVER IBO Candidate", currentMission: "Conduct Interview", currentTension: "Purpose / direction", opportunityStatus: "Open", lastContact: "", nextStep: "Complete interview and determine onboarding path.", tags: "IBO candidate", notes: "High leverage follow-up.", coachObservation: "Explore vision and time commitment before discussing mechanics.", goalConnections: "Prosperity, Wealth, Freedom", highLevelUrl: "" },
  { id: "lynette", name: "Lynnette LaRoche", type: "Mentor", stage: "Active GIVER", currentMission: "Recurring Coaching", currentTension: "Other", opportunityStatus: "Won", lastContact: "", nextStep: "Schedule MAP or recurring coaching check-in.", tags: "mentor", notes: "Active mentor relationship.", highLevelUrl: "" },
  { id: "sopheia", name: "Sopheia McMorris", type: "Mentor", stage: "Active GIVER", currentMission: "Recurring Coaching", currentTension: "Other", opportunityStatus: "Won", lastContact: "", nextStep: "Support consistency and duplication.", tags: "mentor", notes: "Active mentor relationship.", highLevelUrl: "" },
];

const blankLog = (date) => ({
  date,
  wisdom: {
    gratitudeList: ["", "", "", "", ""],
    manifestation: "",
    affirmationChecked: false,
    selfImprovement: "",
    takeaway: "",
    reflection: "",
    goalProgress: {},
  },
  wellness: {
    workoutStatus: "",
    workoutType: "Strength",
    workoutDuration: "",
    workoutNotes: "",
    bevelRecovery: "",
    bevelSleep: "",
    bevelStrain: "",
    bevelStress: "",
  },
  wealth: {
    reachOutsCount: 0,
    samples: 0,
    sixW: 0,
    entries: [],
  },
  magic: {
    practiced: false,
    trick: "",
    minutes: "",
    reps: 0,
    confidence: "Learning",
    notes: "",
  },
  calendar: [],
  quickCapture: "",
  coachNotes: "",
});

function normalizeTricks(raw) {
  const arr = Array.isArray(raw) && raw.length ? raw : DEFAULT_TRICKS;
  return arr.map((t, i) => typeof t === "string" ? { id: t.toLowerCase().replace(/\W+/g, "-") || `trick-${i}`, name: t, status: "Learning", performanceReady: false, notes: "" } : { id: t.id || uid(), name: t.name || "Untitled Trick", status: t.status || "Learning", performanceReady: Boolean(t.performanceReady), notes: t.notes || "" });
}
function toList(value) {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "string") return value.split(",").map((x) => x.trim()).filter(Boolean);
  return [];
}
function normalizePerson(p = {}) {
  const type = p.type || p.role || "Prospect";
  const relationshipTypes = toList(p.relationshipTypes).length ? toList(p.relationshipTypes) : toList(p.relationshipType).length ? toList(p.relationshipType) : [type].filter(Boolean);
  return {
    id: p.id || uid(),
    name: p.name || "",
    type,
    relationshipTypes,
    stage: p.stage || "Reach Out",
    currentMission: p.currentMission || p.mission || stageMission(p.stage || "Reach Out"),
    currentTension: p.currentTension || p.tension || "Other",
    opportunityStatus: p.opportunityStatus || "Open",
    lastContact: p.lastContact || p.updated || "",
    nextStep: p.nextStep || p.next || "",
    tags: Array.isArray(p.tags) ? p.tags.join(", ") : (p.tags || ""),
    notes: p.notes || "",
    coachObservation: p.coachObservation || p.coachNotes || "",
    goalConnections: Array.isArray(p.goalConnections) ? p.goalConnections.join(", ") : (p.goalConnections || ""),
    trustNotes: p.trustNotes || "",
    timeline: Array.isArray(p.timeline) ? p.timeline : [],
    highLevelUrl: p.highLevelUrl || "",
    created: p.created || todayISO(),
    updated: p.updated || todayISO(),
  };
}
function normalizeLog(raw, date) {
  const base = blankLog(date);
  const log = raw || {};
  const legacyGratitude = log.wisdom?.gratitude ? [log.wisdom.gratitude, "", "", "", ""] : undefined;
  return {
    ...base,
    ...log,
    date,
    wisdom: {
      ...base.wisdom,
      ...(log.wisdom || {}),
      gratitudeList: log.wisdom?.gratitudeList || legacyGratitude || base.wisdom.gratitudeList,
      affirmationChecked: Boolean(log.wisdom?.affirmationChecked),
      goalProgress: log.wisdom?.goalProgress || {},
    },
    wellness: { ...base.wellness, ...(log.wellness || {}) },
    wealth: {
      ...base.wealth,
      ...(log.wealth || {}),
      reachOutsCount: Number(log.wealth?.reachOutsCount ?? log.wealth?.reachOuts?.length ?? log.reachOuts?.length ?? 0),
      samples: Number(log.wealth?.samples ?? log.samples ?? 0),
      sixW: Number(log.wealth?.sixW ?? log.sixW ?? 0),
      entries: log.wealth?.entries || [],
    },
    magic: { ...base.magic, ...(log.magic || {}) },
    calendar: Array.isArray(log.calendar) ? log.calendar : [],
    quickCapture: log.quickCapture || "",
  };
}
function normalizeState(raw) {
  const safe = raw || {};
  const settings = safe.settings || {};
  return {
    schemaVersion: 3,
    updatedAt: safe.updatedAt || new Date().toISOString(),
    logs: safe.logs || {},
    prospects: (safe.prospects || safe.people || DEFAULT_PEOPLE).map(normalizePerson),
    settings: {
      targets: { ...DEFAULT_TARGETS, ...(settings.targets || {}) },
      goals: settings.goals || DEFAULT_GOALS,
      affirmations: settings.affirmations || DEFAULT_AFFIRMATIONS,
      manifestationPrompts: settings.manifestationPrompts || DEFAULT_PROMPTS,
      tricks: normalizeTricks(settings.tricks),
      hlTensions: settings.hlTensions || CURRENT_TENSIONS,
      ...settings,
    },
  };
}
function stageMission(stage) {
  const map = {
    "Reach Out": "Reach Out",
    "Relationship Build": "Build Relationship",
    "Identify Tension": "Identify Tension",
    "Share Sample": "Share Sample",
    "Interactive Sample Experience": "Interactive Sample",
    "Video Discussion & Decision": "Review Video + Decision",
    "Retail Patron": "Begin 10-Day Test",
    "Retail Patron Care": "Patron Care Check-In",
    "Wholesale / GIVER IBO": "Explore GIVER Path",
    "GIVER IBO Candidate": "Schedule / Conduct Interview",
    "GIVER IBO Onboarding": "Continue Onboarding",
    "Active GIVER": "Recurring Coaching",
    "Decision Deferred": "Decision Follow-Up",
  };
  return map[stage] || stage || "Next Mission";
}

function goalActivity(goals, logs, selectedDate) {
  return goals.map((goal) => {
    const touched = logs
      .filter((l) => l.date <= selectedDate && l.wisdom?.goalProgress?.[goal.id])
      .sort((a, b) => b.date.localeCompare(a.date));
    const last = touched[0]?.date || null;
    const days = last ? Math.max(0, Math.round((new Date(`${selectedDate}T12:00:00`) - new Date(`${last}T12:00:00`)) / 86400000)) : 999;
    return { ...goal, lastTouched: last, daysUntouched: days, needsAttention: days >= 7 };
  });
}
function goalCoachLine(goal) {
  if (!goal) return "All active goals have attention. Keep choosing the next clean action.";
  const stale = goal.daysUntouched === 999 ? "has not been checked in yet" : `has not received a progress note in ${goal.daysUntouched} days`;
  return `${goal.name} ${stale}. Next: ${goal.nextAction || "choose one small action that proves this identity today."}`;
}
function daysBetween(baseIso, priorIso) {
  if (!priorIso) return 999;
  return Math.max(0, Math.round((new Date(`${baseIso}T12:00:00`) - new Date(`${priorIso}T12:00:00`)) / 86400000));
}
function relationshipScores(person, selectedDate) {
  const days = daysBetween(selectedDate, person.lastContact || person.updated || person.created);
  const stageWeight = { "Share Sample": 20, "Interactive Sample Experience": 18, "Video Discussion & Decision": 18, "GIVER IBO Candidate": 22, "GIVER IBO Onboarding": 20, "Relationship Build": 12, "Identify Tension": 15, "Reach Out": 10, "Active GIVER": 12, "Retail Patron Care": 10 };
  const tags = toList(person.tags);
  const relationshipTypes = toList(person.relationshipTypes);
  const hasNotes = Boolean((person.notes || person.coachObservation || person.trustNotes || "").trim());
  const recentScore = days === 999 ? 18 : Math.max(0, 38 - Math.min(days, 30));
  const relationshipHealth = Math.max(15, Math.min(100, recentScore + (hasNotes ? 18 : 6) + Math.min(tags.length * 4, 16) + Math.min(relationshipTypes.length * 4, 16) + (person.nextStep ? 12 : 0)));
  const trustScore = Math.max(10, Math.min(100, 35 + Math.min(relationshipTypes.length * 8, 28) + (person.trustNotes ? 18 : 0) + (person.notes ? 10 : 0) + (person.opportunityStatus === "Won" ? 10 : 0)));
  const opportunityScore = Math.max(5, Math.min(100, (stageWeight[person.stage] || 8) + (person.nextStep ? 22 : 8) + (person.currentTension && person.currentTension !== "Other" ? 18 : 6) + (person.opportunityStatus === "Open" ? 12 : 0) + Math.min(tags.length * 4, 12)));
  return { daysSinceContact: days, relationshipHealth, trustScore, opportunityScore };
}
function relationshipCoaching(person, selectedDate) {
  const scores = relationshipScores(person, selectedDate);
  const stale = scores.daysSinceContact >= 7 || scores.daysSinceContact === 999;
  const primaryType = toList(person.relationshipTypes)[0] || person.type;
  let starter = `Check in with ${person.name} from a relationship-first place.`;
  if ((person.currentTension || "").includes("Energy")) starter = `Ask ${person.name} how their energy has been lately before mentioning any product or next step.`;
  else if ((person.currentTension || "").includes("Business")) starter = `Ask what ${person.name} has been investing time or energy in these days.`;
  else if ((person.currentTension || "").includes("Purpose")) starter = `Ask what feels most meaningful or exciting for ${person.name} right now.`;
  else if (primaryType === "Family" || primaryType === "Friend") starter = `Reach out with no agenda. Ask how life has been and listen first.`;
  const nextAction = person.nextStep || person.currentMission || stageMission(person.stage);
  const reason = stale
    ? `${person.name} is ${scores.daysSinceContact === 999 ? "missing a contact date" : `${scores.daysSinceContact} days from last contact`}. A small check-in protects the relationship.`
    : `${person.name} is active enough that the next best action is simply to keep momentum moving.`;
  return { ...scores, starter, nextAction, reason };
}
function relationshipInsight(people, selectedDate) {
  const active = people.filter((p) => p.opportunityStatus !== "Lost" && p.stage !== "Not Interested");
  const scored = active.map((p) => ({ ...p, ...relationshipCoaching(p, selectedDate) }));
  return scored.sort((a, b) => (b.opportunityScore + (b.daysSinceContact >= 7 ? 20 : 0) + b.trustScore / 4) - (a.opportunityScore + (a.daysSinceContact >= 7 ? 20 : 0) + a.trustScore / 4))[0] || null;
}
function magicInsight(allLogs, date, tricks, stats) {
  const recent = allLogs
    .filter((l) => l.date <= date && (l.magic?.practiced || l.magic?.trick || l.magic?.notes))
    .sort((a, b) => b.date.localeCompare(a.date));
  const last = recent[0]?.date || null;
  const days = daysBetween(date, last);
  const learning = normalizeTricks(tricks).filter((t) => !t.performanceReady && t.status !== "Performance Ready");
  const nextTrick = learning[0] || normalizeTricks(tricks)[0];
  const targetReady = Math.max(0, Number(stats.targetRepertoireSize || 0));
  const readyGap = Math.max(0, targetReady ? targetReady - Number(stats.performanceReady || 0) : 0);
  let message = "Keep the reps small and deliberate. Ten focused minutes is enough to preserve identity and improve your craft.";
  if (days === 999) message = "Magic has not been logged yet. Start with one trick, ten minutes, and a short note about what needs polish.";
  else if (days >= 7) message = `Magic has been quiet for ${days} days. Do not rebuild the whole routine today — choose one effect and get one clean repetition.`;
  else if (stats.magicPracticeDays === 0) message = "No magic practice has been logged this week. One short session today protects your performer identity.";
  else if (readyGap > 0) message = `You are ${readyGap} performance-ready effect${readyGap === 1 ? "" : "s"} away from your repertoire target. Move one learning trick closer today.`;
  else message = "Your repertoire is taking shape. Use today to sharpen timing, script, and confidence.";
  return { last, days, nextTrick, readyGap, message };
}
function insight({ area, tone = "soft", title, body, action, why, time = "5–10 min", impact = "Medium", goals = [] }) {
  return { area, tone, title, body, action, why, time, impact, goals };
}
function buildCoachInsights({ momentum, stats, missions, log, targets, priorityGoal, relationship, magic }) {
  const insights = [];
  if (priorityGoal?.needsAttention) insights.push(insight({
    area: "Goal",
    tone: "alert",
    title: `${priorityGoal.name} needs a check-in`,
    body: goalCoachLine(priorityGoal),
    action: priorityGoal.nextAction || "Write one progress note.",
    why: `${priorityGoal.name} has been quiet long enough that a tiny action will restore momentum without creating overwhelm.`,
    time: "7 min",
    impact: "High",
    goals: [priorityGoal.name, "Discipline"],
  }));
  if (relationship) insights.push(insight({
    area: "People",
    tone: relationship.daysSinceContact >= 7 ? "alert" : "soft",
    title: `Advance ${relationship.name}`,
    body: `${relationship.stage} • ${relationship.daysSinceContact === 999 ? "No contact date" : `${relationship.daysSinceContact} days since contact`}.`,
    action: relationship.nextStep || relationship.currentMission || stageMission(relationship.stage),
    why: relationship.reason,
    time: "4 min",
    impact: relationship.opportunityScore >= 70 ? "High" : "Medium",
    goals: toList(relationship.goalConnections).slice(0, 3),
  }));
  if (stats.reachOutsToday < targets.dailyReachOuts) insights.push(insight({
    area: "Wealth",
    tone: "soft",
    title: "Daily ratio gap",
    body: `${targets.dailyReachOuts - stats.reachOutsToday} reach-out${targets.dailyReachOuts - stats.reachOutsToday === 1 ? "" : "s"} left to stay on pace today.`,
    action: "Choose one person and send a simple relationship-first message.",
    why: "Your GU growth goal depends on consistent relationship motion, not giant bursts of activity.",
    time: "6 min",
    impact: "High",
    goals: ["Prosperity", "Wealth"],
  }));
  if (!log.wellness.workoutStatus) insights.push(insight({
    area: "Wellness",
    tone: "soft",
    title: "Protect energy",
    body: "Workout status is not logged yet.",
    action: "Choose Yes, Rest Day, or Missed so today stays honest.",
    why: "Momentum is easier to protect when the body plan is clear and honest.",
    time: "1 min",
    impact: "Medium",
    goals: ["Wellness / Fitness", "Discipline"],
  }));
  if (magic && (magic.days >= 7 || stats.magicPracticeDays === 0 || magic.readyGap > 0)) insights.push(insight({
    area: "Magic",
    tone: magic.days >= 7 ? "alert" : "soft",
    title: magic.nextTrick ? `Practice ${magic.nextTrick.name}` : "Practice magic",
    body: magic.message,
    action: magic.nextTrick ? `Do 10 focused minutes on ${magic.nextTrick.name}.` : "Do one clean 10-minute session.",
    why: "Your magician identity grows through short deliberate reps, not occasional long sessions.",
    time: "10 min",
    impact: magic.readyGap > 0 ? "High" : "Medium",
    goals: ["Performing Magician", "Discipline"],
  }));
  if (momentum.percent < 60) insights.push(insight({
    area: "Momentum",
    tone: "alert",
    title: "Rebuild today gently",
    body: `Momentum is ${momentum.percent}%.`,
    action: "Complete one Wisdom entry, one Wellness status, and one Wealth action.",
    why: "A low-momentum day does not need a rescue mission. It needs three finished promises.",
    time: "12 min",
    impact: "High",
    goals: ["Discipline", "Happiness"],
  }));
  return insights.slice(0, 5);
}
function perfectDayItems({ coachInsights, log, stats, targets, relationshipCoach, magicCoach }) {
  const items = [];
  if (!log.wellness.workoutStatus) items.push({ id: "wellness", label: "Choose workout status", detail: "Protect energy and keep the day honest." });
  if (stats.reachOutsToday < targets.dailyReachOuts) items.push({ id: "wealth", label: "Complete one reach-out", detail: relationshipCoach?.name ? `Start with ${relationshipCoach.name}.` : "Choose the highest-trust person." });
  if ((log.wisdom.gratitudeList || []).filter(Boolean).length < 3) items.push({ id: "wisdom", label: "Write 3 gratitude lines", detail: "A quick reset for happiness and perspective." });
  if (magicCoach?.nextTrick && (!log.magic.practiced || stats.magicPracticeDays === 0)) items.push({ id: "magic", label: `Practice ${magicCoach.nextTrick.name}`, detail: "Ten focused minutes is enough." });
  coachInsights.slice(0, 2).forEach((i) => items.push({ id: `${i.area}-${i.title}`, label: i.action, detail: `${i.time} • ${i.impact} impact` }));
  return Array.from(new Map(items.map((i) => [i.label, i])).values()).slice(0, 5);
}

function evaluateMomentum(log) {
  const wisdomParts = [
    log.wisdom.gratitudeList.filter(Boolean).length >= 3,
    Boolean(log.wisdom.manifestation),
    Boolean(log.wisdom.affirmationChecked),
    Boolean(log.wisdom.selfImprovement),
  ];
  const wellnessParts = [Boolean(log.wellness.workoutStatus), Boolean(log.wellness.bevelRecovery || log.wellness.bevelSleep || log.wellness.bevelStrain || log.wellness.bevelStress)];
  const wealthParts = [Number(log.wealth.reachOutsCount || 0) > 0 || Number(log.wealth.samples || 0) > 0 || Number(log.wealth.sixW || 0) > 0];
  const magicParts = [Boolean(log.magic.practiced || log.magic.trick || log.magic.notes)];
  const areas = [
    { label: "Wisdom", score: wisdomParts.filter(Boolean).length / wisdomParts.length },
    { label: "Wellness", score: wellnessParts.filter(Boolean).length / wellnessParts.length },
    { label: "Wealth", score: wealthParts.filter(Boolean).length / wealthParts.length },
    { label: "Magic", score: magicParts.filter(Boolean).length / magicParts.length },
  ];
  const percent = Math.round((areas.reduce((t, a) => t + a.score, 0) / areas.length) * 100);
  return { percent, areas: areas.map((a) => ({ ...a, complete: a.score >= 1 })) };
}

export default function App() {
  const [state, setState] = useState(() => {
    try { return normalizeState(JSON.parse(localStorage.getItem(STORAGE_KEY) || "null")); } catch { return normalizeState(); }
  });
  const [date, setDate] = useState(todayISO());
  const [tab, setTab] = useState("home");
  const [saveStatus, setSaveStatus] = useState("Local preview");
  const [selectedPersonId, setSelectedPersonId] = useState(null);
  const [newPerson, setNewPerson] = useState({ name: "", type: "Prospect", stage: "Reach Out", currentTension: "Other", nextStep: "" });
  const [highLevelSyncStatus, setHighLevelSyncStatus] = useState({});

  const log = normalizeLog(state.logs?.[date], date);
  const settings = state.settings || normalizeState().settings;
  const targets = { ...DEFAULT_TARGETS, ...(settings.targets || {}) };
  const goals = settings.goals || DEFAULT_GOALS;
  const affirmations = settings.affirmations || DEFAULT_AFFIRMATIONS;
  const manifestationPrompts = settings.manifestationPrompts || DEFAULT_PROMPTS;
  const tricks = normalizeTricks(settings.tricks);
  const people = (state.prospects || []).map(normalizePerson);
  const selectedPerson = people.find((p) => p.id === selectedPersonId) || null;

  const setLog = (updater) => {
    setState((s) => {
      const current = normalizeLog(s.logs?.[date], date);
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...s, updatedAt: new Date().toISOString(), logs: { ...(s.logs || {}), [date]: next } };
    });
  };
  const updateLogSection = (section, updates) => setLog((l) => ({ ...l, [section]: { ...(l[section] || {}), ...updates } }));
  const updateSettings = (updates) => setState((s) => ({ ...s, updatedAt: new Date().toISOString(), settings: { ...(s.settings || {}), ...updates } }));
  const addPerson = () => {
    if (!newPerson.name.trim()) return;
    const person = normalizePerson({ ...newPerson, id: uid(), currentMission: stageMission(newPerson.stage), created: todayISO(), updated: todayISO() });
    setState((s) => ({ ...s, prospects: [person, ...(s.prospects || [])] }));
    setNewPerson({ name: "", type: "Prospect", stage: "Reach Out", currentTension: "Other", nextStep: "" });
    setSelectedPersonId(person.id);
  };
  const updatePerson = (id, updates) => setState((s) => ({
    ...s,
    prospects: (s.prospects || []).map((p) => p.id === id ? normalizePerson({ ...p, ...updates, updated: todayISO() }) : p),
  }));

  const syncPersonToHighLevel = async (person) => {
    if (!person?.id) return;

    setHighLevelSyncStatus((s) => ({
      ...s,
      [person.id]: { state: "syncing", message: "Syncing to HighLevel…" },
    }));

    try {
      const response = await fetch(`${GIVE_HUB_API_URL}/people/sync`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "HighLevel sync failed.");
      }

      updatePerson(person.id, {
        highLevelUrl: result.highLevelUrl || "",
        highLevelContactId: result.contactId || "",
        lastHighLevelSync: new Date().toISOString(),
      });

      setHighLevelSyncStatus((s) => ({
        ...s,
        [person.id]: { state: "synced", message: "Synced to HighLevel" },
      }));
    } catch (err) {
      setHighLevelSyncStatus((s) => ({
        ...s,
        [person.id]: { state: "error", message: err.message },
      }));
    }
  };
  const deletePerson = (id) => { setState((s) => ({ ...s, prospects: (s.prospects || []).filter((p) => p.id !== id) })); setSelectedPersonId(null); };

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!hasSupabaseConfig || !supabase) { setSaveStatus("Local preview"); return; }
      setSaveStatus("Loading cloud data…");
      const { data, error } = await supabase.from("giver_hub_state").select("data").eq("id", SUPABASE_ROW_ID).single();
      if (!mounted) return;
      if (error && error.code !== "PGRST116") { setSaveStatus("Cloud unavailable — local mode"); return; }
      if (data?.data) setState(normalizeState(data.data));
      setSaveStatus("Cloud loaded");
    }
    load();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const normalized = normalizeState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
    if (!hasSupabaseConfig || !supabase) { setSaveStatus("Saved locally"); return; }
    setSaveStatus("Saving…");
    const handle = setTimeout(async () => {
      const { error } = await supabase.from("giver_hub_state").upsert({ id: SUPABASE_ROW_ID, data: normalized, updated_at: new Date().toISOString() });
      setSaveStatus(error ? "Cloud save failed — local saved" : "Saved");
    }, 700);
    return () => clearTimeout(handle);
  }, [state]);

  const allLogs = useMemo(() => Object.entries(state.logs || {}).map(([iso, raw]) => normalizeLog(raw, iso)), [state.logs]);
  const stats = useMemo(() => computeStats(allLogs, date, log, targets, tricks), [allLogs, date, log, targets, tricks]);
  const momentum = useMemo(() => evaluateMomentum(log), [log]);
  const goalInsights = useMemo(() => goalActivity(goals, allLogs, date), [goals, allLogs, date]);
  const priorityGoal = goalInsights.filter((g) => g.status !== "Achieved").sort((a, b) => b.daysUntouched - a.daysUntouched)[0];
  const relationshipCoach = useMemo(() => relationshipInsight(people, date), [people, date]);
  const relationshipList = useMemo(() => people.map((p) => ({ ...p, ...relationshipCoaching(p, date) })).sort((a, b) => (b.opportunityScore + b.relationshipHealth + b.trustScore) - (a.opportunityScore + a.relationshipHealth + a.trustScore)), [people, date]);
  const magicCoach = useMemo(() => magicInsight(allLogs, date, tricks, stats), [allLogs, date, tricks, stats]);
  const coachInsights = useMemo(() => buildCoachInsights({ momentum, stats, missions: [], log, targets, priorityGoal, relationship: relationshipCoach, magic: magicCoach }), [momentum, stats, log, targets, priorityGoal, relationshipCoach, magicCoach]);
  const pipelineCounts = useMemo(() => SERVICE_STAGES.reduce((acc, stage) => ({ ...acc, [stage]: people.filter((p) => p.stage === stage).length }), {}), [people]);
  const missions = useMemo(() => people.filter((p) => p.opportunityStatus !== "Lost" && p.stage !== "Not Interested").slice(0, 6).map((p) => ({ ...p, mission: p.nextStep || p.currentMission || stageMission(p.stage) })), [people]);
  const manifestationPrompt = manifestationPrompts[new Date(`${date}T12:00:00`).getDate() % manifestationPrompts.length] || DEFAULT_PROMPTS[0];

  const exportData = () => {
    const blob = new Blob([JSON.stringify(normalizeState(state), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `give-hub-backup-${todayISO()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const importData = (file) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try { setState(normalizeState(JSON.parse(String(reader.result)))); } catch { alert("Could not import that backup file."); }
    };
    reader.readAsText(file);
  };

  const nav = [["home", "🏠", "Home"], ["wisdom", "🧠", "Wisdom"], ["wellness", "❤️", "Wellness"], ["wealth", "💰", "Wealth"], ["magic", "🎩", "Magic"], ["people", "👥", "People"], ["settings", "⚙️", "Settings"]];

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div>
            <div className="brand"><Sparkles size={16} /> GIVE HUB</div>
            <h1>Hello, Evan.</h1>
            <p>Focused Energy that Moves the Needle Forward</p>
            <span className="save-status"><Save size={13} /> {saveStatus}</span>
          </div>
          <nav className="nav-tabs" aria-label="Main navigation">
            {nav.map(([key, icon, label]) => <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>{icon} {label}</button>)}
          </nav>
        </div>
      </header>
      <main className="main-shell">
        {tab === "home" && <HomePage {...{ date, setDate, momentum, missions, stats, log, targets, pipelineCounts, setTab, setSelectedPersonId, updateLogSection, priorityGoal, coachInsights, relationshipCoach, magicCoach }} />}
        {tab === "wisdom" && <WisdomPage {...{ date, setDate, log, updateLogSection, manifestationPrompt, affirmations, goals, goalInsights }} />}
        {tab === "wellness" && <WellnessPage {...{ date, setDate, log, updateLogSection, allLogs }} />}
        {tab === "wealth" && <WealthPage {...{ date, setDate, log, stats, targets, setLog, updateLogSection, allLogs }} />}
        {tab === "magic" && <MagicPage {...{ log, updateLogSection, stats, tricks, updateSettings, magicCoach }} />}
        {tab === "people" && <PeoplePage {...{ people: relationshipList, selectedPerson, selectedPersonId, setSelectedPersonId, newPerson, setNewPerson, addPerson, updatePerson, deletePerson, pipelineCounts, settings, date, highLevelSyncStatus, syncPersonToHighLevel }} />}
        {tab === "settings" && <SettingsPage {...{ state, exportData, importData, settings, targets, goals, affirmations, manifestationPrompts, tricks, updateSettings }} />}
      </main>
      {selectedPerson && <PeopleDrawer person={{ ...selectedPerson, ...relationshipCoaching(selectedPerson, date) }} settings={settings} updatePerson={updatePerson} deletePerson={deletePerson} onClose={() => setSelectedPersonId(null)} highLevelSyncStatus={highLevelSyncStatus[selectedPerson.id]} syncPersonToHighLevel={syncPersonToHighLevel} />}
    </div>
  );
}

function computeStats(allLogs, date, log, targets, tricks) {
  const weekLogs = allLogs.filter((l) => isSameWeek(l.date, date));
  const monthLogs = allLogs.filter((l) => monthKey(l.date) === monthKey(date));
  const sum = (logs, fn) => logs.reduce((t, l) => t + Number(fn(l) || 0), 0);
  const entries = monthLogs.flatMap((l) => l.wealth?.entries || []);
  const income = entries.filter((e) => e.type === "Income").reduce((t, e) => t + Number(e.amount || 0), 0);
  const expenses = entries.filter((e) => e.type === "Expense").reduce((t, e) => t + Number(e.amount || 0), 0);
  const performanceReady = normalizeTricks(tricks).filter((t) => t.performanceReady || t.status === "Performance Ready").length;
  return {
    reachOutsToday: Number(log.wealth.reachOutsCount || 0), samplesToday: Number(log.wealth.samples || 0), sixWToday: Number(log.wealth.sixW || 0),
    weeklyReachOuts: sum(weekLogs, (l) => l.wealth.reachOutsCount), weeklySamples: sum(weekLogs, (l) => l.wealth.samples), weeklySixW: sum(weekLogs, (l) => l.wealth.sixW),
    monthlyReachOuts: sum(monthLogs, (l) => l.wealth.reachOutsCount), monthlySamples: sum(monthLogs, (l) => l.wealth.samples), monthlySixW: sum(monthLogs, (l) => l.wealth.sixW),
    income, expenses, net: income - expenses,
    workoutDaysWeek: weekLogs.filter((l) => l.wellness.workoutStatus === "Yes").length,
    magicPracticeDays: weekLogs.filter((l) => l.magic.practiced).length,
    performanceReady,
    targetRepertoireSize: targets.targetRepertoireSize,
  };
}

function HomePage({ date, setDate, momentum, missions, stats, log, targets, pipelineCounts, setTab, setSelectedPersonId, updateLogSection, priorityGoal, coachInsights, relationshipCoach, magicCoach }) {
  const coach = coachMessage(momentum, stats, missions, log, targets, priorityGoal, relationshipCoach, magicCoach);
  const perfectDay = perfectDayItems({ coachInsights, log, stats, targets, relationshipCoach, magicCoach });
  const calendar = log.calendar || [];
  const [googleCalendarEvents, setGoogleCalendarEvents] = useState([]);
  const [calendarStatus, setCalendarStatus] = useState("loading");

    useEffect(() => {
      let mounted = true;

      async function loadCalendar() {
        try {
          setCalendarStatus("loading");
          const response = await fetch(`${GIVE_HUB_API_URL}/calendar/day?date=${date}`);
          const result = await response.json();

          if (!response.ok || !result.success) {
            throw new Error(result.error || "Calendar sync failed.");
          }

          if (mounted) {
            setGoogleCalendarEvents(result.events || []);
            setCalendarStatus("synced");
          }
        } catch (err) {
          console.error("Calendar sync failed:", err);
          if (mounted) {
            setGoogleCalendarEvents([]);
            setCalendarStatus("error");
          }
        }
      }

      loadCalendar();

      return () => {
        mounted = false;
      };
    }, [date]);

  const combinedCalendar = [
    ...googleCalendarEvents.map((event) => ({
      id: event.id,
      time: event.start ? new Date(event.start).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "",
      title: event.title || "Untitled event",
      source: "google",
      htmlLink: event.htmlLink || "",
    })),
    ...calendar.map((event) => ({ ...event, source: "manual" })),
  ];

  const addCalendar = () => updateLogSection("calendar", { calendar: [...calendar, { id: uid(), time: "", title: "", type: "Mission" }] });
  const updateCalendar = (id, updates) => updateLogSection("calendar", { calendar: calendar.map((e) => e.id === id ? { ...e, ...updates } : e) });
  const deleteCalendar = (id) => updateLogSection("calendar", { calendar: calendar.filter((e) => e.id !== id) });
  const openPerson = (id) => { setSelectedPersonId(id); setTab("people"); };
  return <div className="page-grid">
    <DateBar date={date} setDate={setDate} />
    <section className="hero panel">
      <div><p className="eyebrow">Today’s Focus</p><h2>One screen. One purpose.</h2><p>Know what matters, keep your vows, and move the needle forward.</p></div>
      <MomentumCard momentum={momentum} />
    </section>
    <section className="dashboard-grid">
      <Metric label="Reach Outs" value={`${stats.reachOutsToday}/${targets.dailyReachOuts}`} pct={stats.reachOutsToday / targets.dailyReachOuts} />
      <Metric label="Samples" value={`${stats.samplesToday}/${targets.dailySamples}`} pct={stats.samplesToday / targets.dailySamples} />
      <Metric label="6-W" value={`${stats.sixWToday}/${targets.dailySixW}`} pct={stats.sixWToday / targets.dailySixW} />
      <Metric label="Workout Week" value={`${stats.workoutDaysWeek}/${targets.weeklyWorkoutDays}`} pct={stats.workoutDaysWeek / targets.weeklyWorkoutDays} />
    </section>
    <section className="two-col">
      <Card eyebrow="Coach Evan" title="Next best action">
        <p className="coach-copy">{coach}</p>
        <div className="coach-insight-list">
          {coachInsights.map((item) => <div className={item.tone === "alert" ? "coach-alert coach-rich" : "coach-soft coach-rich"} key={`${item.area}-${item.title}`}>
            <span className="coach-area">{item.area}</span>
            <strong>{item.title}</strong>
            <span>{item.body}</span>
            <small><b>Why:</b> {item.why}</small>
            <small><b>Next:</b> {item.action}</small>
            <div className="coach-meta"><em>{item.time}</em><em>{item.impact} impact</em>{item.goals?.length ? <em>{item.goals.join(" • ")}</em> : null}</div>
          </div>)}
        </div>
        <div className="coach-actions"><button className="btn" onClick={() => setTab("wisdom")}>Goals</button><button className="btn" onClick={() => setTab("wealth")}>Ratios</button><button className="btn" onClick={() => setTab("people")}>People</button><button className="btn" onClick={() => setTab("magic")}>Magic</button></div>
      </Card>
      <Card eyebrow="Command Center" title="Today’s Missions" action={<button className="btn primary" onClick={() => setTab("people")}>Open People</button>}>
        <div className="mission-list">{missions.length ? missions.map((m) => <button className="mission-card" key={m.id} onClick={() => openPerson(m.id)}><strong>{m.name}</strong><span>{m.mission}</span><small>{m.stage}</small></button>) : <Empty text="No active missions yet. Add people to your pipeline." />}</div>
      </Card>
    </section>
    <Card eyebrow="Executive Assistant" title="If today went perfectly…">
      <div className="perfect-day-list">
        {perfectDay.map((item, idx) => <div className="perfect-day-item" key={item.id}><span>{idx + 1}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div></div>)}
        {!perfectDay.length && <Empty text="Today is already clean. Protect the evening and close the loop." />}
      </div>
    </Card>
    <section className="three-col">
      <Card eyebrow="Quick Capture" title="Park the thought"><textarea value={log.quickCapture || ""} onChange={(e) => updateLogSection("quickCapture", { quickCapture: e.target.value })} placeholder="Capture a thought, task, insight, or follow-up without leaving Home." /></Card>
      <Card eyebrow="Calendar" title="Today’s Calendar" action={<button className="btn" onClick={addCalendar}><Plus size={16}/> Add</button>}>
        <div className="calendar-list">
          {calendarStatus === "loading" && <Empty text={`Loading Google Calendar events for ${prettyDate(date, { weekday: undefined })}…`} />}
          {calendarStatus === "error" && <Empty text="Google Calendar could not load. You can still add manual focus blocks here." />}
          {calendarStatus !== "loading" && combinedCalendar.length ? combinedCalendar.map((item) => (
            item.source === "google" ?
              <div
                className="calendar-row"
                key={`google-${item.id}`}
                style={{
                  display: "grid",
                  gridTemplateColumns: "82px 1fr auto",
                  alignItems: "center",
                  gap: "10px",
                  padding: "12px",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    color: "#0b1f4d",
                    whiteSpace: "nowrap",
                    fontSize: "0.92rem",
                  }}
                >
                  {item.time || "All day"}
                </div>
                <div
                  style={{
                    fontWeight: 800,
                    color: "#081633",
                    lineHeight: 1.25,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "normal",
                  }}
                  title={item.title || "Untitled event"}
                >
                  {item.title || "Untitled event"}
                </div>
                {item.htmlLink ? <a className="btn" href={item.htmlLink} target="_blank" rel="noreferrer">Open</a> : <span />}
              </div>
              :
              <div className="calendar-row" key={item.id}>
                <input className="input" type="time" value={item.time || ""} onChange={(e) => updateCalendar(item.id, { time: e.target.value })}/>
                <input className="input" placeholder="Appointment or focus block" value={item.title || ""} onChange={(e) => updateCalendar(item.id, { title: e.target.value })}/>
                <button className="small-danger" onClick={() => deleteCalendar(item.id)}>Delete</button>
              </div>
          )) : null}
          {calendarStatus !== "loading" && !combinedCalendar.length && <Empty text="No calendar events for this date. Add a focus block if you want to structure the day." />}
        </div>
      </Card>
      <Card eyebrow="Pipeline" title="People Snapshot"><div className="mini-list">{["Reach Out", "Share Sample", "GIVER IBO Candidate", "Active GIVER"].map((s) => <div key={s}><span>{s}</span><strong>{pipelineCounts[s] || 0}</strong></div>)}</div></Card>
    </section>
  </div>;
}
function coachMessage(momentum, stats, missions, log, targets, priorityGoal, relationshipCoach, magicCoach) {
  if (priorityGoal?.needsAttention) return `Goal check-in: ${goalCoachLine(priorityGoal)} Keep it small and make one visible move today.`;
  if (relationshipCoach) return `Your highest leverage relationship action is ${relationshipCoach.name}: ${relationshipCoach.nextStep || relationshipCoach.currentMission || stageMission(relationshipCoach.stage)}.`;
  if (magicCoach?.days >= 7) return `Magic needs a small reset. ${magicCoach.message}`;
  if (momentum.percent < 50) return "Start simple: complete one Wisdom entry, choose your workout status, and log one wealth action. Momentum is built through small finished promises.";
  return "You’re building momentum. Protect the next clean action and finish the day with integrity.";
}
function WisdomPage({ date, setDate, log, updateLogSection, manifestationPrompt, affirmations, goals, goalInsights }) {
  const wisdom = log.wisdom;
  const setWisdom = (u) => updateLogSection("wisdom", u);
  return <div className="page-grid"><DateBar date={date} setDate={setDate} />
    <section className="four-grid">
      <Card eyebrow="Gratitude" title="Five things I’m grateful for"><div className="stack">{wisdom.gratitudeList.map((g, i) => <input key={i} className="input" placeholder={`${i + 1}.`} value={g} onChange={(e) => { const next = [...wisdom.gratitudeList]; next[i] = e.target.value; setWisdom({ gratitudeList: next }); }} />)}</div></Card>
      <Card eyebrow="Manifestation" title={manifestationPrompt}><textarea value={wisdom.manifestation} onChange={(e) => setWisdom({ manifestation: e.target.value })} placeholder="Write the future you are living into." /></Card>
      <Card eyebrow="Affirmations" title="Identity I’m reinforcing"><div className="affirmation-list">{affirmations.map((a) => <p key={a}>“{a}”</p>)}</div><button className={`btn ${wisdom.affirmationChecked ? "primary" : ""}`} onClick={() => setWisdom({ affirmationChecked: !wisdom.affirmationChecked })}>{wisdom.affirmationChecked ? "Affirmed" : "Mark affirmed"}</button></Card>
      <Card eyebrow="Self-Improvement" title="What did I do or learn today?"><textarea value={wisdom.selfImprovement} onChange={(e) => setWisdom({ selfImprovement: e.target.value })} /><TextArea label="Biggest takeaway" value={wisdom.takeaway} onChange={(v) => setWisdom({ takeaway: v })} /></Card>
    </section>
    <Card eyebrow="Coach Evan" title="Goals needing attention"><div className="goal-coach-list">{goalInsights.filter((g) => g.status !== "Achieved").slice().sort((a,b) => b.daysUntouched - a.daysUntouched).slice(0,4).map((goal) => <div className={goal.needsAttention ? "goal-attention" : "goal-steady"} key={goal.id}><strong>{goal.name}</strong><span>{goal.daysUntouched === 999 ? "No check-in yet" : `${goal.daysUntouched} days since last check-in`}</span><small>Next: {goal.nextAction || "Choose one small action."}</small></div>)}</div></Card>
    <Card eyebrow="Goals" title="Identity Goals"><div className="goal-grid">{goals.map((goal) => <div className="goal-card" key={goal.id}><div><strong>{goal.name}</strong><span>{goal.status}</span></div><p>{goal.statement}</p><input className="input" placeholder="Progress note for selected date" value={wisdom.goalProgress?.[goal.id] || ""} onChange={(e) => setWisdom({ goalProgress: { ...(wisdom.goalProgress || {}), [goal.id]: e.target.value } })} /><small>Next: {goal.nextAction || "Choose one small action."}</small></div>)}</div></Card>
    <Card eyebrow="Reflection" title="What moved the needle today?"><textarea value={wisdom.reflection} onChange={(e) => setWisdom({ reflection: e.target.value })} /></Card>
  </div>;
}
function WellnessPage({ date, setDate, log, updateLogSection, allLogs }) {
  const w = log.wellness; const set = (u) => updateLogSection("wellness", u);
  return <div className="page-grid"><DateBar date={date} setDate={setDate} />
    <section className="two-col"><Card eyebrow="Workout" title="Workout Log"><label>Status<select className="input" value={w.workoutStatus} onChange={(e) => set({ workoutStatus: e.target.value })}><option value="">Choose status</option><option>Yes</option><option>Rest Day</option><option>Missed</option></select></label><label>Type<select className="input" value={w.workoutType} onChange={(e) => set({ workoutType: e.target.value })}>{WORKOUT_TYPES.map((x) => <option key={x}>{x}</option>)}</select></label><label>Duration<input className="input" type="number" value={w.workoutDuration} onChange={(e) => set({ workoutDuration: e.target.value })} /></label><TextArea label="Notes" value={w.workoutNotes} onChange={(v) => set({ workoutNotes: v })} /></Card>
    <Card eyebrow="Recovery" title="Bevel Data"><div className="form-grid"><NumberField label="Recovery %" value={w.bevelRecovery} onChange={(v) => set({ bevelRecovery: v })} /><NumberField label="Sleep %" value={w.bevelSleep} onChange={(v) => set({ bevelSleep: v })} /><NumberField label="Strain %" value={w.bevelStrain} onChange={(v) => set({ bevelStrain: v })} /><NumberField label="Stress Score" value={w.bevelStress} onChange={(v) => set({ bevelStress: v })} /></div></Card></section>
    <Card eyebrow="History" title="Recent Wellness Logs"><div className="table-like">{allLogs.filter((l) => l.wellness.workoutStatus || l.wellness.bevelRecovery).slice(-10).reverse().map((l) => <div key={l.date}><strong>{compactDate(l.date)}</strong><span>{l.wellness.workoutStatus || "—"} {l.wellness.workoutType ? `• ${l.wellness.workoutType}` : ""}</span><span>Recovery {l.wellness.bevelRecovery || "—"}% • Sleep {l.wellness.bevelSleep || "—"}%</span></div>)}</div></Card>
  </div>;
}
function WealthPage({ date, setDate, log, stats, targets, setLog, updateLogSection, allLogs }) {
  const wealth = log.wealth;
  const addEntry = (type) => setLog((l) => ({ ...l, wealth: { ...l.wealth, entries: [{ id: uid(), date, type, category: "Business", description: "", amount: 0 }, ...(l.wealth.entries || [])] } }));
  const updateEntry = (id, updates) => setLog((l) => ({ ...l, wealth: { ...l.wealth, entries: (l.wealth.entries || []).map((e) => e.id === id ? { ...e, ...updates } : e) } }));
  const deleteEntry = (id) => setLog((l) => ({ ...l, wealth: { ...l.wealth, entries: (l.wealth.entries || []).filter((e) => e.id !== id) } }));
  return <div className="page-grid"><DateBar date={date} setDate={setDate} />
    <section className="three-col"><Card eyebrow="Today" title="GU Daily Ratios"><Counter label="Reach Outs" value={wealth.reachOutsCount} onChange={(v) => updateLogSection("wealth", { reachOutsCount: Math.max(0, v) })} /><Counter label="Samples" value={wealth.samples} onChange={(v) => updateLogSection("wealth", { samples: Math.max(0, v) })} /><Counter label="6-W" value={wealth.sixW} onChange={(v) => updateLogSection("wealth", { sixW: Math.max(0, v) })} /></Card>
    <Card eyebrow="Weekly" title="Ratio Summary"><Ratio label="Reach Outs" value={stats.weeklyReachOuts} target={targets.weeklyReachOuts} /><Ratio label="Samples" value={stats.weeklySamples} target={targets.weeklySamples} /><Ratio label="6-W" value={stats.weeklySixW} target={targets.weeklySixW} /></Card>
    <Card eyebrow="Monthly" title="Business Summary"><Ratio label="Reach Outs" value={stats.monthlyReachOuts} target={targets.monthlyReachOuts} /><Ratio label="Samples" value={stats.monthlySamples} target={targets.monthlySamples} /><Ratio label="6-W" value={stats.monthlySixW} target={targets.monthlySixW} /><Ratio label="Income" value={stats.income} target={targets.monthlyIncomeGoal} /></Card></section>
    <Card eyebrow="Money" title={`Income / Expenses • Net ${money(stats.net)}`} action={<div><button className="btn" onClick={() => addEntry("Income")}>Add Income</button><button className="btn" onClick={() => addEntry("Expense")}>Add Expense</button></div>}><EditableMoneyTable entries={wealth.entries || []} updateEntry={updateEntry} deleteEntry={deleteEntry} /></Card>
  </div>;
}
function MagicPage({ log, updateLogSection, stats, tricks, updateSettings, magicCoach }) {
  const m = log.magic;
  const set = (u) => updateLogSection("magic", u);
  const selected = tricks.find((t) => t.name === m.trick);
  const updateTrick = (id, updates) => updateSettings({ tricks: tricks.map((t) => t.id === id ? { ...t, ...updates } : t) });
  return <div className="page-grid"><section className="two-col"><Card eyebrow="Practice" title="Magic Practice"><label>Trick<select className="input" value={m.trick} onChange={(e) => set({ trick: e.target.value, practiced: true })}><option value="">Choose trick</option>{tricks.map((t) => <option key={t.id}>{t.name}</option>)}</select></label><div className="form-grid"><NumberField label="Minutes" value={m.minutes} onChange={(v) => set({ minutes: v, practiced: true })} /><NumberField label="Reps" value={m.reps} onChange={(v) => set({ reps: v, practiced: true })} /><label>Status<select className="input" value={m.confidence} onChange={(e) => set({ confidence: e.target.value, practiced: true })}>{MAGIC_STATUSES.map((x) => <option key={x}>{x}</option>)}</select></label></div><TextArea label="Notes" value={m.notes} onChange={(v) => set({ notes: v, practiced: true })} /></Card>
    <Card eyebrow="Coach Evan" title="Magic Training Coach"><div className={magicCoach?.days >= 7 ? "coach-alert" : "coach-soft"}><span className="coach-area">Magic</span><strong>{magicCoach?.nextTrick ? `Next: ${magicCoach.nextTrick.name}` : "Next focused practice"}</strong><span>{magicCoach?.message}</span><small>{magicCoach?.last ? `Last practice: ${compactDate(magicCoach.last)}` : "No logged practice yet"}</small></div><div className="coach-actions"><button className="btn" onClick={() => magicCoach?.nextTrick && set({ trick: magicCoach.nextTrick.name, practiced: true, minutes: m.minutes || 10 })}>Load suggested trick</button><button className="btn primary" onClick={() => set({ practiced: true, minutes: m.minutes || 10 })}>Mark practice started</button></div></Card>
    <Card eyebrow="Repertoire" title="Performance Readiness"><div className="mini-list"><div><span>Active repertoire</span><strong>{tricks.length}/{stats.targetRepertoireSize}</strong></div><div><span>Performance ready</span><strong>{stats.performanceReady}</strong></div><div><span>Practice days this week</span><strong>{stats.magicPracticeDays}</strong></div></div>{selected && <div className="manager-card"><strong>{selected.name}</strong><label>Status<select className="input" value={selected.status} onChange={(e) => updateTrick(selected.id, { status: e.target.value, performanceReady: e.target.value === "Performance Ready" })}>{MAGIC_STATUSES.map((x) => <option key={x}>{x}</option>)}</select></label></div>}</Card></section></div>;
}
function PeoplePage({ people, selectedPersonId, setSelectedPersonId, newPerson, setNewPerson, addPerson, updatePerson, deletePerson, pipelineCounts, settings, date, highLevelSyncStatus, syncPersonToHighLevel }) {
  const [query, setQuery] = useState(""); const [stage, setStage] = useState("All"); const [type, setType] = useState("All"); const [status, setStatus] = useState("All"); const [focus, setFocus] = useState("All");
  const filtered = people.filter((p) => {
    const hay = `${p.name} ${p.type} ${(p.relationshipTypes || []).join(" ")} ${p.stage} ${p.currentMission} ${p.currentTension} ${p.nextStep} ${p.tags} ${p.notes} ${p.coachObservation} ${p.goalConnections}`.toLowerCase();
    return (!query || hay.includes(query.toLowerCase())) && (stage === "All" || p.stage === stage) && (type === "All" || p.type === type || (p.relationshipTypes || []).includes(type)) && (status === "All" || p.opportunityStatus === status) && (focus === "All" || (focus === "Needs Attention" ? p.daysSinceContact >= 7 || p.daysSinceContact === 999 : (p.goalConnections || "").toLowerCase().includes(focus.toLowerCase())));
  });
  const highest = people[0];
  const needsAttention = people.filter((p) => p.daysSinceContact >= 7 || p.daysSinceContact === 999).length;
  const averageHealth = people.length ? Math.round(people.reduce((t, p) => t + p.relationshipHealth, 0) / people.length) : 0;
  return <div className="page-grid">
    <Card eyebrow="Relationship Intelligence" title="People are the operating system" action={<button className="btn primary" onClick={addPerson}><Plus size={16}/> Add Person</button>}>
      <div className="relationship-hero-grid">
        <div className="relationship-score-tile"><span>Relationship Health</span><strong>{averageHealth}%</strong><small>Average across active people</small></div>
        <div className="relationship-score-tile"><span>Needs Attention</span><strong>{needsAttention}</strong><small>Stale or missing contact date</small></div>
        <div className="relationship-coach-tile"><span>Coach Evan</span><strong>{highest ? `Start with ${highest.name}` : "Add your first relationship"}</strong><small>{highest ? highest.reason : "Build your relationship intelligence layer."}</small></div>
      </div>
      <div className="add-person-grid relationship-add"><input className="input" placeholder="Name" value={newPerson.name} onChange={(e) => setNewPerson({ ...newPerson, name: e.target.value })} /><select className="input" value={newPerson.type} onChange={(e) => setNewPerson({ ...newPerson, type: e.target.value, relationshipTypes: [e.target.value] })}>{PEOPLE_TYPES.map((x) => <option key={x}>{x}</option>)}</select><select className="input" value={newPerson.stage} onChange={(e) => setNewPerson({ ...newPerson, stage: e.target.value, currentMission: stageMission(e.target.value) })}>{SERVICE_STAGES.map((x) => <option key={x}>{x}</option>)}</select><input className="input" placeholder="Next step" value={newPerson.nextStep} onChange={(e) => setNewPerson({ ...newPerson, nextStep: e.target.value })} /></div>
    </Card>
    <section className="people-layout"><Card eyebrow="Relationship CRM" title="Find the next right person"><div className="search-box"><Search size={16}/><input placeholder="Search people, tags, notes, missions, goals…" value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="filter-grid relationship-filters"><select className="input" value={stage} onChange={(e) => setStage(e.target.value)}><option>All</option>{SERVICE_STAGES.map((x) => <option key={x}>{x}</option>)}</select><select className="input" value={type} onChange={(e) => setType(e.target.value)}><option>All</option>{[...new Set([...PEOPLE_TYPES, ...RELATIONSHIP_TYPES])].map((x) => <option key={x}>{x}</option>)}</select><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option>All</option>{OPPORTUNITY_STATUSES.map((x) => <option key={x}>{x}</option>)}</select><select className="input" value={focus} onChange={(e) => setFocus(e.target.value)}><option>All</option><option>Needs Attention</option><option>Prosperity</option><option>Wealth</option><option>Wellness</option><option>Magic</option><option>Happiness</option></select></div><div className="people-table relationship-table">{filtered.map((p) => <button className={selectedPersonId === p.id ? "person-row relationship-row active" : "person-row relationship-row"} key={p.id} onClick={() => setSelectedPersonId(p.id)}><div><strong>{p.name}</strong><small>{(p.relationshipTypes || [p.type]).slice(0,3).join(" • ")}</small></div><span>{p.stage}</span><div className="score-stack"><b>{p.relationshipHealth}%</b><small>health</small></div><div className="score-stack"><b>{p.opportunityScore}%</b><small>opportunity</small></div><small>{p.nextStep || p.currentMission}</small></button>)}</div></Card><Card eyebrow="Coach Evan" title="Relationship Coaching"><div className="stack">{people.slice(0, 5).map((p) => <button className="relationship-coach-card" key={p.id} onClick={() => setSelectedPersonId(p.id)}><span>{p.daysSinceContact === 999 ? "No contact date" : `${p.daysSinceContact} days`}</span><strong>{p.name}</strong><small>{p.starter}</small></button>)}</div></Card></section>
  </div>;
}
function PeopleDrawer({ person, settings, updatePerson, deletePerson, onClose, highLevelSyncStatus, syncPersonToHighLevel }) {
  const tensions = settings.hlTensions || CURRENT_TENSIONS;
  const set = (updates) => updatePerson(person.id, updates);
  const syncState = highLevelSyncStatus?.state || (person.highLevelUrl ? "synced" : "idle");
  const syncMessage = highLevelSyncStatus?.message || (person.highLevelUrl ? "Connected to HighLevel" : "Not synced yet");
  const toggleRelationshipType = (type) => {
    const current = toList(person.relationshipTypes);
    const next = current.includes(type) ? current.filter((x) => x !== type) : [...current, type];
    set({ relationshipTypes: next });
  };
  const addTimeline = () => {
    const entry = { id: uid(), date: todayISO(), text: "New relationship note" };
    set({ timeline: [entry, ...(person.timeline || [])] });
  };
  const updateTimeline = (id, updates) => set({ timeline: (person.timeline || []).map((item) => item.id === id ? { ...item, ...updates } : item) });
  const deleteTimeline = (id) => set({ timeline: (person.timeline || []).filter((item) => item.id !== id) });
  return <aside className="drawer-backdrop"><section className="drawer relationship-drawer"><div className="drawer-header"><div><p className="eyebrow">Relationship Dossier</p><h2>{person.name}</h2><div className="drawer-score-row"><span>{person.relationshipHealth}% health</span><span>{person.trustScore}% trust</span><span>{person.opportunityScore}% opportunity</span></div></div><button className="icon-btn" onClick={onClose}><X size={18}/></button></div>
    <Card eyebrow="Coach Evan" title="Next Best Action"><div className={person.daysSinceContact >= 7 || person.daysSinceContact === 999 ? "coach-alert" : "coach-soft"}><span className="coach-area">Relationship</span><strong>{person.nextAction}</strong><span>{person.reason}</span><small>{person.starter}</small></div></Card>
    <div className="stack">
      <div className="coach-soft">
        <strong>{syncMessage}</strong>
        {person.lastHighLevelSync && <small>Last Sync: {new Date(person.lastHighLevelSync).toLocaleString()}</small>}
      </div>
      <label>Name<input className="input" value={person.name} onChange={(e) => set({ name: e.target.value })} /></label><div className="form-grid"><label>Type<select className="input" value={person.type} onChange={(e) => set({ type: e.target.value })}>{PEOPLE_TYPES.map((x) => <option key={x}>{x}</option>)}</select></label><label>Opportunity Status<select className="input" value={person.opportunityStatus} onChange={(e) => set({ opportunityStatus: e.target.value })}>{OPPORTUNITY_STATUSES.map((x) => <option key={x}>{x}</option>)}</select></label></div>
    <label>Relationship Categories</label><div className="relationship-chip-grid">{RELATIONSHIP_TYPES.map((type) => <button type="button" className={toList(person.relationshipTypes).includes(type) ? "chip active" : "chip"} key={type} onClick={() => toggleRelationshipType(type)}>{type}</button>)}</div>
    <label>Stage<select className="input" value={person.stage} onChange={(e) => set({ stage: e.target.value, currentMission: stageMission(e.target.value) })}>{SERVICE_STAGES.map((x) => <option key={x}>{x}</option>)}</select></label><label>Current Mission<input className="input" value={person.currentMission} onChange={(e) => set({ currentMission: e.target.value })} /></label><label>Current Tension<select className="input" value={person.currentTension} onChange={(e) => set({ currentTension: e.target.value })}>{tensions.map((x) => <option key={x}>{x}</option>)}</select></label><label>Last Contact<input className="input" type="date" value={person.lastContact || ""} onChange={(e) => set({ lastContact: e.target.value })} /></label><label>Next Step<input className="input" value={person.nextStep} onChange={(e) => set({ nextStep: e.target.value })} /></label><label>Goal Connections<input className="input" value={person.goalConnections} onChange={(e) => set({ goalConnections: e.target.value })} placeholder="Prosperity, Wealth, Magic…" /></label><label>Tags<input className="input" value={person.tags} onChange={(e) => set({ tags: e.target.value })} /></label><label>HighLevel URL<input className="input" value={person.highLevelUrl} onChange={(e) => set({ highLevelUrl: e.target.value })} /></label><TextArea label="Coach Observation" value={person.coachObservation} onChange={(v) => set({ coachObservation: v })} /><TextArea label="Trust Notes" value={person.trustNotes} onChange={(v) => set({ trustNotes: v })} /><TextArea label="Notes" value={person.notes} onChange={(v) => set({ notes: v })} />
    <Card eyebrow="Timeline" title="Relationship History" action={<button className="btn" onClick={addTimeline}>Add note</button>}><div className="timeline-list">{(person.timeline || []).length === 0 && <Empty text="No timeline notes yet. Add the moments that matter."/>}{(person.timeline || []).map((item) => <div className="timeline-item" key={item.id}><input className="input" type="date" value={item.date} onChange={(e) => updateTimeline(item.id, { date: e.target.value })}/><input className="input" value={item.text} onChange={(e) => updateTimeline(item.id, { text: e.target.value })}/><button className="small-danger" onClick={() => deleteTimeline(item.id)}>Delete</button></div>)}</div></Card>
    <div className="drawer-actions">
      <a className={`btn ${person.highLevelUrl ? "primary" : "disabled"}`} href={person.highLevelUrl || undefined} target="_blank" rel="noreferrer"><ExternalLink size={16}/> Open in HighLevel</a>
      <button className="btn" disabled={syncState === "syncing"} onClick={() => syncPersonToHighLevel(person)}>
        {syncState === "syncing" ? "Syncing…" : "Sync HighLevel"}
      </button>
      <button className="btn danger" onClick={() => deletePerson(person.id)}><Trash2 size={16}/> Delete</button>
    </div>
    </div></section></aside>;
}
function SettingsPage({ state, exportData, importData, settings, targets, goals, affirmations, manifestationPrompts, tricks, updateSettings }) {
  const [newAff, setNewAff] = useState(""); const [newPrompt, setNewPrompt] = useState(""); const [newTension, setNewTension] = useState(""); const [newGoal, setNewGoal] = useState({ name: "", statement: "", status: "Active", nextAction: "" }); const [newTrick, setNewTrick] = useState("");
  const updateGoal = (id, updates) => updateSettings({ goals: goals.map((g) => g.id === id ? { ...g, ...updates } : g) });
  return <div className="page-grid"><Card eyebrow="Settings" title="GIVE Hub Settings" action={<div><button className="btn primary" onClick={exportData}><Download size={16}/> Export</button><label className="btn"><Upload size={16}/> Import<input type="file" accept="application/json" hidden onChange={(e) => importData(e.target.files?.[0])}/></label></div>}>
    <p className="muted">Manage targets, goals, affirmations, prompts, repertoire, and data. Local preview works without Supabase; add real keys later for cloud sync.</p></Card>
    <section className="two-col"><Card eyebrow="Targets" title="Ratios + Goals"><div className="settings-target-grid">{Object.entries(targets).map(([key, value]) => <label key={key}><span>{humanize(key)}</span><input className="input" type="number" value={value} onChange={(e) => updateSettings({ targets: { ...targets, [key]: Number(e.target.value || 0) } })} /></label>)}</div></Card>
    <Card eyebrow="Magic" title="Repertoire Manager"><div className="inline-row"><input className="input" placeholder="Add trick" value={newTrick} onChange={(e) => setNewTrick(e.target.value)} /><button className="btn" onClick={() => { if (newTrick.trim()) { updateSettings({ tricks: [...tricks, { id: uid(), name: newTrick.trim(), status: "New", performanceReady: false, notes: "" }] }); setNewTrick(""); }}}>Add</button></div><div className="stack">{tricks.map((t) => <div className="tag-row" key={t.id}><input className="input" value={t.name} onChange={(e) => updateSettings({ tricks: tricks.map((x) => x.id === t.id ? { ...x, name: e.target.value } : x) })}/><select className="input" value={t.status} onChange={(e) => updateSettings({ tricks: tricks.map((x) => x.id === t.id ? { ...x, status: e.target.value, performanceReady: e.target.value === "Performance Ready" } : x) })}>{MAGIC_STATUSES.map((x) => <option key={x}>{x}</option>)}</select><button className="small-danger" onClick={() => updateSettings({ tricks: tricks.filter((x) => x.id !== t.id) })}>Delete</button></div>)}</div></Card></section>
    <Card eyebrow="Wisdom" title="Goals Manager"><div className="goal-settings">{goals.map((g) => <div className="manager-card" key={g.id}><div className="form-grid"><label>Name<input className="input" value={g.name} onChange={(e) => updateGoal(g.id, { name: e.target.value })}/></label><label>Status<select className="input" value={g.status} onChange={(e) => updateGoal(g.id, { status: e.target.value })}><option>Active</option><option>Paused</option><option>Achieved</option></select></label></div><TextArea label="Identity Statement" value={g.statement} onChange={(v) => updateGoal(g.id, { statement: v })}/><label>Next Single Action<input className="input" value={g.nextAction || ""} onChange={(e) => updateGoal(g.id, { nextAction: e.target.value })}/></label><button className="small-danger" onClick={() => updateSettings({ goals: goals.filter((x) => x.id !== g.id) })}>Delete Goal</button></div>)}</div><div className="manager-card"><input className="input" placeholder="New goal" value={newGoal.name} onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}/><textarea placeholder="Identity statement" value={newGoal.statement} onChange={(e) => setNewGoal({ ...newGoal, statement: e.target.value })}/><button className="btn primary" onClick={() => { if (newGoal.name.trim()) { updateSettings({ goals: [...goals, { ...newGoal, id: uid() }] }); setNewGoal({ name: "", statement: "", status: "Active", nextAction: "" }); }}}>Add Goal</button></div></Card>
    <section className="two-col"><Card eyebrow="Wisdom" title="Affirmations Manager"><div className="inline-row"><input className="input" value={newAff} onChange={(e) => setNewAff(e.target.value)} placeholder="New affirmation"/><button className="btn" onClick={() => { if (newAff.trim()) { updateSettings({ affirmations: [...affirmations, newAff.trim()] }); setNewAff(""); }}}>Add</button></div><div className="stack">{affirmations.map((a, i) => <div className="tag-row" key={i}><input className="input" value={a} onChange={(e) => updateSettings({ affirmations: affirmations.map((x, idx) => idx === i ? e.target.value : x) })}/><button className="small-danger" onClick={() => updateSettings({ affirmations: affirmations.filter((_, idx) => idx !== i) })}>Delete</button></div>)}</div></Card>
    <Card eyebrow="Wisdom" title="Manifestation Prompts"><div className="inline-row"><input className="input" value={newPrompt} onChange={(e) => setNewPrompt(e.target.value)} placeholder="New prompt"/><button className="btn" onClick={() => { if (newPrompt.trim()) { updateSettings({ manifestationPrompts: [...manifestationPrompts, newPrompt.trim()] }); setNewPrompt(""); }}}>Add</button></div><div className="stack">{manifestationPrompts.map((p, i) => <div className="tag-row" key={i}><input className="input" value={p} onChange={(e) => updateSettings({ manifestationPrompts: manifestationPrompts.map((x, idx) => idx === i ? e.target.value : x) })}/><button className="small-danger" onClick={() => updateSettings({ manifestationPrompts: manifestationPrompts.filter((_, idx) => idx !== i) })}>Delete</button></div>)}</div></Card></section>
    <Card eyebrow="HighLevel" title="Current Tension Dropdown Options"><p className="muted">These mirror the HighLevel dropdown so People records and future sync stay aligned.</p><div className="inline-row"><input className="input" value={newTension} onChange={(e) => setNewTension(e.target.value)} placeholder="New tension option"/><button className="btn" onClick={() => { if (newTension.trim()) { updateSettings({ hlTensions: [...(settings.hlTensions || CURRENT_TENSIONS), newTension.trim()] }); setNewTension(""); }}}>Add</button></div><div className="stack">{(settings.hlTensions || CURRENT_TENSIONS).map((t, i) => <div className="tag-row" key={i}><input className="input" value={t} onChange={(e) => updateSettings({ hlTensions: (settings.hlTensions || CURRENT_TENSIONS).map((x, idx) => idx === i ? e.target.value : x) })}/><button className="small-danger" onClick={() => updateSettings({ hlTensions: (settings.hlTensions || CURRENT_TENSIONS).filter((_, idx) => idx !== i) })}>Delete</button></div>)}</div></Card>
    <Card eyebrow="Data" title="Snapshot"><pre className="json-preview">{JSON.stringify({ logs: Object.keys(state.logs || {}).length, people: state.prospects.length, goals: goals.length, affirmations: affirmations.length, tricks: tricks.length }, null, 2)}</pre></Card>
  </div>;
}

function DateBar({ date, setDate, locked }) { return <section className="date-bar"><button className="btn" disabled={locked} onClick={() => setDate(addDays(date, -1))}><ChevronLeft size={16}/> Prev</button><div><input className="input" type="date" value={date} disabled={locked} onChange={(e) => setDate(e.target.value)} /><strong>{prettyDate(date)}</strong></div><button className="btn" disabled={locked} onClick={() => setDate(todayISO())}>Today</button><button className="btn" disabled={locked} onClick={() => setDate(addDays(date, 1))}>Next <ChevronRight size={16}/></button></section>; }
function MomentumCard({ momentum }) { return <div className="momentum-card"><div><span>Momentum</span><strong>{momentum.percent}%</strong></div><div className="progress"><i style={{ width: `${momentum.percent}%` }} /></div><div className="momentum-tags">{momentum.areas.map((a) => <span className={a.complete ? "done" : ""} key={a.label}>{a.complete ? "✓" : "○"} {a.label}</span>)}</div></div>; }
function Card({ eyebrow, title, action, children }) { return <section className="card"><div className="card-head"><div>{eyebrow && <p className="eyebrow">{eyebrow}</p>}{title && <h2>{title}</h2>}</div>{action}</div>{children}</section>; }
function Metric({ label, value, pct }) { const width = Math.max(0, Math.min(100, Math.round((pct || 0) * 100))); return <section className="metric"><span>{label}</span><strong>{value}</strong><div className="progress"><i style={{ width: `${width}%` }}/></div></section>; }
function Empty({ text }) { return <div className="empty">{text}</div>; }
function TextArea({ label, value, onChange }) { return <label>{label}<textarea value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>; }
function NumberField({ label, value, onChange }) { return <label>{label}<input className="input" type="number" value={value || ""} onChange={(e) => onChange(e.target.value)} /></label>; }
function Counter({ label, value, onChange }) {
  return (
    <div className="counter">
      <span>{label}</span>
      <input
        className="input"
        type="number"
        min="0"
        value={Number(value || 0)}
        onChange={(e) => onChange(Math.max(0, Number(e.target.value || 0)))}
        style={{
          width: "88px",
          textAlign: "center",
          fontWeight: 800,
        }}
      />
    </div>
  );
}
function Ratio({ label, value, target }) { return <Metric label={label} value={`${value}/${target}`} pct={Number(value || 0) / Number(target || 1)} />; }
function EditableMoneyTable({ entries, updateEntry, deleteEntry }) { return <div className="money-table"><div className="money-row head"><span>Date</span><span>Type</span><span>Description</span><span>Amount</span><span></span></div>{entries.map((e) => <div className="money-row" key={e.id}><input className="input" type="date" value={e.date} onChange={(x) => updateEntry(e.id, { date: x.target.value })}/><select className="input" value={e.type} onChange={(x) => updateEntry(e.id, { type: x.target.value })}><option>Income</option><option>Expense</option></select><input className="input" value={e.description} onChange={(x) => updateEntry(e.id, { description: x.target.value })}/><input className="input" type="number" value={e.amount} onChange={(x) => updateEntry(e.id, { amount: Number(x.target.value || 0) })}/><button className="small-danger" onClick={() => deleteEntry(e.id)}>Delete</button></div>)}{entries.length === 0 && <Empty text="No income or expenses logged for this date yet."/>}</div>; }
function humanize(key) { return key.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()).replace("Six W", "6-W"); }
