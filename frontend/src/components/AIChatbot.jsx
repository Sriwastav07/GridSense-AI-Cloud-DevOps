import { useState } from 'react';
import { MessageSquare, Send, X, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AIChatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: 'bot', text: 'Hello, I am GridSense AI Assistant. Ask me any questions regarding the electrical distribution grid and incident diagnostics.' }
  ]);
  const [input, setInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input.trim();
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput('');

    // AI diagnostic response generator
    setTimeout(() => {
      let reply = "I'm analyzing the Grid telemetry data. Currently, there is an active localized fault segment between POL-10002 and POL-10003 reporting 0V voltage.";
      const query = userMsg.toLowerCase();

      if (query.includes('transformer') || query.includes('failed')) {
        reply = "Transformer TX-1004 reports a potential over-current trip due to a suspected fault line downstream at pole POL-10005.";
      } else if (query.includes('incident') || query.includes('created') || query.includes('why')) {
        reply = "Incident INC-318492 was created automatically because POL-10003 reported POWER_LOSS telemetry sequence transition from Live (240V) to Dead (0V).";
      } else if (query.includes('houses') || query.includes('affected')) {
        reply = "A total of approximately 75 houses are estimated to be affected based on the 5 offline poles (15 households per pole).";
      } else if (query.includes('summary') || query.includes('outage')) {
        reply = "Outage Summary: 1 Active Incident on Feeder Line FDR-102. Affected poles: 4. Current MTTR is 112 minutes. Grid availability is at 99.1%.";
      } else if (query.includes('priority') || query.includes('repair')) {
        reply = "Repair Priority Suggestion:\n1. INC-481920 (Critical - 150 houses affected, hospitals/schools in boundary)\n2. INC-102941 (Medium - 45 houses, residential area)";
      }

      setMessages(prev => [...prev, { sender: 'bot', text: reply }]);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="w-96 h-[480px] glass-card rounded-2xl flex flex-col overflow-hidden mb-4 shadow-2xl border border-blue-500/20"
          >
            {/* Header */}
            <div className="bg-slate-950/60 px-5 py-4 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-2">
                <div className="bg-blue-600/20 p-1 rounded-lg border border-blue-500/30">
                  <Bot className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">GridSense AI Copilot</h4>
                  <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    Online Engine
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-all"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-xl px-4 py-2.5 text-xs ${
                    m.sender === 'user' 
                      ? 'bg-blue-600 text-white rounded-br-none' 
                      : 'bg-slate-900/60 text-gray-200 border border-white/5 rounded-bl-none'
                  }`}>
                    {m.text}
                  </div>
                </div>
              ))}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-slate-950/40 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask GridSense Assistant..."
                className="flex-1 bg-slate-950/50 border border-white/5 rounded-xl px-4 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 p-2.5 rounded-xl text-white transition-all"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat floating trigger */}
      <button
        onClick={() => setOpen(!open)}
        className="bg-blue-600 hover:bg-blue-500 text-white p-4 rounded-full shadow-lg hover:shadow-blue-600/25 transition-all duration-200 flex items-center justify-center border border-blue-400/20"
      >
        <MessageSquare className="h-6 w-6" />
      </button>
    </div>
  );
}
