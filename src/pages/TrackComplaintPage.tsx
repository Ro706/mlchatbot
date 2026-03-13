import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Search, Loader2, Clock, CheckCircle2, AlertTriangle, FileSearch } from "lucide-react";
import { fetchComplaintById } from "@/lib/api";

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  new: { label: "New - Under Review", icon: Clock, color: "text-blue-400" },
  investigating: { label: "Investigating", icon: FileSearch, color: "text-warning" },
  resolved: { label: "Resolved", icon: CheckCircle2, color: "text-green-400" },
  escalated: { label: "Escalated", icon: AlertTriangle, color: "text-destructive" },
};

const TrackComplaintPage = () => {
  const [complaintId, setComplaintId] = useState("");
  const [complaint, setComplaint] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintId.trim()) return;
    setLoading(true);
    setError("");
    setComplaint(null);

    try {
      const data = await fetchComplaintById(complaintId.trim());
      setComplaint(data);
    } catch (fetchError: any) {
      setError("No complaint found with this ID. Please check and try again.");
    }
    setLoading(false);
  };

  const status = complaint ? statusConfig[complaint.status] || statusConfig.new : null;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-xl mx-auto px-4 py-8">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to home
        </Link>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <Search className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Track Complaint</h1>
              <p className="text-sm text-muted-foreground">Enter your complaint ID to check its status</p>
            </div>
          </div>

          <form onSubmit={handleSearch} className="glass-card p-6 space-y-4">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Complaint ID</Label>
              <Input
                value={complaintId}
                onChange={e => { setComplaintId(e.target.value); setError(""); }}
                placeholder="e.g. a1b2c3d4-e5f6-7890-abcd-ef1234567890"
                className="bg-secondary border-border font-mono text-sm"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Searching...</> : <><Search className="w-4 h-4 mr-2" /> Track Status</>}
            </Button>
          </form>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 mt-4 text-center">
              <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">{error}</p>
            </motion.div>
          )}

          {complaint && status && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 mt-4 space-y-4">
              <div className="flex items-center gap-3">
                <status.icon className={`w-6 h-6 ${status.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">Current Status</p>
                  <p className={`text-lg font-semibold ${status.color}`}>{status.label}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-foreground">{complaint.category || "Pending analysis"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Product</p>
                  <p className="text-foreground">{complaint.product_type}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Location</p>
                  <p className="text-foreground">{complaint.location}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Submitted</p>
                  <p className="text-foreground">{new Date(complaint.created_at).toLocaleDateString()}</p>
                </div>
              </div>

              {complaint.ai_response_draft && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Response from our team</p>
                  <div className="bg-secondary/50 rounded-md p-3 text-sm text-foreground">
                    {complaint.ai_response_draft}
                  </div>
                </div>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                ID: <span className="font-mono">{complaint.id}</span>
              </p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default TrackComplaintPage;
