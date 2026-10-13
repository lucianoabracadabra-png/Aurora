import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, 
  Send, 
  X, 
  RotateCcw, 
  Mic, 
  MicOff, 
  Trash2, 
  Zap, 
  Key, 
  ShieldCheck, 
  ExternalLink, 
  Loader2, 
  Eye, 
  EyeOff
} from 'lucide-react';
import { CharacterData } from '../types';
import { parseAndExecuteAurora } from '../utils/auroraParser';
import { executeAuroraTool, buildCharacterContext, safeJsonParse, ToolExecutionResult } from '../utils/auroraTools';
import { AuroraApiKeyGuideModal, GuideType } from './modals/AuroraApiKeyGuideModal';

export type AuroraProvider = 'nlp' | 'gemini' | 'groq';

interface ChatMessage {
  id: string;
  sender: 'user' | 'aurora';
  text: string;
  timestamp: number;
  provider?: AuroraProvider;
  toolResults?: ToolExecutionResult[];
  isUndoAvailable?: boolean;
  error?: boolean;
}

interface AuroraAssistantProps {
  characterData: CharacterData;
  onUpdateCharacterData: (updater: (prev: CharacterData) => CharacterData) => void;
  accentColor?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const defaultWelcomeMessages: Record<AuroraProvider, ChatMessage[]> = {
  nlp: [
    {
      id: 'welcome-nlp',
      sender: 'aurora',
      provider: 'nlp',
      text: '✨ **Olá! Eu sou a Aurora (Modo NLP)**.\n\nNeste chat opero com **regras determinísticas locais 100% offline**, sem custos e sem enviar dados para a internet.\n\nExperimente dizer: *"aumente a coragem um ponto"*, *"tire 6 pontos de mana física"* ou *"adicione 50 peças de ouro"*.',
      timestamp: Date.now()
    }
  ],
  gemini: [
    {
      id: 'welcome-gemini',
      sender: 'aurora',
      provider: 'gemini',
      text: '✨ **Olá! Eu sou a Aurora (Modo Gemini API)**.\n\nConectada aos modelos **Gemini** com **Tool-Calling** nativo para ler ou alterar absolutamente todos os campos da ficha (idiomas, atributos, perícias, inventário, moedas, mana, etc.) e rolar dados.\n\nFale ou digite qualquer comando ou pergunte sobre sua ficha!',
      timestamp: Date.now()
    }
  ],
  groq: [
    {
      id: 'welcome-groq',
      sender: 'aurora',
      provider: 'groq',
      text: '⚡ **Olá! Eu sou a Aurora (Modo Groq API)**.\n\nProcessamento com modelos Groq (**openai/gpt-oss-120b, qwen/qwen3.8-27b, openai/gpt-oss-20b**) com suporte completo a comandos e leitura/edição de todos os campos da ficha.\n\nComo posso te ajudar agora?',
      timestamp: Date.now()
    }
  ]
};

export const GEMINI_AVAILABLE_MODELS = [
  { id: 'models/gemini-2.5-flash', name: 'models/gemini-2.5-flash (Padrão)', label: 'Gemini 2.5 Flash' },
  { id: 'models/gemini-3.8-flash', name: 'models/gemini-3.8-flash', label: 'Gemini 3.8 Flash' },
  { id: 'models/gemini-3.1-pro-preview', name: 'models/gemini-3.1-pro-preview', label: 'Gemini 3.1 Pro' },
];

export const GROQ_AVAILABLE_MODELS = [
  { id: 'openai/gpt-oss-120b', name: 'openai/gpt-oss-120b (Padrão)', label: 'GPT-OSS 120B' },
  { id: 'qwen/qwen3.8-27b', name: 'qwen/qwen3.8-27b', label: 'Qwen 3.8 27B' },
  { id: 'openai/gpt-oss-20b', name: 'openai/gpt-oss-20b', label: 'GPT-OSS 20B' },
];

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

