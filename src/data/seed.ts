// Deterministic seed data for the demo. Real Kerala coalition/party names are
// used at the product owner's request; all candidates and office holders are
// invented people (no real politicians).

import type {
  Approval,
  AuditLogEntry,
  Candidacy,
  Constituency,
  DemoData,
  Front,
  Party,
  Poll,
  Role,
  Segment,
  TrendPoint,
  User,
  Vote,
} from './types';
import { canVoteInPoll } from '../lib/rules';

// Fixed "now" for the seeded demo so cooldowns and trends are reproducible.
export const SEED_NOW = Date.UTC(2026, 8, 18); // 2026-09-18

// --- Deterministic RNG (mulberry32) ---
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rand = rng(20260918);
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)];
const chance = (p: number) => rand() < p;

// --- Constituencies: 20 real Kerala assembly constituencies ---
const CONSTITUENCY_DATA: [string, string][] = [
  ['Thiruvananthapuram', 'Thiruvananthapuram'],
  ['Kazhakkoottam', 'Thiruvananthapuram'],
  ['Nemom', 'Thiruvananthapuram'],
  ['Kollam', 'Kollam'],
  ['Chavara', 'Kollam'],
  ['Kottarakkara', 'Kollam'],
  ['Pathanamthitta', 'Pathanamthitta'],
  ['Aranmula', 'Pathanamthitta'],
  ['Alappuzha', 'Alappuzha'],
  ['Ambalappuzha', 'Alappuzha'],
  ['Kottayam', 'Kottayam'],
  ['Vaikom', 'Kottayam'],
  ['Ernakulam', 'Ernakulam'],
  ['Thrippunithura', 'Ernakulam'],
  ['Thrissur', 'Thrissur'],
  ['Guruvayoor', 'Thrissur'],
  ['Palakkad', 'Palakkad'],
  ['Manjeri', 'Malappuram'],
  ['Kozhikode South', 'Kozhikode'],
  ['Kannur', 'Kannur'],
];

export const constituencies: Constituency[] = CONSTITUENCY_DATA.map(
  ([name, district], i) => ({ id: `con-${i + 1}`, name, district }),
);

// --- Fronts & parties (placeholder names only) ---
export const parties: Party[] = [
  { id: 'party-a', name: 'CPI(M)', frontId: 'front-1', adminUserId: null },
  { id: 'party-b', name: 'CPI', frontId: 'front-1', adminUserId: null },
  { id: 'party-c', name: 'INC', frontId: 'front-2', adminUserId: null },
  { id: 'party-d', name: 'IUML', frontId: 'front-2', adminUserId: null },
  { id: 'party-e', name: 'BJP', frontId: 'front-3', adminUserId: null },
];

export const fronts: Front[] = [
  { id: 'front-1', name: 'LDF', partyIds: ['party-a', 'party-b'], coalitionAdminUserId: null },
  { id: 'front-2', name: 'UDF', partyIds: ['party-c', 'party-d'], coalitionAdminUserId: null },
  { id: 'front-3', name: 'NDA', partyIds: ['party-e'], coalitionAdminUserId: null },
];

// --- Roles ---
const roles: Role[] = [];
roles.push({ id: 'role-cm', title: 'Chief Minister', scope: 'everyone' });
roles.push({ id: 'role-lop', title: 'Leader of Opposition', scope: 'everyone' });
for (const f of fronts) {
  roles.push({
    id: `role-frontcm-${f.id}`,
    title: `${f.name} — CM Candidate`,
    scope: 'front',
    frontId: f.id,
  });
}
// Internal party posts for every party.
const INTERNAL_POSTS = ['District Secretary', 'Youth Wing President'];
for (const p of parties) {
  for (const post of INTERNAL_POSTS) {
    roles.push({
      id: `role-int-${p.id}-${post.replace(/\s+/g, '').toLowerCase()}`,
      title: `${p.name} — ${post}`,
      scope: 'party',
      partyId: p.id,
      internal: true,
    });
  }
}
// Constituency candidate roles: each party fields a candidate in a few seats.
const CANDIDATE_SEATS = ['con-1', 'con-9', 'con-13', 'con-15'];
for (const p of parties) {
  for (const conId of CANDIDATE_SEATS) {
    const con = constituencies.find((c) => c.id === conId)!;
    roles.push({
      id: `role-seat-${p.id}-${conId}`,
      title: `${p.name} candidate — ${con.name}`,
      scope: 'constituency',
      partyId: p.id,
      constituencyId: conId,
    });
  }
}

