import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  Plus,
  AlertTriangle,
  Clock,
  Wrench,
  Package,
  Zap,
  Coffee,
  HelpCircle,
  Timer,
  Calendar,
  TrendingDown,
  CheckCircle,
} from "lucide-react";
import type { DowntimeLog, DowntimeReason } from "@shared/schema";

const reasonConfig: Record<DowntimeReason, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
  planned_maintenance: { label: "Planned Maintenance", icon: Wrench, color: "hsl(var(--chart-1))" },
  unplanned_breakdown: { label: "Unplanned Breakdown", icon: AlertTriangle, color: "hsl(var(--chart-5))" },
  changeover: { label: "Changeover", icon: Package, color: "hsl(var(--chart-2))" },
  material_shortage: { label: "Material Shortage", icon: Package, color: "hsl(var(--chart-4))" },
  quality_issue: { label: "Quality Issue", icon: AlertTriangle, color: "hsl(var(--chart-3))" },
  operator_break: { label: "Operator Break", icon: Coffee, color: "hsl(var(--muted-foreground))" },
  waiting_for_approval: { label: "Waiting for Approval", icon: Clock, color: "hsl(var(--chart-4))" },
  other: { label: "Other", icon: HelpCircle, color: "hsl(var(--muted-foreground))" },
};

const downtimeFormSchema = z.object({
  reason: z.enum([
    "planned_maintenance",
    "unplanned_breakdown",
    "changeover",
    "material_shortage",
    "quality_issue",
    "operator_break",
    "waiting_for_approval",
    "other",
  ]),
  customReason: z.string().optional(),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  isPlanned: z.boolean().default(false),
  notes: z.string().optional(),
});

type DowntimeFormData = z.infer<typeof downtimeFormSchema>;

