import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Dice5, 
  Lock, 
  Unlock, 
  Coins, 
  ShieldCheck, 
  Sparkles, 
  Heart, 
  Search, 
  BookOpen, 
  Layers, 
  MousePointer, 
  CheckCircle2, 
  ChevronRight,
  Swords,
  ScrollText
} from 'lucide-react';

interface UserGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ isOpen, onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState<'all' | 'rolls' | 'modes' | 'currency' | 'equip' | 'health'>('all');

  if (!isOpen) return null;

  const guideItems = [
    {
      id: 'rolls_attributes',
      category: 'rolls',
      title: 'Rolagem Rápida de Atributos',
      badge: 'Clique Simples',
      icon: <Dice5 size={16} className="text-rose-400" />,
      description: 'Com o cadeado trancado (Modo de Jogo), clicar no bloco de qualquer atributo (Físico, Destreza, Mente) abre automaticamente o rolador de dados com o modificador correspondente pré-carregado.'
    },
    {
      id: 'rolls_skills',
      category: 'rolls',
      title: 'Testes de Perícias & Subperícias',
      badge: 'Clique na Perícia',
      icon: <ScrollText size={16} className="text-cyan-400" />,
      description: 'Ao clicar sobre qualquer perícia (Treinamentos, Ciências, Artes ou Perícias Customizadas), o rolador de dados calcula o bônus somando os pontos da perícia ao atributo associado.'
    },
    {
      id: 'rolls_weapons',
      category: 'rolls',
      title: 'Ataques & Dano de Armas',
      badge: 'Ação Rápida',
      icon: <Swords size={16} className="text-amber-400" />,
      description: 'Nas armas equipadas ou na mochila, os valores de Estocada e Balanço (ex: 1d10, 1d6) podem ser clicados para rolar o dano diretamente com bônus de penetração (AP) e precisão.'
    },
    {
      id: 'mode_toggle',
      category: 'modes',
      title: 'Modo de Jogo vs. Modo de Edição',
      badge: 'Ícone de Cadeado',
      icon: <Lock size={16} className="text-emerald-400" />,
      description: 'O ícone de cadeado no topo da ficha alterna entre Modo de Jogo (🔒 verde - ideal para a sessão, protege valores contra cliques acidentais e ativa atalhos de rolagem) e Modo de Edição (🔓 vermelho - permite alterar pontos, adicionar itens e editar biografias).'
    },
    {
      id: 'currency_system',
      category: 'currency',
      title: 'Bolsa de Riquezas & Conversão Automática',
      badge: 'Regra 100:1',
      icon: <Coins size={16} className="text-amber-400" />,
      description: 'A economia é estritamente normalizada: 100 Cobre (C) viram 1 Prata (P); 100 Prata (P) viram 1 Ouro (O). Prata e Cobre sempre ficam no intervalo de 0 a 99.'
    },
    {
      id: 'currency_movement',
      category: 'currency',
      title: 'Movimentar Moedas (+ / -)',
      badge: 'Botão [+]',
      icon: <Coins size={16} className="text-amber-300" />,
      description: 'O botão [+] ao lado das moedas abre o painel direto: alterne o sinal no toggle [+ / -] e digite a quantidade desejada de Ouro, Prata ou Cobre. O sistema calcula a conversão e registra a transação.'
    },
    {
      id: 'currency_history',
      category: 'currency',
      title: 'Histórico de Transações',
      badge: 'Botão [≡]',
      icon: <ScrollText size={16} className="text-amber-300" />,
      description: 'O botão de lista [≡] ao lado do [+] abre o histórico completo com todas as entradas e saídas de moedas, valores, datas e descrições das transações.'
    },
    {
      id: 'equipment_slots',
      category: 'equip',
      title: 'Espaços de Equipamento & Defesa',
      badge: '14 Slots Ativos',
      icon: <ShieldCheck size={16} className="text-cyan-400" />,
      description: 'Clicar em um slot de equipamento vazio permite equipar um item existente da mochila ou criar um novo item pré-formatado. A barra superior soma automaticamente os valores de Corte, Esmagamento, Perfuração, Cobertura e Resistência.'
    },
    {
      id: 'backpack_categories',
      category: 'equip',
      title: 'Mochila & Filtros Rápidos',
      badge: 'Organização',
      icon: <Layers size={16} className="text-violet-400" />,
      description: 'Filtre itens por Todas, Armas, Armaduras, Projéteis, Acessórios ou Gerais. Use a barra de busca e ordene por Nome, Peso ou Quantidade para achar suprimentos rapidamente.'
    },
    {
      id: 'natureza_tracker',
      category: 'health',
      title: 'Pontos de Natureza (Corpo, Mente, Alma)',
      badge: 'Rastreamento',
      icon: <Sparkles size={16} className="text-violet-400" />,
      description: 'Clique nos círculos de Natureza para alternar entre pontos gastos e recuperados durante o uso de magias, habilidades especiais e testes de esforço.'
    },
    {
      id: 'health_tracker',
      category: 'health',
      title: 'Saúde & Estados de Ferimento',
      badge: 'Sobrevivência',
      icon: <Heart size={16} className="text-rose-400" />,
      description: 'Controle a vida atual e máxima, aplique dano/cura rápida e acompanhe penalidades de condições físicas e sangramento.'
    },
    {
      id: 'parallax_universe',
      category: 'modes',
      title: 'Fundo Aurora Galáctica Interativo',
      badge: '3D Parallax',
      icon: <MousePointer size={16} className="text-cyan-300" />,
      description: 'O fundo cósmico possui 3 camadas de estrelas que reagem suavemente ao movimento do mouse e à gravidade estelar com passagem de cometas.'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0816] border border-violet-500/35 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Topo do Modal */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-300 shadow-[0_0_12px_rgba(167,139,250,0.3)]">
              <HelpCircle size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-100 flex items-center gap-2">
                Guia de Ferramentas & Usabilidade
              </h3>
              <p className="text-[11px] text-white/50">Manual de atalhos, rolagens e recursos da Ficha Arcana</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Barra de Busca e Filtros */}
        <div className="p-4 border-b border-white/5 flex flex-col gap-2.5 bg-black/40">
          <div className="relative">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Buscar atalho, rolagem ou ferramenta..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-violet-500/50"
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
                onClick={() => setActiveCategory(cat.id as any)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
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

        {/* Lista de Recursos & Dicas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3 scrollbar-thin scrollbar-thumb-white/10">
          {filteredItems.length > 0 ? (
            filteredItems.map(item => (
              <div 
                key={item.id} 
                className="bg-black/40 border border-white/10 hover:border-violet-500/30 rounded-2xl p-3.5 flex flex-col gap-1.5 transition-all group shadow-sm"
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

        {/* Rodapé Informativo */}
        <div className="px-5 py-3 border-t border-white/10 bg-white/[0.02] flex items-center justify-between text-[11px] text-white/40">
          <span>Dica: Trave a ficha (🔒) durante a partida para ativar os cliques de teste rápido.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-all cursor-pointer shadow-sm text-xs"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
