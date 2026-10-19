import React, { useState } from 'react';
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
  Wand2
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mainTab, setMainTab] = useState<'systemic' | 'mechanics'>('systemic');

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
      title: 'Dano do Corpo: Cliques e Limpeza',
      badge: 'Clique Simples / Duplo Clique',
      icon: <Heart size={16} className="text-rose-400" />,
      description: 'Clique simples nas caixas de vida cicla o dano: Nenhum (⚪) ➔ Simples (🔵 Azul) ➔ Letal (🟠 Laranja) ➔ Agravado (🔴 Vermelho) ➔ Nenhum. No modo edição, dar duplo clique no card de uma região limpa todos os ferimentos daquela parte do corpo.'
    },
    {
      id: 'equip_shortcuts',
      title: 'Equipamento: Botão Direito & Inspeção (Hover)',
      badge: 'Atalhos de Inventário',
      icon: <ShieldCheck size={16} className="text-amber-400" />,
      description: 'Na mochila, clicar com botão direito equipa o item no slot correspondente. Nos slots equipados, botão direito ou duplo clique desequipa o item de volta para a mochila. Passar o mouse exibe o card flutuante de inspeção detalhada.'
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
      description: 'A quantidade de Mana recuperada por descanso completo é calculada automaticamente pela soma do Maior Domínio Elemental + Média de Personalidade (Coragem, Convicção, Serenidade) + Pontos de Fluxo.'
    },
    {
      id: 'hp_regen',
      title: 'Regeneração de HP por Descanso',
      badge: 'Patrono + Constituição + Personalidade',
      icon: <Heart size={16} className="text-rose-400" />,
      description: 'A taxa de cura natural e recuperação de ferimentos por descanso é determinada pela soma do Patrono + Constituição (Atributo Físico) + Média de Personalidade.'
    },
    {
      id: 'safe_magic_margin',
      title: 'Margem Segura para Gasto de Magia',
      badge: 'Domínio Usado + Fluxo',
      icon: <Sparkles size={16} className="text-amber-400" />,
      description: 'A margem máxima de pontos de mana que o conjurador pode despender em um feitiço com segurança antes de correr risco de esgotamento místico ou rachadura é igual ao nível do Domínio Usado somado ao Fluxo.'
    },
    {
      id: 'focus_system_presets',
      title: 'Sistema de Focos: 3 Opções de Distribuição',
      badge: '[F1+F2+F3] | [Fe+F3+F3] | [F2+F2+F2]',
      icon: <Compass size={16} className="text-violet-400" />,
      description: 'Na criação e configuração da ficha, o personagem escolhe uma de três matrizes de aptidão para os grupos Físico, Mental e Social:\n• O Natural (Aptidão Padrão): [ F1 + F2 + F3 ] (1 Primário, 1 Secundário, 1 Sem Foco)\n• O Especialista (Gênio Focado): [ Fe + F3 + F3 ] (1 Exclusivo e 2 Sem Foco)\n• O Generalista ("Sem Foco" Específico): [ F2 + F2 + F2 ] (Três Secundários equilibrados).'
    },
    {
      id: 'focus_weights',
      title: 'Pesos e Custos dos Focos de EXP',
      badge: 'Fe < F1 < F2 < F3',
      icon: <Calculator size={16} className="text-emerald-400" />,
      description: 'Os focos definem a tabela de custo em EXP para Atributos (LVL 1-15) e Perícias (LVL 1-7):\n• Fe (Foco Exclusivo): Custo mais barato de evolução.\n• F1 (Foco Primário): Custo baixo.\n• F2 (Foco Secundário): Custo médio padrão.\n• F3 (Sem Foco): Custo mais elevado para evolução.'
    },
    {
      id: 'fixed_terms_exp',
      title: 'Termos Fixos de EXP (Regras Nominais Especiais)',
      badge: 'Custos Independentes do Grupo',
      icon: <Flame size={16} className="text-amber-300" />,
      description: 'Campos especiais da ficha possuem colunas de custo fixadas pelo sistema:\n• Alma: Usa a tabela de Atributos na coluna Fe (Exclusivo).\n• Domínio: Usa a tabela de Perícias na coluna F1 (Primário).\n• Personalidade: Usa a tabela de Perícias na coluna F2 (Secundário).\n• Fluxo e Patrono: São calculados como Atributos F1 (Primário).'
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
      badge: 'MOD = Nível - PV',
      icon: <Activity size={16} className="text-amber-400" />,
      description: 'Em Fluxo e Patrono, o modificador dinâmico de teste é calculado em tempo real pela fórmula (MOD = Nível Atual - PV). Quando o personagem sofre danos espirituais ou rachadura, seu modificador diminui.'
    },
    {
      id: 'currency_100_1',
      title: 'Bolsa de Moedas: Normalização 100:1',
      badge: '100 C = 1 P | 100 P = 1 O',
      icon: <Coins size={16} className="text-amber-300" />,
      description: 'A economia converte automaticamente moedas de menor valor em moedas de maior valor: 100 Peças de Cobre equivalem a 1 Peça de Prata; 100 Peças de Prata equivalem a 1 Peça de Ouro. O saldo de Cobre e Prata mantém-se sempre no intervalo de 0 a 99.'
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
                : "Buscar cálculos, fórmulas, regeneração, focos ou EXP..."
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