// --- Polls ---
const polls: Poll[] = [];
for (const r of roles) {
  polls.push({ id: `poll-${r.id}`, roleId: r.id, type: 'who_should_hold' });
}
// Approval polls for the two current office holders (placeholder names).
polls.push({
  id: 'poll-approval-cm',
  roleId: 'role-cm',
  type: 'approval',
  currentHolderName: 'Adv. Ravindran Nair (current CM)',
});
polls.push({
  id: 'poll-approval-lop',
  roleId: 'role-lop',
  type: 'approval',
  currentHolderName: 'Smt. Leela Menon (current LoP)',
});

// --- Names & professions ---
const FIRST = [
  'Arun', 'Anoop', 'Biju', 'Deepa', 'Geetha', 'Hari', 'Jayan', 'Kavya',
  'Lakshmi', 'Manoj', 'Nithya', 'Praveen', 'Reshma', 'Sabu', 'Sindhu',
  'Thomas', 'Ummer', 'Vinod', 'Aswathy', 'Rahul', 'Meera', 'Sreejith',
  'Divya', 'Faizal', 'Gopan', 'Indira', 'Jacob', 'Latha', 'Mohanan',
  'Nisha', 'Prasad', 'Remya', 'Suresh', 'Tessy', 'Unni', 'Vidya', 'Ajith',
  'Beena', 'Shaji', 'Anitha',
];
const LAST = [
  'Nair', 'Menon', 'Pillai', 'Kurup', 'Varma', 'Thomas', 'Mathew', 'Das',
  'Krishnan', 'Iyer', 'Rahman', 'Basheer', 'George', 'Joseph', 'Antony',
  'Vasudevan', 'Panicker', 'Kartha', 'Raj', 'Shenoy',
];
const PROFESSIONS = [
  'School teacher', 'Farmer', 'Advocate', 'Doctor', 'Civil engineer',
  'Auto driver', 'Nurse', 'Shopkeeper', 'Journalist', 'Fisherman',
  'Social worker', 'College professor', 'Accountant', 'Electrician',
  'Panchayat clerk', 'Homemaker', 'Small business owner', 'Software developer',
  'Bank officer', 'Retired officer',
];
const EDUCATION = [
  'B.A. Economics', 'B.Sc. Physics', 'B.Com', 'M.A. Malayalam', 'LLB',
  'MBBS', 'B.Tech Civil', 'Diploma in Nursing', 'M.Sc. Chemistry', 'ITI',
  'B.Ed', 'MBA',
];
const ACHIEVEMENTS = [
  'Led the ward drinking-water project.',
  'Ran a free evening tuition centre for five years.',
  'Organised the local flood relief camp in 2018.',
  'Started a women’s self-help savings group.',
  'Volunteer coordinator for the panchayat library.',
  'Coached the district under-17 football team.',
];
const POST_PITCHES = [
  'I want clean, walkable roads and a working drainage plan for every ward. Nothing fancy — just the basics done well and on time.',
  'My focus is local jobs: skilling centres, faster small-business permits, and support for our fishing and farming families.',
  'Healthcare should not mean a bus ride to the city. I will push for staffed primary health centres and evening clinics.',
  'Transparency first. Every rupee of ward spending published online, and a monthly open meeting anyone can attend.',
  'Better schools, safer streets for women, and dignified work for our youth. That is the whole plan.',
];
const VIDEO_URLS = [
  'https://videos.example.com/pitch/anil-intro.mp4',
  'https://videos.example.com/pitch/meera-town-hall.mp4',
  'https://videos.example.com/pitch/roads-and-water.mp4',
  'https://videos.example.com/pitch/health-first.mp4',
];

