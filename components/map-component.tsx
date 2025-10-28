import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { useLocation } from '@/context/location-context';

export default function MapComponent() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { location, isLoading: isLocationLoading, locationPermission } = useLocation();

  const getOpenStreetMapUrl = () => {
    if (!location) return '';
    
    const { latitude, longitude } = location.coords;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  };

  return (
    <View style={styles.container}>
      {locationPermission && location ? (
        <View style={styles.mapContainer}>
          <WebView
            style={styles.map}
            source={{ uri: getOpenStreetMapUrl() }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            renderLoading={() => (
              <View style={styles.loadingContainer}>
                <IconSymbol name="location.circle" size={32} color={colors.tint} />
                <ThemedText style={styles.loadingText}>지도 로딩 중...</ThemedText>
              </View>
            )}
            onError={(syntheticEvent: any) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
            }}
          />
        </View>
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
