import {
  Navigation as Nav,
  MapPin,
  Clock,
  Route,
  Mic,
  Car,
  Bike,
  Footprints,
} from "lucide-react";
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
    <div className="min-h-screen bg-white pb-24">
      <main className="container px-4 py-6 space-y-6">
        <div>
          <h1 className="text-2xl font-bold mb-2 text-black">
            Safe Route Navigation
          </h1>
          <p className="text-gray-600">
            Get safety-optimized routes with well-lit paths and public areas
          </p>
        </div>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Route className="h-4 w-4 text-black" />
              <h3 className="font-medium text-black">Plan Route</h3>
            </div>

            <div className="space-y-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                <Input
                  placeholder="From location"
                  className="flex-1 text-sm bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                <Input
                  placeholder="To destination"
                  className="flex-1 text-sm bg-white border-gray-300 text-black placeholder:text-gray-500"
                />
              </div>
            </div>

            {/* Transportation Mode Selection */}
            <div className="bg-gray-50 rounded-lg p-2 mb-3">
              <div className="flex items-center justify-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white hover:bg-black hover:text-white border-gray-300"
                >
                  <Footprints className="h-3 w-3 mr-1" />
                  Walk
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white hover:bg-black hover:text-white border-gray-300"
                >
                  <Car className="h-3 w-3 mr-1" />
                  Car
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 px-3 text-xs bg-white hover:bg-black hover:text-white border-gray-300"
                >
                  <Bike className="h-3 w-3 mr-1" />
                  Bike
                </Button>
              </div>
            </div>

            <Button className="w-full bg-black hover:bg-gray-800 text-white border-0">
              <Nav className="h-4 w-4 mr-2" />
              Get Safe Route
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="p-4">
            <h3 className="font-medium text-black mb-3">Recent Routes</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                <div>
                  <p className="font-medium text-black">Home to University</p>
                  <p className="text-sm text-gray-600">
                    Via Main Street • 15 min walk
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-black text-white border-0">Safe</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-black hover:bg-gray-100"
                  >
                    Use
                  </Button>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg bg-white">
                <div>
                  <p className="font-medium text-black">Office to Gym</p>
                  <p className="text-sm text-gray-600">
                    Via Park Avenue • 8 min walk
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-black text-white border-0">Safe</Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-gray-300 text-black hover:bg-gray-100"
                  >
                    Use
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardContent className="py-6 text-center">
            <div className="space-y-3">
              <div className="p-3 rounded-full bg-gray-100 w-fit mx-auto">
                <Clock className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-semibold mb-2 text-black">
                  Real-time Safety Updates
                </h3>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
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
