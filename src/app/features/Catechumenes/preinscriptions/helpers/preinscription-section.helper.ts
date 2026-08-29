import { Section } from '../../../Organisations/Sections/models/section.model';

export type PreinscriptionSectionProfile = 'enfant_primaire' | 'enfant_college' | 'jeune' | 'adulte' | 'standard';

function normalizeToken(value?: string | null): string {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase();
}

export function getPreinscriptionSectionProfile(section?: Pick<Section, 'code' | 'nom'> | null): PreinscriptionSectionProfile {
  if (!section) return 'standard';

  const code = normalizeToken(section.code);
  const nom = normalizeToken(section.nom);
  const full = `${code} ${nom}`;

  // 1. Enfant Collège
  if (full.includes('COLLEGE') || full.includes('COLLEGIEN')) {
    return 'enfant_college';
  }

  // 2. Enfant Primaire
  if (full.includes('PRIMAIRE') || full.includes('ELEMENTAIRE')) {
    return 'enfant_primaire';
  }

  // 3. Autres Enfants
  if (full.includes('ENFANT') || full.includes('ENFANCE') || code === 'E') {
    return 'enfant_primaire';
  }

  // 4. Jeunes
  if (full.includes('JEUNE') || full.includes('ADO') || full.includes('LYCEE') || code === 'J') {
    return 'jeune';
  }

  // 5. Adultes
  if (full.includes('ADULTE') || full.includes('AINE') || code === 'A') {
    return 'adulte';
  }

  return 'standard';
}

export function isEnfantSection(section?: Pick<Section, 'code' | 'nom'> | null): boolean {
  const profile = getPreinscriptionSectionProfile(section);
  return profile === 'enfant_primaire' || profile === 'enfant_college';
}

export function isEnfantPrimaire(section?: Pick<Section, 'code' | 'nom'> | null): boolean {
  return getPreinscriptionSectionProfile(section) === 'enfant_primaire';
}

export function isEnfantCollege(section?: Pick<Section, 'code' | 'nom'> | null): boolean {
  return getPreinscriptionSectionProfile(section) === 'enfant_college';
}

export function isJeuneSection(section?: Pick<Section, 'code' | 'nom'> | null): boolean {
  return getPreinscriptionSectionProfile(section) === 'jeune';
}

export function isAdulteSection(section?: Pick<Section, 'code' | 'nom'> | null): boolean {
  return getPreinscriptionSectionProfile(section) === 'adulte';
}
