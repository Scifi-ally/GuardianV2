import { useState } from "react";
import {
  Users,
  Phone,
  MessageCircle,
  UserPlus,
  Edit,
  Trash2,
  Shield,
  AlertTriangle,
  Heart,
  Check,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  priority: number;
  isVerified?: boolean;
}

export function EmergencyContactManager() {
  const { userProfile, updateUserProfile } = useAuth();
  const [contacts, setContacts] = useState<EmergencyContact[]>(
    userProfile?.emergencyContacts || [],
  );
  const [isAddingContact, setIsAddingContact] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(
    null,
  );
  const [newContact, setNewContact] = useState({
    name: "",
    phone: "",
    relationship: "",
  });

  const handleAddContact = async () => {
    if (!newContact.name || !newContact.phone) return;

    const contact: EmergencyContact = {
      id: Date.now().toString(),
      name: newContact.name,
      phone: newContact.phone,
      relationship: newContact.relationship || "Emergency Contact",
      priority: contacts.length + 1,
      isVerified: false,
    };

    const updatedContacts = [...contacts, contact];
    setContacts(updatedContacts);

    if (userProfile) {
      await updateUserProfile({
        ...userProfile,
        emergencyContacts: updatedContacts,
      });
    }

    setNewContact({ name: "", phone: "", relationship: "" });
    setIsAddingContact(false);
  };

  const handleEditContact = async (contact: EmergencyContact) => {
    const updatedContacts = contacts.map((c) =>
      c.id === contact.id ? contact : c,
    );
    setContacts(updatedContacts);

    if (userProfile) {
      await updateUserProfile({
        ...userProfile,
        emergencyContacts: updatedContacts,
      });
    }

    setEditingContact(null);
  };

  const handleDeleteContact = async (contactId: string) => {
    const updatedContacts = contacts.filter((c) => c.id !== contactId);
    setContacts(updatedContacts);

    if (userProfile) {
      await updateUserProfile({
        ...userProfile,
        emergencyContacts: updatedContacts,
      });
    }
  };

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleText = (phone: string, name: string) => {
    const message = `Guardian Alert: This is an emergency message from ${userProfile?.displayName || "Guardian User"}. Please check on me immediately.`;
    window.location.href = `sms:${phone}?body=${encodeURIComponent(message)}`;
  };

  const verifyContact = async (contactId: string) => {
    const updatedContacts = contacts.map((c) =>
      c.id === contactId ? { ...c, isVerified: true } : c,
    );
    setContacts(updatedContacts);

    if (userProfile) {
      await updateUserProfile({
        ...userProfile,
        emergencyContacts: updatedContacts,
      });
    }
  };

  const relationshipColors = {
    Family: "bg-safe/20 text-safe border-safe/30",
    Friend: "bg-primary/20 text-primary border-primary/30",
    Partner: "bg-protection/20 text-protection border-protection/30",
    Colleague: "bg-warning/20 text-warning border-warning/30",
    "Emergency Contact": "bg-muted/20 text-muted-foreground border-muted/30",
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-full bg-safe/20 border-2 border-safe/30">
            <Users className="h-6 w-6 text-safe" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Emergency Contacts</h2>
            <p className="text-sm text-muted-foreground">
              {contacts.length} contacts ready for emergencies
            </p>
          </div>
        </div>

        <Dialog open={isAddingContact} onOpenChange={setIsAddingContact}>
          <DialogTrigger asChild>
            <Button className="bg-safe hover:bg-safe/90 text-safe-foreground shadow-lg">
              <UserPlus className="h-4 w-4 mr-2" />
              Add Contact
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-safe" />
                Add Emergency Contact
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newContact.name}
                  onChange={(e) =>
                    setNewContact({ ...newContact, name: e.target.value })
                  }
                  placeholder="Enter full name"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={newContact.phone}
                  onChange={(e) =>
                    setNewContact({ ...newContact, phone: e.target.value })
                  }
                  placeholder="+1 (555) 123-4567"
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="relationship">Relationship</Label>
                <select
                  id="relationship"
                  value={newContact.relationship}
                  onChange={(e) =>
                    setNewContact({
                      ...newContact,
                      relationship: e.target.value,
                    })
                  }
                  className="w-full p-2 border-2 rounded-lg bg-background"
                >
                  <option value="">Select relationship</option>
                  <option value="Family">Family Member</option>
                  <option value="Friend">Close Friend</option>
                  <option value="Partner">Partner/Spouse</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Emergency Contact">Other</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddContact}
                  className="flex-1 bg-safe hover:bg-safe/90 text-safe-foreground"
                  disabled={!newContact.name || !newContact.phone}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Add Contact
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingContact(false)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Contact List */}
      {contacts.length === 0 ? (
        <Card className="border-2 border-warning/30 bg-gradient-to-br from-warning/10 to-warning/20">
          <CardContent className="p-8 text-center">
            <AlertTriangle className="h-16 w-16 text-warning mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-2">No Emergency Contacts</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add trusted contacts who will be notified during emergencies. We
              recommend adding at least 3 contacts for optimal safety coverage.
            </p>
            <Button
              onClick={() => setIsAddingContact(true)}
              className="bg-safe hover:bg-safe/90 text-safe-foreground"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Add Your First Contact
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {contacts.map((contact) => (
            <Card
              key={contact.id}
              className="border-2 border-muted/30 hover:border-primary/50 transition-all duration-300 hover:shadow-lg"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-primary/20 border-2 border-primary/30 flex items-center justify-center">
                      <span className="text-lg font-bold text-primary">
                        {contact.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    {contact.isVerified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-safe rounded-full border-2 border-background flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-lg">{contact.name}</h3>
                      {contact.priority === 1 && (
                        <Badge className="bg-primary/20 text-primary text-xs">
                          <Shield className="h-3 w-3 mr-1" />
                          Primary
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      {contact.phone}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs",
                          relationshipColors[
                            contact.relationship as keyof typeof relationshipColors
                          ] || relationshipColors["Emergency Contact"],
                        )}
                      >
                        {contact.relationship}
                      </Badge>
                      {!contact.isVerified && (
                        <Badge
                          variant="outline"
                          className="text-xs border-warning text-warning"
                        >
                          Unverified
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleCall(contact.phone)}
                        className="h-10 px-3 bg-safe hover:bg-safe/90 text-safe-foreground"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleText(contact.phone, contact.name)}
                        className="h-10 px-3 border-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {!contact.isVerified && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => verifyContact(contact.id)}
                          className="h-8 px-2 text-xs border-safe text-safe hover:bg-safe hover:text-safe-foreground"
                        >
                          <Check className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingContact(contact)}
                        className="h-8 px-2 text-xs"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteContact(contact.id)}
                        className="h-8 px-2 text-xs border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Safety Tips */}
      {contacts.length > 0 && (
        <Card className="border-2 border-primary/30 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <Heart className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold mb-2">Emergency Contact Tips</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>
                    • Verify contacts by calling them and explaining Guardian
                  </li>
                  <li>• Keep contact information up to date</li>
                  <li>• Add contacts in different locations when possible</li>
                  <li>
                    • Consider adding both family and friends for coverage
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Edit Contact Dialog */}
      {editingContact && (
        <Dialog
          open={!!editingContact}
          onOpenChange={() => setEditingContact(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Edit className="h-5 w-5 text-primary" />
                Edit Contact
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  value={editingContact.name}
                  onChange={(e) =>
                    setEditingContact({
                      ...editingContact,
                      name: e.target.value,
                    })
                  }
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  value={editingContact.phone}
                  onChange={(e) =>
                    setEditingContact({
                      ...editingContact,
                      phone: e.target.value,
                    })
                  }
                  className="border-2"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-relationship">Relationship</Label>
                <select
                  id="edit-relationship"
                  value={editingContact.relationship}
                  onChange={(e) =>
                    setEditingContact({
                      ...editingContact,
                      relationship: e.target.value,
                    })
                  }
                  className="w-full p-2 border-2 rounded-lg bg-background"
                >
                  <option value="Family">Family Member</option>
                  <option value="Friend">Close Friend</option>
                  <option value="Partner">Partner/Spouse</option>
                  <option value="Colleague">Colleague</option>
                  <option value="Emergency Contact">Other</option>
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleEditContact(editingContact)}
                  className="flex-1 bg-primary hover:bg-primary/90"
                  disabled={!editingContact.name || !editingContact.phone}
                >
                  <Check className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setEditingContact(null)}
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
