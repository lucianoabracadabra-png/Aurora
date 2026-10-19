import React, { useState } from 'react';
import { 
  Compass, 
  Sparkles, 
  Calculator, 
  Table, 
  CheckCircle2, 
  Layers, 
  Coins, 
  Heart, 
  Flame, 
  Shield, 
  Brain, 
  Users, 
  Activity,
  Zap,
  Info
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { CharacterData, FocusLevel, FocusDistributionType, FocusConfig } from '../types';
import { 
  FOCUS_LABELS, 
  FOCUS_PRESETS, 
  ATRIBUTOS_COST_TABLE, 
  PERICIAS_COST_TABLE,
  calculateSheetTotalExp,
  calculateDerivedMechanics
} from '../utils/expCalculations';

interface FocusExpModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterData: CharacterData;
  onUpdateFocusConfig: (newConfig: FocusConfig) => void;
  onUpdateExpBudget: (newBudget: { initial: number; campaign: number }) => void;
  readonly?: boolean;
}

export const FocusExpModal: React.FC<FocusExpModalProps> = ({
  isOpen,
  onClose,
  characterData,
  onUpdateFocusConfig,
  onUpdateExpBudget,
  readonly = false,
}) => {
  const [activeTab, setActiveTab] = useState<'config' | 'calculator' | 'tables'>('config');

  const currentFocus = characterData.focusConfig || {
    distribution: 'padrao',
    physical: 'F1',
    mental: 'F2',
    social: 'F3',
  };

  const expBudget = characterData.expBudget || {
    initial: 300,
    campaign: 0,
  };

  const expStats = calculateSheetTotalExp(characterData);
  const derived = calculateDerivedMechanics(characterData);

  const totalBudget = (expBudget.initial || 0) + (expBudget.campaign || 0);
  const remainingExp = totalBudget - expStats.totalSpent;

  // Handler para trocar distribuição pré-definida
  const handleSelectPreset = (dist: FocusDistributionType) => {
    if (readonly) return;
    if (dist === 'padrao') {
      onUpdateFocusConfig({
        distribution: 'padrao',
        physical: 'F1',
        mental: 'F2',
        social: 'F3',
      });
    } else if (dist === 'especializada') {
      onUpdateFocusConfig({
        distribution: 'especializada',
        physical: 'Fe',
        mental: 'F3',
        social: 'F3',
      });
    } else if (dist === 'generalista') {
      onUpdateFocusConfig({
        distribution: 'generalista',
        physical: 'F2',
        mental: 'F2',
        social: 'F2',
      });
    }
  };

  // Handler para alterar foco de um grupo específico mantendo regras de validação
  const handleChangeGroupFocus = (group: 'physical' | 'mental' | 'social', newFocus: FocusLevel) => {
    if (readonly) return;
    const current = { ...currentFocus };

    if (current.distribution === 'padrao') {
      // Padrão exige exatamente F1, F2 e F3 distribuídos entre os 3 grupos
      const allowed: FocusLevel[] = ['F1', 'F2', 'F3'];
      if (!allowed.includes(newFocus)) return;

      const otherGroups = (['physical', 'mental', 'social'] as const).filter(g => g !== group);
      const remainingPicks = allowed.filter(f => f !== newFocus);

      // Troca inteligente
      current[group] = newFocus;
      current[otherGroups[0]] = remainingPicks[0];
      current[otherGroups[1]] = remainingPicks[1];
    } else if (current.distribution === 'especializada') {
      // Especializada exige 1 Fe e 2 F3
      if (newFocus === 'Fe') {
        current.physical = 'F3';
        current.mental = 'F3';
        current.social = 'F3';
        current[group] = 'Fe';
      }
    } else if (current.distribution === 'generalista') {
      // Generalista exige todos F2
      current.physical = 'F2';
      current.mental = 'F2';
      current.social = 'F2';
    }

    onUpdateFocusConfig(current);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focos, Matrizes de Custo & EXP"
      subtitle="Distribuição de aptidão dos grupos, calculadora de pontos e mecânicas vitais"
      icon={<Compass size={20} />}
      theme="violet"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-white/40">Total de EXP Gasto:</span>
            <strong className="text-cyan-300 font-mono text-sm">{expStats.totalSpent} EXP</strong>
            <span className="text-white/20">|</span>
            <span className="text-white/40">Disponível:</span>
            <strong className={`font-mono text-sm ${remainingExp < 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {remainingExp} EXP
            </strong>
          </div>
          <Button theme="violet" size="sm" onClick={onClose}>
            Concluir
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('config')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'config'
                  ? 'bg-violet-500/25 border border-violet-400/50 text-violet-200 shadow-sm'
                  : 'bg-white/5 border border-transparent text-white/60 hover:text-white'
              }`}
            >
              <Compass size={14} />
              <span>1. Configuração de Focos</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('calculator')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'calculator'
                  ? 'bg-violet-500/25 border border-violet-400/50 text-violet-200 shadow-sm'
                  : 'bg-white/5 border border-transparent text-white/60 hover:text-white'
              }`}
            >
              <Calculator size={14} />
              <span>2. Orçamento & EXP</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tables')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'tables'
                  ? 'bg-violet-500/25 border border-violet-400/50 text-violet-200 shadow-sm'
                  : 'bg-white/5 border border-transparent text-white/60 hover:text-white'
              }`}
            >
              <Table size={14} />
              <span>3. Matrizes de Custo</span>
            </button>
          </div>
        </div>

        {/* TAB 1: CONFIGURAÇÃO DE FOCOS */}
        {activeTab === 'config' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* 3 Opções de Distribuição */}
            <div>
              <label className="text-xs font-bold text-white/80 uppercase tracking-wider block mb-2">
                Escolha a Distribuição dos Focos
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {FOCUS_PRESETS.map((preset) => {
                  const isSelected = currentFocus.distribution === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      disabled={readonly}
                      onClick={() => handleSelectPreset(preset.id)}
                      className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-violet-950/40 border-violet-400/80 shadow-[0_0_20px_rgba(168,85,247,0.3)] ring-1 ring-violet-400/50'
                          : 'bg-black/40 border-white/10 hover:border-white/25 hover:bg-white/[0.02]'
                      } ${readonly ? 'cursor-default' : ''}`}
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-bold text-xs text-white">
                            {preset.title}
                          </h4>
                          <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/10 text-cyan-300">
                            {preset.pattern}
                          </span>
                        </div>
                        <p className="text-[10px] text-violet-300 font-medium">
                          {preset.subtitle}
                        </p>
                        <p className="text-[11px] text-white/60 leading-relaxed mt-1">
                          {preset.description}
                        </p>
                      </div>

                      {isSelected && (
                        <div className="mt-2.5 flex items-center gap-1 text-[10px] text-violet-300 font-bold uppercase tracking-wider">
                          <CheckCircle2 size={12} className="text-violet-400" />
                          <span>Selecionado</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Atribuição por Grupo (Físico, Mental, Social) */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                  Alocação de Focos nos Grupos
                </span>
                <span className="text-[11px] text-white/50">
                  {readonly ? 'Modo de Leitura' : 'Clique para alternar o foco do grupo'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* 1. FÍSICO */}
                <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                      <Flame size={14} className="text-rose-400" />
                      Físico
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${FOCUS_LABELS[currentFocus.physical].badgeBg}`}>
                      {currentFocus.physical}
                    </span>
                  </div>

                  {!readonly && currentFocus.distribution === 'padrao' ? (
                    <div className="flex items-center gap-1 pt-1">
                      {(['F1', 'F2', 'F3'] as FocusLevel[]).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleChangeGroupFocus('physical', f)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            currentFocus.physical === f
                              ? 'bg-rose-500/30 border-rose-400 text-rose-200'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  ) : !readonly && currentFocus.distribution === 'especializada' ? (
                    <button
                      type="button"
                      onClick={() => handleChangeGroupFocus('physical', 'Fe')}
                      className={`w-full py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        currentFocus.physical === 'Fe'
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {currentFocus.physical === 'Fe' ? 'Foco Exclusivo (Fe)' : 'Tornar Exclusivo (Fe)'}
                    </button>
                  ) : (
                    <p className="text-[10px] text-white/50">
                      {FOCUS_LABELS[currentFocus.physical].desc}
                    </p>
                  )}
                </div>

                {/* 2. MENTAL */}
                <div className="bg-sky-950/20 border border-sky-500/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300 flex items-center gap-1.5">
                      <Brain size={14} className="text-sky-400" />
                      Mental
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${FOCUS_LABELS[currentFocus.mental].badgeBg}`}>
                      {currentFocus.mental}
                    </span>
                  </div>

                  {!readonly && currentFocus.distribution === 'padrao' ? (
                    <div className="flex items-center gap-1 pt-1">
                      {(['F1', 'F2', 'F3'] as FocusLevel[]).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleChangeGroupFocus('mental', f)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            currentFocus.mental === f
                              ? 'bg-sky-500/30 border-sky-400 text-sky-200'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  ) : !readonly && currentFocus.distribution === 'especializada' ? (
                    <button
                      type="button"
                      onClick={() => handleChangeGroupFocus('mental', 'Fe')}
                      className={`w-full py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        currentFocus.mental === 'Fe'
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {currentFocus.mental === 'Fe' ? 'Foco Exclusivo (Fe)' : 'Tornar Exclusivo (Fe)'}
                    </button>
                  ) : (
                    <p className="text-[10px] text-white/50">
                      {FOCUS_LABELS[currentFocus.mental].desc}
                    </p>
                  )}
                </div>

                {/* 3. SOCIAL */}
                <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-3 flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                      <Users size={14} className="text-emerald-400" />
                      Social
                    </span>
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border ${FOCUS_LABELS[currentFocus.social].badgeBg}`}>
                      {currentFocus.social}
                    </span>
                  </div>

                  {!readonly && currentFocus.distribution === 'padrao' ? (
                    <div className="flex items-center gap-1 pt-1">
                      {(['F1', 'F2', 'F3'] as FocusLevel[]).map(f => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => handleChangeGroupFocus('social', f)}
                          className={`flex-1 py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                            currentFocus.social === f
                              ? 'bg-emerald-500/30 border-emerald-400 text-emerald-200'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                          }`}
                        >
                          {f}
                        </button>
                      ))}
                    </div>
                  ) : !readonly && currentFocus.distribution === 'especializada' ? (
                    <button
                      type="button"
                      onClick={() => handleChangeGroupFocus('social', 'Fe')}
                      className={`w-full py-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                        currentFocus.social === 'Fe'
                          ? 'bg-amber-500/30 border-amber-400 text-amber-200'
                          : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
                      }`}
                    >
                      {currentFocus.social === 'Fe' ? 'Foco Exclusivo (Fe)' : 'Tornar Exclusivo (Fe)'}
                    </button>
                  ) : (
                    <p className="text-[10px] text-white/50">
                      {FOCUS_LABELS[currentFocus.social].desc}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Legenda de Peso dos Focos */}
            <div className="p-3 rounded-2xl bg-white/[0.02] border border-white/10 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-white/70 uppercase tracking-wider">
                Legenda de Peso dos Focos
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['Fe', 'F1', 'F2', 'F3'] as FocusLevel[]).map(k => (
                  <div key={k} className="p-2 rounded-xl bg-black/30 border border-white/5 flex flex-col">
                    <span className={`font-mono font-bold text-xs ${FOCUS_LABELS[k].color}`}>
                      {k}
                    </span>
                    <span className="text-[11px] font-medium text-white/90">
                      {FOCUS_LABELS[k].label.split('(')[1]?.replace(')', '') || ''}
                    </span>
                    <span className="text-[10px] text-white/50 mt-0.5">
                      {FOCUS_LABELS[k].desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: CALCULADORA & ORÇAMENTOS DE EXP */}
        {activeTab === 'calculator' && (
          <div className="flex flex-col gap-4 animate-in fade-in duration-200">
            {/* Os 2 Bancos de EXP */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-gradient-to-br from-violet-950/30 to-black/40 border border-violet-500/30 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-violet-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Coins size={14} className="text-violet-400" />
                    Banco de EXP Inicial (Criação)
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {expBudget.initial} EXP
                  </span>
                </div>
                {!readonly && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={expBudget.initial}
                      onChange={(e) => onUpdateExpBudget({ ...expBudget, initial: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-violet-400"
                      placeholder="300"
                    />
                    <button
                      type="button"
                      onClick={() => onUpdateExpBudget({ ...expBudget, initial: 300 })}
                      className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold uppercase transition-colors shrink-0"
                    >
                      Padrão 300
                    </button>
                  </div>
                )}
                <p className="text-[10px] text-white/50">
                  Orçamento concedido na criação inicial da ficha.
                </p>
              </div>

              <div className="bg-gradient-to-br from-cyan-950/30 to-black/40 border border-cyan-500/30 rounded-2xl p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-cyan-400" />
                    Banco de EXP de Campanha
                  </span>
                  <span className="text-xs font-mono font-bold text-white">
                    {expBudget.campaign} EXP
                  </span>
                </div>
                {!readonly && (
                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min={0}
                      step={10}
                      value={expBudget.campaign}
                      onChange={(e) => onUpdateExpBudget({ ...expBudget, campaign: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
                      placeholder="0"
                    />
                    <div className="flex items-center gap-1 shrink-0">
                      {[10, 25, 50].map(add => (
                        <button
                          key={add}
                          type="button"
                          onClick={() => onUpdateExpBudget({ ...expBudget, campaign: (expBudget.campaign || 0) + add })}
                          className="px-2 py-1.5 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 text-cyan-200 text-[10px] font-mono font-bold transition-all"
                        >
                          +{add}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                <p className="text-[10px] text-white/50">
                  Pontos adicionais de evolução concedidos pelo Mestre durante a campanha.
                </p>
              </div>
            </div>

            {/* Resumo Consolidado de Gastos */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-xs font-bold text-white/90 uppercase tracking-wider">
                Detalhamento dos Gastos de EXP da Ficha
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-rose-950/20 border border-rose-500/20 flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-rose-300">Esfera Física ({currentFocus.physical})</span>
                  <strong className="text-sm font-mono text-white mt-1">{expStats.physicalExp} EXP</strong>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    Atributos: {expStats.breakdown.physicalAttributes} | Perícias: {expStats.breakdown.physicalSkills}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-sky-950/20 border border-sky-500/20 flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-sky-300">Esfera Mental ({currentFocus.mental})</span>
                  <strong className="text-sm font-mono text-white mt-1">{expStats.mentalExp} EXP</strong>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    Atributos: {expStats.breakdown.mentalAttributes} | Perícias: {expStats.breakdown.mentalSkills}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-emerald-300">Esfera Social ({currentFocus.social})</span>
                  <strong className="text-sm font-mono text-white mt-1">{expStats.socialExp} EXP</strong>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    Atributos: {expStats.breakdown.socialAttributes} | Perícias: {expStats.breakdown.socialSkills}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/20 flex flex-col">
                  <span className="text-[10px] font-bold uppercase text-amber-300">Termos Fixos & Especiais</span>
                  <strong className="text-sm font-mono text-white mt-1">{expStats.specialExp} EXP</strong>
                  <span className="text-[10px] text-white/40 mt-0.5">
                    Domínios: {expStats.breakdown.domainsExp} | Spiritus: {expStats.breakdown.spiritusExp} | Personalidade: {expStats.breakdown.personalityExp}
                  </span>
                </div>
              </div>

              {/* Regras Nominais / Termos Fixos */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 text-[11px] text-white/70 leading-relaxed flex flex-col gap-1">
                <span className="font-bold text-white text-xs flex items-center gap-1.5">
                  <Info size={13} className="text-violet-400" />
                  Regras Nominais Especiais (Custos Fixos Independentes do Grupo):
                </span>
                <p>• <strong>Alma:</strong> Usa a tabela de Atributos na coluna <strong>Fe (Exclusivo)</strong>.</p>
                <p>• <strong>Domínio:</strong> Usa a tabela de Perícias na coluna <strong>F1 (Primário)</strong>.</p>
                <p>• <strong>Personalidade:</strong> Usa a tabela de Perícias na coluna <strong>F2 (Secundário)</strong>.</p>
                <p>• <strong>Fluxo e Patrono:</strong> São considerados atributos <strong>F1 (Primário)</strong>.</p>
              </div>
            </div>

            {/* Mecânicas Vitais Derivadas Calculadas */}
            <div className="bg-gradient-to-r from-violet-950/30 via-black/40 to-fuchsia-950/30 border border-violet-500/30 rounded-2xl p-4 flex flex-col gap-3">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Activity size={14} className="text-fuchsia-400" />
                Mecânicas Vitais Calculadas Automaticamente
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-cyan-300">Regeneração de Mana</span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-lg font-mono text-white">+{derived.manaRegen}</strong>
                    <span className="text-[10px] text-white/50">por descanso</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    Domínio ({derived.maxDomain}) + Pers. ({derived.personalityAvg}) + Fluxo ({derived.fluxo})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-rose-300">Regeneração de HP</span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-lg font-mono text-white">+{derived.hpRegen}</strong>
                    <span className="text-[10px] text-white/50">por descanso</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    Patrono ({derived.patrono}) + Const. ({derived.constitution}) + Pers. ({derived.personalityAvg})
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col gap-1">
                  <span className="text-[10px] uppercase font-bold text-amber-300">Margem Segura de Magia</span>
                  <div className="flex items-baseline gap-2">
                    <strong className="text-lg font-mono text-white">{derived.safeMagicMargin}</strong>
                    <span className="text-[10px] text-white/50">pontos seguros</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono">
                    Domínio Usado ({derived.maxDomain}) + Fluxo ({derived.fluxo})
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: MATRIZES DE CUSTO (LOOK-UP TABLES) */}
        {activeTab === 'tables' && (
          <div className="flex flex-col gap-5 animate-in fade-in duration-200">
            {/* Tabela de Atributos */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Matriz de Custo: Atributos (Níveis 1 ao 15)
                </h4>
                <span className="text-[11px] text-white/40 font-mono">Look-up Table Atributos</span>
              </div>

              <div className="overflow-x-auto max-h-56 custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-white/60 text-[10px] uppercase">
                      <th className="py-2 px-3">LVL</th>
                      <th className="py-2 px-3 text-amber-300">Fe (Exclusivo)</th>
                      <th className="py-2 px-3 text-emerald-300">F1 (Primário)</th>
                      <th className="py-2 px-3 text-cyan-300">F2 (Secundário)</th>
                      <th className="py-2 px-3 text-slate-300">F3 (Sem Foco)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 15 }, (_, i) => i + 1).map((lvl) => (
                      <tr key={lvl} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="py-1.5 px-3 font-bold text-white/90">Nível {lvl}</td>
                        <td className="py-1.5 px-3 text-amber-300 font-bold">{ATRIBUTOS_COST_TABLE.Fe[lvl - 1]} EXP</td>
                        <td className="py-1.5 px-3 text-emerald-300">{ATRIBUTOS_COST_TABLE.F1[lvl - 1]} EXP</td>
                        <td className="py-1.5 px-3 text-cyan-300">{ATRIBUTOS_COST_TABLE.F2[lvl - 1]} EXP</td>
                        <td className="py-1.5 px-3 text-slate-400">{ATRIBUTOS_COST_TABLE.F3[lvl - 1]} EXP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Tabela de Perícias */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-4 flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Matriz de Custo: Perícias (Níveis 1 ao 7)
                </h4>
                <span className="text-[11px] text-white/40 font-mono">Look-up Table Perícias</span>
              </div>

              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs text-left border-collapse font-mono">
                  <thead>
                    <tr className="border-b border-white/10 text-white/60 text-[10px] uppercase">
                      <th className="py-2 px-3">LVL</th>
                      <th className="py-2 px-3 text-amber-300">Fe (Exclusivo)</th>
                      <th className="py-2 px-3 text-emerald-300">F1 (Primário)</th>
                      <th className="py-2 px-3 text-cyan-300">F2 (Secundário)</th>
                      <th className="py-2 px-3 text-slate-300">F3 (Sem Foco)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 7 }, (_, i) => i + 1).map((lvl) => (
                      <tr key={lvl} className="border-b border-white/5 hover:bg-white/[0.03] transition-colors">
                        <td className="py-1.5 px-3 font-bold text-white/90">Nível {lvl}</td>
                        <td className="py-1.5 px-3 text-amber-300 font-bold">{PERICIAS_COST_TABLE.Fe[lvl - 1]} EXP</td>
                        <td className="py-1.5 px-3 text-emerald-300">{PERICIAS_COST_TABLE.F1[lvl - 1]} EXP</td>
                        <td className="py-1.5 px-3 text-cyan-300">{PERICIAS_COST_TABLE.F2[lvl - 1]} EXP</td>
                        <td className="py-1.5 px-3 text-slate-400">{PERICIAS_COST_TABLE.F3[lvl - 1]} EXP</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
