import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save,
  X,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Check,
  AlertCircle,
  Camera,
  Upload,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EditProfileModal({ isOpen, onClose }: EditProfileModalProps) {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const [formData, setFormData] = useState({
    displayName: userProfile?.displayName || "",
    email: userProfile?.email || currentUser?.email || "",
    phone: userProfile?.phone || "",
    location: userProfile?.location || "",
    bio: userProfile?.bio || "",
    photoURL: userProfile?.photoURL || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.displayName.trim()) {
      newErrors.displayName = "Display name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (
      formData.phone &&
      !/^[\+]?[1-9][\d]{0,15}$/.test(formData.phone.replace(/[\s\-\(\)]/g, ""))
    ) {
      newErrors.phone = "Please enter a valid phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      return;
    }

    setLoading(true);

    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully!");
      onClose();
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const tabs = [
    { id: "basic", label: "Basic Info", icon: User },
    { id: "contact", label: "Contact", icon: Phone },
    { id: "about", label: "About", icon: Calendar },
  ];

  const modalVariants = {
    hidden: { opacity: 0, scale: 0.95, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 500,
        damping: 30,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 25,
      },
    },
    exit: { opacity: 0, x: -20, transition: { duration: 0.15 } },
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-w-[95vw] max-h-[95vh] overflow-hidden p-0">
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col h-full"
            >
              <DialogHeader className="px-4 sm:px-6 py-4 border-b bg-white">
                <DialogTitle className="text-lg sm:text-xl font-semibold flex items-center gap-2 text-black">
                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-black" />
                  Edit Profile
                </DialogTitle>
              </DialogHeader>

              <div className="flex-1 overflow-hidden">
                <div className="flex flex-col sm:flex-row h-full">
                  {/* Mobile Tab Selector */}
                  <div className="sm:hidden border-b bg-gray-50 p-2">
                    <div className="flex gap-1">
                      {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex-1 flex items-center justify-center gap-1 px-2 py-2 rounded-lg text-xs font-medium transition-colors ${
                              activeTab === tab.id
                                ? "bg-black text-white"
                                : "text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <IconComponent className="h-3 w-3" />
                            <span className="hidden xs:inline">
                              {tab.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Desktop Sidebar Tabs */}
                  <div className="hidden sm:block w-48 border-r bg-gray-50 p-4 flex-shrink-0">
                    <nav className="space-y-2">
                      {tabs.map((tab) => {
                        const IconComponent = tab.icon;
                        return (
                          <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                              activeTab === tab.id
                                ? "bg-black text-white"
                                : "text-gray-700 hover:bg-gray-200"
                            }`}
                          >
                            <IconComponent className="h-4 w-4" />
                            {tab.label}
                          </button>
                        );
                      })}
                    </nav>
                  </div>

                  {/* Content Area */}
                  <div className="flex-1 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="p-4 sm:p-6">
                      <AnimatePresence mode="wait">
                        {/* Basic Info Tab */}
                        {activeTab === "basic" && (
                          <motion.div
                            key="basic"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                          >
                            {/* Profile Picture */}
                            <div className="flex flex-col items-center space-y-4">
                              <div className="relative">
                                <Avatar className="h-24 w-24">
                                  <AvatarImage src={formData.photoURL} />
                                  <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                                    {formData.displayName
                                      ?.charAt(0)
                                      ?.toUpperCase() || "U"}
                                  </AvatarFallback>
                                </Avatar>
                                <motion.button
                                  type="button"
                                  className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center"
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                >
                                  <Camera className="h-4 w-4" />
                                </motion.button>
                              </div>
                              <div className="text-center">
                                <p className="text-sm font-medium">
                                  Profile Picture
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  Click camera to upload new photo
                                </p>
                              </div>
                            </div>

                            {/* Display Name */}
                            <div className="space-y-2">
                              <Label
                                htmlFor="displayName"
                                className="flex items-center gap-2"
                              >
                                <User className="h-4 w-4" />
                                Display Name *
                              </Label>
                              <Input
                                id="displayName"
                                value={formData.displayName}
                                onChange={(e) =>
                                  handleInputChange(
                                    "displayName",
                                    e.target.value,
                                  )
                                }
                                placeholder="Enter your display name"
                                className={
                                  errors.displayName ? "border-destructive" : ""
                                }
                              />
                              {errors.displayName && (
                                <motion.p
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs text-destructive flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {errors.displayName}
                                </motion.p>
                              )}
                            </div>

                            {/* Email */}
                            <div className="space-y-2">
                              <Label
                                htmlFor="email"
                                className="flex items-center gap-2"
                              >
                                <Mail className="h-4 w-4" />
                                Email Address *
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                  handleInputChange("email", e.target.value)
                                }
                                placeholder="Enter your email address"
                                className={
                                  errors.email ? "border-destructive" : ""
                                }
                              />
                              {errors.email && (
                                <motion.p
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs text-destructive flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {errors.email}
                                </motion.p>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Contact Tab */}
                        {activeTab === "contact" && (
                          <motion.div
                            key="contact"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                          >
                            <div className="space-y-2">
                              <Label
                                htmlFor="phone"
                                className="flex items-center gap-2"
                              >
                                <Phone className="h-4 w-4" />
                                Phone Number
                              </Label>
                              <Input
                                id="phone"
                                type="tel"
                                value={formData.phone}
                                onChange={(e) =>
                                  handleInputChange("phone", e.target.value)
                                }
                                placeholder="Enter your phone number"
                                className={
                                  errors.phone ? "border-destructive" : ""
                                }
                              />
                              {errors.phone && (
                                <motion.p
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-xs text-destructive flex items-center gap-1"
                                >
                                  <AlertCircle className="h-3 w-3" />
                                  {errors.phone}
                                </motion.p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                This will be used for emergency contacts and
                                notifications
                              </p>
                            </div>

                            <div className="space-y-2">
                              <Label
                                htmlFor="location"
                                className="flex items-center gap-2"
                              >
                                <MapPin className="h-4 w-4" />
                                Location
                              </Label>
                              <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) =>
                                  handleInputChange("location", e.target.value)
                                }
                                placeholder="Enter your city or region"
                              />
                              <p className="text-xs text-muted-foreground">
                                General location helps provide relevant safety
                                information
                              </p>
                            </div>
                          </motion.div>
                        )}

                        {/* About Tab */}
                        {activeTab === "about" && (
                          <motion.div
                            key="about"
                            variants={tabContentVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="space-y-6"
                          >
                            <div className="space-y-2">
                              <Label htmlFor="bio">Bio</Label>
                              <Textarea
                                id="bio"
                                value={formData.bio}
                                onChange={(e) =>
                                  handleInputChange("bio", e.target.value)
                                }
                                placeholder="Tell us a bit about yourself..."
                                className="min-h-[120px] resize-none"
                                maxLength={500}
                              />
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-muted-foreground">
                                  Optional personal information for your
                                  emergency contacts
                                </p>
                                <span className="text-xs text-muted-foreground">
                                  {formData.bio.length}/500
                                </span>
                              </div>
                            </div>

                            <Card className="bg-muted/20 border-primary/20">
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="h-5 w-5 text-primary mt-0.5" />
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">
                                      Privacy Notice
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      Your profile information is only shared
                                      with your emergency contacts and is used
                                      to provide better safety services. You can
                                      update or delete this information at any
                                      time.
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </form>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-4 sm:px-6 py-4 border-t bg-white flex flex-col sm:flex-row gap-3 sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={loading}
                  className="order-2 sm:order-1 w-full sm:w-auto"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={loading}
                  className="order-1 sm:order-2 w-full sm:w-auto bg-black text-white hover:bg-gray-800"
                >
                  {loading ? (
                    <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
