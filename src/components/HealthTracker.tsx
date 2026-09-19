import React from 'react';
import { BodyHealth, DamageType } from '../types';
import { Heart } from 'lucide-react';

type Props = {
  data: BodyHealth;
  update: (part: keyof BodyHealth, index: number, value: DamageType) => void;
  readonly?: boolean;
};

const DamageBox: React.FC<{ value: DamageType; onChange: (v: DamageType) => void; readonly: boolean }> = ({ value, onChange, readonly }) => {
  const colors = {
    none: `bg-white/[0.03] border-white/15 ${!readonly ? 'hover:border-white/40 hover:bg-white/[0.08]' : ''}`,
    simple: 'bg-blue-500 border-blue-300 shadow-[0_0_10px_rgba(59,130,246,0.6)]',
    lethal: 'bg-orange-500 border-orange-300 shadow-[0_0_10px_rgba(249,115,22,0.6)]',
    aggravated: 'bg-red-600 border-red-400 shadow-[0_0_10px_rgba(220,38,38,0.6)]'
  };

  const nextState: Record<DamageType, DamageType> = {
    none: 'simple',
    simple: 'lethal',
    lethal: 'aggravated',
    aggravated: 'none'
  };

  return (
    <button
      type="button"
      disabled={readonly}
      aria-label={`Damage box: ${value}`}
      className={`relative w-full aspect-square border rounded-md sm:rounded-lg flex items-center justify-center transition-all duration-150 select-none ${colors[value]} ${
        readonly ? 'opacity-80 cursor-default' : 'cursor-pointer active:scale-90 hover:scale-[1.03]'
      }`}
      onClick={() => {
        if (!readonly) onChange(nextState[value]);
      }}
    />
  );
};

const BodyPart = ({ 
  label, 
  boxes, 
  onChange, 
  readonly,
  columns = 4,
  icon
}: { 
  label: string; 
  boxes: DamageType[]; 
  onChange: (index: number, v: DamageType) => void;
  readonly: boolean;
  columns?: number;
  icon?: React.ReactNode;
}) => {
  return (
    <div className="flex flex-col justify-between bg-[#0b0813]/70 backdrop-blur-xl border border-white/10 hover:border-white/20 rounded-2xl p-2.5 sm:p-3.5 relative overflow-hidden h-full shadow-[0_4px_24px_rgba(0,0,0,0.35)] transition-all duration-300">
      <div className="absolute inset-0 bg-gradient-to-b from-rose-500/[0.03] to-transparent pointer-events-none" />
      <div className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-white/70 mb-2 text-center flex flex-col items-center gap-1 select-none relative z-10">
        {icon}
        <span>{label}</span>
      </div>
      <div 
        className="grid gap-1.5 sm:gap-2 mt-auto w-full relative z-10"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {boxes.map((val, idx) => (
          <DamageBox 
            key={idx} 
            value={val} 
            onChange={(v) => onChange(idx, v)} 
            readonly={readonly} 
          />
        ))}
      </div>
    </div>
  );
};

export const HealthTracker: React.FC<Props> = ({ data, update, readonly = false }) => {
  return (
    <div className="grid grid-cols-3 gap-2.5 sm:gap-4 w-full">
      <BodyPart 
        label="Braço Esq. (12)" 
        boxes={data.leftArm} 
        onChange={(i, v) => update('leftArm', i, v)} 
        readonly={readonly} 
      />
      <BodyPart 
        label="Cabeça (8)" 
        boxes={data.head} 
        onChange={(i, v) => update('head', i, v)} 
        readonly={readonly} 
      />
      <BodyPart 
        label="Braço Dir. (12)" 
        boxes={data.rightArm} 
        onChange={(i, v) => update('rightArm', i, v)} 
        readonly={readonly} 
      />
      
      <BodyPart 
        label="Perna Esq. (16)" 
        boxes={data.leftLeg} 
        onChange={(i, v) => update('leftLeg', i, v)} 
        readonly={readonly} 
      />
      <BodyPart 
        label="Torso (20)" 
        boxes={data.torso} 
        onChange={(i, v) => update('torso', i, v)} 
        readonly={readonly} 
      />
      <BodyPart 
        label="Perna Dir. (16)" 
        boxes={data.rightLeg} 
        onChange={(i, v) => update('rightLeg', i, v)} 
        readonly={readonly} 
      />
    </div>
  );
};
