// Read-only derived helpers over DemoData, shared by pages.
import type { Candidacy, DemoData, Poll, Role, User } from '../data/types';

export const roleOfPoll = (data: DemoData, poll: Poll): Role =>
  data.roles.find((r) => r.id === poll.roleId)!;

export const candidacyById = (data: DemoData, id: string): Candidacy | undefined =>
  data.candidacies.find((c) => c.id === id);

export const userById = (data: DemoData, id: string): User | undefined =>
  data.users.find((u) => u.id === id);

export const constituencyName = (data: DemoData, id: string): string =>
  data.constituencies.find((c) => c.id === id)?.name ?? '—';

export const partyName = (data: DemoData, id: string | null): string =>
  id ? data.parties.find((p) => p.id === id)?.name ?? '—' : 'Independent';

export const candidaciesForRole = (data: DemoData, roleId: string): Candidacy[] =>
  data.candidacies.filter((c) => c.roleId === roleId && c.published);

export const userVoteInPoll = (data: DemoData, userId: string, pollId: string) =>
  data.votes.find((v) => v.userId === userId && v.pollId === pollId);

export const userApprovalInPoll = (data: DemoData, userId: string, pollId: string) =>
  data.approvals.find((a) => a.userId === userId && a.pollId === pollId);

export const totalVotesInPoll = (data: DemoData, pollId: string): number =>
  data.votes.filter((v) => v.pollId === pollId).length;

/** "who should hold" polls that have at least one published candidate. */
export const activeWhoPolls = (data: DemoData): Poll[] =>
  data.polls.filter(
    (p) => p.type === 'who_should_hold' && candidaciesForRole(data, p.roleId).length > 0,
  );
