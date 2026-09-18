import { describe, it, expect } from 'vitest';
import {
  COOLDOWN_MS,
  MIN_SEGMENT_VOTES,
  canPublishCandidacy,
  canStandForRole,
  canVoteInPoll,
  computeApproval,
  computeResults,
  cooldownRemainingDays,
  eligibleRolesForUser,
  isMemberOfParty,
  isVerifiedMember,
  makeCooldown,
  userInSegment,
} from './rules';
import type {
  Approval,
  Candidacy,
  Front,
  Poll,
  Role,
  User,
  Vote,
} from '../data/types';

const NOW = 1_700_000_000_000;

const fronts: Front[] = [
  { id: 'front-1', name: 'Front 1', partyIds: ['party-a', 'party-b'], coalitionAdminUserId: null },
  { id: 'front-2', name: 'Front 2', partyIds: ['party-c'], coalitionAdminUserId: null },
];

function mkUser(over: Partial<User> = {}): User {
  return {
    id: over.id ?? 'u',
    phone: '+910000000000',
    name: 'Test',
    profession: '',
    education: '',
    description: '',
    achievements: '',
    constituencyId: over.constituencyId ?? 'con-1',
    partyId: over.partyId ?? null,
    membershipStatus: over.membershipStatus ?? 'independent',
    role: 'voter',
    joinedPartyAt: null,
    cooldowns: over.cooldowns ?? [],
    createdAt: 0,
    ...over,
  };
}

const roleCM: Role = { id: 'role-cm', title: 'CM', scope: 'everyone' };
const roleFront: Role = { id: 'r-front', title: 'Front 1 CM', scope: 'front', frontId: 'front-1' };
const roleParty: Role = { id: 'r-party', title: 'Secretary', scope: 'party', partyId: 'party-a', internal: true };
const roleSeat: Role = {
  id: 'r-seat',
  title: 'Seat',
  scope: 'constituency',
  partyId: 'party-a',
  constituencyId: 'con-1',
};

const pollOf = (roleId: string): Poll => ({ id: `poll-${roleId}`, roleId, type: 'who_should_hold' });

describe('membership helpers', () => {
  it('independent is not a member of any party', () => {
    expect(isMemberOfParty(mkUser(), 'party-a')).toBe(false);
  });
  it('self-declared and verified count as members', () => {
    expect(isMemberOfParty(mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' }), 'party-a')).toBe(true);
    expect(isMemberOfParty(mkUser({ partyId: 'party-a', membershipStatus: 'verified' }), 'party-a')).toBe(true);
  });
  it('verified check is stricter', () => {
    expect(isVerifiedMember(mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' }), 'party-a')).toBe(false);
    expect(isVerifiedMember(mkUser({ partyId: 'party-a', membershipStatus: 'verified' }), 'party-a')).toBe(true);
  });
});

describe('canVoteInPoll — CM/LoP open to everyone', () => {
  it('independent can vote for CM', () => {
    const r = canVoteInPoll({ user: mkUser(), role: roleCM, poll: pollOf('role-cm'), fronts, now: NOW });
    expect(r.eligible).toBe(true);
  });
});

describe('canVoteInPoll — front CM poll', () => {
  it('member of a front party can vote', () => {
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' });
    expect(canVoteInPoll({ user: u, role: roleFront, poll: pollOf('r-front'), fronts, now: NOW }).eligible).toBe(true);
  });
  it('member of another front cannot vote', () => {
    const u = mkUser({ partyId: 'party-c', membershipStatus: 'verified' });
    const r = canVoteInPoll({ user: u, role: roleFront, poll: pollOf('r-front'), fronts, now: NOW });
    expect(r.eligible).toBe(false);
    expect(r.reason).toMatch(/Front 1/);
  });
  it('independent cannot vote in a front CM poll', () => {
    expect(canVoteInPoll({ user: mkUser(), role: roleFront, poll: pollOf('r-front'), fronts, now: NOW }).eligible).toBe(false);
  });
});

describe('canVoteInPoll — party roles', () => {
  it('party member can vote on internal post', () => {
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' });
    expect(canVoteInPoll({ user: u, role: roleParty, poll: pollOf('r-party'), fronts, now: NOW }).eligible).toBe(true);
  });
  it('non-member cannot vote on party role', () => {
    const u = mkUser({ partyId: 'party-b', membershipStatus: 'verified' });
    expect(canVoteInPoll({ user: u, role: roleParty, poll: pollOf('r-party'), fronts, now: NOW }).eligible).toBe(false);
  });
  it('verification is not required to vote', () => {
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' });
    expect(canVoteInPoll({ user: u, role: roleParty, poll: pollOf('r-party'), fronts, now: NOW }).eligible).toBe(true);
  });
});

describe('canVoteInPoll — constituency candidate poll', () => {
  it('matching constituency member can vote', () => {
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'verified', constituencyId: 'con-1' });
    expect(canVoteInPoll({ user: u, role: roleSeat, poll: pollOf('r-seat'), fronts, now: NOW }).eligible).toBe(true);
  });
  it('non-matching constituency is blocked', () => {
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'verified', constituencyId: 'con-9' });
    const r = canVoteInPoll({ user: u, role: roleSeat, poll: pollOf('r-seat'), fronts, now: NOW });
    expect(r.eligible).toBe(false);
    expect(r.reason).toMatch(/constituency/i);
  });
});