let userSeq = 0;
function makeUser(partial: Partial<User> & { name: string }): User {
  userSeq += 1;
  const conId = partial.constituencyId ?? pick(constituencies).id;
  return {
    id: partial.id ?? `user-${userSeq}`,
    phone: partial.phone ?? `+9198${String(40000000 + userSeq).slice(0, 8)}`,
    name: partial.name,
    profession: partial.profession ?? pick(PROFESSIONS),
    education: partial.education ?? pick(EDUCATION),
    description:
      partial.description ?? 'A local resident who wants a fair, working neighbourhood.',
    achievements: partial.achievements ?? pick(ACHIEVEMENTS),
    constituencyId: conId,
    partyId: partial.partyId ?? null,
    membershipStatus: partial.membershipStatus ?? 'independent',
    role: partial.role ?? 'voter',
    adminOfPartyId: partial.adminOfPartyId ?? null,
    adminOfFrontId: partial.adminOfFrontId ?? null,
    joinedPartyAt: partial.joinedPartyAt ?? null,
    cooldowns: partial.cooldowns ?? [],
    createdAt: partial.createdAt ?? SEED_NOW - 200 * 24 * 60 * 60 * 1000,
  };
}

const users: User[] = [];

// --- Fixed demo personas (used by the Demo panel persona switcher) ---
const PERSONA_JOIN = SEED_NOW - 200 * 24 * 60 * 60 * 1000;
users.push(
  makeUser({
    id: 'persona-independent',
    name: 'Ravi Kumar (You — Independent)',
    // display names use real front/party names at the user's request
    profession: 'Auto driver',
    constituencyId: 'con-13',
    partyId: null,
    membershipStatus: 'independent',
  }),
);
users.push(
  makeUser({
    id: 'persona-self-a',
    name: 'Anjali Nair (You — CPI(M), self-declared)',
    profession: 'School teacher',
    constituencyId: 'con-1',
    partyId: 'party-a',
    membershipStatus: 'self_declared',
    joinedPartyAt: PERSONA_JOIN,
  }),
);
users.push(
  makeUser({
    id: 'persona-verified-a',
    name: 'Deepak Menon (You — CPI(M), verified)',
    profession: 'Advocate',
    constituencyId: 'con-9',
    partyId: 'party-a',
    membershipStatus: 'verified',
    joinedPartyAt: PERSONA_JOIN,
  }),
);
users.push(
  makeUser({
    id: 'persona-verified-b',
    name: 'Fathima Rahman (You — CPI, verified)',
    profession: 'Nurse',
    constituencyId: 'con-15',
    partyId: 'party-b',
    membershipStatus: 'verified',
    joinedPartyAt: PERSONA_JOIN,
  }),
);
users.push(
  makeUser({
    id: 'persona-admin-a',
    name: 'Suresh Pillai (You — CPI(M) admin)',
    profession: 'Retired officer',
    constituencyId: 'con-1',
    partyId: 'party-a',
    membershipStatus: 'verified',
    role: 'party_admin',
    adminOfPartyId: 'party-a',
    joinedPartyAt: PERSONA_JOIN,
  }),
);
users.push(
  makeUser({
    id: 'persona-coadmin-1',
    name: 'Latha Varma (You — LDF coalition admin)',
    profession: 'Social worker',
    constituencyId: 'con-1',
    partyId: 'party-a',
    membershipStatus: 'verified',
    role: 'coalition_admin',
    adminOfFrontId: 'front-1',
    joinedPartyAt: PERSONA_JOIN,
  }),
);

// Wire admin references.
parties.find((p) => p.id === 'party-a')!.adminUserId = 'persona-admin-a';
fronts.find((f) => f.id === 'front-1')!.coalitionAdminUserId = 'persona-coadmin-1';

export const PERSONA_IDS = {
  independent: 'persona-independent',
  selfA: 'persona-self-a',
  verifiedA: 'persona-verified-a',
  verifiedB: 'persona-verified-b',
  adminA: 'persona-admin-a',
  coadmin1: 'persona-coadmin-1',
} as const;

