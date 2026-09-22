import { Injectable, computed, inject } from '@angular/core';
import { ModuleTrimestrielService } from '../../features/Organisations/Modules-treimestriels/services/module-trimestriel.service';
import { BilanAnnuelService } from '../../features/Evaluations/bilan-annuel/services/bilan-annuel.service';
import { AnneeCatecheseService } from './annee-catechese.service';

export interface LockCheckOptions {
  moduleId?: string | number | null;
  periode?: string | any;
  date?: string | null;
  annee?: string | null;
  classe?: string | null;
  classeId?: string | number | null;
}

@Injectable({
  providedIn: 'root'
})
export class CloturePeriodeService {
  private readonly moduleService = inject(ModuleTrimestrielService);
  private readonly bilanService = inject(BilanAnnuelService);
  private readonly anneeService = inject(AnneeCatecheseService);

  public static readonly LOCK_MESSAGE = "Aucune modification n'est à effectuer car le bilan est déjà validé.";
  public readonly LOCK_MESSAGE = CloturePeriodeService.LOCK_MESSAGE;

  public readonly modules = this.moduleService.modules;
  public readonly validatedBilans = this.bilanService.validatedBilans;
  public readonly activeAnnee = this.anneeService.activeAnnee;

  /**
   * Vérifie si un trimestre (module trimestriel) est terminé ou clôturé.
   */
  public isTrimestreTermine(moduleIdOrPeriode?: string | number | any, dateStr?: string | null): boolean {
    const mods = this.modules();
    if (!mods || mods.length === 0) return false;

    // 1. Recherche par identifiant ou libellé de module
    if (moduleIdOrPeriode) {
      const searchStr = typeof moduleIdOrPeriode === 'object'
        ? String(moduleIdOrPeriode?.id || moduleIdOrPeriode?.libelle || moduleIdOrPeriode?.nom || '')
        : String(moduleIdOrPeriode);
      const clean = searchStr.trim().toLowerCase();
      const matched = mods.find(m => {
        if (String(m.id) === searchStr) return true;
        const lib = (m.libelle || m.nom || '').trim().toLowerCase();
        if (lib === clean) return true;
        // Correspondance sur numéro (ex: 'Trimestre 1' -> '1')
        if (clean.includes('1') && (lib.includes('1') || lib.includes('premier') || lib.includes('1er'))) return true;
        if (clean.includes('2') && (lib.includes('2') || lib.includes('deuxième') || lib.includes('2ème') || lib.includes('2eme'))) return true;
        if (clean.includes('3') && (lib.includes('3') || lib.includes('troisième') || lib.includes('3ème') || lib.includes('3eme'))) return true;
        return false;
      });

      if (matched) {
        const st = (matched.statut || '').trim().toLowerCase();
        if (st === 'termine' || st === 'terminé' || st === 'cloture' || st === 'cloturé' || st === 'clos') {
          return true;
        }
      }
    }

    // 2. Recherche par date (si la date tombe dans un module trimestriel terminé)
    if (dateStr) {
      const d = dateStr.substring(0, 10);
      const matchedByDate = mods.find(m => {
        if (!m.date_debut || !m.date_fin) return false;
        const start = m.date_debut.substring(0, 10);
        const end = m.date_fin.substring(0, 10);
        return d >= start && d <= end;
      });

      if (matchedByDate) {
        const st = (matchedByDate.statut || '').trim().toLowerCase();
        if (st === 'termine' || st === 'terminé' || st === 'cloture' || st === 'cloturé' || st === 'clos') {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Vérifie si le bilan annuel / trimestriel de la classe est validé.
   */
  public isBilanValide(annee?: string | null, classe?: string | null, classeId?: string | number | null): boolean {
    const valMap = this.validatedBilans();
    const currentAnnee = annee || this.activeAnnee()?.libelle || '';

    if (!currentAnnee) return false;

    // Vérification par clé annee_classe
    if (classe) {
      const key = `${currentAnnee}_${classe}`;
      if (valMap[key]) return true;
    }

    if (classeId !== undefined && classeId !== null) {
      const keyId = `${currentAnnee}_${classeId}`;
      if (valMap[keyId]) return true;
    }

    // Vérification partielle dans les clés
    if (classe || classeId) {
      const target = String(classe || classeId).trim().toLowerCase();
      for (const [k, isVal] of Object.entries(valMap)) {
        if (isVal && k.toLowerCase().includes(target)) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Vérification combinée : Trimestre terminé OU Bilan validé
   */
  public isLocked(options: LockCheckOptions): boolean {
    // 1. Vérifier si le trimestre/module est terminé
    if (this.isTrimestreTermine(options.moduleId || options.periode, options.date)) {
      return true;
    }

    // 2. Vérifier si le bilan de la classe est validé
    if (this.isBilanValide(options.annee, options.classe, options.classeId)) {
      return true;
    }

    return false;
  }

  /**
   * Message utilisateur officiel en cas de verrouillage
   */
  public getLockMessage(): string {
    return this.LOCK_MESSAGE;
  }
}
