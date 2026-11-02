export type Opt = { value: string; label: string };
const o = (m: Record<string, string>): Opt[] => Object.entries(m).map(([value, label]) => ({ value, label }));

export const LOT_TYPE = { APARTMENT: 'Appartement', PARKING: 'Parking', CELLAR: 'Cave', COMMERCIAL: 'Local commercial', OTHER: 'Autre' };
export const EXPENSE_CAT = {
  MAINTENANCE: 'Entretien', CLEANING: 'Nettoyage', ELECTRICITY: 'Électricité', WATER: 'Eau', HEATING: 'Chauffage',
  INSURANCE: 'Assurance', ELEVATOR: 'Ascenseur', GARDEN: 'Espaces verts', FEES: 'Honoraires', OTHER: 'Autre',
};
export const INCIDENT_STATUS = { OPEN: 'Ouvert', IN_PROGRESS: 'En cours', RESOLVED: 'Résolu' };
export const PRIORITY = { LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute' };
export const DOC_CAT = { MINUTES: 'Procès-verbal', RULES: 'Règlement', CONTRACT: 'Contrat', BUDGET: 'Budget', OTHER: 'Autre' };
export const WORK_STATUS = { PLANNED: 'Planifié', IN_PROGRESS: 'En cours', DONE: 'Terminé' };
export const ASSEMBLY_STATUS = { PLANNED: 'Planifiée', OPEN: 'Vote ouvert', CLOSED: 'Clôturée' };
export const MAJORITY = { SIMPLE: 'Majorité simple', ABSOLUTE: 'Majorité absolue (plus de 50 % des tantièmes)', TWO_THIRDS: 'Deux tiers des voix exprimées', UNANIMITY: 'Unanimité' };
export const USER_STATUS = { PENDING: 'En attente', ACTIVE: 'Validé', REJECTED: 'Refusé' };

export const opts = { LOT_TYPE: o(LOT_TYPE), EXPENSE_CAT: o(EXPENSE_CAT), PRIORITY: o(PRIORITY), DOC_CAT: o(DOC_CAT), WORK_STATUS: o(WORK_STATUS), ASSEMBLY_STATUS: o(ASSEMBLY_STATUS), MAJORITY: o(MAJORITY), INCIDENT_STATUS: o(INCIDENT_STATUS) };

export function badgeClass(v: string): string {
  if (['PAID', 'ACTIVE', 'RESOLVED', 'DONE', 'OPEN_VOTE', 'LOW'].includes(v)) return 'badge badge--ok';
  if (['UNPAID', 'REJECTED', 'HIGH'].includes(v)) return 'badge badge--danger';
  if (['PENDING', 'IN_PROGRESS', 'MEDIUM', 'PLANNED'].includes(v)) return 'badge badge--warn';
  return 'badge badge--blue';
}
