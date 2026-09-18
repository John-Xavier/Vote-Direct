// Pure eligibility, cooldown and results logic. No React, no store, no I/O.
// Every voting rule from the spec is enforced here and covered by rules.test.ts.

import type {
  Approval,
  ApprovalValue,
  Candidacy,
  Cooldown,
  Front,
  Poll,
  Role,
  Segment,
  User,
  Vote,
} from '../data/types';

export const COOLDOWN_DAYS = 90;
export const DAY_MS = 24 * 60 * 60 * 1000;
export const COOLDOWN_MS = COOLDOWN_DAYS * DAY_MS;
export const MIN_SEGMENT_VOTES = 20;

export interface Eligibility {
  eligible: boolean;
  /** Human-readable reason, shown in the UI when a vote is blocked. */
  reason: string;
}

const OK: Eligibility = { eligible: true, reason: '' };

/** A user is a member of a party if they picked it (independent = no party). */
export function isMemberOfParty(user: User, partyId: string): boolean {
  return (
    user.partyId === partyId && user.membershipStatus !== 'independent'
  );
}

export function isVerifiedMember(user: User, partyId: string): boolean {
  return isMemberOfParty(user, partyId) && user.membershipStatus === 'verified';
}

/** The front a party belongs to, if any. */
export function frontOfParty(fronts: Front[], partyId: string): Front | undefined {
  return fronts.find((f) => f.partyIds.includes(partyId));
}

/** Active cooldown (if any) blocking this user from a party's polls. */
export function activeCooldown(
  user: User,
  partyId: string,
  now: number,
): Cooldown | null {
  const cd = user.cooldowns.find((c) => c.partyId === partyId && c.until > now);
  return cd ?? null;
}

export function cooldownRemainingDays(
  user: User,
  partyId: string,
  now: number,
): number {
  const cd = activeCooldown(user, partyId, now);
  if (!cd) return 0;
  return Math.ceil((cd.until - now) / DAY_MS);
}

export function makeCooldown(
  partyId: string,
  reason: Cooldown['reason'],
  now: number,
): Cooldown {
  return { partyId, until: now + COOLDOWN_MS, reason };
}

/**
 * Can this user cast a vote in this poll right now?
 * Enforces: open CM/LoP polls, front-only CM polls, party-only party roles,
 * constituency matching, and party cooldowns.
 */
export function canVoteInPoll(args: {
  user: User;
  role: Role;
  poll: Poll;
  fronts: Front[];
  now: number;
}): Eligibility {
  const { user, role, fronts, now } = args;

  // Chief Minister / Leader of Opposition — open to everyone, independents too.
  if (role.scope === 'everyone') return OK;

  if (role.scope === 'front') {
    const front = role.frontId
      ? fronts.find((f) => f.id === role.frontId)
      : undefined;
    if (!front) return { eligible: false, reason: 'This front no longer exists.' };
    if (!user.partyId || !front.partyIds.includes(user.partyId)) {
      return {
        eligible: false,
        reason: `Only members of ${front.name}'s parties can vote in its CM candidate poll.`,
      };
    }
    if (user.membershipStatus === 'independent') {
      return {
        eligible: false,
        reason: 'Independents cannot vote in a front CM candidate poll.',
      };
    }
    const cd = activeCooldown(user, user.partyId, now);
    if (cd) {
      return {
        eligible: false,
        reason: `You joined this party recently. You can vote again in ${cooldownRemainingDays(
          user,
          user.partyId,
          now,
        )} days.`,
      };
    }
    return OK;
  }

  // scope 'party' (internal post) or 'constituency' (party candidate).
  const partyId = role.partyId;
  if (!partyId) return { eligible: false, reason: 'This role has no party.' };
  if (!isMemberOfParty(user, partyId)) {
    return {
      eligible: false,
      reason: 'Only members of this party can vote on its roles.',
    };
  }
  const cd = activeCooldown(user, partyId, now);
  if (cd) {
    return {
      eligible: false,
      reason: `You joined this party recently. You can vote again in ${cooldownRemainingDays(
        user,
        partyId,
        now,
      )} days.`,
    };
  }
  if (role.scope === 'constituency') {
    if (role.constituencyId && role.constituencyId !== user.constituencyId) {
      return {
        eligible: false,
        reason: 'This candidate poll is only for your own assembly constituency.',
      };
    }
  }
  return OK;
}

/**
 * Can this user stand as a candidate for this role?
 * Candidates for a party's roles must be members of that party (verification
 * not required). CM/LoP are open to anyone.
 */
