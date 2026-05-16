import React from 'react';

interface LocationContextType {
  coords: { 
    lat: number; 
    lng: number;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
  } | null;
  history: { lat: number; lng: number; timestamp: number }[];
  error: string | null;
  isSupported: boolean;
  isSyncing: boolean;
}

const LocationContext = React.createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [coords, setCoords] = React.useState<LocationContextType['coords']>(null);
  const [history, setHistory] = React.useState<{ lat: number; lng: number; timestamp: number }[]>([]);
  const [error, setError] = React.useState<string | null>(null);
  const [isSupported, setIsSupported] = React.useState(true);
  const [isSyncing, setIsSyncing] = React.useState(true);

  React.useEffect(() => {
    if (!navigator.geolocation) {
      setIsSupported(false);
      setError("GEOLOCATION_NOT_SUPPORTED");
      setIsSyncing(false);
      return;
    }

    // Initial position fetch
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        };
        setCoords(newCoords);
        setHistory(prev => {
          const now = Date.now();
          const lastPoint = prev[0];
          const uniqueTimestamp = lastPoint && now <= lastPoint.timestamp ? lastPoint.timestamp + 1 : now;
          return [{ lat: newCoords.lat, lng: newCoords.lng, timestamp: uniqueTimestamp }, ...prev].slice(0, 50);
        });
        setIsSyncing(false);
      },
      (err) => {
        console.warn("Initial position failed:", err);
      },
      { enableHighAccuracy: true }
    );

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const newCoords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          speed: position.coords.speed
        };
        setCoords(newCoords);
        setHistory(prev => {
          // Only add to history if moved significantly or it's been a while (throttle history)
          const lastPoint = prev[0];
          const now = Date.now();
          const uniqueTimestamp = lastPoint && now <= lastPoint.timestamp ? lastPoint.timestamp + 1 : now;

          if (!lastPoint || (uniqueTimestamp - lastPoint.timestamp > 2000)) {
             return [{ lat: newCoords.lat, lng: newCoords.lng, timestamp: uniqueTimestamp }, ...prev].slice(0, 100);
          }
          return prev;
        });
        setError(null);
        setIsSyncing(false);
      },
      (err) => {
        console.error("Geolocation Error:", err);
        setError(err.message.toUpperCase());
        setIsSyncing(false);
      },
      { 
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0   
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return (
    <LocationContext.Provider value={{ coords, history, error, isSupported, isSyncing }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = React.useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
}
