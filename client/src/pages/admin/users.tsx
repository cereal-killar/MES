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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import {
  Users,
  UserPlus,
  MoreHorizontal,
  Search,
  Shield,
  ShieldCheck,
  Edit,
  Trash2,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";
import type { OrganizationMember, UserRole } from "@shared/schema";

const roleLabels: Record<UserRole, string> = {
  management: "Management",
  engineer: "Engineer",
  quality: "Quality",
  operator: "Operator",
};

const roleDescriptions: Record<UserRole, string> = {
  management: "Full access to all features including admin functions",
  engineer: "Access to production data, OEE, and equipment management",
  quality: "Access to quality metrics, inspections, and alerts",
  operator: "Access to timesheets, production orders, and downtime logging",
};

const roleBadgeVariants: Record<UserRole, "default" | "secondary" | "outline"> = {
  management: "default",
  engineer: "secondary",
  quality: "secondary",
  operator: "outline",
};

// Form schema for editing member role
const editMemberSchema = z.object({
  role: z.enum(["management", "engineer", "quality", "operator"]),
  isAdmin: z.boolean(),
  isActive: z.boolean(),
});

type EditMemberForm = z.infer<typeof editMemberSchema>;

// Extended type with user info
interface MemberWithUser extends OrganizationMember {
  user?: {
    firstName: string | null;
    lastName: string | null;
    email: string | null;
    profileImageUrl: string | null;
  };
}

export default function AdminUsers() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [editingMember, setEditingMember] = useState<MemberWithUser | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const { data: members, isLoading } = useQuery<MemberWithUser[]>({
    queryKey: ["/api/admin/members"],
  });

  const form = useForm<EditMemberForm>({
    resolver: zodResolver(editMemberSchema),
    defaultValues: {
      role: "operator",
      isAdmin: false,
      isActive: true,
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditMemberForm }) => {
      return apiRequest("PATCH", `/api/admin/members/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      toast({
        title: "Member updated",
        description: "User role and permissions have been updated.",
      });
      setIsEditDialogOpen(false);
      setEditingMember(null);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      return apiRequest("PATCH", `/api/admin/members/${id}`, { isActive });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/members"] });
      toast({
        title: "Status updated",
        description: "User status has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update user status.",
        variant: "destructive",
      });
    },
  });

  const handleEdit = (member: MemberWithUser) => {
    setEditingMember(member);
    form.reset({
      role: member.role as UserRole,
      isAdmin: member.isAdmin,
      isActive: member.isActive,
    });
    setIsEditDialogOpen(true);
  };

  const onSubmit = (data: EditMemberForm) => {
    if (editingMember) {
      updateMemberMutation.mutate({ id: editingMember.id, data });
    }
  };

  const filteredMembers = members?.filter((member) => {
    if (!searchQuery) return true;
    const searchLower = searchQuery.toLowerCase();
    const fullName = `${member.user?.firstName || ""} ${member.user?.lastName || ""}`.toLowerCase();
    const email = member.user?.email?.toLowerCase() || "";
    return fullName.includes(searchLower) || email.includes(searchLower);
  });

  // Mock data for demonstration
  const mockMembers: MemberWithUser[] = [
    {
      id: "1",
      organizationId: "org1",
      userId: "user1",
      role: "management",
      isAdmin: true,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        firstName: "Ahmed",
        lastName: "Hassan",
        email: "ahmed.hassan@example.com",
        profileImageUrl: null,
      },
    },
    {
      id: "2",
      organizationId: "org1",
      userId: "user2",
      role: "engineer",
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        firstName: "Sara",
        lastName: "Mohamed",
        email: "sara.mohamed@example.com",
        profileImageUrl: null,
      },
    },
    {
      id: "3",
      organizationId: "org1",
      userId: "user3",
      role: "quality",
      isAdmin: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        firstName: "Omar",
        lastName: "Ali",
        email: "omar.ali@example.com",
        profileImageUrl: null,
      },
    },
    {
      id: "4",
      organizationId: "org1",
      userId: "user4",
      role: "operator",
      isAdmin: false,
      isActive: false,
      createdAt: new Date(),
      updatedAt: new Date(),
      user: {
        firstName: "Fatima",
        lastName: "Ibrahim",
        email: "fatima.ibrahim@example.com",
        profileImageUrl: null,
      },
    },
  ];

  const displayMembers = filteredMembers || mockMembers;

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase() || "U";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage team members and their access permissions
          </p>
        </div>
        <Button data-testid="button-invite-user">
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Role Overview Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(Object.keys(roleLabels) as UserRole[]).map((role) => {
          const count = displayMembers.filter((m) => m.role === role).length;
          return (
            <Card key={role}>
              <CardHeader className="flex flex-row items-center justify-between gap-2 pb-2">
                <CardTitle className="text-sm font-medium">
                  {roleLabels[role]}
                </CardTitle>
                <Badge variant={roleBadgeVariants[role]}>{count}</Badge>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {roleDescriptions[role]}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {displayMembers.length} members in your organization
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search members..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-users"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Admin</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayMembers.map((member) => (
                    <TableRow key={member.id} data-testid={`row-user-${member.id}`}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarImage
                              src={member.user?.profileImageUrl || undefined}
                              alt={member.user?.firstName || "User"}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {getInitials(member.user?.firstName, member.user?.lastName)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">
                              {member.user?.firstName} {member.user?.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {member.user?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={roleBadgeVariants[member.role as UserRole]}>
                          {roleLabels[member.role as UserRole]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {member.isAdmin ? (
                          <ShieldCheck className="h-5 w-5 text-primary" />
                        ) : (
                          <Shield className="h-5 w-5 text-muted-foreground/30" />
                        )}
                      </TableCell>
                      <TableCell>
                        {member.isActive ? (
                          <Badge variant="outline" className="gap-1 text-green-600 border-green-200 bg-green-50 dark:bg-green-950/30 dark:border-green-900">
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-muted-foreground">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {member.createdAt
                          ? new Date(member.createdAt).toLocaleDateString()
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              data-testid={`button-user-menu-${member.id}`}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => handleEdit(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Role
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                toggleActiveMutation.mutate({
                                  id: member.id,
                                  isActive: !member.isActive,
                                })
                              }
                            >
                              {member.isActive ? (
                                <>
                                  <XCircle className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Member</DialogTitle>
            <DialogDescription>
              Update role and permissions for{" "}
              {editingMember?.user?.firstName} {editingMember?.user?.lastName}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger data-testid="select-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {(Object.keys(roleLabels) as UserRole[]).map((role) => (
                          <SelectItem key={role} value={role}>
                            {roleLabels[role]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {roleDescriptions[field.value as UserRole]}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isAdmin"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Admin Access</FormLabel>
                      <FormDescription>
                        Admins can manage users and organization settings
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-admin"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Inactive users cannot access the system
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="switch-active"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={updateMemberMutation.isPending}
                  data-testid="button-save-member"
                >
                  {updateMemberMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
