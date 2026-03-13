import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/lib/authContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, ArrowLeft } from "lucide-react";

const LoginPage = () => {
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const { error } = isSignUp
      ? await signUp(email, password)
      : await signIn(email, password);
    if (error) {
      setError(error);
    } else if (!isSignUp) {
      navigate("/admin/dashboard");
    }
    setLoading(false);
  };

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
        className="w-full max-w-md mx-4"
      >
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <div className="glass-card p-8 glow-primary">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Shield className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Admin Login</h1>
              <p className="text-xs text-muted-foreground">AI Complaint Intelligence Platform</p>
            </div>
          </div>

          <div className="bg-secondary/50 rounded-md p-3 mb-6 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">Demo Admin Credentials:</p>
            <p>Email: <span className="text-primary font-mono">admin@acip.bank</span></p>
            <p>Password: <span className="text-primary font-mono">Admin@123</span></p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-muted-foreground text-xs uppercase tracking-wider">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                className="bg-secondary border-border focus:border-primary"
                placeholder="admin@acip.bank"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-wider">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                className="bg-secondary border-border focus:border-primary"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-destructive text-sm">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </motion.div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isSignUp ? "Create Admin Account" : "Access Dashboard"}
            </Button>
          </form>

          <button
            onClick={() => { setIsSignUp(!isSignUp); setError(""); }}
            className="text-xs text-muted-foreground mt-6 text-center w-full block hover:text-primary transition-colors"
          >
            {isSignUp ? "Already have an account? Sign in" : "Need an admin account? Sign up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginPage;
