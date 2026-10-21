import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Dice5, 
  Lock, 
  Coins, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Search, 
  BookOpen, 
  Layers, 
  MousePointer, 
  CheckCircle2, 
  X,
  Swords,
  ScrollText,
  Crown,
  Calculator,
  Zap,
  Activity,
  Compass,
  Cpu,
  Flame,
  Wand2,
  Shield,
  Star,
  Check
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { CharacterData, DamageType } from '../types';
import { calculateDerivedMechanics } from '../utils/expCalculations';
import { getBodyHealthStats } from '../utils/healthEvolution';
import { ITEM_RARITY_LIST, resolveItemRarity } from '../utils/itemRarities';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterData?: CharacterData;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ 
  isOpen, 
  onClose,
  characterData 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState<'systemic' | 'mechanics'>('systemic');

  // Cálculos Automáticos Vivos da Ficha Aberta
  const liveStats = useMemo(() => {
    if (!characterData) return null;

    // 1. Mecânicas Derivadas (Regenerações e Margem Segura)
    const derived = calculateDerivedMechanics(characterData);

    // 2. Saúde e Saturação de HP do Corpo Inteiro
    const healthStats = getBodyHealthStats(characterData.health);

    // 3. Contagem de Itens por Raridade (1★ a 9★)
    const allItems = [
      ...(characterData.inventory?.weapons || []),
      ...(characterData.inventory?.armors || []),
      ...(characterData.inventory?.accessories || []),
      ...(characterData.inventory?.projectiles || []),
      ...(characterData.inventory?.generalItems || [])
    ];

    const rarityCounts: Record<number, number> = {
      1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0
    };

    allItems.forEach(it => {
      const r = resolveItemRarity(it);
      rarityCounts[r.stars] = (rarityCounts[r.stars] || 0) + 1;
    });

    // 4. Bolsa de Moedas Consolidada
    const rawCopper = (characterData.inventory?.currency?.gold || 0) * 10000 + 
                      (characterData.inventory?.currency?.silver || 0) * 100 + 
                      (characterData.inventory?.currency?.copper || 0);

    const gold = Math.floor(rawCopper / 10000);
    const remainderAfterGold = rawCopper % 10000;
    const silver = Math.floor(remainderAfterGold / 100);
    const copper = remainderAfterGold % 100;

    // 5. Modificadores de Fluxo e Patrono
    const rachaduraCount = (characterData.spiritus?.rachadura || []).filter(Boolean).length;
    const fluxoMod = (characterData.spiritus?.fluxo || 1) - rachaduraCount;
    const patronoMod = (characterData.spiritus?.patrono || 1) - rachaduraCount;

    return {
      derived,
      healthStats,
      allItemsCount: allItems.length,
      rarityCounts,
      currency: { gold, silver, copper, rawCopper },
      rachaduraCount,
      fluxoMod,
      patronoMod,
      charName: characterData.identity?.name || 'Aventureiro'
    };
  }, [characterData]);

  // 1. LISTA SISTÊMICA (Interface, Atalhos, Cliques, Automações de UI e Ferramentas)
  const systemicItems = [
    {
      id: 'mode_toggle',
      title: 'Modo de Jogo (🔒) vs. Modo de Edição (🔓)',
      badge: 'Ícone no Cabeçalho',
      icon: <Lock size={16} className="text-emerald-400" />,
      description: 'Alterna entre visualização de jogo e edição. Com a ficha travada (ícone de lápis / clique para editar), os campos ficam protegidos contra cliques acidentais e o clique simples nos atributos e perícias abre rolagens diretas de dados. Ao editar (ícone de cadeado / clique para travar), você altera números, biografias e notas.'
    },
    {
      id: 'aurora_assistant',
      title: 'Aurora: Assistente Semi-Inteligente & Voz',
      badge: '✨ Ícone de Estrela no Cabeçalho',
      icon: <Sparkles size={16} className="text-cyan-400" />,
      description: 'Assistente interativa por texto e voz capaz de compreender comandos e atualizar sua ficha diretamente (ex: "adicione a habilidade Lâmina Etérea com custo 3 e mecânica de corte arcano", "cure 5 pontos de dano", "role 1d20+4"). Possui botão de Desfazer instantâneo.'
    },
    {
      id: 'gm_view_toggle',
      title: 'GM View (👑 Mestre) vs. Player View (👤 Jogador)',
      badge: 'Coroa no Cabeçalho',
      icon: <Crown size={16} className="text-amber-400" />,
      description: 'Alterna a perspectiva entre Mestre e Jogador. No GM View, o Mestre tem acesso ao Roster superior com avatares de todos os personagens da campanha, controle da timeline e forja de habilidades avançadas com IA.'
    },
    {
      id: 'battle_tracker',
      title: 'Battle Tracker (Iniciativa Vertical com Rastro)',
      badge: 'Espadas no Cabeçalho',
      icon: <Swords size={16} className="text-amber-400" />,
      description: 'Gráfico vertical crescente de combate em ticks (com expansão dinâmica). Cada personagem ou criatura é representada por uma esfera luminosa que, ao avançar (+2 rápida, +3 padrão, +5 pesada), deixa as últimas 3 posições em rastro degradê (70%, 50% e 20% de opacidade).'
    },
    {
      id: 'rolls_attributes',
      title: 'Rolagem Rápida de Atributos',
      badge: 'Clique no Bloco de Atributo',
      icon: <Dice5 size={16} className="text-rose-400" />,
      description: 'Com a ficha protegida (Modo de Jogo), clicar em qualquer atributo (Força, Destreza, Inteligência, Empatia, etc.) aciona diretamente o rolador de dados com a reserva correspondente.'
    },
    {
      id: 'rolls_skills',
      title: 'Testes de Perícias & Reserva Automática',
      badge: 'Clique na Perícia',
      icon: <ScrollText size={16} className="text-cyan-400" />,
      description: 'Ao clicar sobre qualquer perícia (Treinamentos, Ciências ou Artes), o sistema calcula a reserva somando os pontos da perícia ao atributo base associado.'
    },
    {
      id: 'skill_level_pulses',
      title: 'Pulsos de Maestria (Níveis 5, 6 e 7)',
      badge: 'Animação de Nível',
      icon: <Sparkles size={16} className="text-white" />,
      description: 'Ao atingir Nível 5 (Mestre), os indicadores de nível emitem pulso suave na cor do tema. No Nível 6 (Grão-Mestre), o pulso expande alternando com branco puro. No Nível 7 (Lenda), atinge brilho e irradiação total.'
    },
    {
      id: 'health_tracker_click',
      title: 'Dano do Corpo: Cliques e Limpeza Segura',
      badge: 'Clique Simples / Duplo Clique Externo',
      icon: <Heart size={16} className="text-rose-400" />,
      description: 'Clique simples nas caixas de vida cicla o dano: Nenhum (⚪) ➔ Simples (🔵 Azul) ➔ Letal (🟠 Laranja) ➔ Agravado (🔴 Vermelho) ➔ Nenhum.\n\nPara segurança contra cliques acidentais, dar duplo clique nas caixinhas apenas cicla o ferimento normalmente; a limpeza completa dos ferimentos de uma região só é ativada dando duplo clique na moldura externa do card.'
    },
    {
      id: 'equip_shortcuts',
      title: 'Equipamento: Botão Direito & Inspeção (Hover)',
      badge: 'Atalhos de Inventário',
      icon: <ShieldCheck size={16} className="text-amber-400" />,
      description: 'Na mochila, clicar com botão direito equipa o item no slot correspondente. Nos slots equipados, botão direito ou duplo clique desequipa o item de volta para a mochila. Passar o mouse exibe o card flutuante de inspeção detalhada.'
    },
    {
      id: 'item_creation_centering',
      title: 'Forja & Criação de Itens Centralizada',
      badge: 'Janelas Padronizadas ao Centro',
      icon: <Layers size={16} className="text-emerald-400" />,
      description: 'Todas as telas e etapas de criação, seleção de slots no corpo e edição de propriedades de itens abrem em dimensões padronizadas e perfeitamente ancoradas no centro da tela, evitando deslocamentos visuais durante a navegação.'
    },
    {
      id: 'ai_suggest_ability',
      title: 'Sugestão Inteligente de Habilidades (Sugerir com IA)',
      badge: 'Varinha no Cadastro de Hab.',
      icon: <Wand2 size={16} className="text-fuchsia-300" />,
      description: 'Ao criar ou editar uma habilidade especial, preencha apenas os campos que desejar (ex: apenas o Nome ou apenas o Custo) e clique em "Sugerir com IA". A assistente preenche os campos faltantes mantendo a coerência arquetípica.'
    },
    {
      id: 'parallax_universe',
      title: 'Fundo Parallax 3D & Efeitos Cósmicos',
      badge: 'Parallax do Canvas',
      icon: <MousePointer size={16} className="text-cyan-300" />,
      description: 'Fundo animado em 3 camadas estelares que respondem ao movimento do mouse com transições e passagem periódica de cometas cintilantes.'
    }
  ];

  // 2. LISTA DE MECÂNICAS (Todos os Cálculos Automáticos, Focos, Regenerações e Sugestões do Sistema)
  const mechanicsItems = [
    {
      id: 'mana_regen',
      title: 'Regeneração de Mana por Descanso',
      badge: 'Domínio + Personalidade + Fluxo',
      icon: <Zap size={16} className="text-cyan-400" />,
      description: 'A quantidade de Mana recuperada por descanso completo é calculada automaticamente pela fórmula:\nRegen de Mana = Maior Domínio Elemental + Média de Personalidade (Coragem, Convicção, Serenidade) + Fluxo.',
      liveKey: 'mana_regen',
      renderLive: () => {
        if (!liveStats) return null;
        const { maxDomain, personalityAvg, fluxo, manaRegen } = liveStats.derived;
        return (
          <div className="mt-2.5 p-2.5 rounded-xl bg-cyan-950/40 border border-cyan-500/30 text-xs">
            <div className="flex items-center justify-between text-cyan-300 font-bold mb-1">
              <span>Cálculo Automático na Ficha Aberta ({liveStats.charName}):</span>
              <span className="font-mono text-sm text-cyan-200">+{manaRegen} Mana / Descanso</span>
            </div>
            <div className="text-[11px] text-white/70 font-mono flex flex-wrap items-center gap-1.5">
              <span>Domínio: {maxDomain}</span>
              <span>+</span>
              <span>Personalidade: {personalityAvg}</span>
              <span>+</span>
              <span>Fluxo: {fluxo}</span>
              <span>=</span>
              <span className="font-bold text-cyan-300">{manaRegen} Pontos Recuperados</span>
            </div>
          </div>
        );
      }
    },
    {
      id: 'hp_regen',
      title: 'Regeneração de HP por Descanso',
      badge: 'Patrono + Constituição + Personalidade',
      icon: <Heart size={16} className="text-rose-400" />,
      description: 'A taxa de cura natural e recuperação de ferimentos por descanso é determinada automaticamente pela fórmula:\nRegen de HP = Patrono + Constituição (Atributo Físico) + Média de Personalidade.',
      liveKey: 'hp_regen',
      renderLive: () => {
        if (!liveStats) return null;
        const { patrono, constitution, personalityAvg, hpRegen } = liveStats.derived;
        return (
          <div className="mt-2.5 p-2.5 rounded-xl bg-rose-950/40 border border-rose-500/30 text-xs">
            <div className="flex items-center justify-between text-rose-300 font-bold mb-1">
              <span>Cálculo Automático na Ficha Aberta ({liveStats.charName}):</span>
              <span className="font-mono text-sm text-rose-200">+{hpRegen} HP / Descanso</span>
            </div>
            <div className="text-[11px] text-white/70 font-mono flex flex-wrap items-center gap-1.5">
              <span>Patrono: {patrono}</span>
              <span>+</span>
              <span>Constituição: {constitution}</span>
              <span>+</span>
              <span>Personalidade: {personalityAvg}</span>
              <span>=</span>
              <span className="font-bold text-rose-300">{hpRegen} Caixas de Vida Curadas</span>
            </div>
          </div>
        );
      }
    },
    {
      id: 'safe_magic_margin',
      title: 'Margem Segura para Gasto de Magia',
      badge: 'Domínio Usado + Fluxo',
      icon: <Sparkles size={16} className="text-amber-400" />,
      description: 'A margem máxima de pontos de mana que o conjurador pode despender em um feitiço com segurança antes de sofrer risco de esgotamento místico ou rachadura elemental é dada pela fórmula:\nMargem Segura = Domínio Usado + Fluxo.',
      liveKey: 'safe_magic_margin',
      renderLive: () => {
        if (!liveStats) return null;
        const { maxDomain, fluxo, safeMagicMargin } = liveStats.derived;
        return (
          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs">
            <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
              <span>Cálculo Automático na Ficha Aberta ({liveStats.charName}):</span>
              <span className="font-mono text-sm text-amber-200">{safeMagicMargin} Pontos Seguros</span>
            </div>
            <div className="text-[11px] text-white/70 font-mono flex flex-wrap items-center gap-1.5">
              <span>Maior Domínio Atual: {maxDomain}</span>
              <span>+</span>
              <span>Fluxo: {fluxo}</span>
              <span>=</span>
              <span className="font-bold text-amber-300">Margem Segura de {safeMagicMargin} Mana</span>
            </div>
          </div>
        );
      }
    },
    {
      id: 'hp_damage_evolution',
      title: 'Evolução de Dano por Saturação de HP',
      badge: 'Vazio ➔ Simples ➔ Letal ➔ Agravado',
      icon: <Activity size={16} className="text-red-400" />,
      description: 'Cada caixa de vida evolui progressivamente de um tipo de dano para o outro:\n• Vazio (none, íntegro) ➔ Simples (simple, contusão) ➔ Letal (lethal, corte/trauma) ➔ Agravado (aggravated, dano místico/mutilação).\n\nQuando o usuário preenche todas as caixas de uma região com um tipo de dano, tomar mais dano evolui o tipo dele: dano simples adicional com caixas cheias evolui caixas de simples para letal; se todas já estiverem em letal, evolui para agravado até a saturação final.',
      liveKey: 'hp_damage_evolution',
      renderLive: () => {
        if (!liveStats) return null;
        const { healthStats } = liveStats;
        return (
          <div className="mt-2.5 p-2.5 rounded-xl bg-red-950/40 border border-red-500/30 text-xs">
            <div className="flex items-center justify-between text-red-300 font-bold mb-1.5">
              <span>Integridade Física Atual ({liveStats.charName}):</span>
              <span className="font-mono text-sm text-red-200">{healthStats.healthPercent}% Íntegro</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5 text-center font-mono text-[10px]">
              <div className="p-1 rounded bg-white/5 border border-white/10 text-slate-300">
                <span className="block text-white/40">Vazias</span>
                <span className="font-bold text-emerald-400">{healthStats.noneCount}</span>
              </div>
              <div className="p-1 rounded bg-blue-500/10 border border-blue-500/20 text-blue-300">
                <span className="block text-white/40">Simples</span>
                <span className="font-bold text-blue-400">{healthStats.simpleCount}</span>
              </div>
              <div className="p-1 rounded bg-orange-500/10 border border-orange-500/20 text-orange-300">
                <span className="block text-white/40">Letal</span>
                <span className="font-bold text-orange-400">{healthStats.lethalCount}</span>
              </div>
              <div className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-300">
                <span className="block text-white/40">Agravado</span>
                <span className="font-bold text-red-400">{healthStats.aggravatedCount}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'item_rarities_ranking',
      title: 'Ranking de Raridade & Força de Itens (1★ a 9★)',
      badge: '1★ a 9★ (Primordial)',
      icon: <Star size={16} className="text-yellow-400" />,
      description: 'A raridade e força de todos os itens é medida canonicamente pela quantidade de estrelas (* ou ★):\n• 1* Comum – O padrão básico do dia a dia.\n• 2* Incomum – Qualidade superior, apresentando pequenas melhorias em relação ao padrão.\n• 3* Raro – Escasso e valioso, com características únicas e difíceis de encontrar.\n• 4* Épico – Excepcionalmente poderoso e forjado com maestria.\n• 5* Lendário – Itens de grande renome, geralmente únicos e com poder inestimável.\n• 6* Mítico – Tão absurdamente raros que sua existência é considerada um mito.\n• 7* Divino – Imbuído com a essência e o poder de deuses ou entidades superiores.\n• 8* Transcendente – Ultrapassa as leis físicas e a realidade conhecida do seu universo.\n• 9* Primordial - O ápice perfeito e insuperável, a raridade final do sistema.',
      liveKey: 'item_rarities_ranking',
      renderLive: () => {
        if (!liveStats) return null;
        return (
          <div className="mt-2.5 p-3 rounded-2xl bg-black/60 border border-amber-500/30 text-xs flex flex-col gap-2">
            <div className="flex items-center justify-between text-amber-300 font-bold border-b border-white/10 pb-1.5">
              <span>Inventário da Ficha ({liveStats.allItemsCount} itens cadastrados):</span>
              <span className="text-[10px] text-white/50 font-mono">Contagem por Grau de Estrelas</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
              {ITEM_RARITY_LIST.map((r) => {
                const count = liveStats.rarityCounts[r.stars] || 0;
                return (
                  <div
                    key={r.stars}
                    className={`p-1.5 rounded-xl border flex flex-col items-center text-center ${r.bgGlow} ${r.border}`}
                    title={`${r.starSymbol} ${r.name}: ${r.description}`}
                  >
                    <span className="font-mono font-bold text-[10px] text-amber-300">{r.starSymbol}</span>
                    <span className={`text-[10px] font-bold truncate max-w-full ${r.text}`}>{r.name}</span>
                    <span className="text-[9px] font-mono mt-0.5 px-1.5 py-0.2 rounded bg-black/50 border border-white/10 text-white/80">
                      {count} {count === 1 ? 'item' : 'itens'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }
    },
    {
      id: 'focus_system_presets',
      title: 'Sistema de Focos: 3 Opções de Criação',
      badge: '[F1+F2+SF] | [FE+SF+SF] | [F2+F2+F2]',
      icon: <Compass size={16} className="text-violet-400" />,
      description: 'Na criação da ficha, o personagem escolhe obrigatoriamente uma de três matrizes de aptidão:\n• O Natural (Aptidão Padrão): [ F1 + F2 + SF ] (1 Primário, 1 Secundário, 1 Sem Foco)\n• O Especialista (Gênio Focado): [ FE + SF + SF ] (1 Exclusivo e 2 Sem Foco)\n• O Generalista ("Sem Foco" Específico): [ F2 + F2 + F2 ] (Três Secundários equilibrados).',
      liveKey: 'focus_system_presets',
      renderLive: () => {
        if (!characterData?.focusConfig) return null;
        const cfg = characterData.focusConfig;
        return (
          <div className="mt-2.5 p-2.5 rounded-xl bg-violet-950/40 border border-violet-500/30 text-xs">
            <div className="flex items-center justify-between text-violet-300 font-bold mb-1">
              <span>Focos Configurados no Personagem ({characterData.identity?.name || 'Atual'}):</span>
              <span className="font-mono text-xs uppercase text-violet-200">{cfg.distribution}</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center font-mono text-[11px] mt-1">
              <div className="p-1 rounded bg-rose-500/10 border border-rose-500/20 text-rose-300">
                <span className="block text-[9px] text-white/50">Físico</span>
                <span className="font-bold">{cfg.physical}</span>
              </div>
              <div className="p-1 rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
                <span className="block text-[9px] text-white/50">Mental</span>
                <span className="font-bold">{cfg.mental}</span>
              </div>
              <div className="p-1 rounded bg-violet-500/10 border border-violet-500/20 text-violet-300">
                <span className="block text-[9px] text-white/50">Social</span>
                <span className="font-bold">{cfg.social}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'focus_weights',
      title: 'Pesos e Custos dos Focos de EXP',
      badge: 'FE < F1 < F2 < SF',
      icon: <Calculator size={16} className="text-emerald-400" />,
      description: 'Os focos definem a tabela de custo em EXP para Atributos (LVL 1-15) e Perícias (LVL 1-7):\n• FE (Foco Exclusivo): Menor custo de evolução do jogo.\n• F1 (Foco Primário): Custo baixo.\n• F2 (Foco Secundário): Custo médio padrão.\n• SF (Sem Foco): Maior custo de evolução.'
    },
    {
      id: 'fixed_terms_exp',
      title: 'Termos Fixos de EXP (Regras Nominais Especiais)',
      badge: 'Custos Independentes do Grupo',
      icon: <Flame size={16} className="text-amber-300" />,
      description: 'Campos especiais da ficha possuem colunas de custo fixadas pelo sistema:\n• Alma: Usa a tabela de Atributos na coluna FE (Exclusivo).\n• Domínio: Usa a tabela de Perícias na coluna F1 (Primário).\n• Personalidade: Usa a tabela de Perícias na coluna F2 (Secundário).\n• Fluxo e Patrono: São calculados como Atributos F1 (Primário).'
    },
    {
      id: 'two_exp_banks',
      title: 'Dois Bancos de EXP: Criação & Campanha',
      badge: 'Gestão Separada de Orçamento',
      icon: <Coins size={16} className="text-violet-300" />,
      description: 'A calculadora mantém dois registros distintos: Banco de EXP Inicial (concedido na criação da ficha, padrão 300 EXP) e Banco de EXP de Campanha (pontos extras concedidos pelo Mestre pelas sessões e façanhas).'
    },
    {
      id: 'spiritus_mod_calc',
      title: 'Cálculo de Modificador de Fluxo e Patrono',
      badge: 'MOD = Nível - PV (Rachadura)',
      icon: <Activity size={16} className="text-amber-400" />,
      description: 'Em Fluxo e Patrono, o modificador dinâmico de teste é calculado em tempo real pela fórmula (MOD = Nível Atual - PV). Quando o personagem sofre danos espirituais ou rachadura, seu modificador diminui.',
      liveKey: 'spiritus_mod_calc',
      renderLive: () => {
        if (!liveStats) return null;
        return (
          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs">
            <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
              <span>Modificadores Atuais ({liveStats.charName}):</span>
              <span className="font-mono text-xs text-amber-200">{liveStats.rachaduraCount} Rachadura(s)</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center font-mono text-[11px] mt-1">
              <div className="p-1.5 rounded bg-black/40 border border-white/10 text-cyan-300">
                <span className="block text-[9px] text-white/50">Fluxo MOD</span>
                <span className="font-bold text-sm">+{liveStats.fluxoMod}</span>
              </div>
              <div className="p-1.5 rounded bg-black/40 border border-white/10 text-emerald-300">
                <span className="block text-[9px] text-white/50">Patrono MOD</span>
                <span className="font-bold text-sm">+{liveStats.patronoMod}</span>
              </div>
            </div>
          </div>
        );
      }
    },
    {
      id: 'currency_100_1',
      title: 'Bolsa de Moedas: Normalização 100:1',
      badge: '100 C = 1 P | 100 P = 1 O',
      icon: <Coins size={16} className="text-amber-300" />,
      description: 'A economia converte automaticamente moedas de menor valor em moedas de maior valor: 100 Peças de Cobre equivalem a 1 Peça de Prata; 100 Peças de Prata equivalem a 1 Peça de Ouro. O saldo de Cobre e Prata mantém-se sempre no intervalo de 0 a 99.',
      liveKey: 'currency_100_1',
      renderLive: () => {
        if (!liveStats) return null;
        const { currency } = liveStats;
        return (
          <div className="mt-2.5 p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/30 text-xs">
            <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
              <span>Saldo Consolidado na Bolsa ({liveStats.charName}):</span>
              <span className="font-mono text-xs text-white/50">{currency.rawCopper} Cobre Total</span>
            </div>
            <div className="flex items-center justify-around font-mono font-bold text-xs mt-1 bg-black/40 p-1.5 rounded-lg border border-white/10">
              <span className="text-amber-300">{currency.gold} Ouro</span>
              <span className="text-white/30">·</span>
              <span className="text-slate-200">{currency.silver} Prata</span>
              <span className="text-white/30">·</span>
              <span className="text-orange-400">{currency.copper} Cobre</span>
            </div>
          </div>
        );
      }
    },
    {
      id: 'natureza_tracker_rules',
      title: 'Câmaras de Natureza Elemental',
      badge: '5 Elementos (Água, Ar, Anima, Fogo, Terra)',
      icon: <Sparkles size={16} className="text-cyan-300" />,
      description: 'Cada elemento possui câmara vertical de fluido. 1 clique no ícone restaura 100% da reserva; 1 clique na coluna gasta 1 ponto de energia (-1); 1 duplo clique zera os gastos da câmara.'
    }
  ];

  const currentList = mainTab === 'systemic' ? systemicItems : mechanicsItems;

  const filteredItems = currentList.filter(item => {
    const term = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(term) ||
      item.description.toLowerCase().includes(term) ||
      item.badge.toLowerCase().includes(term)
    );
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guia de Ferramentas & Mecânicas do Sistema"
      subtitle="Manual de atalhos, automações de interface e regras matemáticas calculadas"
      icon={<HelpCircle size={20} />}
      theme="violet"
      maxWidth="3xl"
      footer={
        <div className="flex items-center justify-between w-full">
          <span className="text-[11px] text-white/40">
            Dica: No Modo de Jogo (🔒), clique nos atributos e perícias para rolar testes na hora.
          </span>
          <Button theme="violet" size="sm" onClick={onClose}>
            Entendido
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Toggle das Duas Listas: Sistêmica vs Mecânicas */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-black/50 border border-white/10">
          <button
            type="button"
            onClick={() => setMainTab('systemic')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainTab === 'systemic'
                ? 'bg-violet-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Cpu size={15} />
            <span>Lista Sistêmica & UI ({systemicItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setMainTab('mechanics')}
            className={`py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              mainTab === 'mechanics'
                ? 'bg-fuchsia-600 text-white shadow-[0_0_15px_rgba(232,121,249,0.4)]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            <Calculator size={15} />
            <span>Lista de Mecânicas & Cálculos ({mechanicsItems.length})</span>
          </button>
        </div>

        {/* Barra de Busca Rápida */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            placeholder={
              mainTab === 'systemic'
                ? "Buscar atalhos, cliques, rolagens ou automações..."
                : "Buscar cálculos, fórmulas, regeneração, focos, raridades ou EXP..."
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
          />
        </div>

        {/* Lista de Itens Filtrados */}
        <div className="flex flex-col gap-2.5 max-h-[55vh] overflow-y-auto pr-1 custom-scrollbar">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className="bg-black/30 border border-white/10 hover:border-violet-500/30 rounded-xl p-3.5 flex flex-col gap-1.5 transition-all group shadow-xs"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
                      {item.icon}
                    </div>
                    <span className="font-bold text-xs text-slate-200 group-hover:text-white transition-colors">
                      {item.title}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-violet-300">
                    {item.badge}
                  </span>
                </div>
                <p className="text-[11px] text-white/65 leading-relaxed pl-8 whitespace-pre-line">
                  {item.description}
                </p>

                {/* Renderização do Cálculo Automático Baseado na Ficha Aberta */}
                {'renderLive' in item && typeof (item as any).renderLive === 'function' && (
                  <div className="pl-8">
                    {(item as any).renderLive()}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="py-12 text-center text-white/40 flex flex-col items-center gap-2">
              <BookOpen size={28} className="text-white/20" />
              <p className="text-xs">Nenhum item encontrado para "{searchTerm}".</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};
