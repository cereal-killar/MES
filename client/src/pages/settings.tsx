import { useAuth } from "@/hooks/use-auth";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  User,
  Building2,
  Bell,
  Shield,
  Palette,
  Globe,
  Mail,
  Smartphone,
} from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();

  const userInitials = user
    ? `${user.firstName?.[0] || ""}${user.lastName?.[0] || ""}`.toUpperCase() || "U"
    : "U";

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account and application preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Profile</CardTitle>
          </div>
          <CardDescription>Your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.profileImageUrl || undefined} />
              <AvatarFallback className="text-xl bg-primary/10 text-primary">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h3 className="text-lg font-medium">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <Badge variant="outline">Member since {new Date(user?.createdAt || Date.now()).getFullYear()}</Badge>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input id="firstName" defaultValue={user?.firstName || ""} disabled data-testid="input-first-name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input id="lastName" defaultValue={user?.lastName || ""} disabled data-testid="input-last-name" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ""} disabled data-testid="input-email" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Profile information is managed through your Replit account
          </p>
        </CardContent>
      </Card>

      {/* Organization Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Organization</CardTitle>
          </div>
          <CardDescription>Your organization settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Organization Name</p>
              <p className="text-sm text-muted-foreground">Your manufacturing facility</p>
            </div>
            <Badge>Basic Tier</Badge>
          </div>
          <div className="text-sm text-muted-foreground">
            Contact your administrator to change organization settings or upgrade your subscription tier.
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Appearance</CardTitle>
          </div>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">
                Choose between light, dark, or system theme
              </p>
            </div>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Compact Mode</p>
              <p className="text-sm text-muted-foreground">
                Use smaller spacing for data-dense views
              </p>
            </div>
            <Switch data-testid="switch-compact-mode" />
          </div>
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Notifications</CardTitle>
          </div>
          <CardDescription>Configure alert preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive alerts via email
                </p>
              </div>
            </div>
            <Switch defaultChecked data-testid="switch-email-notifications" />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div className="space-y-0.5">
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">
                  Receive in-app push notifications
                </p>
              </div>
            </div>
            <Switch defaultChecked data-testid="switch-push-notifications" />
          </div>
          <Separator />
          <div className="space-y-3">
            <p className="text-sm font-medium">Alert Types</p>
            <div className="flex items-center justify-between">
              <span className="text-sm">Critical Alerts</span>
              <Switch defaultChecked data-testid="switch-critical-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Quality Warnings</span>
              <Switch defaultChecked data-testid="switch-quality-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Order Updates</span>
              <Switch defaultChecked data-testid="switch-order-alerts" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Shift Reports</span>
              <Switch data-testid="switch-shift-reports" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <CardTitle>Security</CardTitle>
          </div>
          <CardDescription>Manage your security settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <Badge variant="outline">Managed by Replit</Badge>
          </div>
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Active Sessions</p>
              <p className="text-sm text-muted-foreground">
                Manage devices where you're logged in
              </p>
            </div>
            <Button variant="outline" size="sm" data-testid="button-manage-sessions">
              Manage
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between rounded-lg border border-destructive/30 p-4">
            <div className="space-y-0.5">
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm" data-testid="button-delete-account">
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
