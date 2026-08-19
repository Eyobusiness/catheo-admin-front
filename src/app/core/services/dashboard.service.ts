import { Injectable, signal } from '@angular/core';
import { CatechumeneItem, ModuleRoadmap, PastoralStat } from '../models/dashboard.model';

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  // KPI Statistics for Cathéo CIM
  public readonly stats = signal<PastoralStat[]>([
    {
      id: 'stat-catechumenes',
      title: 'Catéchumènes Inscrits',
      value: '342',
      change: '+18.5%',
      isPositive: true,
      period: 'Année 2026-2027',
      icon: 'users',
      color: 'primary'
    },
    {
      id: 'stat-preinscriptions',
      title: 'Préinscriptions',
      value: '48 en attente',
      change: '88% traités',
      isPositive: true,
      period: 'Campagne active',
      icon: 'activity',
      color: 'warning'
    },
    {
      id: 'stat-seances',
      title: 'Groupes & Séances',
      value: '14 Groupes',
      change: '96% assiduité',
      isPositive: true,
      period: 'Samedi & Dimanche',
      icon: 'clock',
      color: 'accent'
    },
    {
      id: 'stat-caisse',
      title: 'Caisse Catéchèse',
      value: '1 850 000 F',
      change: '+12.3%',
      isPositive: true,
      period: 'Versements reçus',
      icon: 'credit-card',
      color: 'success'
    }
  ]);

  // Roadmaps for Cathéo CIM modules
  public readonly roadmapModules = signal<ModuleRoadmap[]>([
    {
      id: 'mod-1',
      libelle: 'Catéchumènes & Dossiers',
      icon: 'bi-people',
      description: 'Gestion des fiches individuelles, filiations, antécédents sacramentels et certificats.',
      avancement: 85,
      statut: 'Presque prêt'
    },
    {
      id: 'mod-2',
      libelle: 'Séances & Feuilles de Présence',
      icon: 'bi-calendar-check',
      description: 'Pointage numérique des présences du week-end par groupe et suivi des absences.',
      avancement: 60,
      statut: 'En cours'
    },
    {
      id: 'mod-3',
      libelle: 'Évaluations, Notes & Bulletins',
      icon: 'bi-journal-text',
      description: 'Saisie des notes périodiques, moyennes de passage et édition des livrets paroissiaux.',
      avancement: 45,
      statut: 'En cours'
    },
    {
      id: 'mod-4',
      libelle: 'Sacrements (Baptême, Communion, Confirmation)',
      icon: 'bi-droplet-half',
      description: 'Gestion des scrutins, registres paroissiaux, parrains/marraines et célébrations.',
      avancement: 40,
      statut: 'En cours'
    },
    {
      id: 'mod-5',
      libelle: 'Finances, Caisse & Reçus',
      icon: 'bi-cash-coin',
      description: 'Suivi des cotisations annuelles, manuels de catéchèse et états de caisse.',
      avancement: 70,
      statut: 'En cours'
    },
    {
      id: 'mod-6',
      libelle: 'Communication & SMS Paroissiaux',
      icon: 'bi-chat-dots',
      description: 'Envoi d\'alertes SMS et notifications aux parents et catéchistes.',
      avancement: 30,
      statut: 'Planifié'
    }
  ]);

  // Sample Catechumenes for preview table
  public readonly sampleCatechumenes = signal<CatechumeneItem[]>([
    {
      id: 'CAT-2026-001',
      nom: 'Kouassi',
      prenoms: 'Emmanuel Jean-Marc',
      age: 11,
      genre: 'M',
      section: '3ème Année (Communion)',
      groupe: 'Groupe Sainte Thérèse',
      catechiste: 'Mme Brou Sylvie',
      statut: 'VALIDEE',
      cotisation: 'PAYE',
      sacrementVise: 'Première Communion'
    },
    {
      id: 'CAT-2026-002',
      nom: 'Aka',
      prenoms: 'Marie-Victoire',
      age: 8,
      genre: 'F',
      section: 'Éveil à la foi',
      groupe: 'Groupe Saint Jean',
      catechiste: 'M. Yao Patrice',
      statut: 'EN_ATTENTE',
      cotisation: 'PARTIEL',
      sacrementVise: 'Éveil'
    },
    {
      id: 'CAT-2026-003',
      nom: 'Diallo',
      prenoms: 'Christian Ange',
      age: 14,
      genre: 'M',
      section: '4ème Année (Confirmation)',
      groupe: 'Groupe Saint Michel',
      catechiste: 'Père Ferdinand K.',
      statut: 'VALIDEE',
      cotisation: 'PAYE',
      sacrementVise: 'Confirmation'
    },
    {
      id: 'CAT-2026-004',
      nom: 'Bamba',
      prenoms: 'Grace Emmanuelle',
      age: 10,
      genre: 'F',
      section: '2ème Année',
      groupe: 'Groupe Sainte Anne',
      catechiste: 'Mme Koné Nicole',
      statut: 'A_COMPLETER',
      cotisation: 'EN_ATTENTE',
      sacrementVise: 'Baptême'
    }
  ]);
}
