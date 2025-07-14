import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  User,
  Activity,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface CompactProfileHeaderProps {
  className?: string;
}

export function CompactProfileHeader({ className }: CompactProfileHeaderProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    displayName: "",
    email: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const { userProfile, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to logout:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!userProfile) return;

    try {
      setIsSaving(true);

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      setIsEditDialogOpen(false);
      // Silently update profile
    } catch (error) {
      console.error("Failed to update profile:", error);
      // Failed to update profile silently
    } finally {
      setIsSaving(false);
    }
  };

  React.useEffect(() => {
    if (userProfile) {
      setEditForm({
        displayName: userProfile.displayName || "",
        email: userProfile.email || "",
      });
    }
  }, [userProfile]);

  if (!userProfile) {
    return null;
  }

  return (
    <motion.div layout className={cn("w-full", className)}>
      <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 overflow-hidden">
        <CardContent className="p-0">
          {/* Compact View */}
          <motion.button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full p-4 flex items-center gap-4 hover:bg-primary/5 transition-colors"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
          >
            <Avatar className="h-12 w-12 shrink-0">
              <AvatarFallback className="bg-primary/20 text-primary text-lg font-semibold">
                {userProfile.displayName?.charAt(0) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 text-left">
              <h2 className="text-lg font-semibold text-gray-900">
                {userProfile.displayName || "Unknown User"}
              </h2>
              <div className="flex items-center gap-2">
                <Badge className="bg-safe text-safe-foreground text-xs">
                  <Activity className="h-2 w-2 mr-1" />
                  Active
                </Badge>
              </div>
            </div>

            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="h-5 w-5 text-gray-500" />
            </motion.div>
          </motion.button>

          {/* Expanded View */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="border-t border-primary/10"
              >
                <div className="p-4 space-y-4">
                  {/* Extended Profile Info */}
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                        {userProfile.displayName?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-gray-900">
                        {userProfile.displayName || "Unknown User"}
                      </h3>
                      <p className="text-gray-600">{userProfile.email}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className="bg-safe text-safe-foreground">
                          <Activity className="h-3 w-3 mr-1" />
                          Active Guardian
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Dialog
                      open={isEditDialogOpen}
                      onOpenChange={setIsEditDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit3 className="h-4 w-4 mr-2" />
                          Edit Profile
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Edit Profile</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 pt-4">
                          <div className="space-y-2">
                            <Label htmlFor="displayName">Display Name</Label>
                            <Input
                              id="displayName"
                              value={editForm.displayName}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  displayName: e.target.value,
                                }))
                              }
                              placeholder="Enter your display name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                              id="email"
                              type="email"
                              value={editForm.email}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  email: e.target.value,
                                }))
                              }
                              placeholder="Enter your email"
                            />
                          </div>
                          <div className="button-stack-safe pt-4 space-y-2">
                            <Button
                              onClick={handleSaveProfile}
                              disabled={isSaving}
                              className="w-full"
                            >
                              {isSaving ? (
                                <motion.div
                                  animate={{ rotate: 360 }}
                                  transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                  }}
                                  className="mr-2"
                                >
                                  <Activity className="h-4 w-4" />
                                </motion.div>
                              ) : (
                                <Save className="h-4 w-4 mr-2" />
                              )}
                              {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => setIsEditDialogOpen(false)}
                              disabled={isSaving}
                              className="w-full"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleLogout}
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>

                  {/* Quick Stats */}
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <div className="text-lg font-bold text-primary">
                        {userProfile.emergencyContacts?.length || 0}
                      </div>
                      <div className="text-xs text-gray-600">Contacts</div>
                    </div>
                    <div className="text-center p-3 bg-white/50 rounded-lg">
                      <div className="text-lg font-bold text-green-600">
                        Active
                      </div>
                      <div className="text-xs text-gray-600">Status</div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
}
