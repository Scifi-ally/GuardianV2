import { Navigation as Nav, MapPin, Clock, Route, Mic } from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

export default function NavigationPage() {
  const handleSOSPress = () => {
    console.log("SOS triggered from navigation");
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="container px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2">Safe Route Navigation</h1>
          <p className="text-muted-foreground">
            Get safety-optimized routes with well-lit paths and public areas
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5 text-primary" />
              Plan Your Route
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1 block">From</label>
                <Input placeholder="Current location" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">To</label>
                <Input placeholder="Enter destination" />
              </div>
            </div>

            <div className="flex gap-2">
              <Button className="flex-1">
                <Nav className="h-4 w-4 mr-2" />
                Get Safe Route
              </Button>
              <Button variant="outline">
                <MapPin className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Routes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Home to University</p>
                  <p className="text-sm text-muted-foreground">
                    Via Main Street • 15 min walk
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-safe text-safe-foreground">Safe</Badge>
                  <Button variant="outline" size="sm">
                    Use Route
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Office to Gym</p>
                  <p className="text-sm text-muted-foreground">
                    Via Park Avenue • 8 min walk
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-safe text-safe-foreground">Safe</Badge>
                  <Button variant="outline" size="sm">
                    Use Route
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-8 text-center">
            <div className="space-y-4">
              <div className="p-4 rounded-full bg-primary/10 w-fit mx-auto">
                <Clock className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Real-time Safety Updates</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Our routes are updated with real-time safety data including
                  lighting, foot traffic, and community reports.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
