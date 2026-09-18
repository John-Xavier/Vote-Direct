// Data model kept close to what a real backend would use.

export type MembershipStatus = 'independent' | 'self_declared' | 'verified';
export type UserRole = 'voter' | 'party_admin' | 'coalition_admin';

/** A coalition / front that groups several parties. */
export interface Front {
  id: string;
  name: string;
  partyIds: string[];
  /** User id of the coalition admin who runs this front's CM candidate poll. */
  coalitionAdminUserId: string | null;
}

export interface Party {
  id: string;
  name: string;
  frontId: string;
  /** User id of the party admin who runs this party's admin panel. */
  adminUserId: string | null;
}

export interface Constituency {
  id: string;
  name: string;
  district: string;
}

/**
 * A cooldown that blocks a user from voting in a party's polls until `until`.
 * Created on party change or admin rejection.
 */
export interface Cooldown {
  partyId: string;
  until: number; // epoch ms
  reason: 'party_change' | 'rejected';
}

export interface User {
  id: string;
  phone: string;
  name: string;
  profession: string;
  education: string;
  description: string;
  achievements: string;
  constituencyId: string;
  partyId: string | null;
  membershipStatus: MembershipStatus;
  role: UserRole;
  /** For party_admin: the party they administer. For coalition_admin: the front. */
  adminOfPartyId?: string | null;
  adminOfFrontId?: string | null;
  joinedPartyAt: number | null; // epoch ms
  cooldowns: Cooldown[];
  createdAt: number;
}

/** Scope determines who may vote and who may stand. */
export type RoleScope = 'everyone' | 'front' | 'party' | 'constituency';

/**
 * A political role people can be voted into.
 * - everyone: Chief Minister, Leader of Opposition (open to all)
 * - front: a coalition's CM candidate (front members only)
 * - party: internal party post (party members only)
 * - constituency: that party's candidate for one constituency (party members
 *   whose constituency matches)
 */
export interface Role {
  id: string;
  title: string;
  scope: RoleScope;
  frontId?: string; // for scope 'front'
  partyId?: string; // for scope 'party' and 'constituency'
  constituencyId?: string; // for scope 'constituency'
  /** Internal party posts (district secretary, youth wing president, etc.). */
  internal?: boolean;
}

export type PollType = 'who_should_hold' | 'approval';

export interface Poll {
  id: string;
  roleId: string;
  type: PollType;
  /** For approval polls: the name of the current office holder (placeholder). */
  currentHolderName?: string;
}

export type PitchKind = 'video' | 'post';

export interface Pitch {
  kind: PitchKind;
  /** For video: a URL. For post: the written text. */
  content: string;
}

/** A user standing for a role. Every published candidacy must have a pitch. */
export interface Candidacy {
  id: string;
  userId: string;
  roleId: string;
  pitch: Pitch | null;
  published: boolean;
  /** Party positions confirmed by the party admin, shown on the profile. */
  confirmedPositions: string[];
  createdAt: number;
}

export interface Vote {
  id: string;
  userId: string;
  pollId: string;
  candidacyId: string;
  createdAt: number;
}

export type ApprovalValue = 'approve' | 'disapprove';

export interface Approval {
  id: string;
  userId: string;
  pollId: string; // an approval-type poll
  value: ApprovalValue;
  createdAt: number;
}

export type AuditAction =
  | 'verify'
  | 'reject'
  | 'position_assigned'
  | 'position_removed'
  | 'coalition_admin_appointed'
  | 'member_readded';

export interface AuditLogEntry {
  id: string;
  partyId: string;
  adminName: string;
  action: AuditAction;
  targetUserName: string;
  detail: string;
  createdAt: number;
}

/** A point in the 12-week trend history for one candidacy in one segment. */
export interface TrendPoint {
  candidacyId: string;
  segment: Segment;
  week: number; // 0..11 (11 = most recent)
  share: number; // 0..1
}

export type Segment = 'all' | 'members' | 'verified';

/** The full persistable demo state. */
export interface DemoData {
  fronts: Front[];
  parties: Party[];
  constituencies: Constituency[];
  users: User[];
  roles: Role[];
  polls: Poll[];
  candidacies: Candidacy[];
  votes: Vote[];
  approvals: Approval[];
  auditLog: AuditLogEntry[];
  trends: TrendPoint[];
  /** Simulated "now". Advancing time bumps this forward. */
  clockOffsetMs: number;
}
