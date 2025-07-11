import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import UniqueGuardianFeatures from "@/components/UniqueGuardianFeatures";

export default function UniqueFeatures() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50"
    >
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Guardian
            </Button>
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-purple-800">
                Unique Features
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <UniqueGuardianFeatures />
      </div>
    </motion.div>
  );
}
