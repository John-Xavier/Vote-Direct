import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ApprovalValue,
  Candidacy,
  DemoData,
  Pitch,
  User,
} from '../data/types';
import { buildSeedData, SEED_NOW } from '../data/seed';
import {
  canVoteInPoll,
  makeCooldown,
} from '../lib/rules';

// Bump this when the seed shape/labels change so existing browsers re-seed
// instead of showing stale persisted data.
const STORAGE_KEY = 'votedirect-demo-v2';

export interface NewUserInput {
  phone: string;
  name: string;
  profession: string;
  education: string;
  description: string;
  achievements: string;
  constituencyId: string;
  partyId: string | null;
}

interface StoreState {
  data: DemoData;
  currentUserId: string;
  simulateLive: boolean;

  // derived time
  now: () => number;
  currentUser: () => User | undefined;

  // demo controls
  setPersona: (userId: string) => void;
  advance90Days: () => void;
  toggleSimulateLive: () => void;
  tickLiveActivity: () => void;
  reset: () => void;

  // auth / profile
  signup: (input: NewUserInput) => string;
  updateProfile: (patch: Partial<User>) => void;
  changeParty: (newPartyId: string | null) => void;

  // voting
  castVote: (pollId: string, candidacyId: string) => void;
  castApproval: (pollId: string, value: ApprovalValue) => void;

  // candidacy
  becomeCandidate: (roleId: string, pitch: Pitch) => void;

  // admin
  adminVerify: (userId: string) => void;
  adminReject: (userId: string) => void;
  adminReAdd: (userId: string) => void;
  assignPosition: (userId: string, position: string) => void;
  removePosition: (userId: string, position: string) => void;
  appointCoalitionAdmin: (userId: string) => void;
}

let idCounter = Date.now();
const uid = (prefix: string) => `${prefix}-${(idCounter++).toString(36)}`;

function purgeIneligibleVotes(data: DemoData, userId: string, now: number) {
  const user = data.users.find((u) => u.id === userId);
  if (!user) return;
  data.votes = data.votes.filter((v) => {
    if (v.userId !== userId) return true;
    const poll = data.polls.find((p) => p.id === v.pollId);
    if (!poll) return false;
    const role = data.roles.find((r) => r.id === poll.roleId);
    if (!role) return false;
    return canVoteInPoll({ user, role, poll, fronts: data.fronts, now }).eligible;
  });
}

