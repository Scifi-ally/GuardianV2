import { useState } from "react";
import {
  User,
  Edit,
  Shield,
  MapPin,
  Phone,
  Mail,
  Calendar,
  Settings,
  LogOut,
  Camera,
  Bell,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { MagicNavbar } from "@/components/MagicNavbar";
import { AnimatedCard } from "@/components/AnimatedCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export default function Profile() {
  const [user] = useState({
    name: "Sarah Johnson",
    email: "sarah.johnson@example.com",
    phone: "+1 (555) 123-4567",
    joinDate: "March 2024",
    avatar: "/placeholder.svg",
    emergencyContacts: 3,
    sosAlerts: 0,
    safeTrips: 24,
  });

  const handleSOSPress = () => {
    console.log("SOS triggered from profile");
  };

  const stats = [
    {
      label: "Emergency Contacts",
      value: user.emergencyContacts,
      icon: Phone,
      color: "text-safe",
    },
    {
      label: "SOS Alerts",
      value: user.sosAlerts,
      icon: Shield,
      color: "text-primary",
    },
    {
      label: "Safe Trips",
      value: user.safeTrips,
      icon: MapPin,
      color: "text-warning",
    },
  ];

  const menuItems = [
    {
      icon: Settings,
      label: "Settings",
      description: "App preferences and privacy",
      href: "/settings",
    },
    {
      icon: Bell,
      label: "Notifications",
      description: "Alert preferences",
      href: "/notifications",
    },
    {
      icon: Lock,
      label: "Privacy & Security",
      description: "Data and account security",
      href: "/privacy",
    },
    {
      icon: Phone,
      label: "Emergency Contacts",
      description: "Manage trusted contacts",
      href: "/contacts",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="container px-4 py-6 space-y-6">
        {/* Profile Header */}
        <AnimatedCard direction="fade" delay={100}>
          <Card className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-safe/5" />
            <CardContent className="relative p-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="relative">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10">
                      {user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">{user.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">
                      Member since {user.joinDate}
                    </span>
                  </div>
                </div>

                <Badge className="bg-safe text-safe-foreground">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified Account
                </Badge>
              </div>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Stats */}
        <AnimatedCard direction="up" delay={200}>
          <div className="grid grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <Card
                key={stat.label}
                className="text-center transition-all duration-300 hover:scale-105"
              >
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div
                      className={cn(
                        "mx-auto w-fit p-2 rounded-lg bg-muted/50",
                        stat.color,
                      )}
                    >
                      <stat.icon className={cn("h-5 w-5", stat.color)} />
                    </div>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-xs text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </AnimatedCard>

        {/* Quick Actions */}
        <AnimatedCard direction="up" delay={300}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                asChild
                variant="outline"
                className="w-full justify-start transition-all duration-200 hover:scale-105"
              >
                <Link to="/contacts">
                  <Phone className="h-4 w-4 mr-3" />
                  Add Emergency Contact
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="w-full justify-start transition-all duration-200 hover:scale-105"
              >
                <Link to="/navigation">
                  <MapPin className="h-4 w-4 mr-3" />
                  Plan Safe Route
                </Link>
              </Button>
            </CardContent>
          </Card>
        </AnimatedCard>

        {/* Menu Items */}
        <AnimatedCard direction="up" delay={400}>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1">
              {menuItems.map((item, index) => (
                <Link
                  key={item.label}
                  to={item.href}
                  className="flex items-center justify-between p-3 rounded-lg transition-all duration-200 hover:bg-muted/50 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-primary/10 transition-colors">
                      <item.icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                    </div>
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Edit className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                </Link>
              ))}

              <Separator className="my-4" />

              <button className="flex items-center gap-3 p-3 rounded-lg w-full text-left transition-all duration-200 hover:bg-destructive/10 group">
                <div className="p-2 rounded-lg bg-muted/50 group-hover:bg-destructive/10 transition-colors">
                  <LogOut className="h-4 w-4 group-hover:text-destructive transition-colors" />
                </div>
                <div>
                  <p className="font-medium group-hover:text-destructive transition-colors">
                    Sign Out
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Log out of your account
                  </p>
                </div>
              </button>
            </CardContent>
          </Card>
        </AnimatedCard>
      </main>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
