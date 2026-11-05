import { Opt, opts, LOT_TYPE, EXPENSE_CAT, DOC_CAT, WORK_STATUS, ASSEMBLY_STATUS } from '../shared/labels';

export interface Col {
  key: string; label: string;
  type?: 'text' | 'money' | 'date' | 'datetime' | 'enum' | 'bool' | 'owner' | 'url' | 'number' | 'building';
  labels?: Record<string, string>;
}
export interface Field {
  key: string; label: string;
  type: 'text' | 'number' | 'date' | 'datetime' | 'select' | 'textarea' | 'checkbox' | 'owner' | 'building';
  options?: Opt[]; required?: boolean; step?: string; min?: string; half?: boolean; placeholder?: string;
}
export interface CrudConfig {
  title: string; subtitle: string; endpoint: string; addLabel: string; itemLabel: string;
  cols: Col[]; fields: Field[]; defaults: () => Record<string, any>;
  /** true : seul le syndic peut modifier (les copropriétaires consultent). */
  adminWrite: boolean; needsOwners?: boolean; rowLink?: string;
}

const today = () => new Date().toISOString().slice(0, 10);

export const CONFIGS: Record<string, CrudConfig> = {
  lots: {
    title: 'Lots & tantièmes', subtitle: 'Les lots de la copropriété et leur propriétaire', endpoint: '/admin/lots', addLabel: 'Ajouter un lot', itemLabel: 'ce lot',
    adminWrite: true, needsOwners: true,
    cols: [
      { key: 'buildingId', label: 'Bâtiment', type: 'building' },
      { key: 'number', label: 'N° lot' }, { key: 'building', label: 'Bloc / escalier' }, { key: 'floor', label: 'Étage', type: 'number' },
      { key: 'type', label: 'Type', type: 'enum', labels: LOT_TYPE }, { key: 'surface', label: 'Surface (m²)', type: 'number' },
      { key: 'tantiemes', label: 'Tantièmes', type: 'number' }, { key: 'ownerId', label: 'Propriétaire', type: 'owner' },
    ],
    fields: [
      { key: 'buildingId', label: 'Bâtiment', type: 'building', required: true },
      { key: 'number', label: 'Numéro du lot', type: 'text', required: true, half: true }, { key: 'building', label: 'Bloc / escalier', type: 'text', half: true },
      { key: 'floor', label: 'Étage', type: 'number', half: true, step: '1' }, { key: 'type', label: 'Type', type: 'select', options: opts.LOT_TYPE, required: true, half: true },
      { key: 'surface', label: 'Surface (m²)', type: 'number', step: '0.01', min: '0', half: true }, { key: 'tantiemes', label: 'Tantièmes', type: 'number', step: '1', min: '1', required: true, half: true },
      { key: 'ownerId', label: 'Copropriétaire', type: 'owner' },
    ],
    defaults: () => ({ buildingId: null, number: '', building: '', floor: null, type: 'APARTMENT', surface: null, tantiemes: 100, ownerId: null }),
  },
  expenses: {
    title: 'Dépenses', subtitle: 'Toutes les dépenses de la copropriété', endpoint: '/admin/expenses', addLabel: 'Ajouter une dépense', itemLabel: 'cette dépense',
    adminWrite: true,
    cols: [
      { key: 'buildingId', label: 'Bâtiment', type: 'building' },
      { key: 'expenseDate', label: 'Date', type: 'date' }, { key: 'label', label: 'Libellé' }, { key: 'category', label: 'Catégorie', type: 'enum', labels: EXPENSE_CAT },
      { key: 'supplier', label: 'Fournisseur' }, { key: 'amount', label: 'Montant', type: 'money' },
    ],
    fields: [
      { key: 'buildingId', label: 'Bâtiment (vide = général)', type: 'building' },
      { key: 'label', label: 'Libellé', type: 'text', required: true }, { key: 'category', label: 'Catégorie', type: 'select', options: opts.EXPENSE_CAT, required: true, half: true },
      { key: 'supplier', label: 'Fournisseur', type: 'text', half: true }, { key: 'amount', label: 'Montant (€)', type: 'number', step: '0.01', min: '0.01', required: true, half: true },
      { key: 'expenseDate', label: 'Date', type: 'date', required: true, half: true }, { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: () => ({ buildingId: null, label: '', category: 'MAINTENANCE', supplier: '', amount: null, expenseDate: today(), notes: '' }),
  },
  announcements: {
    title: 'Annonces', subtitle: 'Informations pour les résidents', endpoint: '/announcements', addLabel: 'Publier une annonce', itemLabel: 'cette annonce',
    adminWrite: true,
    cols: [{ key: 'buildingId', label: 'Bâtiment', type: 'building' }, { key: 'createdAt', label: 'Publiée le', type: 'date' }, { key: 'title', label: 'Titre' }, { key: 'important', label: 'Important', type: 'bool' }],
    fields: [
      { key: 'buildingId', label: 'Bâtiment (vide = général)', type: 'building' },
      { key: 'title', label: 'Titre', type: 'text', required: true }, { key: 'content', label: 'Message', type: 'textarea', required: true },
      { key: 'important', label: 'Marquer comme important', type: 'checkbox' },
    ],
    defaults: () => ({ buildingId: null, title: '', content: '', important: false }),
  },
  documents: {
    title: 'Documents', subtitle: 'Règlement, procès-verbaux, contrats et budgets', endpoint: '/documents', addLabel: 'Ajouter un document', itemLabel: 'ce document',
    adminWrite: true,
    cols: [{ key: 'buildingId', label: 'Bâtiment', type: 'building' }, { key: 'title', label: 'Titre' }, { key: 'category', label: 'Catégorie', type: 'enum', labels: DOC_CAT }, { key: 'createdAt', label: 'Ajouté le', type: 'date' }, { key: 'url', label: 'Lien', type: 'url' }],
    fields: [
      { key: 'buildingId', label: 'Bâtiment (vide = général)', type: 'building' },
      { key: 'title', label: 'Titre', type: 'text', required: true }, { key: 'category', label: 'Catégorie', type: 'select', options: opts.DOC_CAT, required: true },
      { key: 'url', label: 'Lien du document (Drive, Dropbox…)', type: 'text', placeholder: 'https://…' }, { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: () => ({ buildingId: null, title: '', category: 'OTHER', url: '', notes: '' }),
  },
  works: {
    title: 'Travaux', subtitle: 'Suivi des chantiers de la copropriété', endpoint: '/works', addLabel: 'Ajouter des travaux', itemLabel: 'ces travaux',
    adminWrite: true,
    cols: [
      { key: 'buildingId', label: 'Bâtiment', type: 'building' },
      { key: 'title', label: 'Travaux' }, { key: 'status', label: 'Statut', type: 'enum', labels: WORK_STATUS }, { key: 'supplier', label: 'Entreprise' },
      { key: 'budget', label: 'Budget', type: 'money' }, { key: 'startDate', label: 'Début', type: 'date' }, { key: 'endDate', label: 'Fin', type: 'date' },
    ],
    fields: [
      { key: 'buildingId', label: 'Bâtiment (vide = général)', type: 'building' },
      { key: 'title', label: 'Intitulé', type: 'text', required: true }, { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'status', label: 'Statut', type: 'select', options: opts.WORK_STATUS, required: true, half: true }, { key: 'supplier', label: 'Entreprise', type: 'text', half: true },
      { key: 'budget', label: 'Budget (€)', type: 'number', step: '0.01', min: '0', half: true }, { key: 'startDate', label: 'Début', type: 'date', half: true },
      { key: 'endDate', label: 'Fin prévue', type: 'date', half: true },
    ],
    defaults: () => ({ buildingId: null, title: '', description: '', status: 'PLANNED', supplier: '', budget: null, startDate: null, endDate: null }),
  },
  assemblies: {
    title: 'Assemblées & votes', subtitle: 'Assemblées générales et résolutions soumises au vote', endpoint: '/assemblies', addLabel: 'Convoquer une assemblée', itemLabel: 'cette assemblée',
    adminWrite: true, rowLink: '/app/assemblies',
    cols: [
      { key: 'buildingId', label: 'Bâtiment', type: 'building' },
      { key: 'meetingDate', label: 'Date', type: 'datetime' }, { key: 'title', label: 'Assemblée' }, { key: 'location', label: 'Lieu' },
      { key: 'status', label: 'Statut', type: 'enum', labels: ASSEMBLY_STATUS },
    ],
    fields: [
      { key: 'buildingId', label: 'Bâtiment (vide = général)', type: 'building' },
      { key: 'title', label: 'Titre', type: 'text', required: true }, { key: 'meetingDate', label: 'Date et heure', type: 'datetime', required: true, half: true },
      { key: 'location', label: 'Lieu', type: 'text', half: true }, { key: 'status', label: 'Statut', type: 'select', options: opts.ASSEMBLY_STATUS, required: true },
      { key: 'quorumPercent', label: 'Quorum exigé (% des tantièmes ayant voté, 0 = aucun)', type: 'number', step: '1', min: '0', half: true },
      { key: 'votingDeadline', label: 'Fermeture automatique du vote (facultatif)', type: 'datetime', half: true },
      { key: 'agenda', label: 'Ordre du jour', type: 'textarea' },
      { key: 'chairman', label: 'Président de séance (pour le procès-verbal)', type: 'text' },
      { key: 'minutesNote', label: 'Remarques pour le procès-verbal', type: 'textarea' },
    ],
    defaults: () => ({ buildingId: null, title: '', meetingDate: '', location: '', agenda: '', status: 'PLANNED', quorumPercent: 0, votingDeadline: null, chairman: '', minutesNote: '' }),
  },
  suppliers: {
    title: 'Fournisseurs & contrats', subtitle: 'Prestataires de la copropriété et échéances de contrat', endpoint: '/admin/suppliers', addLabel: 'Ajouter un fournisseur', itemLabel: 'ce fournisseur',
    adminWrite: true, rowLink: '/app/admin/suppliers',
    cols: [{ key: 'buildingId', label: 'Bâtiment', type: 'building' }, 
      { key: 'name', label: 'Société' }, { key: 'trade', label: 'Métier' }, { key: 'phone', label: 'Téléphone' },
      { key: 'annualCost', label: 'Coût annuel', type: 'money' }, { key: 'contractEnd', label: 'Fin de contrat', type: 'date' },
    ],
    fields: [
      { key: 'buildingId', label: 'Bâtiment (vide = général)', type: 'building' },
      { key: 'name', label: 'Société', type: 'text', required: true, half: true }, { key: 'trade', label: 'Métier (ascenseur, nettoyage…)', type: 'text', half: true },
      { key: 'contactName', label: 'Contact', type: 'text', half: true }, { key: 'phone', label: 'Téléphone', type: 'text', half: true },
      { key: 'email', label: 'E-mail', type: 'text' }, { key: 'annualCost', label: 'Coût annuel (€)', type: 'number', step: '0.01', min: '0', half: true },
      { key: 'contractStart', label: 'Début de contrat', type: 'date', half: true }, { key: 'contractEnd', label: 'Fin de contrat', type: 'date', half: true },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: () => ({ buildingId: null, name: '', trade: '', contactName: '', phone: '', email: '', annualCost: null, contractStart: null, contractEnd: null, notes: '' }),
  },
  budgets: {
    title: 'Budget prévisionnel', subtitle: 'Budget voté par année, comparé aux dépenses sur le tableau de bord', endpoint: '/admin/budgets', addLabel: 'Ajouter un budget', itemLabel: 'ce budget',
    adminWrite: true,
    cols: [{ key: 'buildingId', label: 'Bâtiment', type: 'building' }, { key: 'year', label: 'Année' }, { key: 'amount', label: 'Montant', type: 'money' }, { key: 'notes', label: 'Notes' }],
    fields: [
      { key: 'buildingId', label: 'Bâtiment (vide = général)', type: 'building' },
      { key: 'year', label: 'Année', type: 'number', step: '1', min: '2000', required: true, half: true },
      { key: 'amount', label: 'Montant (€)', type: 'number', step: '0.01', min: '0', required: true, half: true },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: () => ({ buildingId: null, year: new Date().getFullYear(), amount: null, notes: '' }),
  },
  buildings: {
    title: 'Bâtiments', subtitle: 'Les bâtiments / résidences gérés par le syndic', endpoint: '/admin/buildings', addLabel: 'Ajouter un bâtiment', itemLabel: 'ce bâtiment',
    adminWrite: true,
    cols: [{ key: 'name', label: 'Nom' }, { key: 'address', label: 'Adresse' }, { key: 'postalCode', label: 'Code postal' }, { key: 'city', label: 'Ville' }],
    fields: [
      { key: 'name', label: 'Nom du bâtiment', type: 'text', required: true }, { key: 'address', label: 'Adresse', type: 'text' },
      { key: 'postalCode', label: 'Code postal', type: 'text', half: true }, { key: 'city', label: 'Ville', type: 'text', half: true },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
    defaults: () => ({ name: '', address: '', postalCode: '', city: '', notes: '' }),
  },
};
