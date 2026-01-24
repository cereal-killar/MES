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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import {
  Plus,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Timer,
  Package,
  AlertCircle,
  Coffee,
} from "lucide-react";
import type { Timesheet, ProductionOrder } from "@shared/schema";

const timesheetFormSchema = z.object({
  productionOrderId: z.string().optional(),
  shiftDate: z.string().min(1, "Shift date is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().optional(),
  breakDuration: z.number().min(0).default(0),
  producedQuantity: z.number().min(0).default(0),
  goodQuantity: z.number().min(0).default(0),
  rejectedQuantity: z.number().min(0).default(0),
  notes: z.string().optional(),
});

type TimesheetFormData = z.infer<typeof timesheetFormSchema>;

export default function Timesheets() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState(new Date().toISOString().split("T")[0]);

  const { data: timesheets, isLoading } = useQuery<Timesheet[]>({
    queryKey: ["/api/timesheets"],
  });

  const { data: orders } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/orders"],
  });

  const form = useForm<TimesheetFormData>({
    resolver: zodResolver(timesheetFormSchema),
    defaultValues: {
      shiftDate: new Date().toISOString().split("T")[0],
      startTime: "",
      endTime: "",
      breakDuration: 0,
      producedQuantity: 0,
      goodQuantity: 0,
      rejectedQuantity: 0,
      notes: "",
    },
  });

  const createTimesheetMutation = useMutation({
    mutationFn: async (data: TimesheetFormData) => {
      return apiRequest("POST", "/api/timesheets", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/timesheets"] });
      toast({
        title: "Timesheet created",
        description: "Your timesheet has been recorded successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create timesheet. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TimesheetFormData) => {
    createTimesheetMutation.mutate(data);
  };

  // Mock data for demonstration
  const mockTimesheets: Timesheet[] = [
    {
      id: "1",
      organizationId: "org1",
      productionOrderId: "1",
      equipmentId: "eq1",
      operatorId: user?.id || "user1",
      shiftDate: new Date("2025-01-24"),
      startTime: new Date("2025-01-24T08:00:00"),
      endTime: new Date("2025-01-24T16:00:00"),
      breakDuration: 45,
      producedQuantity: 450,
      goodQuantity: 445,
      rejectedQuantity: 5,
      notes: "Regular shift, minor material delay",
      isApproved: true,
      approvedBy: "supervisor1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      organizationId: "org1",
      productionOrderId: "2",
      equipmentId: "eq2",
      operatorId: user?.id || "user1",
      shiftDate: new Date("2025-01-24"),
      startTime: new Date("2025-01-24T16:00:00"),
      endTime: null,
      breakDuration: 30,
      producedQuantity: 200,
      goodQuantity: 198,
      rejectedQuantity: 2,
      notes: "Shift in progress",
      isApproved: false,
      approvedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      organizationId: "org1",
      productionOrderId: "1",
      equipmentId: "eq1",
      operatorId: user?.id || "user1",
      shiftDate: new Date("2025-01-23"),
      startTime: new Date("2025-01-23T08:00:00"),
      endTime: new Date("2025-01-23T16:00:00"),
      breakDuration: 45,
      producedQuantity: 520,
      goodQuantity: 510,
      rejectedQuantity: 10,
      notes: "Completed shift",
      isApproved: true,
      approvedBy: "supervisor1",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const displayTimesheets = timesheets || mockTimesheets;

  const calculateDuration = (start: Date, end: Date | null, breakMin: number) => {
    if (!end) return "In Progress";
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const totalMinutes = Math.floor(diffMs / 60000) - breakMin;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const stats = {
    totalHours: displayTimesheets.reduce((acc, ts) => {
      if (ts.endTime) {
        const diffMs = new Date(ts.endTime).getTime() - new Date(ts.startTime).getTime();
        return acc + (diffMs / 3600000) - (ts.breakDuration || 0) / 60;
      }
      return acc;
    }, 0),
    totalProduced: displayTimesheets.reduce((acc, ts) => acc + (ts.producedQuantity || 0), 0),
    totalGood: displayTimesheets.reduce((acc, ts) => acc + (ts.goodQuantity || 0), 0),
    pendingApproval: displayTimesheets.filter((ts) => !ts.isApproved && ts.endTime).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Timesheets</h1>
          <p className="text-muted-foreground">
            Log your work hours and production output
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-log-time">
          <Plus className="mr-2 h-4 w-4" />
          Log Time
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hours
            </CardTitle>
            <Timer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalHours.toFixed(1)}h</div>
            <p className="text-xs text-muted-foreground mt-1">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Units Produced
            </CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.totalProduced}</div>
            <p className="text-xs text-muted-foreground mt-1">Total output</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Quality Rate
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {stats.totalProduced > 0
                ? ((stats.totalGood / stats.totalProduced) * 100).toFixed(1)
                : 0}
              %
            </div>
            <p className="text-xs text-muted-foreground mt-1">Good units</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pendingApproval}</div>
            <p className="text-xs text-muted-foreground mt-1">Timesheets</p>
          </CardContent>
        </Card>
      </div>

      {/* Timesheets Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Recent Timesheets</CardTitle>
              <CardDescription>
                Your logged work hours and production data
              </CardDescription>
            </div>
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full sm:w-auto"
              data-testid="input-date-filter"
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : displayTimesheets.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Break</TableHead>
                    <TableHead>Produced</TableHead>
                    <TableHead>Good/Rejected</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayTimesheets.map((timesheet) => (
                    <TableRow key={timesheet.id} data-testid={`row-timesheet-${timesheet.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {new Date(timesheet.shiftDate).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <span>{new Date(timesheet.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          <span className="text-muted-foreground"> - </span>
                          <span>
                            {timesheet.endTime
                              ? new Date(timesheet.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                              : "Now"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-muted-foreground" />
                          {calculateDuration(
                            timesheet.startTime,
                            timesheet.endTime,
                            timesheet.breakDuration || 0
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Coffee className="h-3 w-3 text-muted-foreground" />
                          {timesheet.breakDuration || 0}m
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{timesheet.producedQuantity || 0}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-green-600 dark:text-green-400">
                            {timesheet.goodQuantity || 0}
                          </span>
                          <span className="text-muted-foreground">/</span>
                          <span className="text-red-600 dark:text-red-400">
                            {timesheet.rejectedQuantity || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {!timesheet.endTime ? (
                          <Badge variant="outline" className="gap-1">
                            <Clock className="h-3 w-3" />
                            In Progress
                          </Badge>
                        ) : timesheet.isApproved ? (
                          <Badge variant="secondary" className="gap-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            Approved
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-300 dark:text-yellow-400">
                            <AlertCircle className="h-3 w-3" />
                            Pending
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No timesheets found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Log your first timesheet to track your production hours
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Log Time
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Timesheet Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Log Timesheet</DialogTitle>
            <DialogDescription>
              Record your work hours and production output
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="shiftDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shift Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} data-testid="input-shift-date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} data-testid="input-start-time" />
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
                        <Input type="time" {...field} data-testid="input-end-time" />
                      </FormControl>
                      <FormDescription>Leave empty if still working</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="breakDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Break Duration (minutes)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        data-testid="input-break-duration"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-3">
                <FormField
                  control={form.control}
                  name="producedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Produced</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-produced"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="goodQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Good Units</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-good"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="rejectedQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rejected</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          data-testid="input-rejected"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any issues or comments..."
                        className="resize-none"
                        {...field}
                        data-testid="input-timesheet-notes"
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
                  disabled={createTimesheetMutation.isPending}
                  data-testid="button-save-timesheet"
                >
                  {createTimesheetMutation.isPending ? "Saving..." : "Save Timesheet"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
