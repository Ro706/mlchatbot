import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send, Sparkles, User, Bot, Loader2, MessageSquareWarning, RefreshCw } from "lucide-react";
import { callAIAssistant } from "@/lib/api";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const AIAssistantPage = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your AI Banking Assistant. How can I help you today? I can explain banking processes, troubleshoot issues, or guide you through our services.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setIsLoading(true);

    try {
      const result = await callAIAssistant([...messages, { role: "user", content: userMessage }]);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } catch (error: any) {
      console.error("AI Assistant error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-4 py-6 flex-1 flex flex-col h-full">
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to home
          </Link>
          <Button variant="ghost" size="sm" onClick={() => setMessages([{ role: "assistant", content: "Hello! I'm your AI Banking Assistant. How can I help you today?" }])}>
            <RefreshCw className="w-4 h-4 mr-2" /> Reset Chat
          </Button>
        </div>

        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(var(--primary),0.2)]">
            <Sparkles className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">AI Issue Assistant</h1>
            <p className="text-sm text-muted-foreground">Instant answers for your banking queries</p>
          </div>
        </div>

        <div className="flex-1 flex flex-col glass-card overflow-hidden mb-6 border-primary/10">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 scroll-smooth">
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-3 max-w-[85%] md:max-w-[75%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground border border-border"}`}>
                      {msg.role === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
                    </div>
                    <div className={`p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === "user" ? "bg-primary text-primary-foreground rounded-tr-none" : "bg-secondary/80 text-foreground rounded-tl-none border border-border"}`}>
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                <div className="flex gap-3 max-w-[75%]">
                  <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-1 border border-border">
                    <Bot className="w-4 h-4 text-primary" />
                  </div>
                  <div className="bg-secondary/80 p-4 rounded-2xl rounded-tl-none border border-border">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "0ms" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "150ms" }}></span>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce" style={{ animationDelay: "300ms" }}></span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          <div className="p-4 border-t border-border bg-background/50">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Type your question here..."
                className="bg-secondary border-border focus-visible:ring-primary/30"
                disabled={isLoading}
              />
              <Button onClick={handleSend} disabled={isLoading || !input.trim()} size="icon" className="shrink-0">
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-2 text-center">
              AI can make mistakes. For serious issues, please <Link to="/raise-complaint" className="text-primary hover:underline">raise a formal complaint</Link>.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Link to="/raise-complaint" className="glass-card p-4 flex items-center gap-4 hover:border-primary/50 transition-all">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <MessageSquareWarning className="w-5 h-5 text-warning" />
            </div>
            <div>
              <p className="text-sm font-medium">Resolution not found?</p>
              <p className="text-xs text-muted-foreground">Submit a formal complaint for investigation</p>
            </div>
            <ArrowLeft className="w-4 h-4 ml-auto rotate-180 text-muted-foreground" />
          </Link>
          <div className="glass-card p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-info/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-info" />
            </div>
            <div>
              <p className="text-sm font-medium">Secure Banking</p>
              <p className="text-xs text-muted-foreground">I never ask for passwords, PINs or OTPs</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantPage;
