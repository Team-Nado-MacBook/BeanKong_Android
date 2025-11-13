import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import MapComponent from '@/components/map-component';
import { useFavorites } from '@/hooks/use-favorites';
import { router } from 'expo-router';

export default function MapScreen() {
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);
  const { toggleFavorite, isFavorite } = useFavorites();

  const emptyClassrooms = [
    { id: 1, name: 'IT-5 342', distance: '200m', outlets: ['Desk', 'Wall'], latitude: 36.1234, longitude: 128.5678, building_name: 'IT-5', room_number: '342' },
    { id: 2, name: 'IT-5 341', distance: '201m', outlets: ['Desk'], latitude: 36.1235, longitude: 128.5679, building_name: 'IT-5', room_number: '341' },
  ];

  const handleClassroomSelect = (classroom: any) => setSelectedClassroom(classroom);

  const handleFavoritePress = async (classroom: any) => {
    const classroomData = {
      id: classroom.id,
      building_name: classroom.building_name,
      room_number: classroom.room_number,
      lat: classroom.latitude,
      lng: classroom.longitude,
      mon: '[]', tue: '[]', wed: '[]', thu: '[]', fri: '[]',
    };
    const favorite = isFavorite(classroom.id);
    await toggleFavorite(classroomData);
    Alert.alert(
      favorite ? 'Removed from favorites' : 'Added to favorites',
      favorite
        ? `${classroom.building_name} ${classroom.room_number} removed from favorites.`
        : `${classroom.building_name} ${classroom.room_number} added to favorites.`,
      [{ text: 'OK' }]
    );
  };

  const handleDetailPress = (classroom: any) => {
    if (classroom.id) router.push(`/classroom-detail?id=${classroom.id}`);
    else Alert.alert('Info', 'Details require a real classroom id.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText style={styles.headerTitle}>Map</ThemedText>
        <TouchableOpacity style={styles.menuButton}>
          <IconSymbol name="ellipsis" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      <View style={styles.mapContainer}>
        <MapComponent height={300} />
      </View>

      <View style={styles.listContainer}>
        <ThemedText style={styles.listTitle}>Empty Classrooms</ThemedText>
        <ScrollView style={styles.classroomList} showsVerticalScrollIndicator={false}>
          {emptyClassrooms.map((classroom) => {
            const favorite = isFavorite(classroom.id);
            return (
              <TouchableOpacity
                key={classroom.id}
                style={[styles.classroomItem, selectedClassroom?.id === classroom.id && styles.selectedClassroomItem]}
                onPress={() => handleClassroomSelect(classroom)}
                activeOpacity={0.7}
              >
                <View style={styles.classroomInfo}>
                  <View style={styles.classroomNameRow}>
                    <ThemedText style={styles.classroomName}>{classroom.name}</ThemedText>
                  </View>
                  <ThemedText style={styles.classroomDistance}>{classroom.distance}</ThemedText>
                  {classroom.outlets.length > 0 && (
                    <View style={styles.outletContainer}>
                      {classroom.outlets.map((outlet: string, index: number) => (
                        <View key={index} style={styles.outletTag}>
                          <ThemedText style={styles.outletText}>{outlet}</ThemedText>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <View style={styles.classroomActions}>
                  <TouchableOpacity style={styles.favoriteButton} onPress={() => handleFavoritePress(classroom)} activeOpacity={0.6}>
                    <IconSymbol name={favorite ? 'heart.fill' : 'heart'} size={20} color={favorite ? '#FF3B30' : '#666666'} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.detailButton} onPress={() => handleDetailPress(classroom)}>
                    <ThemedText style={styles.detailButtonText}>Details</ThemedText>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navigateButton}>
                    <IconSymbol name="location" size={16} color="#007AFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  menuButton: { padding: 8 },
  mapContainer: { height: 300, marginHorizontal: 20, marginVertical: 20, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E5E5' },
  listContainer: { flex: 1, paddingHorizontal: 20 },
  listTitle: { fontSize: 18, fontWeight: '600', color: '#000000', marginBottom: 16 },
  classroomList: { flex: 1 },
  classroomItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 8, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  selectedClassroomItem: { borderColor: '#007AFF', backgroundColor: '#F0F8FF' },
  classroomInfo: { flex: 1 },
  classroomNameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  classroomName: { fontSize: 16, fontWeight: '600', color: '#000000' },
  classroomDistance: { fontSize: 14, color: '#666666', marginBottom: 8 },
  outletContainer: { flexDirection: 'row', gap: 4 },
  outletTag: { backgroundColor: '#E3F2FD', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  outletText: { fontSize: 12, color: '#1976D2', fontWeight: '500' },
  classroomActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  favoriteButton: { paddingHorizontal: 8, paddingVertical: 8 },
  detailButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F5F5F5', borderRadius: 6 },
  detailButtonText: { fontSize: 12, color: '#666666' },
  navigateButton: { padding: 8, backgroundColor: '#F0F8FF', borderRadius: 6 },
});

