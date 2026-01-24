import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Zap,
  Award,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Factory,
} from "lucide-react";
import { useState } from "react";
import type { OeeRecord, Equipment } from "@shared/schema";

function MetricGauge({
  value,
  label,
  target,
  trend,
}: {
  value: number;
  label: string;
  target?: number;
  trend?: number;
}) {
  const getColor = (val: number) => {
    if (val >= 85) return { text: "text-green-500", stroke: "stroke-green-500", bg: "bg-green-500" };
    if (val >= 60) return { text: "text-yellow-500", stroke: "stroke-yellow-500", bg: "bg-yellow-500" };
    return { text: "text-red-500", stroke: "stroke-red-500", bg: "bg-red-500" };
  };

  const colors = getColor(value);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center">
          <div className="relative h-32 w-32">
            <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                strokeWidth="10"
                fill="none"
                className="stroke-muted"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                strokeWidth="10"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${value * 2.51} 251`}
                className={colors.stroke}
              />
              {target && (
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  strokeWidth="2"
                  fill="none"
                  strokeDasharray={`2 ${251 - 2}`}
                  strokeDashoffset={-target * 2.51 + 2}
                  className="stroke-foreground/30"
                />
              )}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`text-3xl font-bold ${colors.text}`}>{value}%</span>
            </div>
          </div>
          <span className="mt-3 text-sm font-medium">{label}</span>
          {trend !== undefined && (
            <div className="flex items-center gap-1 mt-1 text-xs">
              {trend >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-green-500" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-red-500" />
              )}
              <span className={trend >= 0 ? "text-green-500" : "text-red-500"}>
                {trend >= 0 ? "+" : ""}
                {trend.toFixed(1)}%
              </span>
              <span className="text-muted-foreground">vs last week</span>
            </div>
          )}
          {target && (
            <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
              <Target className="h-3 w-3" />
              Target: {target}%
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function OeeAnalytics() {
  const [timeRange, setTimeRange] = useState("7d");
  const [equipmentFilter, setEquipmentFilter] = useState("all");

  const { data: oeeRecords, isLoading } = useQuery<OeeRecord[]>({
    queryKey: ["/api/oee"],
  });

  const { data: equipmentList } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  // Mock data for demonstration
  const currentOee = {
    availability: 89,
    performance: 87,
    quality: 96,
    oee: 74,
  };

  const targets = {
    availability: 90,
    performance: 85,
    quality: 99,
    oee: 85,
  };

  const weeklyTrendData = [
    { date: "Jan 18", availability: 88, performance: 85, quality: 95, oee: 71 },
    { date: "Jan 19", availability: 90, performance: 86, quality: 96, oee: 74 },
    { date: "Jan 20", availability: 87, performance: 88, quality: 97, oee: 74 },
    { date: "Jan 21", availability: 91, performance: 84, quality: 95, oee: 73 },
    { date: "Jan 22", availability: 89, performance: 89, quality: 96, oee: 76 },
    { date: "Jan 23", availability: 88, performance: 87, quality: 98, oee: 75 },
    { date: "Jan 24", availability: 89, performance: 87, quality: 96, oee: 74 },
  ];

  const lossCategoryData = [
    { category: "Equipment Failure", loss: 45 },
    { category: "Setup & Adjustments", loss: 30 },
    { category: "Idling & Minor Stops", loss: 25 },
    { category: "Reduced Speed", loss: 40 },
    { category: "Process Defects", loss: 15 },
    { category: "Startup Rejects", loss: 10 },
  ];

  const shiftComparisonData = [
    { shift: "Morning", availability: 92, performance: 88, quality: 97 },
    { shift: "Afternoon", availability: 87, performance: 85, quality: 95 },
    { shift: "Night", availability: 85, performance: 84, quality: 94 },
  ];

  const equipmentComparisonData = [
    { equipment: "Line 1", oee: 78 },
    { equipment: "Line 2", oee: 72 },
    { equipment: "Line 3", oee: 85 },
    { equipment: "Line 4", oee: 69 },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">OEE Analytics</h1>
          <p className="text-muted-foreground">
            Overall Equipment Effectiveness metrics and analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={equipmentFilter} onValueChange={setEquipmentFilter}>
            <SelectTrigger className="w-40" data-testid="select-equipment-filter">
              <Factory className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Equipment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Equipment</SelectItem>
              <SelectItem value="line1">Line 1</SelectItem>
              <SelectItem value="line2">Line 2</SelectItem>
              <SelectItem value="line3">Line 3</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" data-testid="select-time-range">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Period" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Main OEE Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricGauge
          value={currentOee.availability}
          label="Availability"
          target={targets.availability}
          trend={1.2}
        />
        <MetricGauge
          value={currentOee.performance}
          label="Performance"
          target={targets.performance}
          trend={-0.5}
        />
        <MetricGauge
          value={currentOee.quality}
          label="Quality"
          target={targets.quality}
          trend={0.8}
        />
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    strokeWidth="12"
                    fill="none"
                    className="stroke-primary/20"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${currentOee.oee * 2.51} 251`}
                    className="stroke-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold text-primary">{currentOee.oee}%</span>
                </div>
              </div>
              <span className="mt-3 text-sm font-semibold">Overall OEE</span>
              <div className="flex items-center gap-1 mt-1 text-xs">
                <ArrowUpRight className="h-3 w-3 text-green-500" />
                <span className="text-green-500">+2.1%</span>
                <span className="text-muted-foreground">vs last week</span>
              </div>
              <Badge variant="outline" className="mt-2">
                <Target className="mr-1 h-3 w-3" />
                Target: {targets.oee}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* OEE Trend Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>OEE Trend</CardTitle>
              <CardDescription>Weekly trend of OEE components</CardDescription>
            </div>
            <Badge variant="outline" className="gap-1">
              <Activity className="h-3 w-3" />
              Live
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="date" className="text-xs" />
                <YAxis domain={[60, 100]} className="text-xs" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [`${value}%`, ""]}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="availability"
                  name="Availability"
                  stroke="hsl(var(--chart-1))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="performance"
                  name="Performance"
                  stroke="hsl(var(--chart-2))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="quality"
                  name="Quality"
                  stroke="hsl(var(--chart-3))"
                  strokeWidth={2}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="oee"
                  name="OEE"
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Analysis Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Six Big Losses */}
        <Card>
          <CardHeader>
            <CardTitle>Six Big Losses Analysis</CardTitle>
            <CardDescription>Minutes lost by category this week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={lossCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="category" type="category" width={120} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} min`, "Loss"]}
                  />
                  <Bar dataKey="loss" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Shift Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>Shift Comparison</CardTitle>
            <CardDescription>OEE metrics by shift</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={shiftComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="shift" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, ""]}
                  />
                  <Legend />
                  <Bar dataKey="availability" name="Availability" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="performance" name="Performance" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="quality" name="Quality" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment OEE Comparison</CardTitle>
          <CardDescription>Overall OEE by production line</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {equipmentComparisonData.map((eq, index) => (
              <div key={index} className="flex items-center gap-4 p-4 rounded-lg border">
                <div className="relative h-16 w-16">
                  <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8"
                      fill="none"
                      className="stroke-muted"
                    />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      strokeWidth="8"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={`${eq.oee * 2.51} 251`}
                      className={
                        eq.oee >= 80
                          ? "stroke-green-500"
                          : eq.oee >= 60
                          ? "stroke-yellow-500"
                          : "stroke-red-500"
                      }
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-bold">{eq.oee}%</span>
                  </div>
                </div>
                <div>
                  <p className="font-medium">{eq.equipment}</p>
                  <p className="text-xs text-muted-foreground">
                    {eq.oee >= 80 ? "On Target" : eq.oee >= 60 ? "Below Target" : "Critical"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* World Class OEE Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            World Class OEE Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-4">
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-green-500">90%</p>
              <p className="text-sm text-muted-foreground">Availability Target</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-green-500">95%</p>
              <p className="text-sm text-muted-foreground">Performance Target</p>
            </div>
            <div className="p-4 rounded-lg bg-muted/50 text-center">
              <p className="text-2xl font-bold text-green-500">99%</p>
              <p className="text-sm text-muted-foreground">Quality Target</p>
            </div>
            <div className="p-4 rounded-lg bg-primary/10 text-center border border-primary/20">
              <p className="text-2xl font-bold text-primary">85%</p>
              <p className="text-sm text-muted-foreground">World Class OEE</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