  // Provider Mode Selection: NLP | GeminiAPI | GroqAPI
  const [provider, setProvider] = useState<AuroraProvider>(() => {
    try {
      const saved = localStorage.getItem('arcana_aurora_provider');
      if (saved === 'gemini' || saved === 'groq' || saved === 'nlp') return saved;
    } catch {}
    return 'nlp';
  });

  // Model Selection per provider (first is default)
  const [geminiModel, setGeminiModel] = useState<string>(() => {
    try {
      return localStorage.getItem('arcana_aurora_gemini_model') || GEMINI_AVAILABLE_MODELS[0].id;
    } catch {
      return GEMINI_AVAILABLE_MODELS[0].id;
    }
  });

  const [groqModel, setGroqModel] = useState<string>(() => {
    try {
      return localStorage.getItem('arcana_aurora_groq_model') || GROQ_AVAILABLE_MODELS[0].id;
    } catch {
      return GROQ_AVAILABLE_MODELS[0].id;
    }
  });

  // API Keys stored safely in localStorage
  const [geminiKey, setGeminiKey] = useState<string>(() => {
    try {
      return localStorage.getItem('arcana_aurora_gemini_key') || '';
    } catch {
      return '';
    }
  });

  const [groqKey, setGroqKey] = useState<string>(() => {
    try {
      return localStorage.getItem('arcana_aurora_groq_key') || '';
    } catch {
      return '';
    }
  });

