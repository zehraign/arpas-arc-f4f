import { createPortal } from "react-dom";
import { useNavigationOverlay } from "./NavigationOverlayContext";
import "./navigationOverlay.css";

type NavigationFabProps = {
  disabled?: boolean;
  portalRoot?: Element | null;
};

export default function NavigationFab({ disabled = false, portalRoot }: NavigationFabProps) {
  const { toggle } = useNavigationOverlay();

  return createPortal(
    <button
      type="button"
      className="navigation-fab"
      onClick={toggle}
      disabled={disabled}
      aria-disabled={disabled}
    >
      Navigation
    </button>,
    portalRoot ?? document.body
  );
}