function logAudit(
  data: DemoData,
  partyId: string,
  adminName: string,
  action: DemoData['auditLog'][number]['action'],
  targetUserName: string,
  detail: string,
  now: number,
) {
  data.auditLog.unshift({
    id: uid('audit'),
    partyId,
    adminName,
    action,
    targetUserName,
    detail,
    createdAt: now,
  });
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      data: buildSeedData(),
      currentUserId: 'persona-independent',
      simulateLive: false,

      now: () => SEED_NOW + get().data.clockOffsetMs,
      currentUser: () =>
        get().data.users.find((u) => u.id === get().currentUserId),

      setPersona: (userId) => set({ currentUserId: userId }),

      advance90Days: () =>
        set((s) => ({
          data: { ...s.data, clockOffsetMs: s.data.clockOffsetMs + 90 * 24 * 60 * 60 * 1000 },
        })),

      toggleSimulateLive: () => set((s) => ({ simulateLive: !s.simulateLive })),

      tickLiveActivity: () =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          // Add a few random valid votes to who_should_hold polls.
          const whoPolls = data.polls.filter((p) => p.type === 'who_should_hold');
          const rounds = 2 + Math.floor(Math.random() * 3);
          for (let i = 0; i < rounds; i++) {
            const poll = whoPolls[Math.floor(Math.random() * whoPolls.length)];
            if (!poll) continue;
            const role = data.roles.find((r) => r.id === poll.roleId)!;
            const cands = data.candidacies.filter(
              (c) => c.roleId === role.id && c.published,
            );
            if (cands.length === 0) continue;
            const eligible = data.users.filter(
              (u) => canVoteInPoll({ user: u, role, poll, fronts: data.fronts, now }).eligible,
            );
            if (eligible.length === 0) continue;
            const voter = eligible[Math.floor(Math.random() * eligible.length)];
            const cand = cands[Math.floor(Math.random() * cands.length)];
            // one vote per user per poll
            data.votes = data.votes.filter(
              (v) => !(v.userId === voter.id && v.pollId === poll.id),
            );
            data.votes.push({
              id: uid('vote'),
              userId: voter.id,
              pollId: poll.id,
              candidacyId: cand.id,
              createdAt: now,
            });
          }
          return { data };
        }),

      reset: () =>
        set({
          data: buildSeedData(),
          currentUserId: 'persona-independent',
          simulateLive: false,
        }),

      signup: (input) => {
        const id = uid('user');
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const user: User = {
            id,
            phone: input.phone,
            name: input.name,
            profession: input.profession,
            education: input.education,
            description: input.description,
            achievements: input.achievements,
            constituencyId: input.constituencyId,
            partyId: input.partyId,
            membershipStatus: input.partyId ? 'self_declared' : 'independent',
            role: 'voter',
            adminOfPartyId: null,
            adminOfFrontId: null,
            joinedPartyAt: input.partyId ? now : null,
            cooldowns: [],
            createdAt: now,
          };
          data.users.push(user);
          return { data, currentUserId: id };
        });
        return id;
      },

      updateProfile: (patch) =>
        set((s) => {
          const data = structuredClone(s.data);
          const u = data.users.find((x) => x.id === s.currentUserId);
          if (u) Object.assign(u, patch);
          return { data };
        }),

      changeParty: (newPartyId) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const u = data.users.find((x) => x.id === s.currentUserId);
          if (!u) return {};
          // All votes and approvals are deleted on a party change.
          data.votes = data.votes.filter((v) => v.userId !== u.id);
          data.approvals = data.approvals.filter((a) => a.userId !== u.id);
          u.partyId = newPartyId;
          u.membershipStatus = newPartyId ? 'self_declared' : 'independent';
          u.joinedPartyAt = newPartyId ? now : null;
          if (newPartyId) {
            // Cannot vote in the new party's polls for 90 days.
            u.cooldowns = [
              ...u.cooldowns.filter((c) => c.partyId !== newPartyId),
              makeCooldown(newPartyId, 'party_change', now),
            ];
          }
          return { data };
        }),

      castVote: (pollId, candidacyId) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const u = data.users.find((x) => x.id === s.currentUserId);
          if (!u) return {};
          const poll = data.polls.find((p) => p.id === pollId);
          if (!poll) return {};
          const role = data.roles.find((r) => r.id === poll.roleId)!;
          if (!canVoteInPoll({ user: u, role, poll, fronts: data.fronts, now }).eligible)
            return {};
          data.votes = data.votes.filter(
            (v) => !(v.userId === u.id && v.pollId === pollId),
          );
          data.votes.push({
            id: uid('vote'),
            userId: u.id,
            pollId,
            candidacyId,
            createdAt: now,
          });
          return { data };
        }),

      castApproval: (pollId, value) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const u = data.users.find((x) => x.id === s.currentUserId);
          if (!u) return {};
          data.approvals = data.approvals.filter(
            (a) => !(a.userId === u.id && a.pollId === pollId),
          );
          data.approvals.push({
            id: uid('appr'),
            userId: u.id,
            pollId,
            value,
            createdAt: now,
          });
          return { data };
        }),

      becomeCandidate: (roleId, pitch) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const u = data.users.find((x) => x.id === s.currentUserId);
          if (!u) return {};
          const existing = data.candidacies.find(
            (c) => c.userId === u.id && c.roleId === roleId,
          );
          if (existing) {
            existing.pitch = pitch;
            existing.published = true;
          } else {
            const c: Candidacy = {
              id: uid('cand'),
              userId: u.id,
              roleId,
              pitch,
              published: true,
              confirmedPositions: [],
              createdAt: now,
            };
            data.candidacies.push(c);
          }
          return { data };
        }),

      adminVerify: (userId) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const admin = data.users.find((x) => x.id === s.currentUserId);
          const target = data.users.find((x) => x.id === userId);
          if (!admin?.adminOfPartyId || !target) return {};
          if (target.partyId !== admin.adminOfPartyId) return {};
          target.membershipStatus = 'verified';
          logAudit(data, admin.adminOfPartyId, admin.name, 'verify', target.name,
            'Verified as a member.', now);
          return { data };
        }),

      adminReject: (userId) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const admin = data.users.find((x) => x.id === s.currentUserId);
          const target = data.users.find((x) => x.id === userId);
          if (!admin?.adminOfPartyId || !target) return {};
          const partyId = admin.adminOfPartyId;
          if (target.partyId !== partyId) return {};
          // Becomes independent; cannot rejoin for 90 days unless manually re-added.
          target.partyId = null;
          target.membershipStatus = 'independent';
          target.joinedPartyAt = null;
          target.cooldowns = [
            ...target.cooldowns.filter((c) => c.partyId !== partyId),
            makeCooldown(partyId, 'rejected', now),
          ];
          purgeIneligibleVotes(data, target.id, now);
          logAudit(data, partyId, admin.name, 'reject', target.name,
            'Rejected; moved to independent.', now);
          return { data };
        }),

      adminReAdd: (userId) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const admin = data.users.find((x) => x.id === s.currentUserId);
          const target = data.users.find((x) => x.id === userId);
          if (!admin?.adminOfPartyId || !target) return {};
          const partyId = admin.adminOfPartyId;
          // Manual re-add clears the cooldown and restores self-declared membership.
          target.partyId = partyId;
          target.membershipStatus = 'self_declared';
          target.joinedPartyAt = now;
          target.cooldowns = target.cooldowns.filter((c) => c.partyId !== partyId);
          logAudit(data, partyId, admin.name, 'member_readded', target.name,
            'Re-added to the party by admin.', now);
          return { data };
        }),

      assignPosition: (userId, position) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const admin = data.users.find((x) => x.id === s.currentUserId);
          const target = data.users.find((x) => x.id === userId);
          if (!admin?.adminOfPartyId || !target) return {};
          // Positions are stored on the member's party candidacy record, or a
          // lightweight "position holder" candidacy if none exists.
          let cand = data.candidacies.find(
            (c) => c.userId === userId && data.roles.find((r) => r.id === c.roleId)?.partyId === admin.adminOfPartyId,
          );
          if (!cand) {
            const anyRole = data.roles.find(
              (r) => r.partyId === admin.adminOfPartyId && r.internal,
            );
            cand = {
              id: uid('cand'),
              userId,
              roleId: anyRole ? anyRole.id : 'role-cm',
              pitch: null,
              published: false,
              confirmedPositions: [],
              createdAt: now,
            };
            data.candidacies.push(cand);
          }
          if (!cand.confirmedPositions.includes(position))
            cand.confirmedPositions.push(position);
          logAudit(data, admin.adminOfPartyId, admin.name, 'position_assigned',
            target.name, `Assigned position: ${position}.`, now);
          return { data };
        }),

      removePosition: (userId, position) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const admin = data.users.find((x) => x.id === s.currentUserId);
          const target = data.users.find((x) => x.id === userId);
          if (!admin?.adminOfPartyId || !target) return {};
          for (const c of data.candidacies) {
            if (c.userId === userId) {
              c.confirmedPositions = c.confirmedPositions.filter((p) => p !== position);
            }
          }
          logAudit(data, admin.adminOfPartyId, admin.name, 'position_removed',
            target.name, `Removed position: ${position}.`, now);
          return { data };
        }),

      appointCoalitionAdmin: (userId) =>
        set((s) => {
          const data = structuredClone(s.data);
          const now = SEED_NOW + data.clockOffsetMs;
          const admin = data.users.find((x) => x.id === s.currentUserId);
          const target = data.users.find((x) => x.id === userId);
          if (!admin?.adminOfPartyId || !target) return {};
          const front = data.fronts.find((f) => f.partyIds.includes(admin.adminOfPartyId!));
          if (!front) return {};
          // clear previous coalition admin flag
          for (const u of data.users) {
            if (u.adminOfFrontId === front.id && u.id !== userId) {
              u.adminOfFrontId = null;
              if (u.role === 'coalition_admin') u.role = 'voter';
            }
          }
          front.coalitionAdminUserId = userId;
          target.adminOfFrontId = front.id;
          target.role = 'coalition_admin';
          logAudit(data, admin.adminOfPartyId, admin.name, 'coalition_admin_appointed',
            target.name, `Appointed as ${front.name} coalition admin.`, now);
          return { data };
        }),
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        data: s.data,
        currentUserId: s.currentUserId,
        simulateLive: s.simulateLive,
      }),
    },
  ),
);
