import { Plus, UserPlus, Shield, Phone } from "lucide-react";
import { SimpleNavbar } from "@/components/SimpleNavbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Contacts() {
  const handleSOSPress = async () => {
    try {
      const { advancedEmergencyController } = await import(
        "@/services/advancedEmergencyController"
      );
      await advancedEmergencyController.activateSOSWithCountdown("general", 5);
    } catch (error) {
      console.error("SOS activation failed:", error);
    }
  };

  const contacts = [
    {
      id: 1,
      name: "Sarah Johnson",
      relationship: "Best Friend",
      phone: "+1 (555) 123-4567",
      verified: true,
    },
    {
      id: 2,
      name: "Mom",
      relationship: "Mother",
      phone: "+1 (555) 987-6543",
      verified: true,
    },
    {
      id: 3,
      name: "David Chen",
      relationship: "Partner",
      phone: "+1 (555) 456-7890",
      verified: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background safe-bottom-spacing">
      <main className="container px-4 py-6 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Emergency Contacts</h1>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Trusted Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contacts.map((contact) => (
              <div
                key={contact.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-full bg-primary/10">
                    <UserPlus className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{contact.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {contact.relationship}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {contact.phone}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={contact.verified ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {contact.verified ? "Verified" : "Pending"}
                  </Badge>
                  <Button variant="outline" size="sm">
                    <Shield className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="py-8 text-center">
            <div className="space-y-4">
              <div className="p-4 rounded-full bg-muted w-fit mx-auto">
                <UserPlus className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold mb-2">Add More Contacts</h3>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Invite trusted friends and family to be your emergency
                  contacts. They'll receive alerts if you activate SOS.
                </p>
              </div>
              <Button variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Invite Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      <SimpleNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
