import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { fetchComplaints, generateClusterAnalysis } from "@/lib/api";
import { Brain, AlertTriangle, Lightbulb, FileSearch, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const ClustersPage = () => {
  const { data: complaints = [] } = useQuery({ queryKey: ["complaints"], queryFn: fetchComplaints });
  const [clusterReports, setClusterReports] = useState<Record<string, any>>({});

  const clusters = Object.entries(
    complaints.reduce((acc: Record<string, typeof complaints>, c) => {
      const cat = c.category || "Uncategorized";
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(c);
      return acc;
    }, {})
  ).filter(([, items]) => items.length >= 1)
   .map(([name, items]) => ({
     name,
     count: items.length,
     avgFrustration: items.reduce((a, c) => a + (c.frustration_score || 0), 0) / items.length,
     avgPriority: items.reduce((a, c) => a + (c.priority_score || 0), 0) / items.length,
     avgEscalation: items.reduce((a, c) => a + (c.escalation_risk || 0), 0) / items.length,
     rootCause: items[0]?.ai_root_cause || "AI analysis pending for this cluster.",
     complaints: items,
   }));

  const analysisMutation = useMutation({
    mutationFn: async ({ name, texts }: { name: string; texts: string[] }) => {
      const report = await generateClusterAnalysis(texts);
      return { name, report };
    },
    onSuccess: ({ name, report }) => {
      setClusterReports(prev => ({ ...prev, [name]: report }));
      toast.success(`Investigation report generated for ${name}`);
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Complaint Clusters & Root Cause Analysis</h1>
        <p className="text-sm text-muted-foreground">AI-detected patterns grouped by category with investigation reports</p>
      </div>

      {clusters.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          Submit complaints to see AI-detected clusters.
        </div>
      ) : (
        <div className="space-y-4">
          {clusters.map(cluster => {
            const report = clusterReports[cluster.name];
            return (
              <div key={cluster.name} className="glass-card p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{cluster.name}</h3>
                    <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                      <span>{cluster.count} complaints</span>
                      <span>Avg frustration: {cluster.avgFrustration.toFixed(1)}/10</span>
                      <span>Avg priority: {cluster.avgPriority.toFixed(0)}</span>
                      <span>Avg escalation: {(cluster.avgEscalation * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => analysisMutation.mutate({
                        name: cluster.name,
                        texts: cluster.complaints.map(c => c.complaint_text),
                      })}
                      disabled={analysisMutation.isPending}
                    >
                      {analysisMutation.isPending && analysisMutation.variables?.name === cluster.name
                        ? <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        : <FileSearch className="w-3 h-3 mr-1" />}
                      Investigate
                    </Button>
                    <div className="w-9 h-9 rounded-lg bg-warning/20 flex items-center justify-center">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-secondary/50 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="w-4 h-4 text-primary" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Root Cause Analysis</p>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed">{cluster.rootCause}</p>
                  </div>

                  <div className="bg-secondary/50 rounded-md p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Lightbulb className="w-4 h-4 text-warning" />
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">Complaints in Cluster</p>
                    </div>
                    <div className="space-y-1">
                      {cluster.complaints.slice(0, 3).map(c => (
                        <p key={c.id} className="text-xs text-muted-foreground truncate">• {c.complaint_text}</p>
                      ))}
                      {cluster.complaints.length > 3 && (
                        <p className="text-xs text-primary">+{cluster.complaints.length - 3} more</p>
                      )}
                    </div>
                  </div>
                </div>

                {report && (
                  <div className="bg-primary/5 border border-primary/20 rounded-md p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        <h4 className="text-sm font-medium text-foreground">AI Investigation Report</h4>
                      </div>
                      <Badge variant={report.severity === "critical" ? "destructive" : "secondary"}>
                        {report.severity}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-primary uppercase tracking-wider mb-1">Root Cause</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{report.root_cause}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary uppercase tracking-wider mb-1">Investigation Summary</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{report.investigation_summary}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary uppercase tracking-wider mb-1">Impact Assessment</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{report.estimated_impact}</p>
                    </div>
                    <div>
                      <p className="text-xs text-primary uppercase tracking-wider mb-1">Recommended Actions</p>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {report.recommended_actions?.map((a: string, i: number) => <li key={i}>{a}</li>)}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs text-primary uppercase tracking-wider mb-1">Affected Systems</p>
                      <div className="flex flex-wrap gap-2">
                        {report.affected_systems?.map((s: string, i: number) => (
                          <Badge key={i} variant="secondary">{s}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ClustersPage;
