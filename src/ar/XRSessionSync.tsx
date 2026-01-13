import { useEffect } from "react";
import { useXR } from "@react-three/xr";
import { useXRSessionState } from "./XRSessionState";

export default function XRSessionSync() {
  const { setXrSessionActive } = useXRSessionState();
  const { session, isPresenting } = useXR((state) => ({
    session: state.session,
    isPresenting: state.isPresenting,
  }));

  useEffect(() => {
    setXrSessionActive(Boolean(session) || Boolean(isPresenting));
  }, [session, isPresenting, setXrSessionActive]);

  return null;
}
