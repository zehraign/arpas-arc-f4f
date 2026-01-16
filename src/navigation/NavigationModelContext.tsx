import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import stationsRaw from "../data/characterZones.json";

export type Station = {
  id: string;
  name: string;
  lat: number;
  lng: number;
};

export type LatLngTuple = [number, number];

export type NavigationModel = {
  stations: Station[];
  center: LatLngTuple;
  currentPos: LatLngTuple | null;
  destination: Station | null;
  geoError: string | null;
  routePoints: LatLngTuple[] | null;
  routeDistance: number | null;
  routeDuration: number | null;
  isRouting: boolean;
  routeError: string | null;
  setDestination: (station: Station | null) => void;
  clearDestination: () => void;
};

const DEFAULT_CENTER: LatLngTuple = [52.4558, 13.5253];
const ROUTE_UPDATE_THRESHOLD_METERS = 10;

const NavigationModelContext = createContext<NavigationModel | undefined>(undefined);

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

export const NavigationModelProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentPos, setCurrentPos] = useState<LatLngTuple | null>(null);
  const [destination, setDestination] = useState<Station | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [routePoints, setRoutePoints] = useState<LatLngTuple[] | null>(null);
  const [routeDistance, setRouteDistance] = useState<number | null>(null);
  const [routeDuration, setRouteDuration] = useState<number | null>(null);
  const [isRouting, setIsRouting] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
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

  const clearDestination = useCallback(() => {
    setDestination(null);
  }, []);

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

  return <NavigationModelContext.Provider value={value}>{children}</NavigationModelContext.Provider>;
};

export const useNavigationModel = () => {
  const context = useContext(NavigationModelContext);
  if (!context) {
    throw new Error("useNavigationModel must be used within a NavigationModelProvider");
  }
  return context;
};
