import React from 'react';
import { Bot, Send, X, Route, History, FileSearch, Activity, Sparkles, User, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../utils/utils';
import { useLanguage } from '../../context/LanguageContext';
import { GoogleGenAI } from "@google/genai";

interface Message {
  role: 'user' | 'model';
  text: string;
}

const SYSTEM_INSTRUCTION = `You are "TRAFFIC_OPS_COPILOT", a high-performance tactical AI for traffic management.
PERSONA: Professional, direct, technical, institutional-grade. Use tactical jargon (Nodes, Handshakes, Protocols, Telemetry).
RULES:
1. ONLY discuss traffic operations, road safety, logistics, infrastructure, and vehicle tracking.
2. If asked about unrelated topics, respond with "OUT_OF_SCOPE: INTERNAL_PROTOCOL_VIOLATION. Query must remain within Traffic Operations parameters."
3. Provide insights based on tactical data analysis.
4. Keep responses concise and uppercase-leaning to match the Brutalist aesthetic.`;

export function AICopilot() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState('');
  const [isTyping, setIsTyping] = React.useState(false);
  const { t } = useLanguage();
  
  const ai = React.useMemo(() => new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! }), []);

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage: Message = { role: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [...messages, userMessage].map(m => ({ role: m.role, parts: [{ text: m.text }] })),
        config: {
          systemInstruction: SYSTEM_INSTRUCTION,
          temperature: 0.7,
        }
      });

      const modelText = response.text || "SYSTEM_ERROR: NULL_RESPONSE_RECEIVED";
      setMessages(prev => [...prev, { role: 'model', text: modelText }]);
    } catch (error) {
      console.error("AI Copilot Error:", error);
      setMessages(prev => [...prev, { role: 'model', text: "CRITICAL_ERROR: NEURAL_LINK_INTERRUPTED. PLEASE RE-ESTABLISH HANDSHAKE." }]);
    } finally {
      setIsTyping(false);
    }
  };

  const scrollRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  return (
    <div className="fixed right-8 bottom-8 z-[100]">
      <AnimatePresence>
        {isOpen ? (
          <motion.aside
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="w-[350px] bg-surface border border-border-subtle flex flex-col h-[600px] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
          >
            <div className="p-5 border-b border-border-subtle flex items-center justify-between bg-surface">
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 bg-brand-primary rotate-45 animate-pulse" />
                <h2 className="font-bold text-text-primary text-[10px] uppercase tracking-[0.3em] font-mono italic">AI / {t('dashboard.ai.title')}</h2>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="text-text-muted hover:text-brand-primary transition-colors"
                id="close-copilot-btn"
              >
                <X size={14} />
              </button>
            </div>

            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 font-mono bg-surface custom-scrollbar"
            >
              {messages.length === 0 && (
                <div className="space-y-8">
                  <section>
                    <h4 className="text-[8px] font-bold text-text-muted uppercase tracking-[0.4em] mb-4">{t('dashboard.ai.ops_center')}</h4>
                    <div className="flex flex-col gap-3">
                      <SuggestionButton onClick={() => setInput(`${t('dashboard.ai.path_opt')} / I-95`)} icon={<Route size={12}/>} text={`${t('dashboard.ai.path_opt')} / I-95`} />
                      <SuggestionButton onClick={() => setInput(t('dashboard.ai.temporal_comp'))} icon={<History size={12}/>} text={t('dashboard.ai.temporal_comp')} />
                      <SuggestionButton onClick={() => setInput(t('dashboard.ai.manifest_gen'))} icon={<FileSearch size={12}/>} text={t('dashboard.ai.manifest_gen')} />
                    </div>
                  </section>

                  <section>
                    <h4 className="text-[8px] font-bold text-text-muted uppercase tracking-[0.4em] mb-4">{t('dashboard.ai.neural_insights')}</h4>
                    <div className="p-4 bg-background-muted border border-border-subtle">
                      <div className="flex items-center gap-2 mb-2 text-brand-primary">
                        <Activity size={12} />
                        <span className="text-[9px] font-bold uppercase tracking-widest text-brand-primary">SECURE_LINK_READY</span>
                      </div>
                      <p className="text-[10px] text-text-muted leading-relaxed uppercase">
                        NEURAL LINK ESTABLISHED. STANDING BY FOR OPERATIONAL QUERIES.
                      </p>
                    </div>
                  </section>
                </div>
              )}

              {messages.map((m, i) => (
                <div key={i} className={cn("flex flex-col gap-2", m.role === 'user' ? "items-end" : "items-start")}>
                  <div className="flex items-center gap-2 mb-1">
                    {m.role === 'user' ? <User size={10} className="text-text-muted" /> : <Bot size={10} className="text-brand-primary" />}
                    <span className="text-[7px] font-bold text-text-muted uppercase tracking-widest">{m.role === 'user' ? 'OPERATOR' : 'COPILOT'}</span>
                  </div>
                  <div className={cn(
                    "p-3 text-[10px] max-w-[85%] border",
                    m.role === 'user' 
                      ? "bg-brand-primary/5 border-brand-primary/20 text-text-primary" 
                      : "bg-background-muted border-border-subtle text-text-muted"
                  )}>
                    {m.text}
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 text-brand-primary animate-pulse">
                  <Loader2 size={12} className="animate-spin" />
                  <span className="text-[8px] font-bold uppercase tracking-widest">Processing Tactical Data...</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-border-subtle bg-background-muted">
              <div className="relative">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                  placeholder={isTyping ? "PROCESSING..." : t('dashboard.ai.query_placeholder')} 
                  disabled={isTyping}
                  className="w-full bg-surface border border-border-subtle rounded-none py-3 px-4 pr-12 text-[10px] font-mono text-text-primary outline-none focus:border-brand-primary/30 transition-all disabled:opacity-50"
                />
                <button 
                    onClick={handleSend}
                    disabled={isTyping || !input.trim()}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-primary hover:scale-110 disabled:opacity-0 transition-all"
                    id="send-query-btn"
                >
                  <Send size={14} />
                </button>
              </div>
            </div>
          </motion.aside>
        ) : (
          <motion.button
            layoutId="copilot-bubble"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-zinc-900 border border-zinc-800 rounded-none flex items-center justify-center shadow-xl group hover:border-[#FF3E00] transition-all"
            id="open-copilot-bubble"
          >
            <div className="relative">
              <Bot size={24} className="text-zinc-500 group-hover:text-[#FF3E00] transition-colors" />
              <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-[#FF3E00] rounded-full border-2 border-zinc-900" />
            </div>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

function SuggestionButton({ icon, text, onClick }: { icon: any, text: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full text-left bg-surface border border-border-subtle hover:border-brand-primary/40 p-3 rounded-none transition-all flex items-center gap-3 group"
    >
      <span className="text-text-muted group-hover:text-brand-primary transition-all">
        {icon}
      </span>
      <span className="text-[10px] text-text-muted font-bold uppercase tracking-[0.2em] group-hover:text-text-primary transition-all">
        {text}
      </span>
    </button>
  );
}
