import React, { useState } from 'react';
import { X } from 'lucide-react';
import { DotRating } from './DotRating';
import { CustomSkill } from '../types';

export interface CustomSkillsSectionProps {
  title: string;
  skills: CustomSkill[];
  add: (name: string) => void;
  update: (id: string, v: number) => void;
  remove: (id: string) => void;
  readonly: boolean;
  theme: 'rose' | 'cyan' | 'emerald';
  onRoll?: (name: string, value: number) => void;
}

export const CustomSkillsSection: React.FC<CustomSkillsSectionProps> = ({
  title,
  skills,
  add,
  update,
  remove,
  readonly,
  theme,
  onRoll
}) => {
  const [newSkill, setNewSkill] = useState('');
  const titleColors = {
    rose: 'text-rose-400/60',
    cyan: 'text-cyan-400/60',
    emerald: 'text-emerald-400/60'
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className={`text-[10px] tracking-widest uppercase font-medium ${titleColors[theme]}`}>{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        {skills.map(s => (
          <div key={s.id} className="relative group">
            <DotRating 
              label={s.name} 
              value={s.value} 
              onChange={(v) => update(s.id, v)} 
              theme={theme} 
              readonly={readonly} 
              onRoll={onRoll ? () => onRoll(s.name, s.value) : undefined}
            />
            {!readonly && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  remove(s.id);
                }} 
                className="absolute -right-2 -top-2 w-6 h-6 bg-red-600/90 hover:bg-red-500 text-white rounded-full flex items-center justify-center shadow-[0_0_10px_rgba(239,68,68,0.6)] z-20 cursor-pointer transition-all hover:scale-110 active:scale-90 border border-white/20"
                title={`Excluir perícia ${s.name}`}
                aria-label={`Excluir perícia ${s.name}`}
              >
                <X size={12} className="stroke-[3]" />
              </button>
            )}
          </div>
        ))}
      </div>
      {!readonly && (
        <div className="flex gap-2 items-center">
          <input 
            type="text" 
            placeholder="Vazio" 
            value={newSkill} 
            onChange={e => setNewSkill(e.target.value)} 
            className="bg-transparent border-b border-white/10 text-xs px-2 py-1.5 text-white flex-1 focus:outline-none focus:border-white/30" 
          />
          <button 
            type="button"
            onClick={() => { if(newSkill) { add(newSkill); setNewSkill(''); } }} 
            className="text-[10px] uppercase font-bold tracking-widest bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded transition-colors text-white/70 cursor-pointer"
          >
            Add
          </button>
        </div>
      )}
    </div>
  );
};
