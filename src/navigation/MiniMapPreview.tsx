import type { KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import OSMNavigatorMap from "../components/OSMNavigatorMap";
import { useNavigationOverlay } from "./NavigationOverlayContext";
import "./navigationOverlay.css";
import "./miniMapPreview.css";

type MiniMapPreviewProps = {
  isArActive: boolean;
  portalRoot?: Element | null;
  hidden?: boolean;
};

export default function MiniMapPreview({ isArActive, portalRoot, hidden = false }: MiniMapPreviewProps) {
  const { open } = useNavigationOverlay();

  if (!isArActive || hidden) return null;

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      open();
    }
  };

  return createPortal(
    <div
      className="navigation-mini navigation-theme"
      role="button"
      tabIndex={0}
      aria-label="Navigation vergrößern"
      onClick={open}
      onKeyDown={handleKeyDown}
    >
      <div className="navigation-mini__frame">
        <OSMNavigatorMap variant="mini" />
        <div className="navigation-mini__expand" aria-hidden="true">
          ↗
        </div>
      </div>
    </div>,
    portalRoot ?? document.body
  );
}
