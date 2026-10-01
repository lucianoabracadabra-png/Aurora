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
  Crown
} from 'lucide-react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'rolls' | 'modes' | 'currency' | 'equip' | 'health'>('all');

  const guideItems = [
    {
      id: 'mode_toggle',
      category: 'modes',
      title: 'Modo de Jogo (🔒) vs. Modo de Edição (🔓)',
      badge: 'Cadeado no Cabeçalho',
      icon: <Lock size={16} className="text-emerald-400" />,
      description: 'O ícone de cadeado no topo da ficha alterna os modos: no Modo de Jogo (🔒 verde), os campos ficam protegidos contra edições acidentais e o clique simples nos atributos, perícias e armas ativa rolagens diretas de dados. No Modo Editar (🔓 vermelho), você altera pontos, níveis, edita biografias e adiciona itens.'
    },
    {
      id: 'rolls_attributes',
      category: 'rolls',
      title: 'Rolagem Rápida de Atributos',
      badge: 'Clique no Atributo',
      icon: <Dice5 size={16} className="text-rose-400" />,
      description: 'Com o cadeado trancado (🔒 Modo de Jogo), clicar no bloco de qualquer atributo (Força, Destreza, Inteligência, Empatia, etc.) abre automaticamente o rolador com a reserva de dados correspondente.'
    },
    {
      id: 'rolls_skills',
      category: 'rolls',
      title: 'Testes de Perícias & Subperícias',
      badge: 'Clique na Perícia',
      icon: <ScrollText size={16} className="text-cyan-400" />,
      description: 'Ao clicar sobre qualquer perícia (Treinamentos, Ciências, Artes ou Perícias Customizadas), o rolador calcula a reserva somando os pontos da perícia ao atributo base associado.'
    },
    {
      id: 'rolls_weapons',
      category: 'rolls',
      title: 'Ataques & Dano de Armas',
      badge: 'Clique na Fórmula de Dano',
      icon: <Swords size={16} className="text-amber-400" />,
      description: 'Nas armas equipadas ou na mochila, clicar nas fórmulas de Estocada e Balanço (ex: 1d10, 1d6) aciona a rolagem de dano direta com os bônus de penetração de armadura (AP) e precisão.'
    },
    {
      id: 'health_tracker_click',
      category: 'health',
      title: 'Dano do Corpo: Clique Simples nas Caixas',
      badge: 'Clique para Alternar Dano',
      icon: <Heart size={16} className="text-rose-400" />,
      description: 'Clicar em qualquer caixinha de vida altera o estado do ferimento em ciclo: Nenhum (⚪) ➔ Simples (🔵 Azul) ➔ Letal (🟠 Laranja) ➔ Agravado (🔴 Vermelho) ➔ Nenhum.'
    },
    {
      id: 'health_tracker_double_click',
      category: 'health',
      title: 'Dano do Corpo: Clique Duplo na Região',
      badge: 'Clique Duplo para Limpar',
      icon: <Heart size={16} className="text-rose-300" />,
      description: 'No Modo Editar (🔓), dar um duplo clique no card de qualquer região do corpo (Cabeça, Torso, Braços ou Pernas) limpa instantaneamente todos os ferimentos acumulados naquela área.'
    },
    {
      id: 'equip_right_click',
      category: 'equip',
      title: 'Equipar Rápido na Mochila',
      badge: 'Botão Direito no Item',
      icon: <CheckCircle2 size={16} className="text-amber-400" />,
      description: 'Na mochila, clicar com o botão direito sobre qualquer item (arma, armadura, acessório) equipa-o automaticamente no slot de corpo correto.'
    },
    {
      id: 'equip_double_click',
      category: 'equip',
      title: 'Desequipar Slot Rápido',
      badge: 'Clique Duplo / Botão Direito no Slot',
      icon: <X size={16} className="text-rose-400" />,
      description: 'Nos slots de corpo equipados, dar um duplo clique ou clicar com o botão direito desequipa o item diretamente de volta para a mochila.'
    },
    {
      id: 'equip_hover',
      category: 'equip',
      title: 'Inspeção Flutuante de Equipamentos',
      badge: 'Passe o Mouse (Hover)',
      icon: <ShieldCheck size={16} className="text-cyan-400" />,
      description: 'Passar o ponteiro do mouse sobre qualquer slot equipado ou item da mochila exibe o card estilo WoW com resumo de defesas, durabilidade, danos e requisitos.'
    },
    {
      id: 'flow_patron',
      category: 'health',
      title: 'Fluxo e Patrono: Nível & PV',
      badge: 'Botões - / + & Riscos',
      icon: <Crown size={16} className="text-amber-400" />,
      description: 'Os botões de - (esquerda) e + (direita) alteram os Pontos de Vida (PV 0-10) ou você pode clicar diretamente nos riscos. A alteração de Nível fica disponível apenas no Modo Editar (🔓). O MOD é calculated automaticamente (MOD = Nível - PV).'
    },
    {
      id: 'natureza_tracker_click',
      category: 'health',
      title: 'Reserva de Natureza: Clique no Ícone',
      badge: 'Restauração Total (100%)',
      icon: <Sparkles size={16} className="text-cyan-400" />,
      description: 'Clicar no ícone do elemento (Água, Ar, Anima, Fogo, Terra) no topo do tracker restaura 100% da reserva daquele elemento instantaneamente.'
    },
    {
      id: 'natureza_tracker_spend',
      category: 'health',
      title: 'Reserva de Natureza: Clique & Duplo Clique na Câmara',
      badge: 'Gastar (-1) / Resetar (0)',
      icon: <Sparkles size={16} className="text-cyan-300" />,
      description: 'Na câmara vertical de fluido elemental: 1 clique simples gasta 1 ponto de energia (-1). 1 clique duplo zera os pontos gastos (reset de câmara).'
    },
    {
      id: 'mana_controls',
      category: 'modes',
      title: 'Reserva de Mana por Eixo (Vigor, Foco, Graça)',
      badge: 'Controles Rápidos (-5 a +5)',
      icon: <Sparkles size={16} className="text-violet-400" />,
      description: 'Use os botões de atalho rápido (-5, -3, -1, +1, +3, +5) para gastar e recuperar mana de cada eixo. O botão de giro (↺) restaura a mana total do eixo.'
    },
    {
      id: 'currency_system',
      category: 'currency',
      title: 'Bolsa de Riquezas: Regra de Conversão 100:1',
      badge: 'Normalização Automática',
      icon: <Coins size={16} className="text-amber-400" />,
      description: 'A economia converte moedas automaticamente: 100 Cobre (C) viram 1 Prata (P); 100 Prata (P) viram 1 Ouro (O). Prata e Cobre mantêm-se sempre no intervalo de 0 a 99.'
    },
    {
      id: 'currency_movement',
      category: 'currency',
      title: 'Movimentar Moedas & Histórico',
      badge: 'Botões [+] e [≡]',
      icon: <Coins size={16} className="text-amber-300" />,
      description: 'O botão [+] abre o painel para adicionar ou subtrair moedas com cálculo automático. O botão de lista [≡] abre o registro cronológico de todas as transações com data, hora e motivo.'
    },
    {
      id: 'consumables_control',
      category: 'equip',
      title: 'Consumíveis & Durabilidade Rápida',
      badge: 'Controles + / -',
      icon: <Layers size={16} className="text-sky-400" />,
      description: 'Nos itens gerais/suprimentos, use os botões + e - diretamente no card para alterar o estoque. Em armaduras, altere a durabilidade sem abrir o modal de edição.'
    },
    {
      id: 'traits_modal',
      category: 'modes',
      title: 'Detalhes de Vantagens & Desvantagens',
      badge: 'Clique no Traço',
      icon: <Sparkles size={16} className="text-emerald-400" />,
      description: 'Clicar em qualquer Vantagem ou Desvantagem abre um modal com o Título, Custo em Pontos e a Caixa de Texto descrevendo a regra e o histórico do traço.'
    },
    {
      id: 'personality_roll',
      category: 'rolls',
      title: 'Personalidade: Teste ou Edição',
      badge: 'Clique na Nota',
      icon: <Dice5 size={16} className="text-violet-400" />,
      description: 'No Modo de Jogo (🔒), clicar na nota de Coragem, Convicção ou Serenidade rola o teste de personalidade no rolador. No Modo Editar (🔓), altera a nota de 1 a 5.'
    },
    {
      id: 'parallax_universe',
      category: 'modes',
      title: 'Fundo Aurora Galáctica Interativo',
      badge: 'Efeito Parallax 3D',
      icon: <MousePointer size={16} className="text-cyan-300" />,
      description: 'O fundo cósmico reage com 3 camadas de estrelas sensíveis ao movimento do mouse, com passagem periódica de cometas cintilantes.'
    }
  ];

  const filteredItems = guideItems.filter(item => {
    const matchesCategory = activeCategory === 'all' || item.category === activeCategory;
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.badge.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guia de Ferramentas & Usabilidade"
      subtitle="Manual de atalhos, rolagens e recursos da Ficha Arcana"
      icon={<HelpCircle size={20} />}
      theme="violet"
      maxWidth="2xl"
      footer={
        <>
          <span className="text-[11px] text-white/40">
            Dica: Trave a ficha (🔒) para ativar rolagens de teste com 1 clique.
          </span>
          <Button theme="violet" size="sm" onClick={onClose}>
            Entendido
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {/* Barra de Busca e Filtros Segmentados */}
        <div className="flex flex-col gap-2.5 p-3 rounded-2xl bg-black/40 border border-white/5">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar atalho, rolagem ou ferramenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/60 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50 transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
            {[
              { id: 'all', label: 'Tudo' },
              { id: 'rolls', label: 'Rolagens & Dados' },
              { id: 'modes', label: 'Modos & Atalhos' },
              { id: 'currency', label: 'Bolsa & Moedas' },
              { id: 'equip', label: 'Equipamento' },
              { id: 'health', label: 'Saúde & Natureza' }
            ].map(cat => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
                  activeCategory === cat.id
                    ? 'bg-violet-500/25 border border-violet-500/50 text-violet-300 shadow-sm'
                    : 'bg-white/5 border border-transparent text-white/60 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Recursos & Dicas com Nested Radius Harmônico (rounded-xl) */}
        <div className="flex flex-col gap-2.5">
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
                <p className="text-[11px] text-white/65 leading-relaxed pl-8">
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
