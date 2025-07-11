import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Shield,
  Heart,
  Star,
  Phone,
  MessageCircle,
  Share,
  MoreVertical,
  Navigation,
} from "lucide-react";
import { MagicNavbar } from "@/components/MagicNavbar";
import { EmergencyContactManager } from "@/components/EmergencyContactManager";
import {
  AnimatedSection,
  AnimatedCard,
  FloatingElement,
  GlowingElement,
} from "@/components/AnimatedComponents";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const QuickActionCard = ({
  icon: Icon,
  title,
  description,
  onClick,
  gradient = "from-blue-500 to-purple-600",
}) => {
  return (
    <motion.div
      className="relative group cursor-pointer"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
    >
      <Card className="relative overflow-hidden bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm border border-white/30 hover:border-white/50 transition-all duration-300">
        {/* Animated background */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
          animate={{
            background: [
              `linear-gradient(45deg, var(--tw-gradient-stops))`,
              `linear-gradient(225deg, var(--tw-gradient-stops))`,
              `linear-gradient(45deg, var(--tw-gradient-stops))`,
            ],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "linear",
          }}
        />

        <CardContent className="relative p-6 text-center">
          <motion.div
            className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${gradient} shadow-lg mb-4`}
            whileHover={{ rotate: 5, scale: 1.1 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <Icon className="h-8 w-8 text-white" />
          </motion.div>

          <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-600">{description}</p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

const ContactStatsCard = ({
  icon: Icon,
  label,
  value,
  trend,
  color = "blue",
}) => {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600 bg-blue-50 text-blue-700 border-blue-200",
    green:
      "from-green-500 to-green-600 bg-green-50 text-green-700 border-green-200",
    purple:
      "from-purple-500 to-purple-600 bg-purple-50 text-purple-700 border-purple-200",
    orange:
      "from-orange-500 to-orange-600 bg-orange-50 text-orange-700 border-orange-200",
  };

  return (
    <motion.div
      className={`p-4 rounded-2xl border ${colorClasses[color].split(" ").slice(1).join(" ")}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02, y: -2 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <motion.div
            className={`p-2 rounded-xl bg-gradient-to-r ${colorClasses[color].split(" ").slice(0, 2).join(" ")}`}
            whileHover={{ rotate: 10 }}
          >
            <Icon className="h-5 w-5 text-white" />
          </motion.div>
          <div>
            <p className="text-sm text-gray-600">{label}</p>
            <motion.p
              className="text-2xl font-bold"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring" }}
            >
              {value}
            </motion.p>
          </div>
        </div>
        {trend && (
          <motion.div
            className="text-right"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Badge variant="secondary" className="text-xs">
              {trend}
            </Badge>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default function EnhancedContacts() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const handleSOSPress = () => {
    // SOS triggered from contacts
  };

  const handleQuickCall = () => {
    // Quick emergency call
  };

  const handleShareLocation = () => {
    // Share location with all contacts
  };

  const handleFindContacts = () => {
    // Find nearby guardian users
  };

  const stats = [
    {
      icon: Users,
      label: "Total Contacts",
      value: "5",
      trend: "+2 this week",
      color: "blue",
    },
    {
      icon: Shield,
      label: "Active Guards",
      value: "3",
      trend: "All online",
      color: "green",
    },
    {
      icon: Star,
      label: "Priority Level",
      value: "High",
      trend: "Optimal",
      color: "purple",
    },
    {
      icon: Heart,
      label: "Response Rate",
      value: "98%",
      trend: "+5%",
      color: "orange",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <FloatingElement key={i} intensity={12 + i * 3}>
            <motion.div
              className="absolute w-3 h-3 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 2) * 40}%`,
              }}
              animate={{
                rotate: [0, 360],
                scale: [1, 1.3, 1],
              }}
              transition={{
                duration: 6 + i,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </FloatingElement>
        ))}
      </div>

      <div className="relative z-10 pb-24">
        {/* Enhanced Header */}
        <AnimatedSection>
          <motion.div
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-8"
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="container mx-auto">
              <motion.div
                className="flex items-center justify-between mb-6"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div>
                  <h1 className="text-3xl font-bold mb-2">Emergency Network</h1>
                  <p className="text-blue-100">Your trusted safety circle</p>
                </div>

                <motion.div
                  className="flex items-center space-x-2"
                  initial={{ x: 20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <Badge className="bg-green-500 hover:bg-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Protected
                  </Badge>
                </motion.div>
              </motion.div>

              {/* Search Bar */}
              <motion.div
                className="relative"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search contacts..."
                  className="pl-10 bg-white/20 border-white/30 text-white placeholder-white/70 focus:bg-white/30"
                />
              </motion.div>
            </div>
          </motion.div>
        </AnimatedSection>

        <div className="container mx-auto px-4 py-6 space-y-8">
          {/* Quick Stats */}
          <AnimatedSection>
            <motion.div
              className="grid grid-cols-2 md:grid-cols-4 gap-4"
              variants={{
                hidden: { opacity: 0 },
                visible: {
                  opacity: 1,
                  transition: {
                    staggerChildren: 0.1,
                  },
                },
              }}
              initial="hidden"
              animate="visible"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  variants={{
                    hidden: { opacity: 0, y: 20 },
                    visible: { opacity: 1, y: 0 },
                  }}
                >
                  <ContactStatsCard {...stat} />
                </motion.div>
              ))}
            </motion.div>
          </AnimatedSection>

          {/* Quick Actions */}
          <AnimatedSection variant="slideUp">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
                <Navigation className="h-5 w-5" />
                <span>Quick Actions</span>
              </h2>

              <motion.div
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
                variants={{
                  hidden: { opacity: 0 },
                  visible: {
                    opacity: 1,
                    transition: {
                      staggerChildren: 0.1,
                    },
                  },
                }}
                initial="hidden"
                animate="visible"
              >
                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                >
                  <QuickActionCard
                    icon={Phone}
                    title="Emergency Call"
                    description="Call all contacts"
                    onClick={handleQuickCall}
                    gradient="from-red-500 to-red-600"
                  />
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                >
                  <QuickActionCard
                    icon={Share}
                    title="Share Location"
                    description="Send to all guardians"
                    onClick={handleShareLocation}
                    gradient="from-blue-500 to-blue-600"
                  />
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                >
                  <QuickActionCard
                    icon={UserPlus}
                    title="Find Guardians"
                    description="Nearby users"
                    onClick={handleFindContacts}
                    gradient="from-green-500 to-green-600"
                  />
                </motion.div>

                <motion.div
                  variants={{
                    hidden: { opacity: 0, scale: 0.8 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                >
                  <QuickActionCard
                    icon={MessageCircle}
                    title="Group Message"
                    description="Alert everyone"
                    onClick={handleSOSPress}
                    gradient="from-purple-500 to-purple-600"
                  />
                </motion.div>
              </motion.div>
            </div>
          </AnimatedSection>

          {/* Enhanced Contact Manager */}
          <AnimatedSection variant="fadeScale">
            <motion.div
              className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-xl border border-white/30"
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{
                delay: 0.6,
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <GlowingElement glowColor="rgba(59, 130, 246, 0.2)">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 mb-6">
                    <TabsTrigger
                      value="all"
                      className="flex items-center space-x-2"
                    >
                      <Users className="h-4 w-4" />
                      <span>All Contacts</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="priority"
                      className="flex items-center space-x-2"
                    >
                      <Star className="h-4 w-4" />
                      <span>Priority</span>
                    </TabsTrigger>
                    <TabsTrigger
                      value="nearby"
                      className="flex items-center space-x-2"
                    >
                      <Navigation className="h-4 w-4" />
                      <span>Nearby</span>
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="all">
                    <EmergencyContactManager />
                  </TabsContent>

                  <TabsContent value="priority">
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Star className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Priority Contacts
                      </h3>
                      <p className="text-gray-600">
                        Contacts marked as priority will be shown here
                      </p>
                    </motion.div>
                  </TabsContent>

                  <TabsContent value="nearby">
                    <motion.div
                      className="text-center py-8"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <Navigation className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">
                        Nearby Guardians
                      </h3>
                      <p className="text-gray-600">
                        Guardian users in your area will appear here
                      </p>
                    </motion.div>
                  </TabsContent>
                </Tabs>
              </GlowingElement>
            </motion.div>
          </AnimatedSection>
        </div>
      </div>

      <MagicNavbar onSOSPress={handleSOSPress} />
    </div>
  );
}
