import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Send, Loader2, MessageSquareWarning, Sparkles } from "lucide-react";
import { insertComplaint } from "@/lib/api";
import { toast } from "sonner";

const PublicComplaintPage = () => {
  const [form, setForm] = useState({
    text: "",
    date: new Date().toISOString().split("T")[0],
    productType: "",
    channel: "Web Portal",
    location: "",
    name: "",
    email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [complaintId, setComplaintId] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.text.trim()) { toast.error("Please describe your complaint"); return; }

    setSubmitting(true);

    try {
      const result = await insertComplaint({
        complaint_text: form.text,
        date: form.date,
        product_type: form.productType || "General",
        channel: form.channel,
        location: form.location || "Unknown",
        user_id: "00000000-0000-0000-0000-000000000000",
      });

      setComplaintId(result.id);
      toast.success("Complaint submitted successfully!");
    } catch (err: any) {
      console.error("Complaint submission error:", err);
      toast.error(err.message || "Failed to submit complaint. Please try again.");
    }

    setSubmitting(false);
  };

  const handleNewComplaint = () => {
    setForm({ text: "", date: new Date().toISOString().split("T")[0], productType: "", channel: "Web Portal", location: "", name: "", email: "" });
    setComplaintId(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-warning/20 flex items-center justify-center">
              <MessageSquareWarning className="w-5 h-5 text-warning" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Raise a Complaint</h1>
              <p className="text-sm text-muted-foreground">Submit a formal complaint for investigation</p>
            </div>
          </div>

          <Link to="/ai-assistant" className="block mb-6">
            <div className="glass-card p-3 flex items-center gap-3 hover:border-primary/50 transition-all">
              <Sparkles className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-foreground font-medium">Have a question? Try our AI Issue Assistant first</p>
                <p className="text-[10px] text-muted-foreground">Get instant answers — no need to wait for a complaint resolution</p>
              </div>
              <span className="text-primary text-xs">→</span>
            </div>
          </Link>

          {complaintId ? (
            <div className="glass-card p-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center mx-auto">
                <MessageSquareWarning className="w-8 h-8 text-success" />
              </div>
              <h2 className="text-xl font-semibold text-foreground">Complaint Submitted</h2>
              <p className="text-sm text-muted-foreground">Your complaint has been registered and is being reviewed by our team.</p>
              <div className="bg-secondary/50 rounded-md p-4 text-sm">
                <p className="text-muted-foreground text-xs">Your Complaint ID:</p>
                <p className="font-mono text-primary text-sm mt-1 select-all">{complaintId}</p>
                <p className="text-[10px] text-muted-foreground mt-2">Save this ID to track your complaint status</p>
              </div>
              <div className="flex gap-3 justify-center">
                <Button onClick={handleNewComplaint} variant="outline" size="sm">Submit Another</Button>
                <Button asChild size="sm"><Link to="/track-complaint">Track Complaint</Link></Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="glass-card p-6 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Your Name</Label>
                  <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="john@example.com" className="bg-secondary border-border" />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Describe Your Complaint *</Label>
                <Textarea
                  value={form.text}
                  onChange={e => setForm(f => ({ ...f, text: e.target.value }))}
                  placeholder="Please describe your issue in detail..."
                  className="bg-secondary border-border min-h-[120px]"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Product Type</Label>
                  <Input value={form.productType} onChange={e => setForm(f => ({ ...f, productType: e.target.value }))} placeholder="e.g. ATM, UPI, Credit Card" className="bg-secondary border-border" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground uppercase tracking-wider">Location</Label>
                  <Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Mumbai, Delhi" className="bg-secondary border-border" />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Processing...</>
                ) : (
                  <><Send className="w-4 h-4 mr-2" /> Submit Complaint</>
                )}
              </Button>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PublicComplaintPage;
