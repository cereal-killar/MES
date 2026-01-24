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
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Plus,
  Factory,
  Settings,
  Activity,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import type { Equipment } from "@shared/schema";

const equipmentFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  code: z.string().min(1, "Code is required"),
  description: z.string().optional(),
  plannedCycleTime: z.string().optional(),
  isActive: z.boolean().default(true),
});

type EquipmentFormData = z.infer<typeof equipmentFormSchema>;

export default function EquipmentPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);

  const { data: equipment, isLoading } = useQuery<Equipment[]>({
    queryKey: ["/api/equipment"],
  });

  const form = useForm<EquipmentFormData>({
    resolver: zodResolver(equipmentFormSchema),
    defaultValues: {
      name: "",
      code: "",
      description: "",
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: EquipmentFormData) => {
      return apiRequest("POST", "/api/equipment", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/equipment"] });
      toast({
        title: "Equipment created",
        description: "Equipment has been added successfully.",
      });
      setIsCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create equipment.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: EquipmentFormData) => {
    createMutation.mutate(data);
  };

  // Mock data
  const mockEquipment: Equipment[] = [
    {
      id: "1",
      organizationId: "org1",
      name: "Production Line 1",
      code: "PL-001",
      description: "Main production line for widgets",
      isActive: true,
      plannedCycleTime: "15.5",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "2",
      organizationId: "org1",
      name: "Production Line 2",
      code: "PL-002",
      description: "Secondary production line",
      isActive: true,
      plannedCycleTime: "12.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "3",
      organizationId: "org1",
      name: "Packaging Station",
      code: "PKG-001",
      description: "Automated packaging system",
      isActive: false,
      plannedCycleTime: "8.0",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const displayEquipment = equipment || mockEquipment;

  const stats = {
    total: displayEquipment.length,
    active: displayEquipment.filter((e) => e.isActive).length,
    inactive: displayEquipment.filter((e) => !e.isActive).length,
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipment</h1>
          <p className="text-muted-foreground">
            Manage your production equipment and machines
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-add-equipment">
          <Plus className="mr-2 h-4 w-4" />
          Add Equipment
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Equipment
            </CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Inactive
            </CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inactive}</div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <>
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
            <Skeleton className="h-48" />
          </>
        ) : displayEquipment.length > 0 ? (
          displayEquipment.map((eq) => (
            <Card key={eq.id} className="hover-elevate" data-testid={`card-equipment-${eq.id}`}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Factory className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-base">{eq.name}</CardTitle>
                      <CardDescription>{eq.code}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={eq.isActive ? "secondary" : "outline"}>
                    {eq.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {eq.description && (
                  <p className="text-sm text-muted-foreground">{eq.description}</p>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Cycle: {eq.plannedCycleTime || "-"}s</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    data-testid={`button-edit-equipment-${eq.id}`}
                  >
                    <Edit className="mr-1 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    data-testid={`button-view-equipment-${eq.id}`}
                  >
                    <Activity className="mr-1 h-3 w-3" />
                    Stats
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Factory className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No equipment found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first piece of equipment to get started
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create Equipment Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Equipment</DialogTitle>
            <DialogDescription>
              Add a new piece of equipment to track
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Production Line 1" {...field} data-testid="input-equipment-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Code</FormLabel>
                    <FormControl>
                      <Input placeholder="PL-001" {...field} data-testid="input-equipment-code" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="plannedCycleTime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Planned Cycle Time (seconds)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.1" placeholder="15.0" {...field} data-testid="input-cycle-time" />
                    </FormControl>
                    <FormDescription>Ideal cycle time per unit</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Equipment description..."
                        className="resize-none"
                        {...field}
                        data-testid="input-equipment-description"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active</FormLabel>
                      <FormDescription>
                        Is this equipment currently in use?
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-equipment-active"
                      />
                    </FormControl>
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
                  disabled={createMutation.isPending}
                  data-testid="button-save-equipment"
                >
                  {createMutation.isPending ? "Saving..." : "Add Equipment"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
