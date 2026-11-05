export type Role = 'ADMIN' | 'OWNER' | 'SUPER_ADMIN';
export type UserStatus = 'PENDING' | 'ACTIVE' | 'REJECTED';

export interface User {
  id: number; firstName: string; lastName: string; email: string; phone?: string; requestedLot?: string;
  role: Role; status: UserStatus; createdAt?: string; approvedAt?: string; agencyId?: number | null;
}
export interface AuthResponse {
  agency?: AgencyPublic | null; token: string; user: User; }
export interface Building { id?: number; name: string; address?: string; postalCode?: string; city?: string; notes?: string; }
export interface BuildingSummary { id: number; name: string; address?: string; city?: string; lots: number; totalTantiemes: number; owners: number; unpaidTotal: number; openIncidents: number; }
export interface Lot { id?: number; buildingId?: number | null; number: string; building?: string; floor?: number | null; type: string; surface?: number | null; tantiemes: number; ownerId?: number | null; }
export interface ChargeCall { id: number; buildingId?: number | null; title: string; totalAmount: number; dueDate: string; createdAt: string; }
export interface ChargeView {
  id: number; callId: number; callTitle: string; dueDate: string; lotId: number; lotNumber: string;
  ownerId: number; ownerName: string; amount: number; status: 'UNPAID' | 'PAID'; paidAt?: string;
}
export interface Incident {
  id: number; buildingId?: number | null; title: string; description?: string; location?: string; status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH'; reporterName?: string; adminComment?: string; createdAt: string; resolvedAt?: string;
}
export interface Assembly { id: number; quorumPercent?: number; votingDeadline?: string | null; title: string; meetingDate: string; location?: string; agenda?: string; status: 'PLANNED' | 'OPEN' | 'CLOSED'; }
export type Majority = 'SIMPLE' | 'ABSOLUTE' | 'TWO_THIRDS' | 'UNANIMITY';
export interface VoterView { ownerId: number; name: string; weight: number; choice: 'FOR' | 'AGAINST' | 'ABSTAIN'; }
export interface ResolutionView {
  id: number; title: string; description?: string; majority: Majority; forWeight: number; againstWeight: number; abstainWeight: number;
  votersCount: number; myVote: 'FOR' | 'AGAINST' | 'ABSTAIN' | null; result: 'PENDING' | 'ADOPTED' | 'REJECTED' | 'NO_QUORUM'; voters: VoterView[];
}
export interface PersonWeight { id: number; name: string; weight: number; }
export interface ProxyInfo { givenTo: PersonWeight | null; received: PersonWeight[]; maxReceived: number; }
export interface AssemblyView {
  assembly: Assembly; resolutions: ResolutionView[]; myWeight: number; ownWeight: number; canVote: boolean; votingOpen: boolean;
  totalWeight: number; votedWeight: number; quorumReached: boolean; proxy: ProxyInfo | null;
}
export interface Announcement { id: number; title: string; content: string; important: boolean; createdAt: string; }
export interface AdminDashboard {
  pendingUsers: number; activeOwners: number; lots: number; totalTantiemes: number; unpaidTotal: number; unpaidCount: number;
  openIncidents: number; expensesThisYear: number; budgetThisYear: number | null; highPriorityIncidents: number;
  recentExpenses: Expense[]; nextAssembly: Assembly | null; announcements: Announcement[];
}
export interface OwnerDashboard {
  firstName: string; dueTotal: number; unpaidCount: number; openIncidents: number; myTantiemes: number; lots: Lot[];
  nextAssembly: Assembly | null; announcements: Announcement[];
}

export interface Reservation {
  id: number; space: string; date: string; startTime: string; endTime: string; ownerId: number; ownerName: string;
  status: 'PENDING' | 'APPROVED' | 'REFUSED'; note?: string;
}
export interface ContactMessage {
  id: number; ownerId: number; ownerName: string; subject: string; content: string; reply?: string; createdAt: string; repliedAt?: string;
}

export interface Expense {
  id: number; label: string; category: string; supplier?: string; amount: number; expenseDate: string; notes?: string;
}

/** Marque publique d'une agence (nom, logo, couleurs). */
export interface AgencyPublic {
  id: number; slug: string; name: string; tagline: string | null; logoUrl: string | null;
  primaryColor: string | null; accentColor: string | null;
}
/** Ligne de la liste des agences (super administrateur). */
export interface AgencyRow extends AgencyPublic { active: boolean; buildings: number; owners: number; createdAt?: string; }
