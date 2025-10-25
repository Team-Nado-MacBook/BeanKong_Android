import React from 'react';
import { StyleSheet, View, TouchableOpacity } from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import MapComponent from '@/components/map-component';

export default function MapScreen() {
  const handleBackToHome = () => {
    router.push('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <MapComponent />
      <View style={styles.floatingNavigation}>
        <TouchableOpacity style={styles.floatingButton} onPress={handleBackToHome}>
          <IconSymbol name="heart.fill" size={20} color="#666666" />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.floatingButton, styles.activeFloatingButton]}>
          <IconSymbol name="map" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  floatingNavigation: {
    position: 'absolute',
    bottom: 70,
    left: 20,
    flexDirection: 'row',
    gap: 8,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  activeFloatingButton: {
    backgroundColor: '#007AFF',
  },
});