describe('canVoteInPoll — cooldowns', () => {
  it('active cooldown blocks a party poll', () => {
    const u = mkUser({
      partyId: 'party-a',
      membershipStatus: 'self_declared',
      cooldowns: [{ partyId: 'party-a', until: NOW + COOLDOWN_MS, reason: 'party_change' }],
    });
    const r = canVoteInPoll({ user: u, role: roleParty, poll: pollOf('r-party'), fronts, now: NOW });
    expect(r.eligible).toBe(false);
    expect(r.reason).toMatch(/days/);
  });
  it('cooldown does not block open CM poll', () => {
    const u = mkUser({
      partyId: 'party-a',
      membershipStatus: 'self_declared',
      cooldowns: [{ partyId: 'party-a', until: NOW + COOLDOWN_MS, reason: 'rejected' }],
    });
    expect(canVoteInPoll({ user: u, role: roleCM, poll: pollOf('role-cm'), fronts, now: NOW }).eligible).toBe(true);
  });
  it('expired cooldown no longer blocks', () => {
    const u = mkUser({
      partyId: 'party-a',
      membershipStatus: 'self_declared',
      cooldowns: [{ partyId: 'party-a', until: NOW - 1, reason: 'party_change' }],
    });
    expect(canVoteInPoll({ user: u, role: roleParty, poll: pollOf('r-party'), fronts, now: NOW }).eligible).toBe(true);
  });
  it('cooldownRemainingDays reports whole days left', () => {
    const u = mkUser({ cooldowns: [makeCooldown('party-a', 'rejected', NOW)] });
    expect(cooldownRemainingDays(u, 'party-a', NOW)).toBe(90);
    expect(cooldownRemainingDays(u, 'party-a', NOW + COOLDOWN_MS)).toBe(0);
  });
});

describe('candidacy eligibility', () => {
  it('anyone can stand for CM', () => {
    expect(canStandForRole({ user: mkUser(), role: roleCM, fronts }).eligible).toBe(true);
  });
  it('must be a party member to stand for a party role', () => {
    expect(canStandForRole({ user: mkUser(), role: roleParty, fronts }).eligible).toBe(false);
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' });
    expect(canStandForRole({ user: u, role: roleParty, fronts }).eligible).toBe(true);
  });
  it('candidate need not be verified', () => {
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' });
    expect(canStandForRole({ user: u, role: roleSeat, fronts }).eligible).toBe(true);
  });
  it('constituency candidate must match their own seat', () => {
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'verified', constituencyId: 'con-9' });
    expect(canStandForRole({ user: u, role: roleSeat, fronts }).eligible).toBe(false);
  });
  it('eligibleRolesForUser filters correctly', () => {
    const u = mkUser({ partyId: 'party-a', membershipStatus: 'self_declared', constituencyId: 'con-1' });
    const roles = eligibleRolesForUser(u, [roleCM, roleFront, roleParty, roleSeat], fronts);
    expect(roles.map((r) => r.id).sort()).toEqual(['r-front', 'r-party', 'r-seat', 'role-cm']);
  });
});

describe('publishing needs a pitch', () => {
  const base: Candidacy = {
    id: 'c', userId: 'u', roleId: 'role-cm', pitch: null, published: false,
    confirmedPositions: [], createdAt: 0,
  };
  it('rejects a candidacy with no pitch', () => {
    expect(canPublishCandidacy(base)).toBe(false);
  });
  it('rejects an empty pitch', () => {
    expect(canPublishCandidacy({ ...base, pitch: { kind: 'post', content: '   ' } })).toBe(false);
  });
  it('accepts a video or written pitch', () => {
    expect(canPublishCandidacy({ ...base, pitch: { kind: 'video', content: 'https://x' } })).toBe(true);
    expect(canPublishCandidacy({ ...base, pitch: { kind: 'post', content: 'Vote for change' } })).toBe(true);
  });
});

