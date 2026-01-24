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
import { Progress } from "@/components/ui/progress";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Form,
  FormControl,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus,
  MoreHorizontal,
  Search,
  ClipboardList,
  Play,
  Pause,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  Filter,
  Calendar,
  Target,
  TrendingUp,
  Package,
} from "lucide-react";
import type { ProductionOrder, OrderStatus, Product, Equipment } from "@shared/schema";

const statusConfig: Record<OrderStatus, { label: string; icon: React.ComponentType<{ className?: string }>; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  pending: { label: "Pending", icon: Clock, variant: "outline" },
  in_progress: { label: "In Progress", icon: Play, variant: "default" },
  completed: { label: "Completed", icon: CheckCircle2, variant: "secondary" },
  on_hold: { label: "On Hold", icon: Pause, variant: "outline" },
  cancelled: { label: "Cancelled", icon: XCircle, variant: "destructive" },
};

const priorityLabels: Record<number, { label: string; color: string }> = {
  1: { label: "Low", color: "text-muted-foreground" },
  2: { label: "Medium", color: "text-yellow-600 dark:text-yellow-400" },
  3: { label: "High", color: "text-red-600 dark:text-red-400" },
};

const orderFormSchema = z.object({
  orderNumber: z.string().min(1, "Order number is required"),
  productId: z.string().optional(),
  equipmentId: z.string().optional(),
  targetQuantity: z.number().min(1, "Target quantity must be at least 1"),
  priority: z.number().min(1).max(3),
  plannedStart: z.string().optional(),
  plannedEnd: z.string().optional(),
  notes: z.string().optional(),
});

type OrderFormData = z.infer<typeof orderFormSchema>;

