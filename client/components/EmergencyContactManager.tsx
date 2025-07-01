import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Users,
  Plus,
  Trash2,
  Phone,
  MessageSquare,
  Shield,
  Key,
  AlertCircle,
  Check,
  Copy,
  User,
} from "lucide-react";
import { useAuth, type EmergencyContact } from "@/contexts/AuthContext";
import { EmergencyContactService } from "@/services/emergencyContactService";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { cn } from "@/lib/utils";

interface EmergencyContactManagerProps {
  className?: string;
}

export function EmergencyContactManager({
  className,
}: EmergencyContactManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [guardianKey, setGuardianKey] = useState("");
  const [priority, setPriority] = useState("1");
  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const { userProfile, currentUser } = useAuth();

  const emergencyContacts = userProfile?.emergencyContacts || [];

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();

    // Enhanced validation
    if (!guardianKey.trim()) {
      setError("Guardian key is required");
      return;
    }

    if (guardianKey.length !== 8) {
      setError("Guardian key must be exactly 8 characters");
      return;
    }

    if (!contactName.trim()) {
      setError("Contact name is required");
      return;
    }

    // Check for duplicate key
    if (
      emergencyContacts.some((contact) => contact.guardianKey === guardianKey)
    ) {
      setError("This contact is already added");
      return;
    }

    if (!currentUser) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Simulate validation
      setIsValidating(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const result = await EmergencyContactService.addEmergencyContact(
        currentUser.uid,
        guardianKey.trim().toUpperCase(),
        parseInt(priority),
      );

      if (result.success) {
        setSuccess(`${contactName} added as emergency contact!`);

        // Reset form
        setGuardianKey("");
        setContactName("");
        setRelationship("");
        setPriority("1");

        setTimeout(() => {
          setIsAddDialogOpen(false);
          setSuccess("");
        }, 2000);
      } else {
        setError(result.error || "Failed to add contact");
      }
    } catch (error) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveContact = async (contact: EmergencyContact) => {
    if (!currentUser) return;

    const result = await EmergencyContactService.removeEmergencyContact(
      currentUser.uid,
      contact,
    );

    if (!result.success) {
      setError(result.error || "Failed to remove contact");
    }
  };

  const handleAlert = (contact: EmergencyContact) => {
    console.log(`Sending in-app alert to ${contact.name}`);
    // In-app alert functionality would go here
  };

  const handleMessage = (contact: EmergencyContact) => {
    console.log(`Messaging ${contact.name} through Guardian app`);
    // In-app messaging functionality would go here
  };

  const handleCopyKey = () => {
    if (userProfile?.guardianKey) {
      navigator.clipboard?.writeText(userProfile.guardianKey);
      setSuccess("Guardian key copied to clipboard!");
      setTimeout(() => setSuccess(""), 2000);
    }
  };

  const sortedContacts = [...emergencyContacts].sort(
    (a, b) => a.priority - b.priority,
  );

  return (
    <div className={cn("space-y-4", className)}>
      {/* Success/Error Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert className="border-safe text-safe">
          <Check className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Emergency Contacts ({emergencyContacts.length})
            </CardTitle>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8">
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Emergency Contact</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardianKey">Guardian Key *</Label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="guardianKey"
                        placeholder="Enter 8-character Guardian key"
                        value={guardianKey}
                        onChange={(e) => {
                          const value = e.target.value
                            .toUpperCase()
                            .replace(/[^A-Z0-9]/g, "");
                          setGuardianKey(value);
                          setError(""); // Clear previous errors
                        }}
                        className={`pl-10 font-mono tracking-wider ${
                          guardianKey.length === 8
                            ? "border-green-500"
                            : guardianKey.length > 0
                              ? "border-yellow-500"
                              : ""
                        }`}
                        maxLength={8}
                        disabled={loading || isValidating}
                      />
                      {guardianKey.length === 8 && (
                        <div className="absolute right-3 top-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-xs text-gray-500">
                        {guardianKey.length}/8 characters
                      </p>
                      {guardianKey.length === 8 && (
                        <p className="text-xs text-green-600">✓ Valid format</p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contactName">Contact Name *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
                      <Input
                        id="contactName"
                        placeholder="Enter contact's name"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className="pl-10"
                        disabled={loading}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="relationship">Relationship</Label>
                    <Select
                      value={relationship}
                      onValueChange={setRelationship}
                    >
                      <SelectTrigger className="text-left">
                        <SelectValue placeholder="Select relationship" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="family">👨‍👩‍👧‍👦 Family Member</SelectItem>
                        <SelectItem value="spouse">
                          💑 Spouse/Partner
                        </SelectItem>
                        <SelectItem value="friend">👫 Friend</SelectItem>
                        <SelectItem value="colleague">💼 Colleague</SelectItem>
                        <SelectItem value="neighbor">🏠 Neighbor</SelectItem>
                        <SelectItem value="other">👤 Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority Level</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger className="text-left">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                            <span>Priority 1 - First Contact</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                            <span>Priority 2 - Secondary</span>
                          </div>
                        </SelectItem>
                        <SelectItem value="3">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            <span>Priority 3 - Backup</span>
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-gray-500">
                      Priority 1 contacts are alerted first during emergencies
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button
                      type="submit"
                      disabled={
                        loading ||
                        isValidating ||
                        !guardianKey ||
                        !contactName ||
                        guardianKey.length !== 8
                      }
                      className="flex-1 bg-black text-white hover:bg-gray-800 disabled:bg-gray-300"
                    >
                      {loading || isValidating ? (
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                          {isValidating ? "Validating..." : "Adding..."}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <Plus className="h-4 w-4" />
                          Add Emergency Contact
                        </div>
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsAddDialogOpen(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {emergencyContacts.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto">
                <Users className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-medium text-muted-foreground">
                  No Emergency Contacts
                </p>
                <p className="text-sm text-muted-foreground">
                  Add trusted contacts using their Guardian keys
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Quick Call All Button */}
              <div className="flex gap-2 mb-4">
                <Button
                  className="flex-1 h-10 bg-emergency hover:bg-emergency/90"
                  onClick={() =>
                    sortedContacts.forEach((contact) => handleAlert(contact))
                  }
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Alert All Contacts
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 h-10 border-warning text-warning hover:bg-warning hover:text-warning-foreground"
                  onClick={() =>
                    sortedContacts.forEach((contact) => handleMessage(contact))
                  }
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Alert All
                </Button>
              </div>

              {/* Contacts List */}
              <div className="space-y-2">
                {sortedContacts.map((contact) => (
                  <Card key={contact.id} className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {contact.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-sm truncate">
                            {contact.name}
                          </p>
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              contact.priority === 1 && "border-emergency/30",
                              contact.priority === 2 && "border-warning/30",
                              contact.priority === 3 && "border-muted",
                            )}
                          >
                            P{contact.priority}
                          </Badge>
                          {contact.isActive && (
                            <Badge className="text-xs bg-safe text-safe-foreground">
                              Active
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3 w-3 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground font-mono">
                            {contact.guardianKey}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAlert(contact)}
                          className="h-8 w-8 p-0 border-emergency/30 text-emergency hover:bg-emergency hover:text-emergency-foreground"
                        >
                          <Shield className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleMessage(contact)}
                          className="h-8 w-8 p-0"
                        >
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRemoveContact(contact)}
                          className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
