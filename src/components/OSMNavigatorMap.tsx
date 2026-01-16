import { useEffect, useMemo, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer } from "react-leaflet";
import leaflet from "leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import { useNavigationModel } from "../navigation/NavigationModelContext";
import "./OSMNavigatorMap.css";

const DEFAULT_ZOOM = 18;
const ATTRIBUTION = "&copy; OpenStreetMap contributors";

const ensureLeafletIcons = () => {
  delete (leaflet.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
  leaflet.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
};

type OSMNavigatorMapProps = {
  variant?: "full" | "mini";
  className?: string;
};

export default function OSMNavigatorMap({ variant = "full", className }: OSMNavigatorMapProps) {
  const {
    stations,
    center,
    currentPos,
    destination,
    geoError,
    routePoints,
    routeDistance,
    routeDuration,
    isRouting,
    routeError,
    setDestination,
    clearDestination,
  } = useNavigationModel();
  const [map, setMap] = useState<L.Map | null>(null);

  const distanceLabel = useMemo(() => {
    if (routeDistance === null) return "—";
    return `${Math.round(routeDistance)} m`;
  }, [routeDistance]);

  const durationLabel = useMemo(() => {
    if (routeDuration === null) return "—";
    return `~${Math.max(1, Math.round(routeDuration / 60))} min`;
  }, [routeDuration]);

  useEffect(() => {
    ensureLeafletIcons();
  }, []);

  const handleCenterOnMe = () => {
    if (!currentPos || !map) return;
    const zoom = Math.max(map.getZoom(), DEFAULT_ZOOM);
    map.flyTo(currentPos, zoom, { animate: true });
  };

  const isMini = variant === "mini";
  const isInteractive = !isMini;

  return (
    <div className={["osm-navigator", isMini ? "osm-navigator--mini" : "", className].filter(Boolean).join(" ")}>
      {!isMini && (
        <div className="osm-nav__info">
          <div>
            <strong>Ziel:</strong> {destination ? destination.name : "—"}
          </div>
          <div>
            <strong>Entfernung:</strong> {distanceLabel}
          </div>
          <div>
            <strong>Dauer:</strong> {durationLabel}
          </div>
          {isRouting && <div className="osm-nav__hint">Route wird berechnet…</div>}
          {routeError && <div className="osm-nav__hint">{routeError}</div>}
          {geoError && <div className="osm-nav__hint">{geoError}</div>}
          <div className="osm-nav__actions">
            <button type="button" onClick={clearDestination} disabled={!destination}>
              Ziel löschen
            </button>
            <button type="button" onClick={handleCenterOnMe} disabled={!currentPos}>
              Zu mir springen
            </button>
          </div>
        </div>
      )}

      <div className="osm-nav__map">
        <MapContainer
          center={center}
          zoom={DEFAULT_ZOOM}
          scrollWheelZoom={isInteractive}
          dragging={isInteractive}
          doubleClickZoom={isInteractive}
          touchZoom={isInteractive}
          zoomControl={isInteractive}
          keyboard={isInteractive}
        >
          <TileLayer attribution={ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {stations.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              eventHandlers={{
                click: () => setDestination(station),
              }}
            >
              <Popup className="osm-nav__popup" closeButton={false}>
                {station.name}
              </Popup>
            </Marker>
          ))}

          {currentPos && (
            <CircleMarker
              center={currentPos}
              radius={8}
              pathOptions={{ color: "var(--accent-dark)", fillColor: "var(--accent)", fillOpacity: 0.9 }}
            >
              <Popup className="osm-nav__popup" closeButton={false}>
                Du bist hier
              </Popup>
            </CircleMarker>
          )}

          {routePoints && (
            <Polyline positions={routePoints} pathOptions={{ color: "var(--accent)", weight: 5 }} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}
