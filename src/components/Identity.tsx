import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Identity as IdentityType } from '../types';
import { Check, Globe2, X, Camera, ZoomIn, Upload, RotateCcw } from 'lucide-react';
import defaultPortrait from '../assets/images/character_portrait_1789770891084.jpg';

type Props = {
  data: IdentityType;
  update: (field: keyof IdentityType, value: string | string[]) => void;
  readonly?: boolean;
};

const LANGUAGE_FAMILIES = [
  { root: 'Tantumá', dialects: ['Aztanak', 'Tupaguá', 'Mayantun', 'Anaské'] },
  { root: 'Uhzdin', dialects: ['Voslank', 'Manzhufã', 'Han Gul', 'Ylavik'] },
  { root: 'Eilen', dialects: ['Piogriessini', 'Battan', 'Semoari', 'Valius'] },
  { root: "Ma'isha", dialects: ['Meemiri', 'Ofoês', 'Igbalim', 'Bagi'] },
  { root: 'Kamarin', dialects: ['Rakai', 'Mairake', 'Huo-ni'] },
  { root: 'Botokata', dialects: ['Tokamey', 'Bomatan', 'Akobo'] },
  { root: 'Dongalin', dialects: ['Kahakaka', 'Ogoron'] }
];

const InlineInput = ({ label, value, onChange, fullWidth = false, readonly = false }: { label: string; value: string; onChange: (v: string) => void, fullWidth?: boolean, readonly?: boolean }) => (
  <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-full' : ''} group`}>
    <span className="text-[10px] tracking-widest text-violet-400/60 uppercase font-medium group-focus-within:text-violet-400 transition-all drop-shadow-[0_0_8px_rgba(167,139,250,0)] group-focus-within:drop-shadow-[0_0_8px_rgba(167,139,250,0.5)]">
      {label}
    </span>
    {readonly ? (
      <div className="text-slate-200 text-sm py-1 border-b border-transparent min-w-0">
        {value || '-'}
      </div>
    ) : (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent border-b border-white/10 focus:border-violet-400 outline-none text-slate-200 text-sm py-1 transition-all w-full focus:shadow-[0_1px_8px_-2px_rgba(167,139,250,0.5)] min-w-0"
      />
    )}
  </div>
);

