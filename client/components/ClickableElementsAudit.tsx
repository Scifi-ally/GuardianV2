import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  MousePointer,
  Eye,
  EyeOff,
  Zap,
} from "lucide-react";
import { toast } from "sonner";

interface ClickableElement {
  tag: string;
  text: string;
  id?: string;
  className?: string;
  href?: string;
  onClick?: string;
  disabled?: boolean;
  type?: string;
  role?: string;
  ariaLabel?: string;
  position: {
    x: number;
    y: number;
  };
  isWorking: boolean;
  issues: string[];
  element: HTMLElement;
}

interface ClickableElementsAuditProps {
  isVisible?: boolean;
  onToggle?: () => void;
}

export function ClickableElementsAudit({
  isVisible = false,
  onToggle,
}: ClickableElementsAuditProps) {
  const [clickableElements, setClickableElements] = useState<
    ClickableElement[]
  >([]);
  const [highlightedElement, setHighlightedElement] =
    useState<HTMLElement | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [showOnlyIssues, setShowOnlyIssues] = useState(false);

  const scanClickableElements = () => {
    setIsScanning(true);

    const selectors = [
      "button",
      "a",
      'input[type="button"]',
      'input[type="submit"]',
      'input[type="reset"]',
      'input[type="checkbox"]',
      'input[type="radio"]',
      "select",
      "[onclick]",
      '[role="button"]',
      '[role="link"]',
      '[role="tab"]',
      '[role="menuitem"]',
      "[tabindex]",
      ".cursor-pointer",
      '[data-testid*="button"]',
      '[data-testid*="click"]',
    ];

    const elements = document.querySelectorAll(selectors.join(","));
    const clickableElementsData: ClickableElement[] = [];

    elements.forEach((element, index) => {
      const htmlElement = element as HTMLElement;
      const rect = htmlElement.getBoundingClientRect();

      // Skip elements that are not visible
      if (rect.width === 0 || rect.height === 0) return;
      if (getComputedStyle(htmlElement).display === "none") return;
      if (getComputedStyle(htmlElement).visibility === "hidden") return;

      const issues: string[] = [];
      let isWorking = true;

      // Check for common issues
      if (
        htmlElement.tagName === "BUTTON" &&
        htmlElement.getAttribute("disabled") === ""
      ) {
        issues.push("Button is disabled");
        isWorking = false;
      }

      if (
        htmlElement.tagName === "A" &&
        !htmlElement.getAttribute("href") &&
        !htmlElement.onclick
      ) {
        issues.push("Link has no href or onclick handler");
        isWorking = false;
      }

      if (
        !htmlElement.textContent?.trim() &&
        !htmlElement.getAttribute("aria-label") &&
        !htmlElement.querySelector("svg")
      ) {
        issues.push("No visible text, aria-label, or icon");
        isWorking = false;
      }

      // Check if element has pointer-events: none
      if (getComputedStyle(htmlElement).pointerEvents === "none") {
        issues.push("Pointer events disabled");
        isWorking = false;
      }

      // Check if element is covered by other elements
      const elementAtPoint = document.elementFromPoint(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
      );
      if (
        elementAtPoint &&
        !htmlElement.contains(elementAtPoint) &&
        elementAtPoint !== htmlElement
      ) {
        issues.push("Element may be covered by another element");
        isWorking = false;
      }

      // Test click functionality
      try {
        const hasClickHandler =
          htmlElement.onclick ||
          htmlElement.addEventListener ||
          htmlElement.getAttribute("data-testid") ||
          htmlElement.closest("[onclick]") ||
          htmlElement.tagName === "A" ||
          htmlElement.tagName === "BUTTON";

        if (!hasClickHandler) {
          issues.push("No apparent click handler");
          isWorking = false;
        }
      } catch (error) {
        issues.push("Error testing click functionality");
        isWorking = false;
      }

      clickableElementsData.push({
        tag: htmlElement.tagName.toLowerCase(),
        text: htmlElement.textContent?.trim().substring(0, 50) || "",
        id: htmlElement.id || undefined,
        className: htmlElement.className || undefined,
        href: (htmlElement as HTMLAnchorElement).href || undefined,
        onClick: htmlElement.onclick?.toString() || undefined,
        disabled: htmlElement.hasAttribute("disabled"),
        type: (htmlElement as HTMLInputElement).type || undefined,
        role: htmlElement.getAttribute("role") || undefined,
        ariaLabel: htmlElement.getAttribute("aria-label") || undefined,
        position: {
          x: Math.round(rect.left + rect.width / 2),
          y: Math.round(rect.top + rect.height / 2),
        },
        isWorking,
        issues,
        element: htmlElement,
      });
    });

    setClickableElements(clickableElementsData);
    setIsScanning(false);

    const totalElements = clickableElementsData.length;
    const workingElements = clickableElementsData.filter(
      (el) => el.isWorking,
    ).length;
    const issueElements = totalElements - workingElements;

    // Silently complete scan
  };

  const highlightElement = (element: HTMLElement) => {
    // Remove previous highlight
    if (highlightedElement) {
      highlightedElement.style.outline = "";
      highlightedElement.style.boxShadow = "";
    }

    // Add highlight to new element
    element.style.outline = "3px solid #ff0000";
    element.style.boxShadow = "0 0 10px rgba(255, 0, 0, 0.5)";
    element.scrollIntoView({ behavior: "smooth", block: "center" });

    setHighlightedElement(element);
  };

  const testClick = (elementData: ClickableElement) => {
    try {
      const element = elementData.element;

      // Scroll to element
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // Highlight element
      highlightElement(element);

      // Attempt to click
      setTimeout(() => {
        element.click();
        // Silently test click
      }, 500);
    } catch (error) {
      toast.error(`Failed to click element: ${error}`);
    }
  };

  const fixCommonIssues = () => {
    let fixedCount = 0;

    clickableElements.forEach((elementData) => {
      const element = elementData.element;

      // Fix missing cursor pointer
      if (
        element.tagName === "BUTTON" ||
        element.getAttribute("role") === "button"
      ) {
        if (getComputedStyle(element).cursor !== "pointer") {
          element.style.cursor = "pointer";
          fixedCount++;
        }
      }

      // Fix missing aria-labels
      if (!element.getAttribute("aria-label") && !element.textContent?.trim()) {
        if (element.querySelector("svg")) {
          element.setAttribute("aria-label", "Button");
          fixedCount++;
        }
      }

      // Fix disabled buttons with no indication
      if (element.hasAttribute("disabled") && !element.style.opacity) {
        element.style.opacity = "0.5";
        fixedCount++;
      }
    });

    // Silently apply fixes without notification

    // Re-scan after fixes
    setTimeout(scanClickableElements, 1000);
  };

  useEffect(() => {
    if (isVisible) {
      scanClickableElements();
    }

    return () => {
      // Clean up highlights
      if (highlightedElement) {
        highlightedElement.style.outline = "";
        highlightedElement.style.boxShadow = "";
      }
    };
  }, [isVisible]);

  const filteredElements = showOnlyIssues
    ? clickableElements.filter((el) => !el.isWorking)
    : clickableElements;

  const workingCount = clickableElements.filter((el) => el.isWorking).length;
  const issueCount = clickableElements.filter((el) => !el.isWorking).length;

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-20 left-4 z-40 bg-purple-600 hover:bg-purple-700"
        size="sm"
      >
        <MousePointer className="h-4 w-4 mr-2" />
        Audit Clicks
      </Button>
    );
  }

  return (
    <div className="fixed inset-4 z-50 bg-white rounded-xl shadow-2xl border overflow-hidden">
      <Card className="h-full">
        <CardHeader className="pb-3 border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <MousePointer className="h-5 w-5" />
              Clickable Elements Audit
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowOnlyIssues(!showOnlyIssues)}
                variant="outline"
                size="sm"
              >
                {showOnlyIssues ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
                {showOnlyIssues ? "Show All" : "Issues Only"}
              </Button>
              <Button
                onClick={scanClickableElements}
                disabled={isScanning}
                size="sm"
              >
                <Search className="h-4 w-4 mr-2" />
                {isScanning ? "Scanning..." : "Re-scan"}
              </Button>
              <Button onClick={fixCommonIssues} variant="outline" size="sm">
                <Zap className="h-4 w-4 mr-2" />
                Auto-fix
              </Button>
              <Button onClick={onToggle} variant="outline" size="sm">
                Close
              </Button>
            </div>
          </div>

          <div className="flex gap-4 text-sm">
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="h-3 w-3 mr-1" />
              {workingCount} Working
            </Badge>
            <Badge variant="destructive">
              <XCircle className="h-3 w-3 mr-1" />
              {issueCount} Issues
            </Badge>
            <Badge variant="secondary">Total: {clickableElements.length}</Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 h-full overflow-auto">
          <div className="space-y-2 p-4">
            {filteredElements.map((element, index) => (
              <Card
                key={index}
                className={`p-3 cursor-pointer hover:bg-gray-50 ${
                  !element.isWorking
                    ? "border-red-200 bg-red-50"
                    : "border-green-200"
                }`}
                onClick={() => highlightElement(element.element)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      {element.isWorking ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                      <Badge variant="outline" className="text-xs">
                        {element.tag}
                      </Badge>
                      {element.disabled && (
                        <Badge variant="secondary" className="text-xs">
                          disabled
                        </Badge>
                      )}
                    </div>

                    <p className="text-sm font-medium">
                      {element.text || element.ariaLabel || "No text"}
                    </p>

                    {element.id && (
                      <p className="text-xs text-gray-600">ID: {element.id}</p>
                    )}

                    {element.href && (
                      <p className="text-xs text-blue-600">
                        Href: {element.href}
                      </p>
                    )}

                    {element.issues.length > 0 && (
                      <div className="mt-2">
                        {element.issues.map((issue, issueIndex) => (
                          <div
                            key={issueIndex}
                            className="flex items-center gap-1 text-xs text-red-600"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            {issue}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1">
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        testClick(element);
                      }}
                      size="sm"
                      variant="outline"
                      className="text-xs h-6"
                    >
                      Test Click
                    </Button>
                    <div className="text-xs text-gray-500 text-center">
                      {element.position.x}, {element.position.y}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
