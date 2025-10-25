import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import MapComponent from '@/components/map-component';

export default function MapScreen() {
  const [selectedClassroom, setSelectedClassroom] = useState<any>(null);

  // 빈강의실 데이터 (임시)
  const emptyClassrooms = [
    { id: 1, name: 'IT-5호관 342', distance: '200m', outlets: ['책상', '벽'], latitude: 36.1234, longitude: 128.5678 },
    { id: 2, name: 'IT-5호관 341', distance: '201m', outlets: ['책상'], latitude: 36.1235, longitude: 128.5679 },
    { id: 3, name: 'IT-5호관 340', distance: '202m', outlets: ['벽'], latitude: 36.1236, longitude: 128.5680 },
    { id: 4, name: 'IT-5호관 339', distance: '203m', outlets: ['책상', '벽'], latitude: 36.1237, longitude: 128.5681 },
    { id: 5, name: 'IT-5호관 338', distance: '204m', outlets: [], latitude: 36.1238, longitude: 128.5682 },
    { id: 6, name: 'IT-5호관 337', distance: '205m', outlets: ['책상'], latitude: 36.1239, longitude: 128.5683 },
  ];

  const handleClassroomSelect = (classroom: any) => {
    setSelectedClassroom(classroom);
  };

  const handleBackToHome = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackToHome}>
          <IconSymbol name="chevron.left" size={24} color="#000000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>지도</ThemedText>
        <View style={styles.placeholder} />
      </View>

      {/* 지도 영역 */}
      <View style={styles.mapContainer}>
        <MapComponent height={400} />
      </View>

      {/* 강의실 리스트 */}
      <View style={styles.listContainer}>
        <ThemedText style={styles.listTitle}>빈 강의실</ThemedText>
        <ScrollView style={styles.classroomList} showsVerticalScrollIndicator={false}>
          {emptyClassrooms.map((classroom) => (
            <TouchableOpacity
              key={classroom.id}
              style={[
                styles.classroomItem,
                selectedClassroom?.id === classroom.id && styles.selectedClassroomItem
              ]}
              onPress={() => handleClassroomSelect(classroom)}
              activeOpacity={0.7}
            >
              <View style={styles.classroomInfo}>
                <ThemedText style={styles.classroomName}>{classroom.name}</ThemedText>
                <ThemedText style={styles.classroomDistance}>{classroom.distance}</ThemedText>
                {classroom.outlets.length > 0 && (
                  <View style={styles.outletContainer}>
                    {classroom.outlets.map((outlet, index) => (
                      <View key={index} style={styles.outletTag}>
                        <ThemedText style={styles.outletText}>{outlet}</ThemedText>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <View style={styles.classroomActions}>
                <TouchableOpacity style={styles.detailButton}>
                  <ThemedText style={styles.detailButtonText}>상세정보</ThemedText>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navigateButton}>
                  <IconSymbol name="location" size={16} color="#007AFF" />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* 하단 네비게이션 */}
      <View style={styles.bottomNavigation}>
        <TouchableOpacity style={styles.navButton} onPress={handleBackToHome}>
          <IconSymbol name="heart.fill" size={24} color="#007AFF" />
          <ThemedText style={styles.navButtonText}>홈</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navButton}>
          <IconSymbol name="map" size={24} color="#666666" />
          <ThemedText style={styles.navButtonText}>지도</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  placeholder: {
    width: 24,
  },
  mapContainer: {
    height: 400,
    marginHorizontal: 20,
    marginVertical: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  classroomList: {
    flex: 1,
  },
  classroomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  selectedClassroomItem: {
    borderColor: '#007AFF',
    backgroundColor: '#F0F8FF',
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  classroomDistance: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 8,
  },
  outletContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  outletTag: {
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  outletText: {
    fontSize: 12,
    color: '#1976D2',
    fontWeight: '500',
  },
  classroomActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F5F5',
    borderRadius: 6,
  },
  detailButtonText: {
    fontSize: 12,
    color: '#666666',
  },
  navigateButton: {
    padding: 8,
    backgroundColor: '#F0F8FF',
    borderRadius: 6,
  },
  bottomNavigation: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  navButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navButtonText: {
    fontSize: 12,
    color: '#666666',
    marginTop: 4,
  },
});
