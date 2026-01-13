import { createPortal } from "react-dom";
import OSMNavigatorMap from "../components/OSMNavigatorMap";
import { useNavigationOverlay } from "./NavigationOverlayContext";
import "./navigationOverlay.css";

type NavigationOverlayProps = {
  portalRoot?: Element | null;
};

export default function NavigationOverlay({ portalRoot }: NavigationOverlayProps) {
  const { isOpen, close } = useNavigationOverlay();

  if (!isOpen) return null;

  return createPortal(
    <div className="navigation-overlay__backdrop" onClick={close} role="presentation">
      <div
        className="navigation-overlay__panel"
        role="dialog"
        aria-modal="true"
        aria-label="Campus navigation"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="navigation-overlay__header">
          <div>
            <h3>Navigation</h3>
            <p>Campus-Routing im AR-Modus</p>
          </div>
          <button type="button" className="navigation-overlay__close" onClick={close}>
            Schließen
          </button>
        </div>
        <div className="navigation-overlay__content">
          <OSMNavigatorMap />
        </div>
      </div>
    </div>,
    portalRoot ?? document.body
  );
}
