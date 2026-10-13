import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  RotateCcw, 
  Mic, 
  MicOff, 
  Trash2, 
  Dices, 
  Zap, 
  HelpCircle,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  MessageSquare
} from 'lucide-react';
import { CharacterData } from '../types';
import { parseAndExecuteAurora, AuroraActionResult } from '../utils/auroraParser';

interface ChatMessage {
  id: string;
  sender: 'user' | 'aurora';
  text: string;
  timestamp: number;
  actionResult?: AuroraActionResult;
  isUndoAvailable?: boolean;
}

interface AuroraAssistantProps {
  characterData: CharacterData;
  onUpdateCharacterData: (updater: (prev: CharacterData) => CharacterData) => void;
  accentColor?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

export const AuroraAssistant: React.FC<AuroraAssistantProps> = ({
  characterData,
  onUpdateCharacterData,
  accentColor = '#a855f7',
  isOpen: controlledIsOpen,
  onClose
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  
  // History of changes for Undo stack
  const [undoStack, setUndoStack] = useState<{ id: string; prevData: CharacterData; description: string }[]>([]);

  // Chat message list
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    return [
      {
        id: 'welcome',
        sender: 'aurora',
        text: '✨ **Olá! Eu sou a Aurora**, sua assistente da ficha. Posso alterar atributos, gastar/recuperar mana, registrar moedas e rolar dados sem custos de IA.\n\nExperimente dizer: *"aumente a coragem um ponto"* ou *"tire 6 pontos de mana física"*.',
        timestamp: Date.now()
      }
    ];
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Setup Web Speech API if available in browser
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'pt-BR';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleExecuteCommand(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  // Focus input when opened and listen for Escape key
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        setIsListening(false);
      }
    }
  };

  const handleExecuteCommand = (commandText: string) => {
    const trimmed = commandText.trim();
    if (!trimmed) return;

    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now()
    };

    // Execute through rule-based Aurora Parser
    const result = parseAndExecuteAurora(trimmed, characterData);

    const auroraMsgId = `aurora-${Date.now() + 1}`;
    let isUndoAvailable = false;

    if (result.success && result.updatedData && result.undoData) {
      const prevDataCopy = JSON.parse(JSON.stringify(result.undoData));
      const nextDataCopy = JSON.parse(JSON.stringify(result.updatedData));
      
      // Update character data in parent App
      onUpdateCharacterData(() => nextDataCopy);

      // Push to undo stack
      setUndoStack(prev => [
        { id: auroraMsgId, prevData: prevDataCopy, description: result.description || 'Alteração na ficha' },
        ...prev
      ]);
      isUndoAvailable = true;
    }

    const auroraMsg: ChatMessage = {
      id: auroraMsgId,
      sender: 'aurora',
      text: result.message,
      timestamp: Date.now() + 1,
      actionResult: result,
      isUndoAvailable
    };

