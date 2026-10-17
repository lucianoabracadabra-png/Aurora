import React, { useState } from 'react';
import { Trash2, AlertTriangle, Key, X, Check, Loader2 } from 'lucide-react';

interface DeleteCharacterModalProps {
  isOpen: boolean;
  onClose: () => void;
  characterUsername: string;
  characterName: string;
  onConfirmDelete: (username: string, gmPassword: string) => Promise<void>;
}

export const DeleteCharacterModal: React.FC<DeleteCharacterModalProps> = ({
  isOpen,
  onClose,
  characterUsername,
  characterName,
  onConfirmDelete,
}) => {
  const [gmPassword, setGmPassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gmPassword) {
      setError('Por favor, informe a senha do Game Master.');
      return;
    }

    try {
      setIsDeleting(true);
      setError(null);
      await onConfirmDelete(characterUsername, gmPassword);
      setGmPassword('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Falha ao apagar ficha. Verifique a senha.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-[#0b0518] border border-rose-500/40 rounded-2xl max-w-md w-full p-6 shadow-[0_0_50px_rgba(244,63,94,0.3)] flex flex-col gap-4 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-rose-500/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Apagar Ficha de Personagem</span>
              </h3>
              <p className="text-xs text-rose-300/80 font-mono">
                @{characterUsername} {characterName && characterName !== characterUsername ? `(${characterName})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-white/40 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Warning text */}
        <div className="bg-rose-950/40 border border-rose-500/30 rounded-xl p-3.5 text-xs text-rose-200/90 leading-relaxed">
          <p className="font-semibold text-rose-300 mb-1">
            Atenção: Ação Irreversível!
          </p>
          <p>
            Você está prestes a apagar permanentemente a ficha do usuário{' '}
            <strong className="text-white font-mono">@{characterUsername}</strong>{' '}
            do sistema de arquivos e desvinculá-la do painel do Game Master.
          </p>
        </div>

        {error && (
          <div className="bg-rose-500/20 border border-rose-500/50 rounded-xl p-2.5 text-xs text-rose-300 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1 flex items-center gap-1.5">
              <Key size={13} className="text-amber-400" />
              <span>Digite a senha do Game Master:</span>
            </label>
            <input
              type="password"
              required
              autoFocus
              placeholder="Digite a senha do GM..."
              value={gmPassword}
              onChange={(e) => setGmPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-black/50 border border-white/20 focus:border-rose-400 rounded-xl text-white text-xs outline-none transition-colors placeholder:text-white/30"
            />
            <p className="text-[10px] text-white/40 mt-1">
              Dica: Apenas o Game Master com a credencial correta pode apagar arquivos de ficha.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/10 mt-1">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isDeleting}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white text-xs font-bold transition-all shadow-lg shadow-rose-600/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>Apagando...</span>
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  <span>Confirmar & Apagar</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
