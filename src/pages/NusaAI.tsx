import {api} from '../lib/api';
import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  HelpCircle, 
  MessageSquare, 
  Sparkles, 
  RefreshCw,
  Terminal,
  User,
  Activity,
  Calendar
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  timestamp: string;
}

export default function NusaAI() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Halo kawan! Saya Nusa AI, asisten virtual digital angkatan XII IPS MA NU Islamiyah Asembagus. Saya siap membantumu mencari jadwal, mencari struktur pengurus kelas, rincian prestasi, koordinasi, maupun trivia menarik lainnya. Ada yang ingin kamu tanyakan hari ini?',
      timestamp: 'Baru saja'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isUsingCloud, setIsUsingCloud] = useState(true);
  const [latency, setLatency] = useState<number>(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  const presets = [
    { label: 'Siapa ketua kelas kita?', key: 'ketua' },
    { label: 'Ingin tanya jadwal Selasa?', key: 'selasa' },
    { label: 'Siapa Wali Kelas XII IPS?', key: 'wali' },
    { label: 'Kapan jam istirahat sekolah?', key: 'istirahat' }
  ];

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    // 1. Add User message
    const userMsg: ChatMessage = {
      id: Date.now().toString() + '-user',
      sender: 'user',
      text: text,
      timestamp: 'Baru saja'
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    
    // 2. Trigger AI Typing indicator
    setIsTyping(true);

    const startTime = Date.now();

    try {
      // 3. Attempt to fetch from real server-side Gemini API endpoint
      const data = await api('/nusa-ai',{message:text,history:messages.slice(-10)});
      setIsUsingCloud(true);
      setLatency(Date.now() - startTime);
      setIsTyping(false);
    } catch (error) {
      console.warn('Real Gemini API failed, falling back to local mock NLP matcher:', error);
      
      // Fallback local mock NLP matching
      setTimeout(() => {
        const responseText = 'Nusa AI belum dapat menjawab. Periksa sesi atau coba lagi nanti.';
        const aiMsg: ChatMessage = {
          id: Date.now().toString() + '-ai',
          sender: 'ai',
          text: responseText,
          timestamp: 'Baru saja'
        };
        setMessages(prev => [...prev, aiMsg]);
        setIsUsingCloud(false);
        setLatency(Date.now() - startTime);
        setIsTyping(false);
      }, 600);
    }
  };

  // Scroll to bottom helper
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  return (
    <div className="space-y-12">
      
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-slate-100 border border-slate-200 text-slate-500 text-[10px] font-mono font-medium font-semibold">
          NUSA_AI V1 : RE-COGNITIVE TERMINAL
        </div>
        <h2 className="text-3xl font-bold text-slate-800 font-display">Asisten Nusa AI XII IPS</h2>
        <p className="text-slate-500 text-sm">
          Navigasikan ruang kearsipan dengan Nusa AI. Temukan info panitia kelas, jadwal belajar, dan log dokumentasi melalui komunikasi interaktif langsung.
        </p>
      </div>

      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        
        {/* Left Side Column: Instructions & Presets */}
        <div className="md:col-span-4 space-y-6 flex flex-col justify-between">
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-3xl space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-200/60 pb-3">
              <HelpCircle className="w-4.5 h-4.5 text-archive-teal" />
              <h3 className="font-bold text-xs text-slate-800 font-display uppercase tracking-wider">Coba Kueri Cepat</h3>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              Tekan salah satu tombol instruksi kueri instan di bawah untuk berinteraksi langsung dengan pusat data komputasi Nusa AI.
            </p>

            <div className="space-y-2">
              {presets.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(p.label)}
                  className="w-full text-left px-4 py-3 bg-white hover:bg-teal-500/5 text-slate-600 hover:text-archive-teal font-medium rounded-xl border border-slate-200/60 hover:border-archive-teal/40 transition-all text-xs flex items-center justify-between select-none cursor-pointer"
                >
                  <span>{p.label}</span>
                  <Sparkles className="w-3.5 h-3.5 text-slate-300 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 text-zinc-400 p-5 rounded-2xl space-y-2 font-mono text-[9px] leading-relaxed">
            <div className="flex items-center gap-1.5 text-archive-teal">
              <Terminal className="w-3.5 h-3.5" />
              <span>NUSA_AGENT_INFO : STATS</span>
            </div>
            <p>CORE_ENGINE : {isUsingCloud ? 'GEMINI_3.5_FLASH_CLOUD' : 'LOCAL_ROUTER_V1_MOCK'}</p>
            <p>NLP_PARSER : {isUsingCloud ? 'PROMPT_GROUNDED_LLM' : 'CONTAINS_RULE_KEYWORDS'}</p>
            <p>LATENCY_DELAY : {latency > 0 ? `${latency}MS` : '900MS (PENDING)'}</p>
            <p className="text-zinc-500">SYSTEM_STATUS : {isUsingCloud ? 'SECURE & CONNECTED' : 'OFFLINE FALLBACK ACTIVE'}</p>
          </div>
        </div>

        {/* Right Side Column: Modern Chat UI */}
        <div className="md:col-span-8 flex flex-col h-[520px] bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-900 flex items-center justify-center text-white relative">
                <Bot className="w-5 h-5 text-archive-teal" />
                <span className="w-2.5 h-2.5 rounded-full bg-archive-mint border-2 border-slate-50 absolute -bottom-0.5 -right-0.5"></span>
              </div>
              <div className="text-left">
                <h4 className="font-bold text-sm text-slate-800 font-display">Nusa AI Agent</h4>
                <p className="text-[9px] font-mono font-semibold text-archive-teal tracking-wide transition-all uppercase flex items-center gap-1">
                  <span>{isUsingCloud ? 'CONNECTED TO GEMINI' : 'LOCAL OFFLINE'} & MENUNGGU KUERI</span>
                </p>
              </div>
            </div>

            <button 
              onClick={() => {
                setMessages([
                  {
                    id: Math.random().toString(),
                    sender: 'ai',
                    text: 'Kearsipan kelas di-refresh! Ada hal lain yang bisa saya bantu temukan?',
                    timestamp: 'Baru saja'
                  }
                ]);
              }}
              className="p-1.5 rounded hover:bg-slate-200/60 text-slate-400 hover:text-slate-700 cursor-pointer text-xs flex items-center gap-1"
              title="Bersihkan Percakapan"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Chat Bubble Container */}
          <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/40">
            {messages.map((m) => {
              const isAI = m.sender === 'ai';
              return (
                <div key={m.id} className={`flex gap-3 max-w-[85%] ${isAI ? '' : 'ml-auto justify-end'}`}>
                  {isAI && (
                    <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`p-4 rounded-2xl text-xs sm:text-xs leading-relaxed border ${
                    isAI 
                      ? 'bg-white rounded-tl-none border-slate-200 text-slate-700 shadow-3xs' 
                      : 'bg-slate-900 rounded-tr-none border-slate-800 text-white'
                  }`}>
                    <p className="break-words font-medium">{m.text}</p>
                    <span className="text-[8px] font-mono text-slate-400 mt-1.5 block text-right">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Simulated typing dot-bounce loader */}
            {isTyping && (
              <div className="flex gap-3 max-w-[85%] animate-pulse">
                <div className="w-7 h-7 rounded-full bg-slate-900 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white border border-slate-200 px-4 py-3.5 rounded-2xl rounded-tl-none shadow-3xs flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}

            {/* Bottom anchor for scrolling */}
            <div ref={chatScrollRef} />
          </div>

          {/* Chat input box */}
          <div className="p-3 border-t border-slate-100 bg-white">
            <div className="relative">
              <input 
                type="text" 
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSend(inputValue);
                  }
                }}
                placeholder="Tanyakan hal menarik tentang XII IPS kawan..." 
                className="w-full bg-slate-50 border border-slate-200 rounded-full py-3.5 pl-5 pr-12 text-xs focus:outline-none focus:border-archive-teal focus:bg-white transition-all text-slate-800"
              />
              <button 
                onClick={() => handleSend(inputValue)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 bg-slate-900 text-white rounded-full flex items-center justify-center hover:bg-archive-teal cursor-pointer hover:shadow-md transition-all select-none"
              >
                <Send className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
