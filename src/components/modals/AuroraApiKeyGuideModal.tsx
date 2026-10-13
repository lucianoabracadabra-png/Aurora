import React from 'react';
import { X, ExternalLink, Key, Sparkles, Zap, ShieldCheck, CheckCircle2, Copy } from 'lucide-react';

export type GuideType = 'gemini' | 'groq' | 'nlp';

interface AuroraApiKeyGuideModalProps {
  type: GuideType | null;
  onClose: () => void;
  onApplyKey?: (key: string) => void;
}

export const AuroraApiKeyGuideModal: React.FC<AuroraApiKeyGuideModalProps> = ({
  type,
  onClose,
  onApplyKey
}) => {
  const [copiedLink, setCopiedLink] = React.useState(false);

  if (!type) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-3xl bg-[#090518] border border-white/15 p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(168,85,247,0.25)] flex flex-col gap-5 relative overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-20 bg-gradient-to-b from-violet-600/30 to-transparent blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border shadow-lg ${
              type === 'gemini' 
                ? 'bg-blue-500/20 border-blue-400/40 text-blue-300 shadow-blue-500/20'
                : type === 'groq'
                ? 'bg-amber-500/20 border-amber-400/40 text-amber-300 shadow-amber-500/20'
                : 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300 shadow-cyan-500/20'
            }`}>
              {type === 'gemini' && <Sparkles size={22} className="drop-shadow-[0_0_8px_currentColor]" />}
              {type === 'groq' && <Zap size={22} className="drop-shadow-[0_0_8px_currentColor]" />}
              {type === 'nlp' && <ShieldCheck size={22} className="drop-shadow-[0_0_8px_currentColor]" />}
            </div>

            <div>
              <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                {type === 'gemini' && 'Chave Gratuita: Google Gemini API'}
                {type === 'groq' && 'Chave Gratuita: Groq Cloud API'}
                {type === 'nlp' && 'Modo NLP: Offline & Sem Custos'}
              </h2>
              <p className="text-xs text-white/50">
                {type === 'gemini' && 'Modelos Gemini com Tool-Calling nativo'}
                {type === 'groq' && 'Modelos Groq com suporte a Tool-Calling'}
                {type === 'nlp' && 'Processamento determinístico local no navegador'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/50 hover:text-white transition-colors cursor-pointer"
            title="Fechar guia"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="relative z-10 flex flex-col gap-4 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
          {type === 'gemini' && (
            <>
              <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex flex-col gap-2">
                <span className="font-semibold text-blue-200 flex items-center gap-1.5">
                  <Key size={14} /> Como conseguir sua chave em 1 minuto:
                </span>
                <ol className="list-decimal list-inside space-y-2 text-white/80">
                  <li>
                    Acesse o console do <strong className="text-blue-300">Google AI Studio</strong>:
                    <a 
                      href="https://aistudio.google.com/app/apikey" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-cyan-300 underline underline-offset-2 ml-1 hover:text-white font-mono"
                    >
                      aistudio.google.com/app/apikey <ExternalLink size={11} />
                    </a>
                  </li>
                  <li>Faça login com qualquer conta Google padrão.</li>
                  <li>Clique no botão azul <strong>"Create API key"</strong> (Criar chave de API).</li>
                  <li>Copie a chave gerada (iniciada geralmente com <code className="bg-black/50 px-1 py-0.5 rounded text-blue-200">AIzaSy...</code>).</li>
                  <li>Cole no campo <strong>Chave Gemini</strong> da Aurora no topo do assistente!</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 transition-all cursor-pointer"
                >
                  <span>Abrir Google AI Studio</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </>
          )}

          {type === 'groq' && (
            <>
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-400/20 flex flex-col gap-2">
                <span className="font-semibold text-amber-200 flex items-center gap-1.5">
                  <Zap size={14} /> Como conseguir sua chave no Groq Cloud:
                </span>
                <ol className="list-decimal list-inside space-y-2 text-white/80">
                  <li>
                    Acesse o console da <strong className="text-amber-300">Groq Cloud</strong>:
                    <a 
                      href="https://console.groq.com/keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-amber-300 underline underline-offset-2 ml-1 hover:text-white font-mono"
                    >
                      console.groq.com/keys <ExternalLink size={11} />
                    </a>
                  </li>
                  <li>Faça login ou crie sua conta (pode usar login direto com Google ou GitHub).</li>
                  <li>No menu esquerdo, acesse <strong>"API Keys"</strong>.</li>
                  <li>Clique em <strong>"Create API Key"</strong>, dê um nome (ex: "Aurora RPG") e copie o token gerado (começa com <code className="bg-black/50 px-1 py-0.5 rounded text-amber-200">gsk_...</code>).</li>
                  <li>Cole no campo <strong>Chave Groq</strong> no cabeçalho da Aurora.</li>
                </ol>
              </div>

              <div className="flex gap-2">
                <a
                  href="https://console.groq.com/keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                >
                  <span>Abrir Groq Cloud Console</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            </>
          )}

          {type === 'nlp' && (
            <>
              <div className="p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-400/20 flex flex-col gap-2">
                <span className="font-semibold text-cyan-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} /> Motor NLP Local (Determinístico & Offline)
                </span>
                <p className="text-white/80">
                  O modo <strong>NLP</strong> roda 100% no seu navegador através de um interpretador de regras semânticas em português. Ele não faz requisições a servidores externos de IA e funciona até mesmo sem internet!
                </p>
              </div>

              <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 space-y-2 text-[11px] text-white/80">
                <p className="font-semibold text-cyan-300">Exemplos de comandos aceitos por voz ou texto:</p>
                <ul className="space-y-1 text-white/70">
                  <li>• <strong className="text-white">"aumente a coragem um ponto"</strong> (Personalidade)</li>
                  <li>• <strong className="text-white">"tire 6 pontos de mana física"</strong> ou <strong className="text-white">"gaste 4 de foco"</strong> (Mana)</li>
                  <li>• <strong className="text-white">"recupere toda a mana"</strong> (Restauração total)</li>
                  <li>• <strong className="text-white">"adicione 50 peças de ouro"</strong> ou <strong className="text-white">"gastei 10 de prata"</strong> (Moedas)</li>
                  <li>• <strong className="text-white">"cure a cabeça"</strong> ou <strong className="text-white">"cure todos os ferimentos"</strong> (Vida)</li>
                  <li>• <strong className="text-white">"role 1d20+5"</strong> ou <strong className="text-white">"role 2d10"</strong> (Dados)</li>
                  <li>• <strong className="text-white">"quanto de mana física eu tenho?"</strong> (Consulta)</li>
                </ul>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-all cursor-pointer"
              >
                Entendido, voltar para o assistente
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