describe('segments', () => {
  it('all includes everyone', () => {
    expect(userInSegment(mkUser(), 'all')).toBe(true);
  });
  it('members excludes independents', () => {
    expect(userInSegment(mkUser(), 'members')).toBe(false);
    expect(userInSegment(mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' }), 'members')).toBe(true);
  });
  it('verified only includes verified members', () => {
    expect(userInSegment(mkUser({ partyId: 'party-a', membershipStatus: 'self_declared' }), 'verified')).toBe(false);
    expect(userInSegment(mkUser({ partyId: 'party-a', membershipStatus: 'verified' }), 'verified')).toBe(true);
  });
});

describe('computeResults', () => {
  const poll = pollOf('role-cm');
  const cands: Candidacy[] = [
    { id: 'ca', userId: 'x', roleId: 'role-cm', pitch: null, published: true, confirmedPositions: [], createdAt: 0 },
    { id: 'cb', userId: 'y', roleId: 'role-cm', pitch: null, published: true, confirmedPositions: [], createdAt: 0 },
  ];

  it('hides a segment under 20 votes', () => {
    const users: User[] = [];
    const votes: Vote[] = [];
    for (let i = 0; i < 5; i++) {
      users.push(mkUser({ id: `u${i}` }));
      votes.push({ id: `v${i}`, userId: `u${i}`, pollId: poll.id, candidacyId: 'ca', createdAt: 0 });
    }
    const res = computeResults({ poll, votes, users, candidacies: cands, segment: 'all' });
    expect(res.total).toBe(5);
    expect(res.hidden).toBe(true);
  });

  it('shows results at the threshold and ranks by count', () => {
    const users: User[] = [];
    const votes: Vote[] = [];
    for (let i = 0; i < MIN_SEGMENT_VOTES; i++) {
      users.push(mkUser({ id: `u${i}` }));
      votes.push({
        id: `v${i}`, userId: `u${i}`, pollId: poll.id,
        candidacyId: i < 12 ? 'ca' : 'cb', createdAt: 0,
      });
    }
    const res = computeResults({ poll, votes, users, candidacies: cands, segment: 'all' });
    expect(res.hidden).toBe(false);
    expect(res.total).toBe(20);
    expect(res.ranked[0].candidacyId).toBe('ca');
    expect(res.ranked[0].count).toBe(12);
    expect(res.ranked[0].share).toBeCloseTo(0.6, 5);
  });

  it('filters votes by segment', () => {
    const users: User[] = [
      mkUser({ id: 'ind', membershipStatus: 'independent' }),
      mkUser({ id: 'mem', partyId: 'party-a', membershipStatus: 'self_declared' }),
      mkUser({ id: 'ver', partyId: 'party-a', membershipStatus: 'verified' }),
    ];
    const votes: Vote[] = users.map((u, i) => ({
      id: `v${i}`, userId: u.id, pollId: poll.id, candidacyId: 'ca', createdAt: 0,
    }));
    expect(computeResults({ poll, votes, users, candidacies: cands, segment: 'all' }).total).toBe(3);
    expect(computeResults({ poll, votes, users, candidacies: cands, segment: 'members' }).total).toBe(2);
    expect(computeResults({ poll, votes, users, candidacies: cands, segment: 'verified' }).total).toBe(1);
  });
});

describe('computeApproval', () => {
  const poll: Poll = { id: 'poll-appr', roleId: 'role-cm', type: 'approval', currentHolderName: 'X' };
  it('splits approve/disapprove and hides under threshold', () => {
    const users: User[] = [];
    const approvals: Approval[] = [];
    for (let i = 0; i < 10; i++) {
      users.push(mkUser({ id: `u${i}` }));
      approvals.push({ id: `a${i}`, userId: `u${i}`, pollId: poll.id, value: i < 6 ? 'approve' : 'disapprove', createdAt: 0 });
    }
    const res = computeApproval({ poll, approvals, users, segment: 'all' });
    expect(res.approve).toBe(6);
    expect(res.disapprove).toBe(4);
    expect(res.hidden).toBe(true); // only 10 < 20
  });
  it('computes approve share when visible', () => {
    const users: User[] = [];
    const approvals: Approval[] = [];
    for (let i = 0; i < 20; i++) {
      users.push(mkUser({ id: `u${i}` }));
      approvals.push({ id: `a${i}`, userId: `u${i}`, pollId: poll.id, value: i < 15 ? 'approve' : 'disapprove', createdAt: 0 });
    }
    const res = computeApproval({ poll, approvals, users, segment: 'all' });
    expect(res.hidden).toBe(false);
    expect(res.approveShare).toBeCloseTo(0.75, 5);
  });
});
