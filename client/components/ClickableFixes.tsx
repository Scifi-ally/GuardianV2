import { useEffect } from "react";
import { toast } from "sonner";

export function ClickableFixes() {
  useEffect(() => {
    const applyFixes = () => {
      let fixCount = 0;

      // Fix buttons without cursor pointer
      const buttons = document.querySelectorAll(
        'button, [role="button"], .cursor-pointer',
      );
      buttons.forEach((button) => {
        const htmlButton = button as HTMLElement;
        if (getComputedStyle(htmlButton).cursor !== "pointer") {
          htmlButton.style.cursor = "pointer";
          fixCount++;
        }

        // Add proper focus styles for accessibility
        if (
          !htmlButton.style.outline &&
          !htmlButton.classList.contains("focus:outline-none")
        ) {
          htmlButton.addEventListener("focus", () => {
            htmlButton.style.outline = "2px solid #3b82f6";
            htmlButton.style.outlineOffset = "2px";
          });
          htmlButton.addEventListener("blur", () => {
            htmlButton.style.outline = "";
            htmlButton.style.outlineOffset = "";
          });
        }
      });

      // Fix links without href that should be buttons
      const linksWithoutHref = document.querySelectorAll(
        'a:not([href]), a[href=""]',
      );
      linksWithoutHref.forEach((link) => {
        const htmlLink = link as HTMLElement;
        if (htmlLink.onclick || htmlLink.addEventListener) {
          htmlLink.setAttribute("role", "button");
          htmlLink.style.cursor = "pointer";
          htmlLink.setAttribute("tabindex", "0");

          // Add keyboard support
          htmlLink.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              htmlLink.click();
            }
          });
          fixCount++;
        }
      });

      // Fix disabled buttons with no visual indication
      const disabledButtons = document.querySelectorAll("button[disabled]");
      disabledButtons.forEach((button) => {
        const htmlButton = button as HTMLElement;
        if (!htmlButton.style.opacity) {
          htmlButton.style.opacity = "0.5";
          htmlButton.style.cursor = "not-allowed";
          fixCount++;
        }
      });

      // Fix elements with onclick but no role
      const onclickElements = document.querySelectorAll(
        "[onclick]:not(button):not(a)",
      );
      onclickElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (!htmlElement.getAttribute("role")) {
          htmlElement.setAttribute("role", "button");
          htmlElement.style.cursor = "pointer";
          htmlElement.setAttribute("tabindex", "0");

          // Add keyboard support
          htmlElement.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              htmlElement.click();
            }
          });
          fixCount++;
        }
      });

      // Fix form inputs without proper labels
      const inputs = document.querySelectorAll(
        'input:not([type="hidden"]), textarea, select',
      );
      inputs.forEach((input) => {
        const htmlInput = input as HTMLElement;
        const id = htmlInput.id;
        if (id) {
          const label = document.querySelector(`label[for="${id}"]`);
          if (!label && !htmlInput.getAttribute("aria-label")) {
            // Add placeholder as aria-label if available
            const placeholder = (htmlInput as HTMLInputElement).placeholder;
            if (placeholder) {
              htmlInput.setAttribute("aria-label", placeholder);
              fixCount++;
            }
          }
        }
      });

      // Fix clickable cards/divs without proper accessibility
      const clickableCards = document.querySelectorAll(
        '.cursor-pointer:not(button):not(a):not([role="button"])',
      );
      clickableCards.forEach((card) => {
        const htmlCard = card as HTMLElement;
        if (!htmlCard.getAttribute("role")) {
          htmlCard.setAttribute("role", "button");
          htmlCard.setAttribute("tabindex", "0");

          // Add keyboard support
          htmlCard.addEventListener("keydown", (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              htmlCard.click();
            }
          });
          fixCount++;
        }
      });

      // Fix missing aria-labels on icon-only buttons
      const iconButtons = document.querySelectorAll(
        'button:not([aria-label]):has(svg):not(:has(span)), [role="button"]:not([aria-label]):has(svg):not(:has(span))',
      );
      iconButtons.forEach((button) => {
        const htmlButton = button as HTMLElement;
        const svg = htmlButton.querySelector("svg");
        if (svg && !htmlButton.textContent?.trim()) {
          // Try to guess the purpose from class names or context
          const classList = htmlButton.className.toLowerCase();
          let ariaLabel = "Button";

          if (classList.includes("close")) ariaLabel = "Close";
          else if (classList.includes("menu")) ariaLabel = "Menu";
          else if (classList.includes("search")) ariaLabel = "Search";
          else if (classList.includes("delete")) ariaLabel = "Delete";
          else if (classList.includes("edit")) ariaLabel = "Edit";
          else if (classList.includes("save")) ariaLabel = "Save";
          else if (classList.includes("cancel")) ariaLabel = "Cancel";
          else if (classList.includes("submit")) ariaLabel = "Submit";

          htmlButton.setAttribute("aria-label", ariaLabel);
          fixCount++;
        }
      });

      // Fix tabindex issues
      const tabbableElements = document.querySelectorAll(
        'button, a[href], input:not([type="hidden"]), select, textarea, [tabindex]:not([tabindex="-1"])',
      );
      tabbableElements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        if (
          !htmlElement.getAttribute("tabindex") &&
          htmlElement.tagName !== "INPUT" &&
          htmlElement.tagName !== "TEXTAREA" &&
          htmlElement.tagName !== "SELECT"
        ) {
          htmlElement.setAttribute("tabindex", "0");
        }
      });

      if (fixCount > 0) {
        console.log(`ClickableFixes: Applied ${fixCount} accessibility fixes`);
      }
    };

    // Apply fixes after DOM is ready
    const timer = setTimeout(applyFixes, 1000);

    // Also apply fixes when new content is added (for dynamic content)
    const observer = new MutationObserver((mutations) => {
      let shouldReapplyFixes = false;
      mutations.forEach((mutation) => {
        if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as HTMLElement;
              if (
                element.tagName === "BUTTON" ||
                element.querySelector("button") ||
                element.getAttribute("role") === "button" ||
                element.onclick
              ) {
                shouldReapplyFixes = true;
              }
            }
          });
        }
      });

      if (shouldReapplyFixes) {
        setTimeout(applyFixes, 100);
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null; // This is a utility component that doesn't render anything
}
