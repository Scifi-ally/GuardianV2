import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
import { EmergencyKeyService } from "@/services/emergencyKeyService";
import { LoadingAnimation } from "@/components/LoadingAnimation";
import { ContactStatusIndicator } from "@/components/ContactStatusIndicator";
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
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(
    null,
  );
  const [addingContact, setAddingContact] = useState(false);
  const [keyLookupMode, setKeyLookupMode] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [showFloatingSuccess, setShowFloatingSuccess] = useState(false);
  const [confirmDeleteContact, setConfirmDeleteContact] =
    useState<EmergencyContact | null>(null);
  const { userProfile, currentUser } = useAuth();

  const emergencyContacts = userProfile?.emergencyContacts || [];

  // Simulate dynamic loading
  useEffect(() => {
    const loadContacts = async () => {
      setLoadingContacts(true);
      // Simulate loading time for dynamic effect
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoadingContacts(false);
    };

    if (userProfile) {
      loadContacts();
    }
  }, [userProfile]);

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
        setAddingContact(true);
        setShowFloatingSuccess(true);
        setSuccess(`${contactName} added as emergency contact!`);

        // Reset form with animation delay
        setTimeout(() => {
          setGuardianKey("");
          setContactName("");
          setRelationship("");
          setPriority("1");
          setAddingContact(false);
          setLookupResult(null);
        }, 500);

        setTimeout(() => {
          setIsAddDialogOpen(false);
          setSuccess("");
          setShowFloatingSuccess(false);
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

  const handleRemoveContact = (contact: EmergencyContact) => {
    setConfirmDeleteContact(contact);
  };

  const confirmRemoveContact = async (contact: EmergencyContact) => {
    if (!currentUser) return;

    setConfirmDeleteContact(null);

    // Start deletion animation
    setDeletingContactId(contact.id);

    // Wait for animation before actual deletion
    setTimeout(async () => {
      const result = await EmergencyContactService.removeEmergencyContact(
        currentUser.uid,
        contact,
      );

      if (result.success) {
        setSuccess(`${contact.name} removed from emergency contacts`);
        setTimeout(() => setSuccess(""), 2000);
      } else {
        setError(result.error || "Failed to remove contact");
      }

      setDeletingContactId(null);
    }, 300);
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

  const handleKeyLookup = async (key: string) => {
    if (key.length !== 8) return;

    setIsValidating(true);
    try {
      const result = await EmergencyKeyService.findUserByGuardianKey(
        key.toUpperCase(),
      );
      if (result) {
        setLookupResult(result);
        setContactName(result.displayName || "Unknown User");
        setSuccess(`Found user: ${result.displayName}`);
      } else {
        setError("No user found with this Guardian key");
        setLookupResult(null);
      }
    } catch (error) {
      setError("Error looking up Guardian key");
      setLookupResult(null);
    } finally {
      setIsValidating(false);
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
                          setLookupResult(null);

                          // Auto-lookup when key is complete
                          if (value.length === 8) {
                            handleKeyLookup(value);
                          }
                        }}
                        className={`pl-10 font-mono tracking-wider transition-all duration-300 ${
                          guardianKey.length === 8
                            ? "border-green-500 bg-green-50"
                            : guardianKey.length > 0
                              ? "border-yellow-500 bg-yellow-50"
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

                  {/* Instant Contact Preview & Lookup Result */}
                  <AnimatePresence>
                    {guardianKey.length === 8 && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className={cn(
                          "border rounded-lg p-3",
                          lookupResult
                            ? "bg-green-50 border-green-200"
                            : contactName
                              ? "bg-blue-50 border-blue-200"
                              : "bg-gray-50 border-gray-200",
                        )}
                      >
                        {isValidating ? (
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                            Looking up Guardian key...
                          </div>
                        ) : lookupResult ? (
                          <>
                            <h4 className="text-sm font-medium text-green-900 mb-2 flex items-center gap-2">
                              <Check className="h-4 w-4" />
                              User Found!
                            </h4>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-green-700">
                                  {lookupResult.displayName
                                    ?.charAt(0)
                                    .toUpperCase() || "?"}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-green-900">
                                  {lookupResult.displayName}
                                </p>
                                <p className="text-xs text-green-700">
                                  {lookupResult.email}
                                </p>
                                <p className="text-xs text-green-600 font-mono">
                                  {guardianKey}
                                </p>
                              </div>
                              <div className="ml-auto">
                                <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
                                  Ready to add
                                </span>
                              </div>
                            </div>
                          </>
                        ) : contactName ? (
                          <>
                            <h4 className="text-sm font-medium text-blue-900 mb-2">
                              Contact Preview
                            </h4>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-semibold text-blue-700">
                                  {contactName.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-sm text-blue-900">
                                  {contactName}
                                </p>
                                <p className="text-xs text-blue-700 font-mono">
                                  {guardianKey}
                                </p>
                              </div>
                              <div className="ml-auto">
                                <span className="text-xs bg-blue-200 text-blue-800 px-2 py-1 rounded">
                                  Priority {priority}
                                </span>
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-gray-600 text-center">
                            Enter a contact name to continue
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

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
          {emergencyContacts.length === 0 && !loadingContacts ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-8 space-y-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                className="p-4 rounded-full bg-gradient-to-br from-blue-50 to-purple-50 w-fit mx-auto"
              >
                <Users className="h-8 w-8 text-blue-500" />
              </motion.div>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <p className="font-medium text-gray-700">
                  No Emergency Contacts Yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add trusted contacts using their Guardian keys
                </p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-left max-w-sm mx-auto"
              >
                <h4 className="text-sm font-medium text-blue-900 mb-2">
                  💡 Quick Tip
                </h4>
                <p className="text-xs text-blue-800">
                  Ask your friends and family to share their Guardian keys with
                  you. You can add them instantly and they'll receive alerts
                  during emergencies.
                </p>
              </motion.div>
            </motion.div>
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

              {/* Animated Contacts List */}
              <div className="space-y-2">
                {loadingContacts ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 border rounded-lg animate-pulse"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                          <div className="flex gap-1">
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                            <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {sortedContacts.map((contact, index) => (
                      <motion.div
                        key={contact.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{
                          opacity: deletingContactId === contact.id ? 0 : 1,
                          y: 0,
                          scale: deletingContactId === contact.id ? 0.95 : 1,
                          x: deletingContactId === contact.id ? -100 : 0,
                        }}
                        exit={{ opacity: 0, scale: 0.95, x: -100 }}
                        transition={{
                          delay: index * 0.05,
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className={cn(
                            "p-3 transition-all duration-300 border-l-4",
                            contact.priority === 1 &&
                              "border-l-red-500 bg-red-50/30",
                            contact.priority === 2 &&
                              "border-l-yellow-500 bg-yellow-50/30",
                            contact.priority === 3 &&
                              "border-l-green-500 bg-green-50/30",
                            deletingContactId === contact.id &&
                              "bg-red-100 border-red-300",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.2 }}
                              className="relative"
                            >
                              <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                                <AvatarFallback
                                  className={cn(
                                    "font-semibold text-white",
                                    contact.priority === 1 && "bg-red-500",
                                    contact.priority === 2 && "bg-yellow-500",
                                    contact.priority === 3 && "bg-green-500",
                                  )}
                                >
                                  {contact.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              {contact.isActive && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"
                                />
                              )}
                            </motion.div>

                            <div className="flex-1 min-w-0">
                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 + 0.3 }}
                                className="flex items-center gap-2 mb-1"
                              >
                                <p className="font-medium text-sm truncate">
                                  {contact.name}
                                </p>
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: index * 0.1 + 0.4 }}
                                >
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "text-xs font-semibold",
                                      contact.priority === 1 &&
                                        "border-red-300 text-red-700 bg-red-50",
                                      contact.priority === 2 &&
                                        "border-yellow-300 text-yellow-700 bg-yellow-50",
                                      contact.priority === 3 &&
                                        "border-green-300 text-green-700 bg-green-50",
                                    )}
                                  >
                                    Priority {contact.priority}
                                  </Badge>
                                </motion.div>
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ delay: index * 0.1 + 0.5 }}
                                >
                                  <ContactStatusIndicator
                                    contactId={contact.id}
                                  />
                                </motion.div>
                              </motion.div>

                              <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.1 + 0.4 }}
                                className="flex items-center gap-2"
                              >
                                <Shield className="h-3 w-3 text-muted-foreground" />
                                <p className="text-xs text-muted-foreground font-mono tracking-wider">
                                  {contact.guardianKey}
                                </p>
                              </motion.div>
                            </div>

                            <motion.div
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: index * 0.1 + 0.5 }}
                              className="flex gap-1"
                            >
                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleAlert(contact)}
                                  className="h-8 w-8 p-0 border-red-200 text-red-600 hover:bg-red-500 hover:text-white transition-all duration-200"
                                  title="Send emergency alert"
                                >
                                  <Shield className="h-3 w-3" />
                                </Button>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleMessage(contact)}
                                  className="h-8 w-8 p-0 border-blue-200 text-blue-600 hover:bg-blue-500 hover:text-white transition-all duration-200"
                                  title="Send message"
                                >
                                  <MessageSquare className="h-3 w-3" />
                                </Button>
                              </motion.div>

                              <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleRemoveContact(contact)}
                                  disabled={deletingContactId === contact.id}
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-200"
                                  title="Remove contact"
                                >
                                  {deletingContactId === contact.id ? (
                                    <motion.div
                                      animate={{ rotate: 360 }}
                                      transition={{
                                        duration: 0.5,
                                        repeat: Infinity,
                                        ease: "linear",
                                      }}
                                      className="h-3 w-3 border border-destructive border-t-transparent rounded-full"
                                    />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </motion.div>
                            </motion.div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Floating Success Notification */}
      <AnimatePresence>
        {showFloatingSuccess && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center gap-3"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
            >
              <Check className="h-5 w-5" />
            </motion.div>
            <div>
              <p className="font-semibold">Contact Added!</p>
              <p className="text-sm text-green-100">
                Emergency network updated
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Deletion Confirmation Dialog */}
      <AnimatePresence>
        {confirmDeleteContact && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6"
            >
              <div className="text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4"
                >
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </motion.div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Remove Emergency Contact?
                </h3>

                <p className="text-gray-600 mb-6">
                  Are you sure you want to remove{" "}
                  <span className="font-semibold">
                    {confirmDeleteContact.name}
                  </span>{" "}
                  from your emergency contacts? They will no longer receive
                  alerts.
                </p>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDeleteContact(null)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => confirmRemoveContact(confirmDeleteContact)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  >
                    Remove Contact
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