// --- Generated population, so most segments cross 20 votes ---
const PARTY_IDS = parties.map((p) => p.id);
// Members per party (verified vs self-declared mix).
for (const partyId of PARTY_IDS) {
  const memberCount = partyId === 'party-e' ? 14 : 26; // Party E stays smaller
  for (let i = 0; i < memberCount; i++) {
    const verified = chance(0.62);
    users.push(
      makeUser({
        name: `${pick(FIRST)} ${pick(LAST)}`,
        partyId,
        membershipStatus: verified ? 'verified' : 'self_declared',
        joinedPartyAt: SEED_NOW - (120 + Math.floor(rand() * 400)) * 24 * 60 * 60 * 1000,
      }),
    );
  }
}
// Independents.
for (let i = 0; i < 30; i++) {
  users.push(makeUser({ name: `${pick(FIRST)} ${pick(LAST)}` }));
}

// --- Candidacies (~40) with a mix of video and written pitches ---
const candidacies: Candidacy[] = [];
let candSeq = 0;
function addCandidacy(userId: string, roleId: string, confirmed: string[] = []): Candidacy {
  candSeq += 1;
  const usePost = chance(0.55);
  const c: Candidacy = {
    id: `cand-${candSeq}`,
    userId,
    roleId,
    pitch: usePost
      ? { kind: 'post', content: pick(POST_PITCHES) }
      : { kind: 'video', content: pick(VIDEO_URLS) },
    published: true,
    confirmedPositions: confirmed,
    createdAt: SEED_NOW - (10 + Math.floor(rand() * 120)) * 24 * 60 * 60 * 1000,
  };
  candidacies.push(c);
  return c;
}

function membersOf(partyId: string): User[] {
  return users.filter((u) => u.partyId === partyId && u.membershipStatus !== 'independent');
}
function anyUsers(n: number): User[] {
  const pool = [...users];
  const out: User[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(rand() * pool.length), 1)[0]);
  }
  return out;
}

// CM candidates (open to everyone) — draw from across the population.
for (const u of anyUsers(5)) addCandidacy(u.id, 'role-cm');
// LoP candidates.
for (const u of anyUsers(4)) addCandidacy(u.id, 'role-lop');
// Front CM candidates.
for (const f of fronts) {
  const pool = f.partyIds.flatMap((pid) => membersOf(pid));
  const n = f.id === 'front-3' ? 2 : 3;
  for (let i = 0; i < n && pool.length; i++) {
    const u = pool.splice(Math.floor(rand() * pool.length), 1)[0];
    addCandidacy(u.id, `role-frontcm-${f.id}`);
  }
}
// Internal party posts.
for (const p of parties) {
  for (const post of INTERNAL_POSTS) {
    const roleId = `role-int-${p.id}-${post.replace(/\s+/g, '').toLowerCase()}`;
    const pool = membersOf(p.id);
    const n = Math.min(2 + Math.floor(rand() * 2), pool.length);
    for (let i = 0; i < n && pool.length; i++) {
      const u = pool.splice(Math.floor(rand() * pool.length), 1)[0];
      addCandidacy(u.id, roleId, chance(0.5) ? [post] : []);
    }
  }
}
// Constituency candidates.
for (const p of parties) {
  for (const conId of CANDIDATE_SEATS) {
    const roleId = `role-seat-${p.id}-${conId}`;
    const pool = membersOf(p.id).filter((u) => u.constituencyId === conId);
    // ensure at least one candidate from that seat if possible
    const n = Math.min(1 + Math.floor(rand() * 2), pool.length);
    for (let i = 0; i < n && pool.length; i++) {
      const u = pool.splice(Math.floor(rand() * pool.length), 1)[0];
      addCandidacy(u.id, roleId);
    }
  }
}

