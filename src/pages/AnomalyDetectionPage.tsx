import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchComplaints } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from "recharts";
import { AlertTriangle, Activity, TrendingUp, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const AnomalyDetectionPage = () => {
  const { data: complaints = [] } = useQuery({ queryKey: ["complaints"], queryFn: fetchComplaints });

  const { dailyData, anomalies, productSpikes } = useMemo(() => {
    // Group by date
    const byDate: Record<string, number> = {};
    const byDateProduct: Record<string, Record<string, number>> = {};
    complaints.forEach(c => {
      byDate[c.date] = (byDate[c.date] || 0) + 1;
      if (!byDateProduct[c.date]) byDateProduct[c.date] = {};
      const cat = c.category || c.product_type || "Other";
      byDateProduct[c.date][cat] = (byDateProduct[c.date][cat] || 0) + 1;
    });

    const sorted = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
    const counts = sorted.map(([, v]) => v);
    const mean = counts.length > 0 ? counts.reduce((a, b) => a + b, 0) / counts.length : 0;
    const stdDev = counts.length > 1
      ? Math.sqrt(counts.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / counts.length)
      : 0;
    const threshold = mean + 1.5 * stdDev;

    const dailyData = sorted.map(([date, count]) => ({
      date,
      count,
      isAnomaly: count > threshold,
    }));

    const anomalies = dailyData.filter(d => d.isAnomaly);

    // Product spikes - find products with disproportionate complaints on anomaly days
    const productSpikes: { product: string; date: string; count: number; normal: number }[] = [];
    const productAvg: Record<string, number[]> = {};
    Object.values(byDateProduct).forEach(products => {
      Object.entries(products).forEach(([p, c]) => {
        if (!productAvg[p]) productAvg[p] = [];
        productAvg[p].push(c);
      });
    });

    anomalies.forEach(a => {
      const products = byDateProduct[a.date] || {};
      Object.entries(products).forEach(([product, count]) => {
        const avg = productAvg[product] ? productAvg[product].reduce((x, y) => x + y, 0) / productAvg[product].length : 0;
        if (count > avg * 1.5) {
          productSpikes.push({ product, date: a.date, count, normal: Math.round(avg) });
        }
      });
    });

    return { dailyData, anomalies, productSpikes, threshold, mean };
  }, [complaints]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" /> Anomaly Detection
        </h1>
        <p className="text-sm text-muted-foreground">Detect sudden spikes in complaints by time and product</p>
      </div>

      {complaints.length === 0 ? (
        <div className="glass-card p-12 text-center text-muted-foreground">
          Submit complaints to see anomaly detection analysis.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-warning" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Anomalies Detected</p>
              </div>
              <p className="text-3xl font-bold text-warning">{anomalies.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Days with abnormal complaint volume</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Product Spikes</p>
              </div>
              <p className="text-3xl font-bold text-primary">{productSpikes.length}</p>
              <p className="text-xs text-muted-foreground mt-1">Category surges above baseline</p>
            </div>
            <div className="glass-card p-5">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-destructive" />
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Worst Spike</p>
              </div>
              <p className="text-3xl font-bold text-destructive">
                {anomalies.length > 0 ? `${Math.max(...anomalies.map(a => a.count))}` : "—"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">Max complaints in a single day</p>
            </div>
          </div>

          <div className="glass-card p-5">
            <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" /> Daily Complaint Volume
            </h3>
            {dailyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dailyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(215, 12%, 50%)" }} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(215, 12%, 50%)" }} />
                  <Tooltip contentStyle={{ background: "hsl(220, 18%, 10%)", border: "1px solid hsl(220, 14%, 18%)", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="count" fill="hsl(174, 72%, 46%)" radius={[4, 4, 0, 0]}
                    // Highlight anomaly bars
                    shape={(props: any) => {
                      const { x, y, width, height, payload } = props;
                      return (
                        <rect
                          x={x} y={y} width={width} height={height}
                          rx={4} ry={4}
                          fill={payload.isAnomaly ? "hsl(0, 72%, 55%)" : "hsl(174, 72%, 46%)"}
                          opacity={0.85}
                        />
                      );
                    }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm">No data yet</p>}
            <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(174, 72%, 46%)" }} /> Normal</div>
              <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: "hsl(0, 72%, 55%)" }} /> Anomaly</div>
            </div>
          </div>

          {productSpikes.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-warning" /> Product/Category Spikes
              </h3>
              <div className="space-y-2">
                {productSpikes.map((spike, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-md bg-secondary/50">
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary">{spike.product}</Badge>
                      <span className="text-xs text-muted-foreground">{spike.date}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="text-destructive font-bold">{spike.count} complaints</span>
                      <span className="text-xs text-muted-foreground">vs avg {spike.normal}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {anomalies.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-sm font-medium text-foreground mb-4">Anomaly Timeline</h3>
              <div className="space-y-2">
                {anomalies.map((a, i) => (
                  <div key={i} className="flex items-center gap-4 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                    <Zap className="w-4 h-4 text-destructive shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-foreground font-medium">{a.date}</p>
                      <p className="text-xs text-muted-foreground">{a.count} complaints — significantly above normal volume</p>
                    </div>
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

export default AnomalyDetectionPage;
