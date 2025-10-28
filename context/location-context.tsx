
import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import * as Location from 'expo-location';

interface LocationContextData {
  location: Location.LocationObject | null;
  locationPermission: boolean;
  isLoading: boolean;
  refreshLocation: () => Promise<void>;
}

const LocationContext = createContext<LocationContextData>({
  location: null,
  locationPermission: false,
  isLoading: true,
  refreshLocation: async () => {},
});

export const useLocation = () => useContext(LocationContext);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const requestAndFetchLocation = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        const permissionGranted = status === 'granted';
        setLocationPermission(permissionGranted);

        if (permissionGranted) {
          const currentLocation = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setLocation(currentLocation);
        }
      } catch (error) {
        console.error("Failed to get location", error);
      } finally {
        setIsLoading(false);
      }
    };

    requestAndFetchLocation();
  }, []);

  const refreshLocation = async () => {
    setIsLoading(true);
    try {
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation(currentLocation);
    } catch (error) {
      console.error("Failed to refresh location", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LocationContext.Provider value={{ location, locationPermission, isLoading, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
};
