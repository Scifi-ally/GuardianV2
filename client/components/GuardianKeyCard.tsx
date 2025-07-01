import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Shield, Eye, EyeOff, QrCode } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { copyToClipboard } from "@/lib/clipboard";
import { cn } from "@/lib/utils";

interface GuardianKeyCardProps {
  className?: string;
}

export function GuardianKeyCard({ className }: GuardianKeyCardProps) {
  const [copied, setCopied] = useState(false);
  const [showKey, setShowKey] = useState(false);
  const { userProfile } = useAuth();

  const handleCopy = async () => {
    if (!userProfile?.guardianKey) return;

    const success = await copyToClipboard(userProfile.guardianKey);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const displayKey = showKey
    ? userProfile?.guardianKey
    : userProfile?.guardianKey.replace(/./g, "•");

  return (
    <Card
      className={cn(
        "border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Shield className="h-5 w-5 text-primary" />
          Your Guardian Key
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-background/50 rounded-lg border">
            <div className="font-mono text-lg tracking-wider font-bold text-primary">
              {displayKey}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowKey(!showKey)}
                className="h-8 w-8 p-0"
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleCopy}
                className="h-8 w-8 p-0"
                disabled={copied}
              >
                {copied ? (
                  <Check className="h-4 w-4 text-safe" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleCopy}
              className="flex-1 h-10"
              disabled={copied}
            >
              {copied ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy Key
                </>
              )}
            </Button>
            <Button variant="outline" className="h-10 px-3">
              <QrCode className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-sm text-muted-foreground">
          <div>
            <Badge variant="outline" className="mr-2">
              Tip
            </Badge>
            Share this key with trusted contacts so they can add you as their
            emergency contact.
          </div>
          <p className="text-xs">
            Keep this key secure. Anyone with this key can add you as their
            emergency contact.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
