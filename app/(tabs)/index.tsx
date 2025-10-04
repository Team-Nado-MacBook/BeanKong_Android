import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import MapComponent from '@/components/map-component';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 빈강의실 데이터 (임시)
  const emptyClassrooms = [
    { id: 1, name: '공학관 101호', time: '09:00-11:00', capacity: 50 },
    { id: 2, name: '공학관 201호', time: '14:00-16:00', capacity: 30 },
    { id: 3, name: '인문관 301호', time: '10:00-12:00', capacity: 40 },
    { id: 4, name: '자연관 401호', time: '15:00-17:00', capacity: 60 },
  ];

  const handleAddSchedule = () => {
    // 시간표 추가 로직
    console.log('시간표 추가하기');
    // TODO: 시간표 추가 모달 또는 화면으로 이동
  };

  const handleClassroomPress = (classroom: any) => {
    // 강의실 상세 정보 보기
    console.log('강의실 선택:', classroom.name);
    // TODO: 강의실 상세 정보 모달 또는 화면으로 이동
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 상단 프로필 아이콘 */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.profileButton}>
          <IconSymbol name="person.circle" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 시간표 추가 버튼 */}
      <TouchableOpacity style={[styles.addScheduleButton, { backgroundColor: colors.background }]} onPress={handleAddSchedule}>
        <IconSymbol name="plus" size={24} color={colors.text} />
        <ThemedText style={styles.addScheduleText}>내 시간표 추가하기</ThemedText>
      </TouchableOpacity>

      {/* 지도 섹션 */}
      <ThemedView style={styles.mapContainer}>
        <ThemedText style={styles.sectionTitle}>지도</ThemedText>
        <MapComponent height={200} />
      </ThemedView>

      {/* 빈강의실 섹션 */}
      <ThemedView style={styles.classroomContainer}>
        <ThemedText style={styles.sectionTitle}>빈강의실</ThemedText>
        {emptyClassrooms.map((classroom) => (
          <TouchableOpacity 
            key={classroom.id} 
            style={[styles.classroomItem, { backgroundColor: colors.background }]}
            onPress={() => handleClassroomPress(classroom)}
            activeOpacity={0.7}
          >
            <View style={styles.classroomInfo}>
              <ThemedText style={styles.classroomName}>{classroom.name}</ThemedText>
              <ThemedText style={styles.classroomTime}>{classroom.time}</ThemedText>
            </View>
            <View style={styles.classroomCapacity}>
              <ThemedText style={styles.capacityText}>{classroom.capacity}명</ThemedText>
              <IconSymbol name="chevron.right" size={16} color="#999" />
            </View>
          </TouchableOpacity>
        ))}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  profileButton: {
    padding: 8,
  },
  addScheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    marginBottom: 20,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  addScheduleText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
  },
  mapContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#666',
  },
  classroomContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  classroomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  classroomTime: {
    fontSize: 14,
    color: '#666',
  },
  classroomCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
    marginRight: 4,
  },
});
