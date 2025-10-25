import React, { useState, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import * as Location from 'expo-location';

interface MapComponentProps {}

export default function MapComponent({}: MapComponentProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentLocation();
    startLocationTracking();
  }, []);

  const getCurrentLocation = async () => {
    try {
      setIsLoading(true);
      
      // 위치 권한 요청
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('위치 권한이 거부되었습니다.');
        setIsLoading(false);
        return;
      }

      // 현재 위치 가져오기
      const currentLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      
      setLocation(currentLocation);
      setLocationError(null);
    } catch (error) {
      console.error('위치 가져오기 실패:', error);
      setLocationError('위치를 가져올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const startLocationTracking = async () => {
    try {
      // 백그라운드 위치 권한 요청
      const { status } = await Location.requestBackgroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('백그라운드 위치 권한이 거부되었습니다.');
        return;
      }

      // 위치 추적 시작
      await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          timeInterval: 10000, // 10초마다 업데이트
          distanceInterval: 100, // 100m 이동시 업데이트
        },
        (newLocation) => {
          setLocation(newLocation);
          setLocationError(null);
        }
      );
    } catch (error) {
      console.error('위치 추적 시작 실패:', error);
    }
  };

  const getLocationInfo = () => {
    if (isLoading) return '위치 확인 중...';
    if (locationError) return locationError;
    if (!location) return '위치 정보 없음';
    
    const { latitude, longitude } = location.coords;
    return `위도: ${latitude.toFixed(4)}, 경도: ${longitude.toFixed(4)}`;
  };

  const getOpenStreetMapUrl = () => {
    if (!location) return '';
    
    const { latitude, longitude } = location.coords;
    return `https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`;
  };

  return (
    <View style={styles.container}>
      {location ? (
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
            name={isLoading ? "location.circle" : "location.fill"} 
            size={48} 
            color={isLoading ? colors.tint : '#007AFF'} 
          />
          <ThemedText style={styles.mapText}>
            {isLoading ? '위치 확인 중...' : '위치 정보 없음'}
          </ThemedText>
          <ThemedText style={styles.subText}>
            {getLocationInfo()}
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
  subText: {
    marginTop: 4,
    fontSize: 14,
    color: '#999',
  },
});