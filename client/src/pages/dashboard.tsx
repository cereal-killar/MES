import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery } from "@tanstack/react-query";
import {
  TrendingUp,
  TrendingDown,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Activity,
  Target,
  Zap,
  Award,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ProductionOrder, OeeRecord } from "@shared/schema";
import { Link } from "wouter";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-2))", "hsl(var(--chart-3))", "hsl(var(--chart-4))", "hsl(var(--chart-5))"];

function StatCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  description,
}: {
  title: string;
  value: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: React.ComponentType<{ className?: string }>;
  description?: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <div className="flex items-center gap-1 text-xs mt-1">
            {changeType === "positive" ? (
              <ArrowUpRight className="h-3 w-3 text-green-500" />
            ) : changeType === "negative" ? (
              <ArrowDownRight className="h-3 w-3 text-red-500" />
            ) : null}
            <span
              className={
                changeType === "positive"
                  ? "text-green-500"
                  : changeType === "negative"
                  ? "text-red-500"
                  : "text-muted-foreground"
              }
            >
              {change}
            </span>
            {description && <span className="text-muted-foreground">{description}</span>}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function OeeGauge({ value, label }: { value: number; label: string }) {
  const getColor = (val: number) => {
    if (val >= 85) return "text-green-500";
    if (val >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative h-24 w-24">
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
            strokeDasharray={`${value * 2.51} 251`}
            className={getColor(value).replace("text-", "stroke-")}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-lg font-bold ${getColor(value)}`}>{value}%</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-medium">{label}</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: orders, isLoading: ordersLoading } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/orders"],
  });

  const { data: oeeData, isLoading: oeeLoading } = useQuery<OeeRecord[]>({
    queryKey: ["/api/oee/summary"],
  });

  const { data: dashboardStats } = useQuery<{
    totalOrders: number;
    activeOrders: number;
    completedToday: number;
    totalDowntime: number;
    avgOee: number;
    availability: number;
    performance: number;
    quality: number;
  }>({
    queryKey: ["/api/dashboard/stats"],
  });

  // Mock data for charts (will be replaced with real data)
  const weeklyOeeData = [
    { day: "Mon", oee: 82, availability: 90, performance: 88, quality: 96 },
    { day: "Tue", oee: 78, availability: 85, performance: 86, quality: 97 },
    { day: "Wed", oee: 85, availability: 92, performance: 90, quality: 95 },
    { day: "Thu", oee: 80, availability: 88, performance: 87, quality: 96 },
    { day: "Fri", oee: 84, availability: 91, performance: 89, quality: 97 },
    { day: "Sat", oee: 76, availability: 84, performance: 85, quality: 94 },
    { day: "Sun", oee: 79, availability: 87, performance: 86, quality: 95 },
  ];

  const orderStatusData = [
    { name: "In Progress", value: 5, color: "hsl(var(--chart-1))" },
    { name: "Pending", value: 3, color: "hsl(var(--chart-4))" },
    { name: "Completed", value: 8, color: "hsl(var(--chart-3))" },
    { name: "On Hold", value: 2, color: "hsl(var(--chart-5))" },
  ];

  const downtimeByReason = [
    { reason: "Changeover", minutes: 45 },
    { reason: "Breakdown", minutes: 30 },
    { reason: "Material", minutes: 20 },
    { reason: "Maintenance", minutes: 60 },
    { reason: "Quality", minutes: 15 },
  ];

  const recentOrders = orders?.slice(0, 5) || [];

  const stats = dashboardStats || {
    totalOrders: 18,
    activeOrders: 5,
    completedToday: 3,
    totalDowntime: 170,
    avgOee: 84,
    availability: 89,
    performance: 87,
    quality: 96,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time overview of your manufacturing operations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500"></span>
            Live
          </Badge>
          <span className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </span>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Orders"
          value={stats.totalOrders.toString()}
          change="+12%"
          changeType="positive"
          description="vs last week"
          icon={ClipboardList}
        />
        <StatCard
          title="Active Orders"
          value={stats.activeOrders.toString()}
          change="2 pending"
          changeType="neutral"
          icon={Activity}
        />
        <StatCard
          title="Completed Today"
          value={stats.completedToday.toString()}
          change="+2"
          changeType="positive"
          description="vs yesterday"
          icon={CheckCircle2}
        />
        <StatCard
          title="Downtime Today"
          value={`${stats.totalDowntime} min`}
          change="-15%"
          changeType="positive"
          description="vs average"
          icon={AlertTriangle}
        />
      </div>

      {/* OEE Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>OEE Overview</CardTitle>
              <CardDescription>Overall Equipment Effectiveness metrics</CardDescription>
            </div>
            <Link href="/oee">
              <Button variant="outline" size="sm" data-testid="button-view-oee-details">
                View Details
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-8 lg:grid-cols-2">
            <div className="flex items-center justify-around">
              <OeeGauge value={stats.availability} label="Availability" />
              <OeeGauge value={stats.performance} label="Performance" />
              <OeeGauge value={stats.quality} label="Quality" />
            </div>
            <div className="flex flex-col items-center justify-center">
              <div className="relative h-32 w-32">
                <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    strokeWidth="12"
                    fill="none"
                    className="stroke-muted"
                  />
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    strokeWidth="12"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={`${stats.avgOee * 2.51} 251`}
                    className="stroke-primary"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">{stats.avgOee}%</span>
                  <span className="text-xs text-muted-foreground">Overall OEE</span>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-green-500">+3.2%</span>
                <span className="text-muted-foreground">vs last week</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly OEE Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly OEE Trend</CardTitle>
            <CardDescription>OEE performance over the past week</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyOeeData}>
                  <defs>
                    <linearGradient id="oeeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis domain={[0, 100]} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="oee"
                    stroke="hsl(var(--primary))"
                    fill="url(#oeeGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
            <CardDescription>Current status of all production orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={orderStatusData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {orderStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {orderStatusData.map((status, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: status.color }}
                    ></div>
                    <span className="text-sm">{status.name}</span>
                    <span className="ml-auto text-sm font-medium">{status.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest production orders</CardDescription>
              </div>
              <Link href="/orders">
                <Button variant="outline" size="sm" data-testid="button-view-all-orders">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersLoading ? (
                <>
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </>
              ) : recentOrders.length > 0 ? (
                recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <ClipboardList className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{order.orderNumber}</p>
                        <p className="text-xs text-muted-foreground">
                          Target: {order.targetQuantity} units
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Progress
                        value={(order.producedQuantity / order.targetQuantity) * 100}
                        className="w-20"
                      />
                      <Badge
                        variant={
                          order.status === "completed"
                            ? "default"
                            : order.status === "in_progress"
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {order.status?.replace("_", " ")}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ClipboardList className="h-10 w-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">No orders yet</p>
                  <Link href="/orders">
                    <Button variant="link" size="sm">
                      Create your first order
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Downtime by Reason */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Downtime by Reason</CardTitle>
                <CardDescription>Today's downtime breakdown</CardDescription>
              </div>
              <Link href="/downtime">
                <Button variant="outline" size="sm" data-testid="button-view-downtime">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={downtimeByReason} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis type="number" className="text-xs" />
                  <YAxis dataKey="reason" type="category" width={80} className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} min`, "Duration"]}
                  />
                  <Bar dataKey="minutes" fill="hsl(var(--chart-5))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