    setMessages(prev => [...prev, userMsg, auroraMsg]);
    setInput('');
  };

  const handleUndo = (msgId?: string) => {
    if (undoStack.length === 0) return;

    const [lastUndo, ...remaining] = undoStack;
    onUpdateCharacterData(() => lastUndo.prevData);
    setUndoStack(remaining);

    // Add confirmation message
    const undoMsg: ChatMessage = {
      id: `undo-${Date.now()}`,
      sender: 'aurora',
      text: `↩️ **Alteração desfeita com sucesso**: revertido *"${lastUndo.description}"*.`,
      timestamp: Date.now()
    };

    setMessages(prev => [
      ...prev.map(m => (m.id === (msgId || lastUndo.id) ? { ...m, isUndoAvailable: false } : m)),
      undoMsg
    ]);
  };

  const handleClearHistory = () => {
    setMessages([
      {
        id: 'reset',
        sender: 'aurora',
        text: '✨ Histórico de conversa limpo! Como posso te ajudar na ficha agora?',
        timestamp: Date.now()
      }
    ]);
  };

  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Backdrop para mobile (fecha ao clicar fora) */}
      <div 
        className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[55] sm:hidden animate-in fade-in duration-200"
        onClick={handleClose}
        aria-hidden="true"
      />

      <aside aria-label="Assistente Aurora" className="fixed bottom-4 sm:bottom-6 right-3 sm:right-6 z-[60] flex flex-col items-end pointer-events-auto">
        {/* Janela Modal Flutuante da Aurora */}
        <div className="w-[calc(100vw-1.5rem)] sm:w-[420px] max-w-[460px] h-[550px] max-h-[82vh] rounded-3xl bg-[#080518]/98 border border-white/15 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Cabeçalho */}
          <div className="px-4 py-3 bg-white/[0.03] border-b border-white/10 flex items-center justify-between gap-3 relative select-none">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 p-[1.5px] shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                <div className="w-full h-full rounded-full bg-[#080518] flex items-center justify-center">
                  <Sparkles size={16} className="text-cyan-300" />
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-white flex items-center gap-1">
                    Aurora
                  </h3>
                  <span className="text-[8px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono font-semibold">
                    Offline / Sem IA
                  </span>
                </div>
                <span className="text-[10px] text-white/50 tracking-tight">
                  Ficha de <strong className="text-violet-300 font-semibold">{characterData.identity?.name || 'Personagem'}</strong>
                </span>
              </div>
            </div>

          <div className="flex items-center gap-1">
            {undoStack.length > 0 && (
              <button
                type="button"
                onClick={() => handleUndo()}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-violet-300 hover:text-white transition-colors cursor-pointer"
                title={`Desfazer última alteração (${undoStack[0].description})`}
              >
                <RotateCcw size={14} />
              </button>
            )}

            <button
              type="button"
              onClick={handleClearHistory}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white transition-colors cursor-pointer"
              title="Limpar histórico"
            >
              <Trash2 size={14} />
            </button>

            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 transition-colors cursor-pointer"
              title="Fechar assistente"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Área de Mensagens (Chat feed) */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
              {messages.map((msg) => {
                const isUser = msg.sender === 'user';
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
                  >
                    <div
                      className={`max-w-[88%] rounded-2xl p-3 shadow-md backdrop-blur-md ${
                        isUser
                          ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-xs border border-violet-400/30'
                          : 'bg-white/[0.04] text-white/90 rounded-bl-xs border border-white/10'
                      }`}
                    >
                      {/* Formatação simples de markdown em negrito e quebras de linha */}
                      <div className="leading-relaxed whitespace-pre-wrap font-sans text-[11px] sm:text-xs">
                        {renderFormattedText(msg.text)}
                      </div>

                      {/* Botão de desfazer contextual */}
                      {!isUser && msg.isUndoAvailable && (
                        <div className="mt-2.5 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                          <span className="text-[9px] text-white/50 font-mono">
                            Ficha atualizada no servidor
                          </span>
                          <button
                            type="button"
                            onClick={() => handleUndo(msg.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-violet-500/20 hover:bg-violet-500/30 text-violet-300 hover:text-white border border-violet-500/30 text-[10px] font-medium transition-colors cursor-pointer"
                          >
                            <RotateCcw size={10} />
                            Desfazer
                          </button>
                        </div>
                      )}
                    </div>

                    <span className="text-[9px] text-white/30 font-mono px-1">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                );
              })}
              <div ref={chatEndRef} />
            </div>

            {/* Input de Envio com Microfone */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleExecuteCommand(input);
              }}
              className="p-3 bg-black/40 border-t border-white/10 flex items-center gap-2"
            >
              <div className="relative flex-1 flex items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={
                    isListening
                      ? '🎙️ Ouvindo comando...'
                      : 'Ex: "ei aurora, aumente a coragem um ponto"'
                  }
                  className={`w-full py-2.5 pl-3.5 pr-9 rounded-xl bg-white/[0.04] border ${
                    isListening
                      ? 'border-rose-500 bg-rose-500/10 text-rose-200 animate-pulse'
                      : 'border-white/10 focus:border-cyan-400/50'
                  } text-white placeholder-white/30 text-xs outline-none transition-all shadow-inner`}
                />

                {speechSupported && (
                  <button
                    type="button"
                    onClick={toggleListening}
                    className={`absolute right-2 p-1 rounded-lg transition-colors cursor-pointer ${
                      isListening
                        ? 'text-rose-400 bg-rose-500/20 animate-pulse'
                        : 'text-white/40 hover:text-cyan-300 hover:bg-white/10'
                    }`}
                    title={isListening ? 'Parar de ouvir' : 'Falar comando por voz'}
                  >
                    {isListening ? <MicOff size={15} /> : <Mic size={15} />}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 disabled:opacity-30 disabled:pointer-events-none text-white shadow-[0_0_15px_rgba(168,85,247,0.3)] transition-all cursor-pointer shrink-0 active:scale-95"
                title="Executar comando"
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </aside>
    </>
  );
};

// Helper simples para renderizar negrito (**bold**) e itálico (*italic*) com segurança
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    // Process **bold** and *italic*
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return (
      <React.Fragment key={lIdx}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={pIdx} className="italic text-cyan-200/90">{part.slice(1, -1)}</em>;
          }
          return part;
        })}
        {lIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}