// --- Votes: for each who_should_hold poll, eligible users vote ---
const votes: Vote[] = [];
let voteSeq = 0;
function addVote(userId: string, pollId: string, candidacyId: string) {
  voteSeq += 1;
  votes.push({
    id: `vote-${voteSeq}`,
    userId,
    pollId,
    candidacyId,
    createdAt: SEED_NOW - Math.floor(rand() * 60) * 24 * 60 * 60 * 1000,
  });
}

for (const poll of polls) {
  if (poll.type !== 'who_should_hold') continue;
  const role = roles.find((r) => r.id === poll.roleId)!;
  const rolCands = candidacies.filter((c) => c.roleId === role.id);
  if (rolCands.length === 0) continue;
  const eligible = users.filter(
    (u) => canVoteInPoll({ user: u, role, poll, fronts, now: SEED_NOW }).eligible,
  );
  // Turnout: big for CM/LoP, smaller for niche polls (so some segments < 20).
  let turnout: number;
  if (role.scope === 'everyone') turnout = 0.75;
  else if (role.scope === 'front') turnout = 0.7;
  else if (role.scope === 'party') turnout = 0.55;
  else turnout = 0.5; // constituency — deliberately thin
  // Candidate popularity weights.
  const weights = rolCands.map(() => 0.5 + rand() * 1.5);
  const wsum = weights.reduce((a, b) => a + b, 0);
  for (const u of eligible) {
    if (!chance(turnout)) continue;
    let r = rand() * wsum;
    let idx = 0;
    for (let i = 0; i < weights.length; i++) {
      r -= weights[i];
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    addVote(u.id, poll.id, rolCands[idx].id);
  }
}

// --- Approvals for the two current office holders ---
const approvals: Approval[] = [];
let apprSeq = 0;
for (const poll of polls) {
  if (poll.type !== 'approval') continue;
  const base = poll.id === 'poll-approval-cm' ? 0.56 : 0.48;
  for (const u of users) {
    if (!chance(0.7)) continue;
    apprSeq += 1;
    approvals.push({
      id: `appr-${apprSeq}`,
      userId: u.id,
      pollId: poll.id,
      value: chance(base) ? 'approve' : 'disapprove',
      createdAt: SEED_NOW - Math.floor(rand() * 40) * 24 * 60 * 60 * 1000,
    });
  }
}

// --- 12 weeks of trend history for every published candidacy, per segment ---
const trends: TrendPoint[] = [];
const SEGMENTS: Segment[] = ['all', 'members', 'verified'];
for (const c of candidacies) {
  // Final share approximated from current votes among 'all'.
  for (const segment of SEGMENTS) {
    const finalShare = 0.15 + rand() * 0.5;
    const start = Math.max(0.05, finalShare - (0.1 + rand() * 0.2));
    for (let week = 0; week < 12; week++) {
      const t = week / 11;
      const noise = (rand() - 0.5) * 0.05;
      const share = Math.min(0.95, Math.max(0.02, start + (finalShare - start) * t + noise));
      trends.push({ candidacyId: c.id, segment, week, share });
    }
  }
}

// --- Seed audit log for CPI(M) (party-a) ---
const auditLog: AuditLogEntry[] = [
  {
    id: 'audit-1',
    partyId: 'party-a',
    adminName: 'Suresh Pillai',
    action: 'verify',
    targetUserName: 'Deepak Menon',
    detail: 'Verified as a CPI(M) member.',
    createdAt: SEED_NOW - 30 * 24 * 60 * 60 * 1000,
  },
  {
    id: 'audit-2',
    partyId: 'party-a',
    adminName: 'Suresh Pillai',
    action: 'position_assigned',
    targetUserName: 'Deepak Menon',
    detail: 'Assigned position: Booth Committee Convener.',
    createdAt: SEED_NOW - 20 * 24 * 60 * 60 * 1000,
  },
];

export function buildSeedData(): DemoData {
  // Deep clone so the store owns fresh, mutable objects.
  return structuredClone({
    fronts,
    parties,
    constituencies,
    users,
    roles,
    polls,
    candidacies,
    votes,
    approvals,
    auditLog,
    trends,
    clockOffsetMs: 0,
  });
}