  // UI state for key configuration panel and guide modal
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [showKeySecret, setShowKeySecret] = useState(false);
  const [guideModalType, setGuideModalType] = useState<GuideType | null>(null);

  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isThinking, setIsThinking] = useState(false);

  // Undo stack
  const [undoStack, setUndoStack] = useState<{ id: string; prevData: CharacterData; description: string }[]>([]);

  // CHATS ISOLADOS POR PROVEDOR (NLP / Gemini / Groq)
  const [messagesByProvider, setMessagesByProvider] = useState<Record<AuroraProvider, ChatMessage[]>>(() => {
    try {
      const saved = localStorage.getItem('arcana_aurora_chats_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            nlp: Array.isArray(parsed.nlp) && parsed.nlp.length > 0 ? parsed.nlp : defaultWelcomeMessages.nlp,
            gemini: Array.isArray(parsed.gemini) && parsed.gemini.length > 0 ? parsed.gemini : defaultWelcomeMessages.gemini,
            groq: Array.isArray(parsed.groq) && parsed.groq.length > 0 ? parsed.groq : defaultWelcomeMessages.groq
          };
        }
      }
    } catch {}
    return defaultWelcomeMessages;
  });

  // Active messages list for current selected tab
  const activeMessages = messagesByProvider[provider] || defaultWelcomeMessages[provider];

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Save provider mode when changed
  useEffect(() => {
    try {
      localStorage.setItem('arcana_aurora_provider', provider);
    } catch {}
  }, [provider]);

  // Sync isolated chats to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('arcana_aurora_chats_v2', JSON.stringify(messagesByProvider));
    } catch {}
  }, [messagesByProvider]);

  // Save keys when changed
  useEffect(() => {
    try {
      localStorage.setItem('arcana_aurora_gemini_key', geminiKey);
    } catch {}
  }, [geminiKey]);

  useEffect(() => {
    try {
      localStorage.setItem('arcana_aurora_groq_key', groqKey);
    } catch {}
  }, [groqKey]);

  // Setup Web Speech API if available
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

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  // Auto-scroll on new messages or tab change
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeMessages, provider, isOpen, isThinking]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !guideModalType) {
          handleClose();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, guideModalType]);

  const toggleListening = () => {
    if (!speechSupported || !recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  // Main command executor supporting NLP / Gemini / Groq with isolated chats
  const handleExecuteCommand = async (commandText: string) => {
    const trimmed = commandText.trim();
    if (!trimmed || isThinking) return;

    const currentTab = provider;
    const userMsgId = `user-${Date.now()}`;
    const userMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text: trimmed,
      timestamp: Date.now()
    };

    // Update active tab's isolated message list
    setMessagesByProvider((prev) => ({
      ...prev,
      [currentTab]: [...(prev[currentTab] || []), userMsg]
    }));
    setInput('');

    // --- MODE 1: NLP (OFFLINE & DETERMINISTIC) ---
    if (currentTab === 'nlp') {
      const result = parseAndExecuteAurora(trimmed, characterData);
      const auroraMsgId = `aurora-${Date.now() + 1}`;
      let isUndoAvailable = false;

      if (result.success && result.updatedData && result.undoData) {
        const prevCopy = safeJsonParse(JSON.stringify(result.undoData), result.undoData);
        const nextCopy = safeJsonParse(JSON.stringify(result.updatedData), result.updatedData);

        onUpdateCharacterData(() => nextCopy);

        setUndoStack((prev) => [
          { id: auroraMsgId, prevData: prevCopy, description: result.description || 'Alteração na ficha' },
          ...prev
        ]);
        isUndoAvailable = true;
      }

      const auroraMsg: ChatMessage = {
        id: auroraMsgId,
        sender: 'aurora',
        provider: 'nlp',
        text: result.message,
        timestamp: Date.now() + 1,
        isUndoAvailable
      };

      setMessagesByProvider((prev) => ({
        ...prev,
        nlp: [...(prev.nlp || []), auroraMsg]
      }));
      return;
    }

    // --- MODE 2 & 3: LLM WITH FUNCTION CALLING (GEMINI / GROQ) ---
    setIsThinking(true);

    try {
      const activeKey = currentTab === 'gemini' ? geminiKey.trim() : groqKey.trim();
      const characterContext = buildCharacterContext(characterData);

      // History specific to the active isolated tab
      const currentTabHistory = (messagesByProvider[currentTab] || []).slice(-8).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));
      currentTabHistory.push({ role: 'user', content: trimmed });

      const response = await fetch('/api/aurora/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: currentTab,
          apiKey: activeKey,
          messages: currentTabHistory,
          characterContext,
          model: currentTab === 'gemini' ? geminiModel : groqModel
        })
      });

      const responseText = await response.text();
      let resData: any = {};
      try {
        resData = JSON.parse(responseText);
      } catch (e) {
        throw new Error('Falha ao processar resposta do servidor.');
      }

      if (!response.ok || !resData.success) {
        throw new Error(resData?.error || `Erro de conexão (${response.status})`);
      }

      const auroraMsgId = `aurora-${Date.now() + 1}`;
      const toolCalls = resData.toolCalls || [];
      const toolResults: ToolExecutionResult[] = [];
      let latestSheet = safeJsonParse(JSON.stringify(characterData), characterData);
      let didModifySheet = false;
      const initialUndoSnapshot = safeJsonParse(JSON.stringify(characterData), characterData);
      const actionDescriptions: string[] = [];

      // Execute each tool call safely with validation
      if (Array.isArray(toolCalls) && toolCalls.length > 0) {
        for (const tc of toolCalls) {
          const execRes = executeAuroraTool(tc.name, tc.args, latestSheet);
          toolResults.push(execRes);
          if (execRes.success && execRes.updatedData) {
            latestSheet = execRes.updatedData;
            didModifySheet = true;
            if (execRes.description) {
              actionDescriptions.push(execRes.description);
            }
          }
        }
      }

      let isUndoAvailable = false;
      if (didModifySheet) {
        onUpdateCharacterData(() => latestSheet);
        setUndoStack((prev) => [
          {
            id: auroraMsgId,
            prevData: initialUndoSnapshot,
            description: actionDescriptions.join('; ') || 'Alteração via LLM'
          },
          ...prev
        ]);
        isUndoAvailable = true;
      }

      // Format response text with tool badges
      let finalText = resData.text || '';
      if (toolResults.length > 0) {
        const toolBadgeText = toolResults
          .map((tr) => (tr.success ? `✨ ${tr.message}` : `⚠️ ${tr.message}`))
          .join('\n');
        finalText = finalText ? `${finalText}\n\n${toolBadgeText}` : toolBadgeText;
      }

      if (!finalText.trim()) {
        finalText = 'Comando processado com sucesso na ficha.';
      }

      const auroraMsg: ChatMessage = {
        id: auroraMsgId,
        sender: 'aurora',
        provider: currentTab,
        text: finalText,
        timestamp: Date.now() + 1,
        toolResults,
        isUndoAvailable
      };

      setMessagesByProvider((prev) => ({
        ...prev,
        [currentTab]: [...(prev[currentTab] || []), auroraMsg]
      }));
    } catch (err: any) {
      console.error('[Aurora Assistant Error]', err);
      const errorMsgId = `aurora-err-${Date.now()}`;
      const errorMsg: ChatMessage = {
        id: errorMsgId,
        sender: 'aurora',
        provider: currentTab,
        text: `⚠️ **Aviso da Aurora**: ${err?.message || 'Falha ao processar o comando com a IA.'}\n\nVerifique sua chave de API ou experimente o modo **NLP (Offline)** caso a conexão oscile.`,
        timestamp: Date.now(),
        error: true
      };
      setMessagesByProvider((prev) => ({
        ...prev,
        [currentTab]: [...(prev[currentTab] || []), errorMsg]
      }));
    } finally {
      setIsThinking(false);
    }
  };

  const handleUndo = (msgId?: string) => {
    if (undoStack.length === 0) return;

    const [lastUndo, ...remaining] = undoStack;
    onUpdateCharacterData(() => lastUndo.prevData);
    setUndoStack(remaining);

    const undoMsg: ChatMessage = {
      id: `undo-${Date.now()}`,
      sender: 'aurora',
      provider,
      text: `↩️ **Alteração desfeita com sucesso**: revertido *"${lastUndo.description}"*.`,
      timestamp: Date.now()
    };

    setMessagesByProvider((prev) => ({
      ...prev,
      [provider]: (prev[provider] || []).map((m) =>
        m.id === (msgId || lastUndo.id) ? { ...m, isUndoAvailable: false } : m
      ).concat(undoMsg)
    }));
  };

  // Limpa apenas o histórico da aba atualmente ativa
  const handleClearHistory = () => {
    setMessagesByProvider((prev) => ({
      ...prev,
      [provider]: defaultWelcomeMessages[provider]
    }));
  };

  if (!isOpen) return null;

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
        <div className="w-[calc(100vw-1.5rem)] sm:w-[440px] max-w-[480px] h-[580px] max-h-[85vh] rounded-3xl bg-[#080518]/98 border border-white/15 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(168,85,247,0.3)] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          
          {/* Cabeçalho */}
          <div className="px-3.5 py-2.5 bg-white/[0.03] border-b border-white/10 flex items-center justify-between gap-2.5 relative select-none">
            <div className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full p-[1.5px] transition-all ${
                provider === 'gemini'
                  ? 'bg-gradient-to-br from-blue-500 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                  : provider === 'groq'
                  ? 'bg-gradient-to-br from-amber-500 via-orange-500 to-yellow-400 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                  : 'bg-gradient-to-br from-violet-500 via-indigo-500 to-cyan-400 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
              }`}>
                <div className="w-full h-full rounded-full bg-[#080518] flex items-center justify-center">
                  {provider === 'gemini' && <Sparkles size={15} className="text-blue-300" />}
                  {provider === 'groq' && <Zap size={15} className="text-amber-300" />}
                  {provider === 'nlp' && <ShieldCheck size={15} className="text-cyan-300" />}
                </div>
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <h3 className="text-xs font-bold tracking-wider uppercase text-white flex items-center gap-1">
                    Aurora
                  </h3>
                  <span className={`text-[8px] px-1.5 py-0.2 rounded border font-mono font-semibold ${
                    provider === 'gemini'
                      ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                      : provider === 'groq'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30'
                  }`}>
                    {provider === 'gemini'
                      ? (GEMINI_AVAILABLE_MODELS.find(m => m.id === geminiModel)?.label || 'Gemini 2.5 Flash')
                      : provider === 'groq'
                      ? (GROQ_AVAILABLE_MODELS.find(m => m.id === groqModel)?.label || 'GPT-OSS 120B')
                      : 'NLP Offline'}
                  </span>
                </div>
                <span className="text-[10px] text-white/50 tracking-tight">
                  Chat isolado: <strong className="text-violet-300 font-semibold">{provider.toUpperCase()}</strong>
                </span>
              </div>
            </div>

            {/* Ações do cabeçalho */}
            <div className="flex items-center gap-1">
              {(provider === 'gemini' || provider === 'groq') && (
                <button
                  type="button"
                  onClick={() => setShowKeyConfig(!showKeyConfig)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                    showKeyConfig
                      ? 'bg-violet-500/30 text-white'
                      : (provider === 'gemini' ? geminiKey : groqKey)
                      ? 'bg-white/5 text-emerald-300 hover:bg-white/10'
                      : 'bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 animate-pulse'
                  }`}
                  title="Configurar Chave de API"
                >
                  <Key size={13} />
                </button>
              )}

              {undoStack.length > 0 && (
                <button
                  type="button"
                  onClick={() => handleUndo()}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-violet-300 hover:text-white transition-colors cursor-pointer"
                  title={`Desfazer última alteração (${undoStack[0].description})`}
                >
                  <RotateCcw size={13} />
                </button>
              )}

              <button
                type="button"
                onClick={handleClearHistory}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/40 hover:text-white transition-colors cursor-pointer"
                title={`Limpar histórico da aba ${provider.toUpperCase()}`}
              >
                <Trash2 size={13} />
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-white/60 hover:text-rose-300 transition-colors cursor-pointer"
                title="Fechar assistente"
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* BARRA DE SELEÇÃO DE PROVEDOR: 3 CHATS ISOLADOS (NLP / GeminiAPI / GroqAPI) */}
          <div className="px-3 pt-2.5 pb-2 bg-black/40 border-b border-white/5 flex flex-col gap-1.5">
            <div 
              className="grid grid-cols-3 gap-1 p-1 bg-white/[0.03] border border-white/10 rounded-xl"
              role="tablist"
              aria-label="Escolher Modo da Aurora"
            >
              <button
                type="button"
                onClick={() => setProvider('nlp')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  provider === 'nlp'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="Chat NLP (Regras determinísticas offline sem IA)"
              >
                <ShieldCheck size={12} className="shrink-0" />
                <span>NLP</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('gemini')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  provider === 'gemini'
                    ? 'bg-blue-600/30 text-blue-200 border border-blue-400/50 shadow-[0_0_12px_rgba(59,130,246,0.35)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="Chat GeminiAPI (Google Gemini com Tool Calling)"
              >
                <Sparkles size={12} className="shrink-0" />
                <span>GeminiAPI</span>
              </button>

              <button
                type="button"
                onClick={() => setProvider('groq')}
                className={`py-1.5 px-2 rounded-lg text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  provider === 'groq'
                    ? 'bg-amber-600/30 text-amber-200 border border-amber-400/50 shadow-[0_0_12px_rgba(245,158,11,0.35)]'
                    : 'text-white/50 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
                title="Chat GroqAPI (Groq Llama 3.1 com resposta em milissegundos)"
              >
                <Zap size={12} className="shrink-0" />
                <span>GroqAPI</span>
              </button>
            </div>

            {/* LINKS PARA CADA RESPECTIVO MODAL MINI-GUIA ONDE PEGAR AS CHAVES GRATUITAS */}
            <div className="flex items-center justify-between px-1 text-[10px] text-white/50">
              <button
                type="button"
                onClick={() => setGuideModalType('nlp')}
                className="hover:text-cyan-300 transition-colors flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                title="Abrir guia do modo NLP"
              >
                <span>ℹ️ Guia NLP</span>
              </button>

              <button
                type="button"
                onClick={() => setGuideModalType('gemini')}
                className="hover:text-blue-300 transition-colors flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                title="Abrir guia para pegar chave grátis do Gemini"
              >
                <span>🔑 Chave Gemini Grátis</span>
              </button>

              <button
                type="button"
                onClick={() => setGuideModalType('groq')}
                className="hover:text-amber-300 transition-colors flex items-center gap-1 underline underline-offset-2 cursor-pointer"
                title="Abrir guia para pegar chave grátis do Groq"
              >
                <span>⚡ Chave Groq Grátis</span>
              </button>
            </div>

            {/* PAINEL CONFIGURAÇÃO DE CHAVE (QUANDO GEMINI OU GROQ ATIVO) */}
            {(showKeyConfig || ((provider === 'gemini' && !geminiKey) || (provider === 'groq' && !groqKey))) && (
              <div className="p-2 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col gap-1.5 mt-1 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-white/80 flex items-center gap-1">
                    <Key size={11} className={provider === 'gemini' ? 'text-blue-400' : 'text-amber-400'} />
                    {provider === 'gemini' ? 'Chave Gemini API:' : 'Chave Groq API:'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setGuideModalType(provider === 'gemini' ? 'gemini' : 'groq')}
                    className="text-[9px] text-cyan-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                  >
                    Onde pegar grátis? <ExternalLink size={9} />
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  <div className="relative flex-1">
                    <input
                      type={showKeySecret ? 'text' : 'password'}
                      value={provider === 'gemini' ? geminiKey : groqKey}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (provider === 'gemini') setGeminiKey(val);
                        else setGroqKey(val);
                      }}
                      placeholder={
                        provider === 'gemini'
                          ? 'AIzaSy... (ou deixe vazio para usar do ambiente)'
                          : 'gsk_... (insira sua chave Groq)'
                      }
                      className="w-full py-1.5 pl-2.5 pr-8 rounded-lg bg-black/50 border border-white/10 text-white placeholder-white/30 text-[11px] font-mono outline-none focus:border-cyan-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKeySecret(!showKeySecret)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-white/40 hover:text-white cursor-pointer"
                      title={showKeySecret ? 'Ocultar' : 'Exibir'}
                    >
                      {showKeySecret ? <EyeOff size={12} /> : <Eye size={12} />}
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowKeyConfig(false)}
                    className="px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium transition-colors cursor-pointer"
                  >
                    Pronto
                  </button>
                </div>

                {/* Seleção de Modelo para Groq ou Gemini */}
                <div className="flex flex-col gap-1 pt-1.5 border-t border-white/5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/80 font-semibold flex items-center gap-1">
                      <span>Modelo:</span>
                    </span>
                    <span className="text-cyan-300 text-[9px] font-mono">
                      {provider === 'gemini' ? 'Padrão: models/gemini-2.5-flash' : 'Padrão: openai/gpt-oss-120b'}
                    </span>
                  </div>

                  <select
                    value={provider === 'gemini' ? geminiModel : groqModel}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (provider === 'gemini') {
                        setGeminiModel(val);
                        try { localStorage.setItem('arcana_aurora_gemini_model', val); } catch {}
                      } else {
                        setGroqModel(val);
                        try { localStorage.setItem('arcana_aurora_groq_model', val); } catch {}
                      }
                    }}
                    className="w-full py-1.5 px-2 rounded-lg bg-black/60 border border-white/10 text-white text-[11px] font-mono outline-none focus:border-cyan-400/50 cursor-pointer"
                  >
                    {provider === 'gemini'
                      ? GEMINI_AVAILABLE_MODELS.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#0b081e] text-white">
                            {m.name}
                          </option>
                        ))
                      : GROQ_AVAILABLE_MODELS.map((m) => (
                          <option key={m.id} value={m.id} className="bg-[#0b081e] text-white">
                            {m.name}
                          </option>
                        ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Área de Mensagens (Chat feed isolado para o provedor atual) */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3 text-xs">
            {activeMessages.map((msg) => {
              const isUser = msg.sender === 'user';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} gap-1`}
                >
                  <div
                    className={`max-w-[90%] rounded-2xl p-3 shadow-md backdrop-blur-md transition-all ${
                      isUser
                        ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-br-xs border border-violet-400/30'
                        : msg.error
                        ? 'bg-rose-950/40 text-rose-200 rounded-bl-xs border border-rose-500/40'
                        : 'bg-white/[0.04] text-white/90 rounded-bl-xs border border-white/10'
                    }`}
                  >
                    {/* Badge do provedor se for mensagem da Aurora */}
                    {!isUser && msg.provider && (
                      <div className="mb-1.5 flex items-center gap-1">
                        <span className={`text-[8px] px-1 py-0.2 rounded font-mono font-medium border ${
                          msg.provider === 'gemini'
                            ? 'bg-blue-500/15 text-blue-300 border-blue-500/25'
                            : msg.provider === 'groq'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/25'
                            : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/25'
                        }`}>
                          {msg.provider.toUpperCase()}
                        </span>
                      </div>
                    )}

                    {/* Texto formatado */}
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

            {/* Indicador de processamento da IA */}
            {isThinking && (
              <div className="flex flex-col items-start gap-1 animate-in fade-in duration-200">
                <div className="max-w-[85%] rounded-2xl rounded-bl-xs p-3 bg-white/[0.04] border border-white/10 text-white/80 shadow-md flex items-center gap-2.5">
                  <Loader2 size={14} className="text-cyan-400 animate-spin" />
                  <span className="text-xs text-white/70 italic">
                    {provider === 'gemini'
                      ? 'Aurora consultando Gemini API e preparando ferramentas...'
                      : 'Aurora processando comando via Groq LPU...'}
                  </span>
                </div>
              </div>
            )}

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
                disabled={isThinking}
                placeholder={
                  isListening
                    ? '🎙️ Ouvindo comando...'
                    : isThinking
                    ? 'Aguarde a resposta da Aurora...'
                    : provider === 'nlp'
                    ? 'Comando NLP: "gaste 4 de foco", "aumente a coragem"'
                    : 'Fale ou digite qualquer comando ou pergunta...'
                }
                className={`w-full py-2.5 pl-3.5 pr-9 rounded-xl bg-white/[0.04] border ${
                  isListening
                    ? 'border-rose-500 bg-rose-500/10 text-rose-200 animate-pulse'
                    : 'border-white/10 focus:border-cyan-400/50'
                } text-white placeholder-white/30 text-xs outline-none transition-all shadow-inner disabled:opacity-50`}
              />

              {speechSupported && (
                <button
                  type="button"
                  onClick={toggleListening}
                  disabled={isThinking}
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
              disabled={!input.trim() || isThinking}
              className={`p-2.5 rounded-xl text-white shadow-lg transition-all cursor-pointer shrink-0 active:scale-95 disabled:opacity-30 disabled:pointer-events-none ${
                provider === 'gemini'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                  : provider === 'groq'
                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-500/25'
                  : 'bg-gradient-to-r from-violet-600 to-cyan-600 hover:from-violet-500 hover:to-cyan-500 shadow-violet-500/25'
              }`}
              title="Executar comando"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </aside>

      {/* Mini Guia Popup Modal para Chaves Gratuitas (Gemini / Groq / NLP) */}
      <AuroraApiKeyGuideModal
        type={guideModalType}
        onClose={() => setGuideModalType(null)}
      />
    </>
  );
};

// Formatação segura de negrito, itálico e quebras de linha
function renderFormattedText(text: string) {
  const lines = text.split('\n');
  return lines.map((line, lIdx) => {
    const parts = line.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);
    return (
      <React.Fragment key={lIdx}>
        {parts.map((part, pIdx) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={pIdx} className="font-bold text-white">{part.slice(2, -2)}</strong>;
          }
          if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={pIdx} className="italic text-cyan-200/90">{part.slice(1, -1)}</em>;
          }
          if (part.startsWith('`') && part.endsWith('`')) {
            return <code key={pIdx} className="px-1 py-0.2 rounded bg-black/40 text-cyan-300 font-mono text-[10px]">{part.slice(1, -1)}</code>;
          }
          return part;
        })}
        {lIdx < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}
