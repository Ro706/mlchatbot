import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchComplaintById, updateComplaintStatus, generateClusterAnalysis, fetchChatMessages } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, AlertTriangle, Brain, MessageSquare, ShieldAlert, Loader2, Copy, Check, FileSearch, Bot, User } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import ReactMarkdown from "react-markdown";

const STATUS_OPTIONS = [
  { value: "new", label: "New", className: "bg-chart-5/20 text-chart-5" },
  { value: "investigating", label: "Investigating", className: "bg-primary/20 text-primary" },
  { value: "in_progress", label: "In Progress", className: "bg-warning/20 text-warning" },
  { value: "resolved", label: "Resolved", className: "bg-success/20 text-success" },
  { value: "escalated", label: "Escalated", className: "bg-destructive/20 text-destructive" },
  { value: "closed", label: "Closed", className: "bg-muted-foreground/20 text-muted-foreground" },
];

const ComplaintDetailPage = () => {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [rcaReport, setRcaReport] = useState<any>(null);

  const { data: complaint, isLoading, error } = useQuery({
    queryKey: ["complaint", id],
    queryFn: () => fetchComplaintById(id!),
    enabled: !!id,
  });

  const { data: chatMessages } = useQuery({
    queryKey: ["chat_messages", id],
    queryFn: () => fetchChatMessages(id!),
    enabled: !!id,
    refetchInterval: 10000,
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateComplaintStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["complaint", id] });
      queryClient.invalidateQueries({ queryKey: ["complaints"] });
      toast.success("Status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rcaMutation = useMutation({
    mutationFn: (text: string) => generateClusterAnalysis([text]),
    onSuccess: (data) => setRcaReport(data),
    onError: (e: any) => toast.error(e.message),
  });

  const copyDraft = () => {
    if (complaint?.ai_response_draft) {
      navigator.clipboard.writeText(complaint.ai_response_draft);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Response draft copied to clipboard");
    }
  };

  if (isLoading) return <div className="text-muted-foreground p-8">Loading complaint...</div>;
  if (error || !complaint) {
    return (
      <div className="text-center py-20">
        <p className="text-muted-foreground">Complaint not found</p>
        <Link to="/admin/complaints" className="text-primary text-sm mt-2 inline-block">← Back to list</Link>
      </div>
    );
  }

  const currentStatus = STATUS_OPTIONS.find(s => s.value === complaint.status) || STATUS_OPTIONS[0];

  return (
    <div className="space-y-6">
      <Link to="/admin/complaints" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to complaints
      </Link>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-foreground font-mono">{complaint.id.slice(0, 8)}</h1>
          <Badge variant="secondary">{complaint.category || "Pending"}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">Status:</span>
          <Select
            value={complaint.status}
            onValueChange={(value) => statusMutation.mutate({ id: complaint.id, status: value })}
            disabled={statusMutation.isPending}
          >
            <SelectTrigger className={`w-[160px] text-sm ${currentStatus.className}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {statusMutation.isPending && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      <div className="glass-card p-5">
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Complaint Text</p>
        <p className="text-foreground leading-relaxed">{complaint.complaint_text}</p>
        <div className="flex gap-6 mt-4 text-xs text-muted-foreground">
          <span>📅 {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '—'}</span>
          <span>📦 {complaint.product_type}</span>
          <span>📡 {complaint.channel}</span>
          <span>📍 {complaint.location}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-4 h-4 text-primary" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Sentiment</p>
          </div>
          <p className={`text-lg font-bold capitalize ${complaint.sentiment === "negative" ? "text-destructive" : complaint.sentiment === "positive" ? "text-success" : "text-warning"}`}>
            {complaint.sentiment || "Pending"}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-warning" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Frustration</p>
          </div>
          <p className="text-lg font-bold text-foreground">{complaint.frustration_score ?? "—"}<span className="text-sm text-muted-foreground">/10</span></p>
          {complaint.frustration_score != null && (
            <div className="w-full h-1.5 bg-secondary rounded-full mt-2">
              <div className="h-full rounded-full bg-warning" style={{ width: `${complaint.frustration_score * 10}%` }} />
            </div>
          )}
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-destructive" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Priority Score</p>
          </div>
          <p className={`text-lg font-bold ${(complaint.priority_score || 0) >= 90 ? "text-destructive" : (complaint.priority_score || 0) >= 70 ? "text-warning" : "text-foreground"}`}>
            {complaint.priority_score ?? "—"}
          </p>
        </div>

        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <ShieldAlert className="w-4 h-4 text-chart-2" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Escalation Risk</p>
          </div>
          <p className={`text-lg font-bold ${(complaint.escalation_risk || 0) >= 0.7 ? "text-destructive" : (complaint.escalation_risk || 0) >= 0.4 ? "text-warning" : "text-success"}`}>
            {complaint.escalation_risk != null ? `${(complaint.escalation_risk * 100).toFixed(0)}%` : "—"}
          </p>
        </div>
      </div>

      {complaint.ai_root_cause && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">AI Root Cause Analysis</h3>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => rcaMutation.mutate(complaint.complaint_text)}
              disabled={rcaMutation.isPending}
            >
              {rcaMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <FileSearch className="w-3 h-3 mr-1" />}
              Deep Analysis
            </Button>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{complaint.ai_root_cause}</p>
        </div>
      )}

      {rcaReport && (
        <div className="glass-card p-5 glow-primary">
          <div className="flex items-center gap-2 mb-3">
            <FileSearch className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">AI Investigation Report</h3>
          </div>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div>
              <p className="text-xs text-primary uppercase tracking-wider mb-1">Root Cause</p>
              <p className="leading-relaxed">{rcaReport.root_cause}</p>
            </div>
            <div>
              <p className="text-xs text-primary uppercase tracking-wider mb-1">Investigation Summary</p>
              <p className="leading-relaxed">{rcaReport.investigation_summary}</p>
            </div>
            <div>
              <p className="text-xs text-primary uppercase tracking-wider mb-1">Recommended Actions</p>
              <ul className="list-disc list-inside space-y-1">
                {rcaReport.recommended_actions?.map((a: string, i: number) => <li key={i}>{a}</li>)}
              </ul>
            </div>
          </div>
        </div>
      )}

      {complaint.ai_response_draft && (
        <div className="glass-card p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-medium text-foreground">AI-Generated Response Draft</h3>
            </div>
            <Button variant="outline" size="sm" onClick={copyDraft}>
              {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
              {copied ? "Copied" : "Copy Draft"}
            </Button>
          </div>
          <pre className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed bg-secondary/50 rounded-md p-4">
            {complaint.ai_response_draft}
          </pre>
        </div>
      )}
      
      {chatMessages && chatMessages.length > 0 && (
        <div className="glass-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-medium text-foreground">Customer Conversation ({chatMessages.length} messages)</h3>
          </div>
          <div className="space-y-3 max-h-[400px] overflow-auto p-2">
            {chatMessages.map((msg: any) => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {(msg.role === "assistant" || msg.role === "bot") && (
                  <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                    <Bot className="w-3.5 h-3.5 text-primary" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-lg p-3 text-sm ${
                  msg.role === "user" ? "bg-warning/10 text-foreground" : "bg-secondary text-foreground"
                }`}>
                   <p>{msg.content}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(msg.created_at).toLocaleString()}
                  </p>
                </div>
                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                    <User className="w-3.5 h-3.5 text-warning" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintDetailPage;
