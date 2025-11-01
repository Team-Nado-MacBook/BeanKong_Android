import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/context/location-context';
import buildings from '@/assets/data/merged_buildings.json';

import EmptyClassroomModal from './EmptyClassroomModal';

export default function MapComponent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { location, isLoading: isLocationLoading, locationPermission } = useLocation();
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);

  const handleMarkerPress = (building: any) => {
    setSelectedBuilding(building);
  };

  const handleCloseModal = () => {
    setSelectedBuilding(null);
  };

  return (
    <View style={styles.container}>
      {locationPermission && location ? (
        <MapView
          style={styles.map}
          provider={PROVIDER_GOOGLE}
          initialRegion={{
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}
          showsUserLocation={true}
        >
          {buildings.map((building) => (
            <Marker
              key={building.name}
              coordinate={{ latitude: building.lat, longitude: building.lng }}
              title={building.name}
              description="Click to see available rooms"
              onPress={() => handleMarkerPress(building)}
            />
          ))}
        </MapView>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.background }]}>
          <IconSymbol 
            name={isLocationLoading ? "location.circle" : "location.fill"} 
            size={48} 
            color={isLocationLoading ? colors.tint : '#007AFF'} 
          />
          <ThemedText style={styles.mapText}>
            {isLocationLoading ? '위치 확인 중...' : '위치 권한이 필요합니다.'}
          </ThemedText>
        </View>
      )}
      <EmptyClassroomModal
        building={selectedBuilding}
        visible={selectedBuilding !== null}
        onClose={handleCloseModal}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
  },
  loadingText: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  mapText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '600',
  },
});
