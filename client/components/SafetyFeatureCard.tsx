import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface SafetyFeatureCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  buttonText: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "emergency" | "safe";
  className?: string;
}

export function SafetyFeatureCard({
  title,
  description,
  icon: Icon,
  buttonText,
  onClick,
  variant = "default",
  className,
}: SafetyFeatureCardProps) {
  const variantStyles = {
    default: "border-border",
    primary: "border-primary/20 bg-primary/5",
    emergency: "border-emergency/20 bg-emergency/5",
    safe: "border-safe/20 bg-safe/5",
  };

  const buttonVariants = {
    default: "bg-primary hover:bg-primary/90",
    primary: "bg-primary hover:bg-primary/90",
    emergency: "bg-emergency hover:bg-emergency/90",
    safe: "bg-safe hover:bg-safe/90",
  };

  return (
    <Card
      className={cn(
        "h-full transition-all hover:shadow-lg",
        variantStyles[variant],
        className,
      )}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              "p-2 rounded-lg shrink-0",
              variant === "emergency" && "bg-emergency/10",
              variant === "safe" && "bg-safe/10",
              variant === "primary" && "bg-primary/10",
              variant === "default" && "bg-muted",
            )}
          >
            <Icon
              className={cn(
                "h-5 w-5",
                variant === "emergency" && "text-emergency",
                variant === "safe" && "text-safe",
                variant === "primary" && "text-primary",
                variant === "default" && "text-muted-foreground",
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg leading-tight">{title}</CardTitle>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-sm leading-relaxed mb-4">
          {description}
        </CardDescription>
        <Button
          onClick={onClick}
          className={cn("w-full", buttonVariants[variant])}
          variant={variant === "default" ? "default" : "default"}
        >
          {buttonText}
        </Button>
      </CardContent>
    </Card>
  );
}
