import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, MessageSquareWarning, LogIn, Search, Sparkles } from "lucide-react";

const LandingPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{
        backgroundImage: "linear-gradient(hsl(var(--primary) / 0.3) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary) / 0.3) 1px, transparent 1px)",
        backgroundSize: "60px 60px"
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-3xl mx-4 space-y-8"
      >
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto glow-primary">
            <Shield className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">AI Complaint Intelligence</h1>
          <p className="text-sm text-muted-foreground">Banking Operations Platform — Powered by AI</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Link to="/ai-assistant" className="block sm:col-span-2">
            <div className="glass-card p-6 text-center hover:border-primary/50 transition-all group cursor-pointer glow-primary">
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">AI Issue Assistant</h2>
              <p className="text-xs text-muted-foreground">Get instant AI-powered answers for your banking issues and questions</p>
            </div>
          </Link>

          <Link to="/raise-complaint" className="block">
            <div className="glass-card p-6 text-center hover:border-primary/50 transition-all group cursor-pointer h-full">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <MessageSquareWarning className="w-6 h-6 text-warning" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Raise a Complaint</h2>
              <p className="text-xs text-muted-foreground">Submit a formal complaint if the AI assistant couldn't resolve your issue</p>
            </div>
          </Link>

          <Link to="/track-complaint" className="block">
            <div className="glass-card p-6 text-center hover:border-primary/50 transition-all group cursor-pointer h-full">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-success" />
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-2">Track Complaint</h2>
              <p className="text-xs text-muted-foreground">Check the status of your existing complaint using its ID</p>
            </div>
          </Link>

          <Link to="/admin/login" className="block sm:col-span-2">
            <div className="glass-card p-4 text-center hover:border-primary/50 transition-all group cursor-pointer">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LogIn className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="text-base font-semibold text-foreground">Admin Login</h2>
                  <p className="text-xs text-muted-foreground">Access the analytics dashboard and management system</p>
                </div>
              </div>
            </div>
          </Link>
        </div>
      </motion.div>
    </div>
  );
};

export default LandingPage;
