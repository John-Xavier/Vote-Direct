// All user-facing English strings live here so a Malayalam translation
// (ml.ts) can be added later with the same shape.

export const en = {
  appName: 'VoteDirect',
  tagline: 'Member opinion, direct from the people.',
  demoBadge: 'Demo · sample data',
  notScientific: 'Member opinion, not a scientific poll.',
  hiddenUntil: 'Hidden until 20 votes',
  live: 'Live',

  nav: {
    ballot: 'My Ballot',
    approvals: 'Approval Ratings',
    becomeCandidate: 'Become a Candidate',
    profile: 'My Profile',
    adminPanel: 'Party Admin',
    coalition: 'Coalition Admin',
    home: 'Home',
  },

  landing: {
    heroTitle: 'A voting platform for party members and independents',
    heroSubtitle:
      'Declare where you stand, vote on who should hold each role, and watch a living approval rating — all in the open.',
    tryDemo: 'Try the demo',
    howItWorks: 'How it works',
    step1Title: '1. Sign up',
    step1Body:
      'Register with a phone number, pick your assembly constituency, and choose a party or stay independent.',
    step2Title: '2. Vote on roles',
    step2Body:
      'Vote for the people you want in political and party roles. Change your vote any time — results are a live approval rating.',
    step3Title: '3. See the results',
    step3Body:
      'Public results split into all voters, party members, and verified members. Small segments stay hidden until 20 votes.',
    forParties: 'For parties',
    forPartiesBody:
      'Parties pay for an admin panel to verify members and assign positions. Admins only ever see aggregates — never how anyone voted.',
  },

  signup: {
    title: 'Create your account',
    phoneStep: 'Your phone number',
    phoneHelp: 'We simulate an OTP for this demo — any 6 digits work.',
    phoneLabel: 'Phone number',
    sendOtp: 'Send code',
    otpStep: 'Enter the 6-digit code',
    otpHelp: 'Demo: type any 6 digits.',
    otpLabel: 'Verification code',
    verify: 'Verify',
    constituencyStep: 'Your assembly constituency',
    constituencyHelp: 'Search and pick the constituency where you are registered.',
    searchPlaceholder: 'Search constituency…',
    partyStep: 'Party or independent',
    partyHelp: 'Choose a party to declare membership, or stay independent.',
    independent: 'Stay independent',
    profileStep: 'Your profile',
    name: 'Full name',
    profession: 'Profession',
    education: 'Education',
    description: 'About you',
    achievements: 'Achievements',
    finish: 'Finish and enter demo',
    next: 'Next',
    back: 'Back',
  },

  ballot: {
    title: 'My Ballot',
    subtitle: 'Every poll you can vote in, and the ones you can only view.',
    canVote: 'You can vote',
    voted: 'Voted',
    notVoted: 'Not voted',
    viewOnly: 'View only',
    whyBlocked: 'Why can’t I vote here?',
    noPolls: 'No polls to show for this persona yet.',
    openPolls: 'Open to everyone',
    frontPolls: 'Coalition (front) polls',
    partyPolls: 'Party roles',
    seatPolls: 'Constituency candidates',
  },

  poll: {
    totalVotes: 'total votes',
    yourVote: 'Your vote',
    vote: 'Vote',
    changeVote: 'Change vote',
    voteRecorded: 'Vote recorded',
    segAll: 'All voters',
    segMembers: 'Party members',
    segVerified: 'Verified members',
    viewProfile: 'View profile',
    blockedTitle: 'You can view this poll but not vote',
  },

  candidate: {
    pitch: 'Pitch',
    videoPitch: 'Video pitch',
    writtenPitch: 'Written pitch',
    videoPlaceholder: 'Video pitch (placeholder) — would play here in production',
    positions: 'Confirmed party positions',
    noPositions: 'No confirmed party positions yet.',
    results: 'Results by segment',
    trend: '12-week trend',
    profileDetails: 'Profile',
  },

  become: {
    title: 'Become a candidate',
    subtitle: 'Pick a role you are eligible for, then add a pitch. You can’t publish without a pitch.',
    pickRole: 'Pick an eligible role',
    noEligible: 'This persona is not eligible for any candidate role yet.',
    addPitch: 'Add your pitch',
    pitchKind: 'Pitch type',
    video: 'Video URL',
    post: 'Written post',
    videoUrlLabel: 'Paste a video URL',
    postLabel: 'Write your pitch',
    publish: 'Publish candidacy',
    needPitch: 'Add a pitch to publish.',
    published: 'Your candidacy is live.',
  },

  approvals: {
    title: 'Approval ratings',
    subtitle: 'Approve or disapprove of the people currently holding office.',
    approve: 'Approve',
    disapprove: 'Disapprove',
    yourRating: 'Your rating',
    approveShare: 'Approve',
  },

  profile: {
    title: 'My profile & settings',
    edit: 'Edit profile',
    save: 'Save changes',
    verification: 'Verification status',
    changeParty: 'Change party',
    changePartyWarn:
      'Changing party deletes all of your votes and blocks you from the new party’s polls for 90 days.',
    confirmChange: 'Yes, change my party',
    cancel: 'Cancel',
    statusIndependent: 'Independent',
    statusSelf: 'Self-declared member',
    statusVerified: 'Verified member',
    cooldownActive: 'Cooldown active',
  },

  admin: {
    title: 'Party Admin',
    aggregatesOnly:
      'You only ever see aggregates. VoteDirect never shows an admin how any individual voted.',
    queue: 'Verification queue',
    members: 'Members',
    positions: 'Positions',
    results: 'Aggregate results',
    coalition: 'Coalition admin',
    audit: 'Audit log',
    billing: 'Billing',
    approve: 'Approve',
    reject: 'Reject',
    reAdd: 'Re-add',
    filterConstituency: 'Filter by constituency',
    all: 'All',
    assign: 'Assign position',
    remove: 'Remove',
    appoint: 'Appoint coalition admin',
    appointed: 'Coalition admin',
    when: 'When',
    who: 'Admin',
    action: 'Action',
    target: 'Member',
    detail: 'Detail',
  },

  coalitionAdmin: {
    title: 'Coalition Admin',
    subtitle: 'Manage this front’s CM candidate poll.',
    onlyFront: 'Only members of this front’s parties can vote in this poll.',
  },

  demo: {
    title: 'Demo panel',
    persona: 'Persona',
    advance: 'Advance 90 days',
    simulate: 'Simulate live activity',
    simulateOn: 'Live activity on',
    reset: 'Reset demo data',
    clock: 'Demo clock',
    personaIndependent: 'Independent',
    personaSelfA: 'CPI(M) — self-declared',
    personaVerifiedA: 'CPI(M) — verified',
    personaVerifiedB: 'CPI — verified',
    personaAdminA: 'CPI(M) — admin',
    personaCoadmin1: 'LDF — coalition admin',
  },

  footer: {
    note: 'Demo · sample data · no real backend, login or SMS.',
  },
};

export type Strings = typeof en;
