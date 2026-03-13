import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchIncidentCommanderReport } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Shield, AlertTriangle, Loader2, RefreshCw, Flame, TrendingUp,
  Link2, Brain, Wrench, ShieldAlert, ChevronDown, ChevronUp
} from "lucide-react";

const severityColors: Record<string, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-warning/20 text-warning",
  medium: "bg-chart-5/20 text-chart-5",
  low: "bg-success/20 text-success",
};

const priorityColors: Record<string, string> = {
  immediate: "bg-destructive/20 text-destructive",
  high: "bg-warning/20 text-warning",
  medium: "bg-chart-5/20 text-chart-5",
  low: "bg-success/20 text-success",
};

const IncidentCommanderPage = () => {
  const [expandedIncident, setExpandedIncident] = useState<number | null>(0);

  const { data: report, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["incident-commander"],
    queryFn: fetchIncidentCommanderReport,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-destructive/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Incident Commander</h1>
            <p className="text-sm text-muted-foreground">Real-time crisis intelligence & management</p>
          </div>
        </div>
        <Button onClick={() => refetch()} disabled={isFetching} variant="outline" size="sm">
          {isFetching ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Refresh
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Analyzing complaint patterns...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="glass-card p-6 text-center">
          <AlertTriangle className="w-8 h-8 text-warning mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">{(error as Error).message}</p>
          <Button onClick={() => refetch()} className="mt-3" size="sm">Retry</Button>
        </div>
      )}

      {report && !isLoading && (
        <>
          {/* Stats bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{report.total_complaints_analyzed || 0}</p>
              <p className="text-xs text-muted-foreground">Complaints Analyzed</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{report.incidents?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Active Incidents</p>
            </div>
            <div className="glass-card p-4 text-center">
              <Badge className={severityColors[report.crisis_forecast?.risk_level || "low"]}>{(report.crisis_forecast?.risk_level || "low").toUpperCase()}</Badge>
              <p className="text-xs text-muted-foreground mt-1">Forecast Risk</p>
            </div>
            <div className="glass-card p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{report.fraud_signals?.length || 0}</p>
              <p className="text-xs text-muted-foreground">Fraud Signals</p>
            </div>
          </div>

          {/* Crisis Forecast */}
          <div className="glass-card p-5 glow-primary">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-semibold text-foreground">Crisis Forecast Engine</h2>
              <Badge className={severityColors[report.crisis_forecast?.risk_level || "low"]} variant="secondary">
                {report.crisis_forecast?.risk_level?.toUpperCase()}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">{report.crisis_forecast?.message}</p>
            {report.crisis_forecast?.predicted_volume && (
              <p className="text-xs text-muted-foreground">📊 Volume Trend: {report.crisis_forecast.predicted_volume}</p>
            )}
            {report.crisis_forecast?.potential_triggers?.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {report.crisis_forecast.potential_triggers.map((t: string, i: number) => (
                  <Badge key={i} variant="outline" className="text-[10px]">{t}</Badge>
                ))}
              </div>
            )}
          </div>

          {/* Active Incidents */}
          {report.incidents?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-destructive" />
                <h2 className="text-sm font-semibold text-foreground">Active Incidents</h2>
              </div>
              {report.incidents.map((inc: any, i: number) => (
                <div key={i} className="glass-card overflow-hidden">
                  <button
                    onClick={() => setExpandedIncident(expandedIncident === i ? null : i)}
                    className="w-full p-4 flex items-center justify-between hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Badge className={severityColors[inc.severity]}>{inc.severity.toUpperCase()}</Badge>
                      <span className="text-sm font-medium text-foreground">{inc.title}</span>
                      <span className="text-xs text-muted-foreground">{inc.complaint_count} complaints</span>
                    </div>
                    {expandedIncident === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </button>
                  {expandedIncident === i && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Cities Affected</p>
                          <div className="flex flex-wrap gap-1">
                            {inc.cities_affected?.map((c: string, j: number) => <Badge key={j} variant="secondary" className="text-[10px]">{c}</Badge>)}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Root Cause Probability</p>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-secondary rounded-full">
                              <div className="h-full rounded-full bg-primary" style={{ width: `${inc.root_cause_probability}%` }} />
                            </div>
                            <span className="text-xs font-mono text-primary">{inc.root_cause_probability}%</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Root Cause</p>
                        <p className="text-sm text-foreground">{inc.root_cause_description}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Recommended Actions</p>
                        <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                          {inc.recommended_actions?.map((a: string, j: number) => <li key={j}>{a}</li>)}
                        </ol>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Affected Products</p>
                        <div className="flex flex-wrap gap-1">
                          {inc.affected_products?.map((p: string, j: number) => <Badge key={j} variant="outline" className="text-[10px]">{p}</Badge>)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Complaint Cascade Detection */}
          {report.cascades?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Link2 className="w-4 h-4 text-chart-5" />
                <h2 className="text-sm font-semibold text-foreground">Complaint Cascade Detection</h2>
              </div>
              {report.cascades.map((c: any, i: number) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-foreground">🔗 {c.trigger_issue}</p>
                    <Badge variant="secondary" className="text-[10px]">{c.total_affected} affected</Badge>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {c.downstream_effects?.map((e: string, j: number) => (
                      <span key={j} className="text-xs bg-secondary px-2 py-1 rounded text-muted-foreground">→ {e}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Root Cause Confidence Scoring */}
          {report.root_cause_scores?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-chart-2" />
                <h2 className="text-sm font-semibold text-foreground">Root Cause Confidence Scoring</h2>
              </div>
              <div className="glass-card p-4 space-y-3">
                {report.root_cause_scores.map((rc: any, i: number) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-foreground">{rc.cause}</span>
                        <span className="text-xs text-muted-foreground">{rc.evidence_count} evidence</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full">
                        <div
                          className={`h-full rounded-full ${rc.confidence >= 70 ? "bg-destructive" : rc.confidence >= 40 ? "bg-warning" : "bg-chart-5"}`}
                          style={{ width: `${rc.confidence}%` }}
                        />
                      </div>
                    </div>
                    <span className="text-sm font-mono font-semibold w-12 text-right text-foreground">{rc.confidence}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Recommendations */}
          {report.resolution_recommendations?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-success" />
                <h2 className="text-sm font-semibold text-foreground">Resolution Recommendation System</h2>
              </div>
              <div className="glass-card divide-y divide-border">
                {report.resolution_recommendations.map((r: any, i: number) => (
                  <div key={i} className="p-4 flex items-start gap-3">
                    <Badge className={`${priorityColors[r.priority]} shrink-0 text-[10px]`}>{r.priority.toUpperCase()}</Badge>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{r.action}</p>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs text-muted-foreground">Impact: {r.impact_estimate}</span>
                        <span className="text-xs text-muted-foreground">Owner: {r.owner}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fraud Signals */}
          {report.fraud_signals?.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-destructive" />
                <h2 className="text-sm font-semibold text-foreground">Fraud Signal Detection</h2>
              </div>
              {report.fraud_signals.map((f: any, i: number) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className={severityColors[f.risk_level]}>{f.risk_level.toUpperCase()}</Badge>
                      <span className="text-sm font-medium text-foreground">{f.signal}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{f.affected_count} affected</span>
                  </div>
                  <p className="text-xs text-muted-foreground">💡 {f.recommendation}</p>
                </div>
              ))}
            </div>
          )}

          <p className="text-[10px] text-muted-foreground text-right">
            Generated: {report.generated_at ? new Date(report.generated_at).toLocaleString() : "—"}
          </p>
        </>
      )}
    </div>
  );
};

export default IncidentCommanderPage;