export default function Downtime() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: downtimeLogs, isLoading } = useQuery<DowntimeLog[]>({
    queryKey: ["/api/downtime"],
  });

  const form = useForm<DowntimeFormData>({
    resolver: zodResolver(downtimeFormSchema),
    defaultValues: {
      reason: "unplanned_breakdown",
      startTime: new Date().toISOString().slice(0, 16),
      isPlanned: false,
      notes: "",
    },
  });

  const selectedReason = form.watch("reason");

  const createDowntimeMutation = useMutation({
    mutationFn: async (data: DowntimeFormData) => {
      return apiRequest("POST", "/api/downtime", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downtime"] });
      toast({
        title: "Downtime logged",
        description: "Downtime event has been recorded successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log downtime. Please try again.",
        variant: "destructive",
      });
    },
  });

  const endDowntimeMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/downtime/${id}`, {
        endTime: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/downtime"] });
      toast({
        title: "Downtime ended",
        description: "Downtime event has been marked as resolved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to end downtime.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: DowntimeFormData) => {
    createDowntimeMutation.mutate(data);
  };

  // Mock data for demonstration
  const mockDowntimeLogs: DowntimeLog[] = [
    {
      id: "1",
      organizationId: "org1",
      productionOrderId: "1",
      equipmentId: "eq1",
      operatorId: user?.id || "user1",
      reason: "changeover",
      customReason: null,
      startTime: new Date("2025-01-24T10:00:00"),
      endTime: new Date("2025-01-24T10:30:00"),
      durationMinutes: 30,
      isPlanned: true,
      notes: "Product changeover to new SKU",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      organizationId: "org1",
      productionOrderId: "1",
      equipmentId: "eq1",
      operatorId: user?.id || "user1",
      reason: "unplanned_breakdown",
      customReason: null,
      startTime: new Date("2025-01-24T14:30:00"),
      endTime: null,
      durationMinutes: null,
      isPlanned: false,
      notes: "Motor overheating, maintenance called",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      organizationId: "org1",
      productionOrderId: "2",
      equipmentId: "eq2",
      operatorId: user?.id || "user1",
      reason: "material_shortage",
      customReason: null,
      startTime: new Date("2025-01-24T09:00:00"),
      endTime: new Date("2025-01-24T09:45:00"),
      durationMinutes: 45,
      isPlanned: false,
      notes: "Waiting for raw material delivery",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "4",
      organizationId: "org1",
      productionOrderId: null,
      equipmentId: "eq1",
      operatorId: user?.id || "user1",
      reason: "planned_maintenance",
      customReason: null,
      startTime: new Date("2025-01-23T16:00:00"),
      endTime: new Date("2025-01-23T17:00:00"),
      durationMinutes: 60,
      isPlanned: true,
      notes: "Weekly preventive maintenance",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const displayLogs = downtimeLogs || mockDowntimeLogs;

  // Calculate stats
  const stats = {
    totalEvents: displayLogs.length,
    activeEvents: displayLogs.filter((d) => !d.endTime).length,
    totalMinutes: displayLogs.reduce((acc, d) => acc + (d.durationMinutes || 0), 0),
    plannedMinutes: displayLogs
      .filter((d) => d.isPlanned)
      .reduce((acc, d) => acc + (d.durationMinutes || 0), 0),
    unplannedMinutes: displayLogs
      .filter((d) => !d.isPlanned)
      .reduce((acc, d) => acc + (d.durationMinutes || 0), 0),
  };

  // Chart data
  const reasonChartData = Object.entries(reasonConfig).map(([reason, config]) => ({
    name: config.label,
    value: displayLogs
      .filter((d) => d.reason === reason)
      .reduce((acc, d) => acc + (d.durationMinutes || 0), 0),
    color: config.color,
  })).filter((d) => d.value > 0);

  const dailyChartData = [
    { day: "Mon", planned: 60, unplanned: 30 },
    { day: "Tue", planned: 30, unplanned: 45 },
    { day: "Wed", planned: 45, unplanned: 20 },
    { day: "Thu", planned: 60, unplanned: 75 },
    { day: "Fri", planned: 30, unplanned: 15 },
    { day: "Sat", planned: 0, unplanned: 25 },
    { day: "Sun", planned: 0, unplanned: 10 },
  ];

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) return `${hours}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Downtime Tracking</h1>
          <p className="text-muted-foreground">
            Log and analyze equipment downtime events
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-log-downtime">
          <Plus className="mr-2 h-4 w-4" />
          Log Downtime
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Now
            </CardTitle>
            <Zap className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.activeEvents}</div>
            <p className="text-xs text-muted-foreground mt-1">Ongoing events</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Planned Downtime
            </CardTitle>
            <Wrench className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{formatDuration(stats.plannedMinutes)}</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Unplanned Downtime
            </CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{formatDuration(stats.unplannedMinutes)}</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Weekly Downtime Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Downtime Trend</CardTitle>
            <CardDescription>Planned vs unplanned downtime by day</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="day" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} min`, ""]}
                  />
                  <Bar dataKey="planned" name="Planned" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="unplanned" name="Unplanned" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Downtime by Reason */}
        <Card>
          <CardHeader>
            <CardTitle>Downtime by Reason</CardTitle>
            <CardDescription>Total minutes by downtime category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reasonChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {reasonChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} min`, ""]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {reasonChartData.slice(0, 5).map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm truncate max-w-24">{item.name}</span>
                    <span className="ml-auto text-sm font-medium">{item.value}m</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Downtime Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Downtime Events</CardTitle>
          <CardDescription>All logged downtime events</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : displayLogs.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reason</TableHead>
                    <TableHead>Start Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayLogs.map((log) => {
                    const ReasonIcon = reasonConfig[log.reason as DowntimeReason].icon;
                    const isActive = !log.endTime;

                    return (
                      <TableRow key={log.id} data-testid={`row-downtime-${log.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-lg"
                              style={{
                                backgroundColor: `${reasonConfig[log.reason as DowntimeReason].color}20`,
                              }}
                            >
                              <ReasonIcon
                                className="h-4 w-4"
                                style={{
                                  color: reasonConfig[log.reason as DowntimeReason].color,
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium">
                              {reasonConfig[log.reason as DowntimeReason].label}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {new Date(log.startTime).toLocaleDateString()}
                            <span className="text-muted-foreground ml-2">
                              {new Date(log.startTime).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Timer className="h-3 w-3 text-muted-foreground" />
                            {isActive ? (
                              <span className="text-red-500 font-medium">Ongoing</span>
                            ) : (
                              formatDuration(log.durationMinutes)
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={log.isPlanned ? "secondary" : "destructive"}>
                            {log.isPlanned ? "Planned" : "Unplanned"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground truncate max-w-32 block">
                            {log.notes || "-"}
                          </span>
                        </TableCell>
                        <TableCell>
                          {isActive ? (
                            <Badge variant="outline" className="gap-1 text-red-500 border-red-200">
                              <Zap className="h-3 w-3" />
                              Active
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="gap-1 text-green-600">
                              <CheckCircle className="h-3 w-3" />
                              Resolved
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isActive && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => endDowntimeMutation.mutate(log.id)}
                              disabled={endDowntimeMutation.isPending}
                              data-testid={`button-end-downtime-${log.id}`}
                            >
                              End
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No downtime logged</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Log downtime events to track equipment availability
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Downtime
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Downtime Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Downtime Event</DialogTitle>
            <DialogDescription>
              Record a downtime event for tracking and analysis
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="reason"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reason</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-downtime-reason">
                          <SelectValue placeholder="Select reason" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(reasonConfig).map(([value, config]) => {
                          const Icon = config.icon;
                          return (
                            <SelectItem key={value} value={value}>
                              <div className="flex items-center gap-2">
                                <Icon className="h-4 w-4" />
                                {config.label}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {selectedReason === "other" && (
                <FormField
                  control={form.control}
                  name="customReason"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Custom Reason</FormLabel>
                      <FormControl>
                        <Input placeholder="Specify the reason" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-downtime-start" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>End Time</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-downtime-end" />
                      </FormControl>
                      <FormDescription>Leave empty if still ongoing</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isPlanned"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Planned Downtime</FormLabel>
                      <FormDescription>
                        Is this a scheduled maintenance or planned stop?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-is-planned"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Additional details about the downtime..."
                        className="resize-none"
                        {...field}
                        data-testid="input-downtime-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createDowntimeMutation.isPending}
                  data-testid="button-save-downtime"
                >
                  {createDowntimeMutation.isPending ? "Saving..." : "Log Downtime"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
