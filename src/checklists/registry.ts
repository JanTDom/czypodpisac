import { ContractType } from "../pipeline/schemas/stage02-classification";
import { LegalKnowledgeBase } from "../kb";
import { ContractChecklist, ChecklistItem } from "./types";
import { checklistUniwersalna } from "./uniwersalna";
import { checklistNajemLokaluMieszkalnego } from "./najem-lokalu-mieszkalnego";
import { checklistNajemOkazjonalny } from "./najem-okazjonalny";
import { checklistNajemInstytucjonalny } from "./najem-instytucjonalny";
import { checklistNajemLokaluUzytkowego } from "./najem-lokalu-uzytkowego";

export class ChecklistRegistry {
  private static instance: ChecklistRegistry | null = null;
  private checklists: Map<ContractType, ContractChecklist> = new Map();
  private universalChecklist: ContractChecklist = checklistUniwersalna;

  constructor() {
    this.registerDefaults();
  }

  public static getInstance(): ChecklistRegistry {
    if (!ChecklistRegistry.instance) {
      ChecklistRegistry.instance = new ChecklistRegistry();
    }
    return ChecklistRegistry.instance;
  }

  private registerDefaults(): void {
    this.checklists.set("najem_lokalu_mieszkalnego", checklistNajemLokaluMieszkalnego);
    this.checklists.set("najem_okazjonalny", checklistNajemOkazjonalny);
    this.checklists.set("najem_instytucjonalny", checklistNajemInstytucjonalny);
    this.checklists.set("najem_lokalu_uzytkowego", checklistNajemLokaluUzytkowego);
  }

  public getUniversalChecklist(): ContractChecklist {
    return this.universalChecklist;
  }

  /**
   * Zwraca efektywny zestaw punktów kontrolnych dla danego typu umowy:
   * Punkty uniwersalne (18 obszarów) + dedykowane punkty specyficzne dla typu umowy.
   */
  public getEffectiveChecklist(contractType: ContractType): ChecklistItem[] {
    const specific = this.getChecklist(contractType);
    const universalItems = this.universalChecklist.items;
    if (!specific) {
      return universalItems;
    }
    return [...universalItems, ...specific.items];
  }

  public registerChecklist(checklist: ContractChecklist): void {
    this.checklists.set(checklist.contractType, checklist);
  }

  public getChecklist(contractType: ContractType): ContractChecklist | undefined {
    return this.checklists.get(contractType);
  }

  public hasChecklist(contractType: ContractType): boolean {
    return this.checklists.has(contractType);
  }

  public getAllSupportedContractTypes(): ContractType[] {
    return Array.from(this.checklists.keys());
  }

  public getItemById(itemId: string): ChecklistItem | undefined {
    for (const checklist of this.checklists.values()) {
      const found = checklist.items.find((it) => it.id === itemId);
      if (found) return found;
    }
    return undefined;
  }

  /**
   * Deterministyczna walidacja grounding checklisty:
   * Sprawdza, czy 100% identyfikatorów źródeł przypisanych do każdego punktu checklisty
   * faktycznie istnieje w legal-kb/ i ma status 'active'.
   */
  public validateChecklistGrounding(
    checklist: ContractChecklist,
    kb: LegalKnowledgeBase
  ): { valid: boolean; missingSourceIds: string[] } {
    const missing: string[] = [];

    for (const item of checklist.items) {
      for (const sourceId of item.kbSourceIds) {
        if (!kb.hasValidSource(sourceId)) {
          missing.push(`${item.id} -> brak aktywnego źródła w legal-kb: ${sourceId}`);
        }
      }
    }

    return {
      valid: missing.length === 0,
      missingSourceIds: missing,
    };
  }
}