export function canStandForRole(args: {
  user: User;
  role: Role;
  fronts: Front[];
}): Eligibility {
  const { user, role, fronts } = args;
  if (role.scope === 'everyone') return OK;

  if (role.scope === 'front') {
    const front = role.frontId
      ? fronts.find((f) => f.id === role.frontId)
      : undefined;
    if (!front) return { eligible: false, reason: 'This front no longer exists.' };
    if (
      !user.partyId ||
      !front.partyIds.includes(user.partyId) ||
      user.membershipStatus === 'independent'
    ) {
      return {
        eligible: false,
        reason: `You must be a member of one of ${front.name}'s parties.`,
      };
    }
    return OK;
  }

  const partyId = role.partyId;
  if (!partyId) return { eligible: false, reason: 'This role has no party.' };
  if (!isMemberOfParty(user, partyId)) {
    return {
      eligible: false,
      reason: 'You must be a member of this party to stand for its roles.',
    };
  }
  if (role.scope === 'constituency') {
    if (role.constituencyId && role.constituencyId !== user.constituencyId) {
      return {
        eligible: false,
        reason: 'You can only stand in your own assembly constituency.',
      };
    }
  }
  return OK;
}

/** Roles a user is eligible to stand for. */
export function eligibleRolesForUser(
  user: User,
  roles: Role[],
  fronts: Front[],
): Role[] {
  return roles.filter((role) => canStandForRole({ user, role, fronts }).eligible);
}

/** A candidacy may be published only when it has a pitch. */
export function canPublishCandidacy(c: Candidacy): boolean {
  return c.pitch !== null && c.pitch.content.trim().length > 0;
}

/** Whether a user counts inside a results segment (based on their own status). */
export function userInSegment(user: User, segment: Segment): boolean {
  switch (segment) {
    case 'all':
      return true;
    case 'members':
      return user.membershipStatus !== 'independent' && user.partyId !== null;
    case 'verified':
      return user.membershipStatus === 'verified';
  }
}

export interface RankedResult {
  candidacyId: string;
  count: number;
  share: number; // 0..1
}

export interface PollResults {
  ranked: RankedResult[];
  total: number;
  /** True when the segment has fewer than MIN_SEGMENT_VOTES votes. */
  hidden: boolean;
}

/** Tally a "who should hold this role" poll for one segment. */
export function computeResults(args: {
  poll: Poll;
  votes: Vote[];
  users: User[];
  candidacies: Candidacy[];
  segment: Segment;
}): PollResults {
  const { poll, votes, users, candidacies, segment } = args;
  const userById = new Map(users.map((u) => [u.id, u]));
  const pollVotes = votes.filter((v) => {
    if (v.pollId !== poll.id) return false;
    const u = userById.get(v.userId);
    return u ? userInSegment(u, segment) : false;
  });
  const counts = new Map<string, number>();
  for (const v of pollVotes) {
    counts.set(v.candidacyId, (counts.get(v.candidacyId) ?? 0) + 1);
  }
  const total = pollVotes.length;
  const candidacyIds = candidacies
    .filter((c) => {
      const role = c.roleId;
      return role === poll.roleId;
    })
    .map((c) => c.id);
  // Include any candidacy that received votes even if not in the list.
  for (const id of counts.keys()) if (!candidacyIds.includes(id)) candidacyIds.push(id);

  const ranked: RankedResult[] = candidacyIds
    .map((candidacyId) => {
      const count = counts.get(candidacyId) ?? 0;
      return { candidacyId, count, share: total > 0 ? count / total : 0 };
    })
    .sort((a, b) => b.count - a.count);

  return { ranked, total, hidden: total < MIN_SEGMENT_VOTES };
}

export interface ApprovalResults {
  approve: number;
  disapprove: number;
  total: number;
  approveShare: number; // 0..1
  hidden: boolean;
}

/** Tally an approve/disapprove poll for one segment. */
export function computeApproval(args: {
  poll: Poll;
  approvals: Approval[];
  users: User[];
  segment: Segment;
}): ApprovalResults {
  const { poll, approvals, users, segment } = args;
  const userById = new Map(users.map((u) => [u.id, u]));
  const relevant = approvals.filter((a) => {
    if (a.pollId !== poll.id) return false;
    const u = userById.get(a.userId);
    return u ? userInSegment(u, segment) : false;
  });
  const approve = relevant.filter((a) => a.value === 'approve').length;
  const disapprove = relevant.filter((a) => a.value === 'disapprove').length;
  const total = relevant.length;
  return {
    approve,
    disapprove,
    total,
    approveShare: total > 0 ? approve / total : 0,
    hidden: total < MIN_SEGMENT_VOTES,
  };
}

export type { ApprovalValue };
