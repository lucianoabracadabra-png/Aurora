// Sistema de Evolução de Dano de HP - Aurora RPG
// Regra Oficial: Vazio (none) > Simples (simple) > Letal (lethal) > Agravado (aggravated)
// Quando todas as caixas são preenchidas por dano, sofrer dano adicional evolui o tipo de dano:
// - Dano Simples evolui Simples para Letal (ou Letal para Agravado se não houver Simples)
// - Dano Letal evolui Simples para Letal (ou Letal para Agravado)
// - Dano Agravado substitui Simples ou Letal por Agravado até saturação final.

import { DamageType, BodyHealth } from '../types';

export const DAMAGE_HIERARCHY: Record<DamageType, number> = {
  none: 0,
  simple: 1,
  lethal: 2,
  aggravated: 3,
};

export const DAMAGE_LABELS: Record<DamageType, { label: string; color: string; desc: string }> = {
  none: { label: 'Vazio', color: 'text-white/40', desc: 'Caixa de vida íntegra e saudável' },
  simple: { label: 'Simples', color: 'text-blue-400', desc: 'Dano superficial, contusões e fadiga' },
  lethal: { label: 'Letal', color: 'text-orange-400', desc: 'Cortes profundos, perfurações e traumas' },
  aggravated: { label: 'Agravado', color: 'text-red-500', desc: 'Dano místico, necrose ou mutilação grave' },
};

export interface DamageEvolutionResult {
  nextSlots: DamageType[];
  applied: number;
  evolvedCount: number;
  isFullyAggravated: boolean;
  historySummary: string;
}

/**
 * Aplica dano a uma lista de caixas de uma parte do corpo com a evolução de dano.
 */
export function applyDamageWithEvolution(
  currentSlots: DamageType[],
  incomingType: DamageType,
  count: number = 1
): DamageEvolutionResult {
  if (count <= 0 || incomingType === 'none') {
    return {
      nextSlots: [...currentSlots],
      applied: 0,
      evolvedCount: 0,
      isFullyAggravated: currentSlots.every(s => s === 'aggravated'),
      historySummary: 'Nenhum dano aplicado'
    };
  }

  const slots = [...currentSlots];
  let applied = 0;
  let evolvedCount = 0;

  for (let c = 0; c < count; c++) {
    // 1. Caso: DANO AGRAVADO
    if (incomingType === 'aggravated') {
      // Procura primeiro espaço vazio
      const emptyIdx = slots.indexOf('none');
      if (emptyIdx !== -1) {
        slots[emptyIdx] = 'aggravated';
        applied++;
      } else {
        // Sem vazios: substitui o dano mais leve (simples primeiro, depois letal)
        const simpleIdx = slots.indexOf('simple');
        if (simpleIdx !== -1) {
          slots[simpleIdx] = 'aggravated';
          applied++;
          evolvedCount++;
        } else {
          const lethalIdx = slots.indexOf('lethal');
          if (lethalIdx !== -1) {
            slots[lethalIdx] = 'aggravated';
            applied++;
            evolvedCount++;
          } else {
            // Todos já são agravados
            break;
          }
        }
      }
    }
    // 2. Caso: DANO LETAL
    else if (incomingType === 'lethal') {
      // Procura primeiro espaço vazio
      const emptyIdx = slots.indexOf('none');
      if (emptyIdx !== -1) {
        slots[emptyIdx] = 'lethal';
        applied++;
      } else {
        // Sem vazios: evolui simples para letal
        const simpleIdx = slots.indexOf('simple');
        if (simpleIdx !== -1) {
          slots[simpleIdx] = 'lethal';
          applied++;
          evolvedCount++;
        } else {
          // Se não há mais simples e nem vazios, dano letal adicional transborda evoluindo letal para agravado!
          const lethalIdx = slots.indexOf('lethal');
          if (lethalIdx !== -1) {
            slots[lethalIdx] = 'aggravated';
            applied++;
            evolvedCount++;
          } else {
            // Todos já são agravados
            break;
          }
        }
      }
    }
    // 3. Caso: DANO SIMPLES
    else if (incomingType === 'simple') {
      // Procura primeiro espaço vazio
      const emptyIdx = slots.indexOf('none');
      if (emptyIdx !== -1) {
        slots[emptyIdx] = 'simple';
        applied++;
      } else {
        // Sem vazios: dano simples adicional evolui dano simples para letal!
        const simpleIdx = slots.indexOf('simple');
        if (simpleIdx !== -1) {
          slots[simpleIdx] = 'lethal';
          applied++;
          evolvedCount++;
        } else {
          // Se todas as caixas já são letal ou agravado, mais dano simples empurra letal para agravado!
          const lethalIdx = slots.indexOf('lethal');
          if (lethalIdx !== -1) {
            slots[lethalIdx] = 'aggravated';
            applied++;
            evolvedCount++;
          } else {
            // Todos já são agravados
            break;
          }
        }
      }
    }
  }

  const isFullyAggravated = slots.length > 0 && slots.every(s => s === 'aggravated');
  let historySummary = `${applied} dano(s) ${incomingType}`;
  if (evolvedCount > 0) {
    historySummary += ` (${evolvedCount} evoluído(s) por saturação)`;
  }

  return {
    nextSlots: slots,
    applied,
    evolvedCount,
    isFullyAggravated,
    historySummary
  };
}

/**
 * Retorna estatísticas consolidadas da vida do corpo inteiro.
 */
export function getBodyHealthStats(health?: BodyHealth) {
  if (!health) {
    return {
      totalSlots: 0,
      noneCount: 0,
      simpleCount: 0,
      lethalCount: 0,
      aggravatedCount: 0,
      healthPercent: 100,
      severelyInjuredCount: 0,
      isFullyAggravated: false,
    };
  }

  const parts = Object.values(health) as DamageType[][];
  let totalSlots = 0;
  let noneCount = 0;
  let simpleCount = 0;
  let lethalCount = 0;
  let aggravatedCount = 0;

  for (const list of parts) {
    if (Array.isArray(list)) {
      totalSlots += list.length;
      for (const val of list) {
        if (val === 'none') noneCount++;
        else if (val === 'simple') simpleCount++;
        else if (val === 'lethal') lethalCount++;
        else if (val === 'aggravated') aggravatedCount++;
      }
    }
  }

  const healthPercent = totalSlots > 0 ? Math.round((noneCount / totalSlots) * 100) : 100;
  const isFullyAggravated = totalSlots > 0 && aggravatedCount === totalSlots;

  return {
    totalSlots,
    noneCount,
    simpleCount,
    lethalCount,
    aggravatedCount,
    healthPercent,
    severelyInjuredCount: lethalCount + aggravatedCount,
    isFullyAggravated,
  };
}
