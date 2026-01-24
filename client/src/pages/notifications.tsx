import { useQuery, useMutation } from "@tanstack/react-query";
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
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  Bell,
  BellOff,
  Check,
  CheckCheck,
  AlertTriangle,
  Info,
  AlertCircle,
  CheckCircle,
  Trash2,
  Clock,
} from "lucide-react";
import type { Notification, NotificationType } from "@shared/schema";

const typeConfig: Record<
  NotificationType,
  { icon: React.ComponentType<{ className?: string }>; color: string; bgColor: string }
> = {
  info: { icon: Info, color: "text-blue-500", bgColor: "bg-blue-500/10" },
  warning: { icon: AlertTriangle, color: "text-yellow-500", bgColor: "bg-yellow-500/10" },
  critical: { icon: AlertCircle, color: "text-red-500", bgColor: "bg-red-500/10" },
  success: { icon: CheckCircle, color: "text-green-500", bgColor: "bg-green-500/10" },
};

export default function NotificationsPage() {
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery<Notification[]>({
    queryKey: ["/api/notifications"],
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("PATCH", `/api/notifications/${id}`, { status: "read" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/notifications/mark-all-read", {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/notifications"] });
      toast({
        title: "All notifications marked as read",
      });
    },
  });

  // Mock data
  const mockNotifications: Notification[] = [
    {
      id: "1",
      organizationId: "org1",
      userId: "user1",
      type: "critical",
      title: "Equipment Breakdown",
      message: "Production Line 1 has experienced an unplanned breakdown. Maintenance has been notified.",
      status: "unread",
      relatedEntityType: "equipment",
      relatedEntityId: "eq1",
      createdAt: new Date(Date.now() - 15 * 60000), // 15 min ago
      readAt: null,
    },
    {
      id: "2",
      organizationId: "org1",
      userId: "user1",
      type: "warning",
      title: "Quality Alert",
      message: "Reject rate on Order PO-2025-001 has exceeded 3% threshold.",
      status: "unread",
      relatedEntityType: "order",
      relatedEntityId: "1",
      createdAt: new Date(Date.now() - 45 * 60000), // 45 min ago
      readAt: null,
    },
    {
      id: "3",
      organizationId: "org1",
      userId: "user1",
      type: "success",
      title: "Order Completed",
      message: "Production Order PO-2025-002 has been completed successfully with 98.5% quality rate.",
      status: "read",
      relatedEntityType: "order",
      relatedEntityId: "2",
      createdAt: new Date(Date.now() - 2 * 60 * 60000), // 2 hours ago
      readAt: new Date(Date.now() - 60 * 60000),
    },
    {
      id: "4",
      organizationId: "org1",
      userId: "user1",
      type: "info",
      title: "Shift Report Available",
      message: "Morning shift report for January 24, 2025 is now available for review.",
      status: "read",
      relatedEntityType: null,
      relatedEntityId: null,
      createdAt: new Date(Date.now() - 4 * 60 * 60000), // 4 hours ago
      readAt: new Date(Date.now() - 3 * 60 * 60000),
    },
    {
      id: "5",
      organizationId: "org1",
      userId: "user1",
      type: "warning",
      title: "Low OEE Alert",
      message: "OEE dropped below 70% on Line 2 in the past hour.",
      status: "read",
      relatedEntityType: "equipment",
      relatedEntityId: "eq2",
      createdAt: new Date(Date.now() - 6 * 60 * 60000), // 6 hours ago
      readAt: new Date(Date.now() - 5 * 60 * 60000),
    },
  ];

  const displayNotifications = notifications || mockNotifications;

  const unreadCount = displayNotifications.filter((n) => n.status === "unread").length;

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - new Date(date).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with alerts and system notifications
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Badge variant="destructive">{unreadCount} unread</Badge>
          )}
          <Button
            variant="outline"
            onClick={() => markAllReadMutation.mutate()}
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            data-testid="button-mark-all-read"
          >
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark All Read
          </Button>
        </div>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle>All Notifications</CardTitle>
          <CardDescription>
            {displayNotifications.length} notifications
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : displayNotifications.length > 0 ? (
            <div className="space-y-3">
              {displayNotifications.map((notification) => {
                const config = typeConfig[notification.type as NotificationType];
                const Icon = config.icon;
                const isUnread = notification.status === "unread";

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-4 rounded-lg border p-4 transition-colors ${
                      isUnread ? "bg-muted/50" : ""
                    }`}
                    data-testid={`notification-${notification.id}`}
                  >
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${config.bgColor}`}
                    >
                      <Icon className={`h-5 w-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-medium ${isUnread ? "" : "text-muted-foreground"}`}>
                            {notification.title}
                          </p>
                          {isUnread && (
                            <span className="h-2 w-2 rounded-full bg-primary"></span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatTime(notification.createdAt!)}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>
                      {isUnread && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs"
                          onClick={() => markReadMutation.mutate(notification.id)}
                          data-testid={`button-mark-read-${notification.id}`}
                        >
                          <Check className="mr-1 h-3 w-3" />
                          Mark as read
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-1">No notifications</h3>
              <p className="text-sm text-muted-foreground">
                You're all caught up! New alerts will appear here.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