export default function ProductionOrders() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  const { data: orders, isLoading } = useQuery<ProductionOrder[]>({
    queryKey: ["/api/orders"],
  });

  const { data: products } = useQuery<Product[]>({
    queryKey: ["/api/products"],
  });

  const { data: equipmentList } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const form = useForm<OrderFormData>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: {
      orderNumber: "",
      targetQuantity: 100,
      priority: 2,
      notes: "",
    },
  });

  const createOrderMutation = useMutation({
    mutationFn: async (data: OrderFormData) => {
      return apiRequest("POST", "/api/orders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Order created",
        description: "Production order has been created successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create order. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: OrderStatus }) => {
      return apiRequest("PATCH", `/api/orders/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      toast({
        title: "Status updated",
        description: "Order status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: OrderFormData) => {
    createOrderMutation.mutate(data);
  };

  // Mock data for demonstration
  const mockOrders: ProductionOrder[] = [
    {
      id: "1",
      organizationId: "org1",
      orderNumber: "PO-2025-001",
      productId: "prod1",
      equipmentId: "eq1",
      targetQuantity: 500,
      producedQuantity: 425,
      goodQuantity: 420,
      rejectedQuantity: 5,
      status: "in_progress",
      priority: 3,
      plannedStart: new Date("2025-01-24T08:00:00"),
      plannedEnd: new Date("2025-01-24T16:00:00"),
      actualStart: new Date("2025-01-24T08:15:00"),
      actualEnd: null,
      notes: "Rush order for client ABC",
      createdBy: "user1",
      createdAt: new Date("2025-01-23T10:00:00"),
      updatedAt: new Date(),
    },
    {
      id: "2",
      organizationId: "org1",
      orderNumber: "PO-2025-002",
      productId: "prod2",
      equipmentId: "eq2",
      targetQuantity: 1000,
      producedQuantity: 1000,
      goodQuantity: 985,
      rejectedQuantity: 15,
      status: "completed",
      priority: 2,
      plannedStart: new Date("2025-01-23T08:00:00"),
      plannedEnd: new Date("2025-01-23T18:00:00"),
      actualStart: new Date("2025-01-23T08:00:00"),
      actualEnd: new Date("2025-01-23T17:30:00"),
      notes: null,
      createdBy: "user1",
      createdAt: new Date("2025-01-22T14:00:00"),
      updatedAt: new Date(),
    },
    {
      id: "3",
      organizationId: "org1",
      orderNumber: "PO-2025-003",
      productId: "prod1",
      equipmentId: "eq1",
      targetQuantity: 300,
      producedQuantity: 0,
      goodQuantity: 0,
      rejectedQuantity: 0,
      status: "pending",
      priority: 1,
      plannedStart: new Date("2025-01-25T08:00:00"),
      plannedEnd: new Date("2025-01-25T14:00:00"),
      actualStart: null,
      actualEnd: null,
      notes: "Standard order",
      createdBy: "user1",
      createdAt: new Date("2025-01-24T09:00:00"),
      updatedAt: new Date(),
    },
    {
      id: "4",
      organizationId: "org1",
      orderNumber: "PO-2025-004",
      productId: "prod3",
      equipmentId: "eq2",
      targetQuantity: 200,
      producedQuantity: 100,
      goodQuantity: 98,
      rejectedQuantity: 2,
      status: "on_hold",
      priority: 2,
      plannedStart: new Date("2025-01-24T10:00:00"),
      plannedEnd: new Date("2025-01-24T14:00:00"),
      actualStart: new Date("2025-01-24T10:15:00"),
      actualEnd: null,
      notes: "Waiting for material",
      createdBy: "user1",
      createdAt: new Date("2025-01-23T16:00:00"),
      updatedAt: new Date(),
    },
  ];

  const displayOrders = orders || mockOrders;

  const filteredOrders = displayOrders.filter((order) => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: displayOrders.length,
    inProgress: displayOrders.filter((o) => o.status === "in_progress").length,
    completed: displayOrders.filter((o) => o.status === "completed").length,
    pending: displayOrders.filter((o) => o.status === "pending").length,
  };

  const getProgress = (order: ProductionOrder) => {
    return Math.round((order.producedQuantity / order.targetQuantity) * 100);
  };

  const getQualityRate = (order: ProductionOrder) => {
    if (order.producedQuantity === 0) return 0;
    return Math.round((order.goodQuantity / order.producedQuantity) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Production Orders</h1>
          <p className="text-muted-foreground">
            Manage and track production orders
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-order">
          <Plus className="mr-2 h-4 w-4" />
          New Order
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Orders
            </CardTitle>
            <ClipboardList className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Play className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.inProgress}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed Today
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Orders</CardTitle>
              <CardDescription>
                {filteredOrders.length} orders found
              </CardDescription>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-48"
                  data-testid="input-search-orders"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as OrderStatus | "all")}
              >
                <SelectTrigger className="w-full sm:w-36" data-testid="select-status-filter">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : filteredOrders.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Scheduled</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map((order) => {
                    const StatusIcon = statusConfig[order.status as OrderStatus].icon;
                    const progress = getProgress(order);
                    const qualityRate = getQualityRate(order);

                    return (
                      <TableRow key={order.id} data-testid={`row-order-${order.id}`}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                              <ClipboardList className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{order.orderNumber}</p>
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                {order.targetQuantity} units
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusConfig[order.status as OrderStatus].variant}>
                            <StatusIcon className="mr-1 h-3 w-3" />
                            {statusConfig[order.status as OrderStatus].label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Progress value={progress} className="w-20" />
                            <span className="text-sm font-medium">{progress}%</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {order.producedQuantity}/{order.targetQuantity}
                          </p>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div
                              className={`h-2 w-2 rounded-full ${
                                qualityRate >= 95
                                  ? "bg-green-500"
                                  : qualityRate >= 90
                                  ? "bg-yellow-500"
                                  : "bg-red-500"
                              }`}
                            ></div>
                            <span className="text-sm">{qualityRate}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={`text-sm font-medium ${priorityLabels[order.priority].color}`}>
                            {priorityLabels[order.priority].label}
                          </span>
                        </TableCell>
                        <TableCell>
                          {order.plannedStart && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              {new Date(order.plannedStart).toLocaleDateString()}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                data-testid={`button-order-menu-${order.id}`}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuSeparator />
                              {order.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: order.id,
                                      status: "in_progress",
                                    })
                                  }
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Start Production
                                </DropdownMenuItem>
                              )}
                              {order.status === "in_progress" && (
                                <>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: order.id,
                                        status: "on_hold",
                                      })
                                    }
                                  >
                                    <Pause className="mr-2 h-4 w-4" />
                                    Put On Hold
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() =>
                                      updateStatusMutation.mutate({
                                        id: order.id,
                                        status: "completed",
                                      })
                                    }
                                  >
                                    <CheckCircle2 className="mr-2 h-4 w-4" />
                                    Mark Complete
                                  </DropdownMenuItem>
                                </>
                              )}
                              {order.status === "on_hold" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updateStatusMutation.mutate({
                                      id: order.id,
                                      status: "in_progress",
                                    })
                                  }
                                >
                                  <Play className="mr-2 h-4 w-4" />
                                  Resume Production
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-destructive">
                                <XCircle className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No orders found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all"
                  ? "Try adjusting your search or filter"
                  : "Create your first production order to get started"}
              </p>
              {!searchQuery && statusFilter === "all" && (
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Order
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Order Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Production Order</DialogTitle>
            <DialogDescription>
              Enter the details for the new production order
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="orderNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Order Number</FormLabel>
                    <FormControl>
                      <Input placeholder="PO-2025-XXX" {...field} data-testid="input-order-number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="targetQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Quantity</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          data-testid="input-target-quantity"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priority"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Priority</FormLabel>
                      <Select
                        value={field.value.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <FormControl>
                          <SelectTrigger data-testid="select-priority">
                            <SelectValue placeholder="Select priority" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">Low</SelectItem>
                          <SelectItem value="2">Medium</SelectItem>
                          <SelectItem value="3">High</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="plannedStart"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned Start</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-planned-start" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="plannedEnd"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Planned End</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} data-testid="input-planned-end" />
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
                        placeholder="Additional notes..."
                        className="resize-none"
                        {...field}
                        data-testid="input-notes"
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
                  disabled={createOrderMutation.isPending}
                  data-testid="button-save-order"
                >
                  {createOrderMutation.isPending ? "Creating..." : "Create Order"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
