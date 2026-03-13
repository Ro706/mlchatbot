import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchComplaints, generateIntelligenceReport } from "@/lib/api";
import { FileText, AlertTriangle, TrendingUp, Lightbulb, Shield, Loader2, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";

const IntelligencePage = () => {
  const { data: complaints = [] } = useQuery({ queryKey: ["complaints"], queryFn: fetchComplaints });
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generateReport = async () => {
    if (complaints.length === 0) { setError("No complaints to analyze"); return; }
    setLoading(true);
    setError("");
    try {
      const data = await generateIntelligenceReport(complaints);
      setReport(data);
    } catch (e: any) {
      setError(e.message || "Failed to generate report");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            Daily Intelligence Summary
          </h1>
          <p className="text-sm text-muted-foreground">AI-generated from {complaints.length} complaints</p>
        </div>
        <Button onClick={generateReport} disabled={loading || complaints.length === 0}>
          {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating...</> : <><Brain className="w-4 h-4 mr-2" />Generate Report</>}
        </Button>
      </div>

      {error && <div className="glass-card p-4 text-destructive text-sm">{error}</div>}

      {!report && !loading && (
        <div className="glass-card p-12 text-center">
          <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">Generate Intelligence Report</h3>
          <p className="text-sm text-muted-foreground">Click the button above to generate an AI-powered daily intelligence summary from all complaints.</p>
        </div>
      )}

      {report && (
        <>
          <div className="glass-card p-6 glow-primary">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Executive Summary</p>
            </div>
            <p className="text-foreground leading-relaxed">{report.summary}</p>
          </div>

          {report.crisis_alerts?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <h3 className="text-sm font-medium text-foreground">Crisis Alerts</h3>
              </div>
              <div className="space-y-3">
                {report.crisis_alerts.map((alert: any, i: number) => (
                  <div key={i} className={`flex items-start gap-3 p-3 rounded-md ${alert.severity === "high" ? "bg-destructive/10 border border-destructive/20" : "bg-warning/10 border border-warning/20"}`}>
                    <div className={`w-2 h-2 rounded-full mt-1.5 ${alert.severity === "high" ? "bg-destructive animate-pulse-glow" : "bg-warning"}`} />
                    <p className="text-sm text-foreground">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.top_products?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Most Affected Products</h3>
              </div>
              <div className="space-y-2">
                {report.top_products.map((p: any) => (
                  <div key={p.product} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                    <span className="text-sm text-foreground">{p.product}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-primary">{p.complaints} complaints</span>
                      <span className={`text-xs ${p.trend === "up" ? "text-destructive" : "text-muted-foreground"}`}>
                        {p.trend === "up" ? "↑ Rising" : p.trend === "down" ? "↓ Falling" : "→ Stable"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {report.actions?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="w-4 h-4 text-warning" />
                <h3 className="text-sm font-medium text-foreground">Recommended Actions</h3>
              </div>
              <ol className="space-y-2">
                {report.actions.map((action: string, i: number) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <span className="font-mono text-primary shrink-0">{String(i + 1).padStart(2, "0")}</span>
                    {action}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {report.clusters?.length > 0 && (
            <div className="glass-card p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-medium text-foreground">Detected Clusters</h3>
              </div>
              <div className="space-y-3">
                {report.clusters.map((c: any, i: number) => (
                  <div key={i} className="bg-secondary/50 rounded-md p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-foreground">{c.name}</span>
                      <span className="text-xs text-muted-foreground">{c.count} complaints</span>
                    </div>
                    <p className="text-xs text-muted-foreground"><span className="text-primary">Root cause:</span> {c.root_cause}</p>
                    <p className="text-xs text-muted-foreground"><span className="text-warning">Action:</span> {c.recommendation}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default IntelligencePage;
