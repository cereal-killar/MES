import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Factory,
  TrendingUp,
  Clock,
  Shield,
  BarChart3,
  Users,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const features = [
  {
    icon: ClipboardIcon,
    title: "Digital Order Tracking",
    description: "Track production orders in real-time from creation to completion with complete visibility.",
  },
  {
    icon: TrendingUp,
    title: "OEE Analytics",
    description: "Measure Availability, Performance, and Quality metrics to optimize your manufacturing efficiency.",
  },
  {
    icon: Clock,
    title: "Time & Downtime Tracking",
    description: "Capture operator timesheets and log downtime events to identify improvement opportunities.",
  },
  {
    icon: Shield,
    title: "Quality Management",
    description: "Monitor quality metrics and receive instant alerts when issues arise on the production floor.",
  },
  {
    icon: BarChart3,
    title: "Real-time Dashboards",
    description: "Visualize your production performance with intuitive, customizable dashboards.",
  },
  {
    icon: Users,
    title: "Role-based Access",
    description: "Secure access control for Management, Engineers, Quality, and Operators with tailored views.",
  },
];

const benefits = [
  "Increase production efficiency by up to 25%",
  "Reduce unplanned downtime with proactive alerts",
  "Improve quality with real-time monitoring",
  "Make data-driven decisions with comprehensive analytics",
];

function ClipboardIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <path d="M12 11h4" />
      <path d="M12 16h4" />
      <path d="M8 11h.01" />
      <path d="M8 16h.01" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Factory className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold tracking-tight">MES Pro</span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <a href="/api/login">
              <Button data-testid="button-login">Sign In</Button>
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-40 lg:pb-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center rounded-full border px-3 py-1 text-sm">
                  <span className="mr-2 h-2 w-2 rounded-full bg-green-500"></span>
                  Affordable MES for MENA Region
                </div>
                <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                  <span className="block">Smart Manufacturing</span>
                  <span className="block text-primary">Execution System</span>
                </h1>
                <p className="max-w-lg text-lg text-muted-foreground">
                  Streamline your production operations with our comprehensive MES solution. 
                  Track orders, measure OEE, manage quality, and boost efficiency—all in one platform.
                </p>
              </div>
              <div className="flex flex-col gap-4 sm:flex-row">
                <a href="/api/login">
                  <Button size="lg" className="gap-2" data-testid="button-get-started">
                    Get Started Free
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <Button size="lg" variant="outline" data-testid="button-learn-more">
                  Learn More
                </Button>
              </div>
              <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Free tier available
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  No credit card required
                </span>
              </div>
            </div>
            <div className="relative">
              <div className="relative rounded-xl border bg-card p-2 shadow-2xl">
                <div className="rounded-lg bg-gradient-to-br from-primary/5 to-accent/5 p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Today's OEE</span>
                      <span className="text-2xl font-bold text-primary">84.2%</span>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Availability</div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-[92%] rounded-full bg-chart-1"></div>
                        </div>
                        <div className="text-xs font-medium">92%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Performance</div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-[88%] rounded-full bg-chart-2"></div>
                        </div>
                        <div className="text-xs font-medium">88%</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Quality</div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className="h-full w-[97%] rounded-full bg-chart-3"></div>
                        </div>
                        <div className="text-xs font-medium">97%</div>
                      </div>
                    </div>
                    <div className="pt-4 border-t">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Active Orders</span>
                        <span className="font-medium">12</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">Units Produced</span>
                        <span className="font-medium">2,847</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -top-4 -right-4 h-72 w-72 rounded-full bg-primary/10 blur-3xl -z-10"></div>
              <div className="absolute -bottom-4 -left-4 h-72 w-72 rounded-full bg-accent/10 blur-3xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to manage production
            </h2>
            <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              A complete manufacturing execution system designed for the MENA region, 
              with features that rival premium solutions at a fraction of the cost.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="hover-elevate">
                <CardContent className="p-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10 mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 items-center">
            <div>
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl mb-6">
                Built for manufacturers in MENA
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                We understand the unique challenges faced by manufacturers in Egypt, Saudi Arabia, 
                and across the MENA region. Our tiered pricing model ensures you only pay for 
                what you need, with room to grow.
              </p>
              <ul className="space-y-4">
                {benefits.map((benefit, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                      <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span>{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">80%</div>
                <div className="text-sm text-muted-foreground">
                  Of premium MES features at a fraction of the cost
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">3</div>
                <div className="text-sm text-muted-foreground">
                  Flexible tiers to match your needs
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">24/7</div>
                <div className="text-sm text-muted-foreground">
                  Cloud-based access from anywhere
                </div>
              </Card>
              <Card className="p-6">
                <div className="text-4xl font-bold text-primary mb-2">100%</div>
                <div className="text-sm text-muted-foreground">
                  Data ownership and security
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-primary-foreground sm:text-4xl mb-4">
            Ready to transform your manufacturing operations?
          </h2>
          <p className="text-lg text-primary-foreground/80 mb-8 max-w-2xl mx-auto">
            Start with our free tier and upgrade as your needs grow. No commitment required.
          </p>
          <a href="/api/login">
            <Button size="lg" variant="secondary" className="gap-2" data-testid="button-start-now">
              Start Now
              <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Factory className="h-5 w-5 text-primary" />
              <span className="font-semibold">MES Pro</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 MES Pro. Designed for manufacturers in MENA.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
