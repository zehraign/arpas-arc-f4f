import { useEffect, useMemo, useRef, useState } from "react";
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from "react-leaflet";
import leaflet from "leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import stationsRaw from "../data/characterZones.json";
import "./OSMNavigatorMap.css";

type Station = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

type LatLngTuple = [number, number];

const DEFAULT_CENTER: LatLngTuple = [52.4558, 13.5253];
const DEFAULT_ZOOM = 18;
const ROUTE_UPDATE_THRESHOLD_METERS = 10;
const ATTRIBUTION = "&copy; OpenStreetMap contributors";

const toRadians = (value: number) => (value * Math.PI) / 180;

const haversineMeters = (a: LatLngTuple, b: LatLngTuple) => {
  const R = 6371000;
  const dLat = toRadians(b[0] - a[0]);
  const dLng = toRadians(b[1] - a[1]);
  const lat1 = toRadians(a[0]);
  const lat2 = toRadians(b[0]);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const h = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const ensureLeafletIcons = () => {
  delete (leaflet.Icon.Default.prototype as { _getIconUrl?: () => string })._getIconUrl;
  leaflet.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
  });
};

function CaptureMap({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();

  useEffect(() => {
    onReady(map);
  }, [map, onReady]);

  return null;
}

export default function OSMNavigatorMap() {
  const [currentPos, setCurrentPos] = useState<LatLngTuple | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [routePoints, setRoutePoints] = useState<LatLngTuple[] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [map, setMap] = useState<L.Map | null>(null);
  const didInitialCenterRef = useRef(false);
  const lastRouteRef = useRef<{ pos: LatLngTuple; destinationId: string } | null>(null);
  const activeRouteRequest = useRef<AbortController | null>(null);

  const stations = useMemo<Station[]>(() => {
    return (stationsRaw as Station[]).filter(
      (station) => typeof station.lat === "number" && typeof station.lng === "number"
    );
  }, []);

  const center = useMemo<LatLngTuple>(() => {
    if (!stations.length) return DEFAULT_CENTER;
    const sum = stations.reduce(
      (acc, station) => ({ lat: acc.lat + station.lat, lng: acc.lng + station.lng }),
      { lat: 0, lng: 0 }
    );
    return [sum.lat / stations.length, sum.lng / stations.length];
  }, [stations]);

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

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation nicht verfügbar.");
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setCurrentPos([pos.coords.latitude, pos.coords.longitude]);
        setGeoError(null);
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setGeoError("Standort erlauben, sonst keine Navigation.");
        } else {
          setGeoError("Standort nicht verfügbar.");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 15000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  useEffect(() => {
    if (!currentPos || !map || didInitialCenterRef.current) return;
    map.setView(currentPos, DEFAULT_ZOOM, { animate: true });
    didInitialCenterRef.current = true;
  }, [currentPos, map]);

  useEffect(() => {
    if (!currentPos || !destination) {
      activeRouteRequest.current?.abort();
      activeRouteRequest.current = null;
      setRoutePoints(null);
      setRouteDistance(null);
      setRouteDuration(null);
      setRouteError(null);
      setIsRouting(false);
      lastRouteRef.current = null;
      return;
    }

    const lastRoute = lastRouteRef.current;
    const destinationChanged = !lastRoute || lastRoute.destinationId !== destination.id;
    const movedEnough =
      !lastRoute || haversineMeters(currentPos, lastRoute.pos) > ROUTE_UPDATE_THRESHOLD_METERS;

    if (!destinationChanged && !movedEnough) return;

    lastRouteRef.current = { pos: currentPos, destinationId: destination.id };

    const controller = new AbortController();
    activeRouteRequest.current?.abort();
    activeRouteRequest.current = controller;
    setIsRouting(true);
    setRouteError(null);

    const url = `https://router.project-osrm.org/route/v1/foot/${currentPos[1]},${currentPos[0]};${destination.lng},${destination.lat}?overview=full&geometries=geojson`;

    fetch(url, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Routing fehlgeschlagen");
        }
        return response.json();
      })
      .then((data) => {
        const route = data?.routes?.[0];
        const coords = route?.geometry?.coordinates;
        if (!route || !Array.isArray(coords) || coords.length === 0) {
          throw new Error("Keine Route gefunden");
        }
        const points = coords.map(([lng, lat]: [number, number]) => [lat, lng] as LatLngTuple);
        setRoutePoints(points);
        setRouteDistance(typeof route.distance === "number" ? route.distance : null);
        setRouteDuration(typeof route.duration === "number" ? route.duration : null);
      })
      .catch((error) => {
        if (error?.name === "AbortError") return;
        setRoutePoints(null);
        setRouteDistance(null);
        setRouteDuration(null);
        setRouteError("Routing nicht verfügbar");
      })
      .finally(() => {
        if (activeRouteRequest.current === controller) {
          setIsRouting(false);
        }
      });

    return () => {
      controller.abort();
    };
  }, [currentPos, destination]);

  const handleCenterOnMe = () => {
    if (!currentPos || !map) return;
    const zoom = Math.max(map.getZoom(), DEFAULT_ZOOM);
    map.flyTo(currentPos, zoom, { animate: true });
  };

  return (
    <div className="osm-navigator">
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
          <button type="button" onClick={() => setDestination(null)} disabled={!destination}>
            Ziel löschen
          </button>
          <button type="button" onClick={handleCenterOnMe} disabled={!currentPos}>
            Zu mir springen
          </button>
        </div>
      </div>

      <div className="osm-nav__map">
        <MapContainer center={currentPos ?? center} zoom={DEFAULT_ZOOM} scrollWheelZoom>
          <CaptureMap onReady={setMap} />
          <TileLayer attribution={ATTRIBUTION} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {stations.map((station) => (
            <Marker
              key={station.id}
              position={[station.lat, station.lng]}
              eventHandlers={{
                click: () => setDestination(station),
              }}
            >
              <Popup>{station.name}</Popup>
            </Marker>
          ))}

          {currentPos && (
            <CircleMarker
              center={currentPos}
              radius={8}
              pathOptions={{ color: "#2563eb", fillColor: "#3b82f6", fillOpacity: 0.9 }}
            >
              <Popup>Du bist hier</Popup>
            </CircleMarker>
          )}

          {routePoints && <Polyline positions={routePoints} pathOptions={{ color: "#2563eb", weight: 5 }} />}
        </MapContainer>
      </div>
    </div>
  );
}
