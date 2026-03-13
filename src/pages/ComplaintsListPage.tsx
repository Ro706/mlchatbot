import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchComplaints } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

const statusColors: Record<string, string> = {
  new: "bg-chart-5/20 text-chart-5",
  processing: "bg-warning/20 text-warning",
  resolved: "bg-success/20 text-success",
  escalated: "bg-destructive/20 text-destructive",
};

const ComplaintsListPage = () => {
  const [search, setSearch] = useState("");
  const { data: allComplaints = [], isLoading } = useQuery({
    queryKey: ["complaints"],
    queryFn: fetchComplaints,
  });

  const complaints = allComplaints.filter(c =>
    c.complaint_text.toLowerCase().includes(search.toLowerCase()) ||
    c.id.toLowerCase().includes(search.toLowerCase()) ||
    (c.category || "").toLowerCase().includes(search.toLowerCase())
  );

  if (isLoading) return <div className="text-muted-foreground">Loading complaints...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Complaints</h1>
          <p className="text-sm text-muted-foreground">{complaints.length} total complaints</p>
        </div>
        <Link to="/admin/complaints/new" className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          + New Complaint
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search complaints..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
      </div>

      {complaints.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          {search ? "No complaints match your search" : "No complaints yet. Submit your first one!"}
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {["ID", "Text", "Category", "Sentiment", "Frustration", "Priority", "Status"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs text-muted-foreground uppercase tracking-wider font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {complaints.map(c => (
                <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/admin/complaints/${c.id}`} className="font-mono text-primary hover:underline text-xs">{c.id.slice(0, 8)}</Link>
                  </td>
                  <td className="px-4 py-3 max-w-xs truncate text-foreground">{c.complaint_text}</td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="text-xs">{c.category || "Pending"}</Badge></td>
                  <td className="px-4 py-3 capitalize text-muted-foreground">{c.sentiment || "—"}</td>
                  <td className="px-4 py-3">
                    {c.frustration_score != null ? (
                      <span className={`font-mono ${c.frustration_score >= 8 ? "text-destructive" : c.frustration_score >= 5 ? "text-warning" : "text-success"}`}>{c.frustration_score}/10</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {c.priority_score != null ? (
                      <span className={`font-mono font-bold ${c.priority_score >= 90 ? "text-destructive" : c.priority_score >= 70 ? "text-warning" : "text-muted-foreground"}`}>{c.priority_score}</span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${statusColors[c.status] || ""}`}>{c.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ComplaintsListPage;