const LanguageSelector = ({ 
  selectedLanguages, 
  onChange,
  readonly = false
}: { 
  selectedLanguages: string[]; 
  onChange: (languages: string[]) => void;
  readonly?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleLanguage = (lang: string) => {
    if (readonly) return;
    if (selectedLanguages.includes(lang)) {
      onChange(selectedLanguages.filter(l => l !== lang));
    } else {
      onChange([...selectedLanguages, lang]);
    }
  };

  return (
    <div className="w-full col-span-full mt-1">
      <button
        id="identity-languages-button"
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(true);
        }}
        className="language-selector-container w-full py-2 px-3.5 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-violet-500/10 hover:border-violet-500/30 text-white/80 hover:text-white transition-all flex items-center justify-between group cursor-pointer"
        title="Clique para abrir o painel de idiomas"
      >
        <div className="flex items-center gap-2">
          <Globe2 size={14} className="text-violet-400 group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold tracking-wide text-white/90">Idiomas</span>
        </div>
        <span className="text-[11px] font-mono font-bold text-violet-300 bg-violet-500/15 px-2.5 py-0.5 rounded-full border border-violet-500/30 group-hover:border-violet-500/50">
          {selectedLanguages.length}
        </span>
      </button>

      {isOpen && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-md" 
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
            if (e.target === e.currentTarget) {
              setIsOpen(false);
            }
          }}
        >
          <div 
            className="bg-[#050508] border border-white/10 rounded-[2rem] w-full max-w-2xl max-h-[85vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.9)] overflow-hidden" 
            onClick={e => e.stopPropagation()}
            onMouseDown={e => e.stopPropagation()}
          >
            <div className="p-6 border-b border-white/5 bg-gradient-to-r from-violet-500/10 to-transparent relative">
               <h3 className="font-bold text-lg text-white flex items-center gap-3">
                  <Globe2 size={24} className="text-violet-400" />
                  Painel de Idiomas
               </h3>
               <p className="text-xs text-white/40 mt-2 tracking-wide">
                 {readonly ? 'Visualizando as raízes e dialetos que o personagem compreende.' : 'Selecione as raízes e dialetos que o personagem compreende.'}
               </p>
               <button 
                 onClick={(e) => {
                   e.stopPropagation();
                   setIsOpen(false);
                 }}
                 className="absolute top-6 right-6 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
               >
                 <X size={18} />
               </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LANGUAGE_FAMILIES.map(family => {
                   const isRootSelected = selectedLanguages.includes(family.root);
                   return (
                     <div key={family.root} className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 flex flex-col gap-3 transition-colors hover:bg-white/[0.03]">
                       <div 
                         className={`flex items-center justify-between p-2 -m-2 rounded-xl transition-colors ${readonly ? 'cursor-default' : 'cursor-pointer hover:bg-white/5'}`}
                         onClick={() => toggleLanguage(family.root)}
                       >
                          <span className={`font-bold text-sm tracking-wide ${isRootSelected ? 'text-violet-300 drop-shadow-[0_0_8px_currentColor]' : 'text-slate-300'}`}>{family.root}</span>
                          <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all flex-shrink-0 ${isRootSelected ? 'bg-violet-500 border-violet-400 shadow-[0_0_8px_rgba(139,92,246,0.6)]' : 'border-white/20 bg-black/20'} ${readonly && !isRootSelected ? 'opacity-30' : ''}`}>
                            {isRootSelected && <Check size={12} className="text-white" />}
                          </div>
                       </div>
                       
                       <div className="flex flex-wrap gap-1.5 pt-3 border-t border-white/5">
                          {family.dialects.map(dialect => {
                            const isSelected = selectedLanguages.includes(dialect);
                            return (
                              <button
                                key={dialect}
                                onClick={() => toggleLanguage(dialect)}
                                disabled={readonly}
                                className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-1.5 rounded-lg border transition-all ${
                                  isSelected 
                                    ? 'bg-violet-500/20 text-violet-300 border-violet-500/50 shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                                    : 'bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/5 hover:text-slate-300'
                                } ${readonly ? 'cursor-default' : 'cursor-pointer'} ${readonly && !isSelected ? 'opacity-40' : ''}`}
                              >
                                {dialect}
                              </button>
                            );
                          })}
                       </div>
                     </div>
                   );
                })}
              </div>
            </div>
            
            <div className="p-6 border-t border-white/5 bg-white/[0.01]">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="w-full py-4 rounded-xl bg-violet-500 text-white font-bold text-xs uppercase tracking-widest hover:bg-violet-400 transition-colors shadow-[0_0_20px_rgba(139,92,246,0.3)]"
              >
                Fechar Painel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export const Identity: React.FC<Props & { expanded?: boolean }> = ({ data, update, readonly = false, expanded = true }) => {
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const imageSrc = data.avatarUrl || defaultPortrait;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (typeof event.target?.result === 'string') {
          update('avatarUrl', event.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="relative">
      <input 
        type="file" 
        ref={fileInputRef} 
        accept="image/*" 
        onChange={handleFileUpload} 
        className="hidden" 
      />

      {expanded ? (
        <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
          {/* Retrato 16:9 Vertical */}
          <div className="identity-image-container flex flex-col items-center shrink-0">
            <div 
              id="character-portrait-card"
              className="relative aspect-[9/16] w-36 sm:w-40 md:w-44 rounded-2xl overflow-hidden border border-white/10 bg-black/60 shadow-[0_12px_32px_rgba(0,0,0,0.7)] group/portrait cursor-pointer select-none transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_12px_32px_rgba(139,92,246,0.25)]"
              onClick={(e) => {
                e.stopPropagation();
                setShowLightbox(true);
              }}
              title={readonly ? "Clique para ver em tela cheia (16:9 vertical)" : "Retrato do Personagem (16:9 vertical)"}
            >
              <img 
                src={imageSrc} 
                alt={data.name || 'Retrato do Personagem'} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition-transform duration-500 group-hover/portrait:scale-105" 
              />
              
              {/* Degradê superior e inferior */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30 pointer-events-none" />

              {/* Ícone de zoom para abrir lightbox */}
              <div className="absolute top-2 right-2 p-1.5 rounded-md bg-black/50 backdrop-blur-md border border-white/10 text-white/70 opacity-0 group-hover/portrait:opacity-100 transition-opacity">
                <ZoomIn size={12} />
              </div>

              {/* Nome do personagem no rodapé do retrato */}
              <div className="absolute bottom-2.5 inset-x-2 text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold tracking-widest text-violet-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] truncate block">
                  {data.name || 'Personagem'}
                </span>
              </div>

              {/* Botão de edição sobre a imagem quando não readonly */}
              {!readonly && (
                <div 
                  className="absolute inset-0 bg-black/60 backdrop-blur-[2px] opacity-0 group-hover/portrait:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  <div className="p-2.5 rounded-full bg-violet-500/90 text-white shadow-[0_0_15px_rgba(139,92,246,0.6)]">
                    <Camera size={18} />
                  </div>
                  <span className="text-[10px] text-white font-semibold uppercase tracking-wider text-center">
                    Trocar Foto
                  </span>
                </div>
              )}
            </div>

            {/* Ações da imagem no modo edição */}
            {!readonly && (
              <div className="flex items-center gap-1.5 mt-2 w-full justify-center">
                <button
                  id="btn-upload-portrait"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="text-[10px] py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  title="Carregar arquivo de imagem do dispositivo"
                >
                  <Upload size={11} />
                  <span>Upload</span>
                </button>
                
                <button
                  id="btn-url-portrait"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    const url = window.prompt("Digite a URL da imagem (16:9 vertical):", data.avatarUrl || '');
                    if (url !== null && url.trim()) update('avatarUrl', url.trim());
                  }}
                  className="text-[10px] py-1 px-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                  title="Colar link de imagem da web"
                >
                  <span>URL</span>
                </button>

                {data.avatarUrl && data.avatarUrl !== defaultPortrait && (
                  <button
                    id="btn-reset-portrait"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      update('avatarUrl', defaultPortrait);
                    }}
                    className="text-[10px] p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 text-white/50 transition-colors cursor-pointer"
                    title="Restaurar imagem padrão"
                  >
                    <RotateCcw size={11} />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Campos de Identidade ao lado */}
          <div className="flex-1 min-w-0 w-full grid grid-cols-2 gap-x-4 gap-y-3">
            <InlineInput fullWidth label="Nome" value={data.name} onChange={(v) => update('name', v)} readonly={readonly} />
            <InlineInput label="Altura" value={data.height} onChange={(v) => update('height', v)} readonly={readonly} />
            <InlineInput label="Peso" value={data.weight} onChange={(v) => update('weight', v)} readonly={readonly} />
            <InlineInput label="Cabelo" value={data.hair} onChange={(v) => update('hair', v)} readonly={readonly} />
            <InlineInput label="Olhos" value={data.eyes} onChange={(v) => update('eyes', v)} readonly={readonly} />
            <InlineInput label="Pele" value={data.skin} onChange={(v) => update('skin', v)} readonly={readonly} />
            <InlineInput label="Idade" value={data.age} onChange={(v) => update('age', v)} readonly={readonly} />
            <InlineInput fullWidth label="Ideais" value={data.ideals} onChange={(v) => update('ideals', v)} readonly={readonly} />
            <InlineInput fullWidth label="Origem" value={data.origin} onChange={(v) => update('origin', v)} readonly={readonly} />
            <LanguageSelector selectedLanguages={data.languages} onChange={(v) => update('languages', v)} readonly={readonly} />
          </div>
        </div>
      ) : (
        /* Modo recolhido */
        <div className="flex gap-4 items-center">
          <div 
            id="character-portrait-thumb"
            className="identity-image-container relative aspect-[9/16] w-14 sm:w-16 rounded-xl overflow-hidden border border-white/10 bg-black/40 shadow-md shrink-0 cursor-pointer group/thumb hover:border-violet-400/40 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setShowLightbox(true);
            }}
            title="Clique para ver o retrato completo (16:9 vertical)"
          >
            <img 
              src={imageSrc} 
              alt={data.name || 'Retrato'} 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-300" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />
          </div>

          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <InlineInput fullWidth label="Nome" value={data.name} onChange={(v) => update('name', v)} readonly={readonly} />
            <InlineInput fullWidth label="Ideais" value={data.ideals} onChange={(v) => update('ideals', v)} readonly={readonly} />
            <LanguageSelector selectedLanguages={data.languages} onChange={(v) => update('languages', v)} readonly={readonly} />
          </div>
        </div>
      )}

      {/* Lightbox / Visualização em tela cheia do retrato */}
      {showLightbox && typeof document !== 'undefined' && createPortal(
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
          onClick={(e) => {
            e.stopPropagation();
            setShowLightbox(false);
          }}
        >
          <div 
            className="relative flex flex-col items-center max-h-[92vh] max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              id="close-portrait-lightbox"
              onClick={() => setShowLightbox(false)}
              className="absolute -top-11 right-0 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Fechar"
            >
              <X size={18} />
            </button>

            <div className="relative aspect-[9/16] w-full rounded-2xl overflow-hidden border border-violet-500/30 shadow-[0_0_50px_rgba(139,92,246,0.3)] bg-black">
              <img 
                src={imageSrc} 
                alt={data.name || 'Retrato'} 
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
              <div className="absolute bottom-4 inset-x-4 text-center">
                <h4 className="text-sm uppercase font-bold tracking-widest text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                  {data.name || 'Personagem'}
                </h4>
                {data.origin && (
                  <p className="text-[11px] text-white/60 tracking-wider mt-0.5">
                    {data.origin}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
