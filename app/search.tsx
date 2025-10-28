import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Alert, FlatList, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchCourses, Course } from '../database';

// Debounce hook for search input
function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
}

// Maps schedule time blocks to actual start/end times
const timeBlockMap: { [key: string]: { startTime: string; endTime: string } } = {
    '1A,1B,2A': { startTime: '09:00', endTime: '10:15' },
    '2B,3A,3B': { startTime: '10:30', endTime: '11:45' },
    '4A,4B,5A': { startTime: '12:00', endTime: '13:15' },
    '5B,6A,6B': { startTime: '13:30', endTime: '14:45' },
    '7A,7B,8A': { startTime: '15:00', endTime: '16:15' },
    '8B,9A,9B': { startTime: '16:30', endTime: '17:45' },
    '10A,10B,11A': { startTime: '18:00', endTime: '19:15' },
    '11B,12A,12B': { startTime: '19:30', endTime: '20:45' },
};

const dayMap: { [key: string]: string } = {
    mon: '월',
    tue: '화',
    wed: '수',
    thu: '목',
    fri: '금',
};

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim() === '') {
        setSearchResults([]);
        return;
      }
      setIsLoading(true);
      try {
        const results = await searchCourses(debouncedSearchQuery);
        setSearchResults(results);
      } catch {
        Alert.alert('오류', '강의 검색에 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };
    performSearch();
  }, [debouncedSearchQuery]);

  const handleAddClass = async (course: Course) => {
    try {
      const existingClassesStr = await AsyncStorage.getItem('timetableClasses');
      let existingClasses = existingClassesStr ? JSON.parse(existingClassesStr) : [];
      
      if (existingClasses.some((c: any) => c.code === course.class_id)) {
        Alert.alert('오류', '이미 추가된 수업입니다.');
        return;
      }

      const schedule = JSON.parse(course.schedule);
      const schedules = [];

      for (const entry of schedule) {
        const timeKey = entry.time.join(',');
        const timeInfo = timeBlockMap[timeKey];
        
        if (!timeInfo) continue;

        schedules.push({
            day: dayMap[entry.day] || entry.day,
            startTime: timeInfo.startTime,
            endTime: timeInfo.endTime,
        });
      }

      if (schedules.length === 0) {
        Alert.alert('오류', '유효한 시간 정보가 없는 수업입니다.');
        return;
      }

      const newClass = {
          id: course.class_id,
          name: course.subject,
          code: course.class_id,
          schedules: schedules,
          color: '#FFE4B5'
      };

      // Conflict check
      const conflictingClasses = existingClasses.filter((c: any) => {
        for (const newSchedule of newClass.schedules) {
          for (const existingSchedule of c.schedules) {
            if (newSchedule.day === existingSchedule.day) {
              const newStartTime = parseInt(newSchedule.startTime.replace(':', ''), 10);
              const newEndTime = parseInt(newSchedule.endTime.replace(':', ''), 10);
              const existingStartTime = parseInt(existingSchedule.startTime.replace(':', ''), 10);
              const existingEndTime = parseInt(existingSchedule.endTime.replace(':', ''), 10);

              if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
                return true; // Conflict found
              }
            }
          }
        }
        return false; // No conflict
      });

      if (conflictingClasses.length > 0) {
        const conflictingClassNames = conflictingClasses.map((c: any) => c.name).join(', ');
        Alert.alert('시간표 충돌', `다음 수업과 시간이 겹칩니다: ${conflictingClassNames}`);
        return;
      }

      // Add the new class
      existingClasses.push(newClass);

      await AsyncStorage.setItem('timetableClasses', JSON.stringify(existingClasses));
      Alert.alert('추가 완료', `${course.subject} 수업이 시간표에 추가되었습니다.`);
      router.back();

    } catch {
      Alert.alert('오류', '수업 추가에 실패했습니다.');
    }
  };

  const renderResultItem = ({ item }: { item: Course }) => (
    <TouchableOpacity
      style={styles.resultItem}
      onPress={() => handleAddClass(item)}
    >
      <View style={styles.classInfo}>
        <ThemedText style={styles.className}>{item.subject}</ThemedText>
        <ThemedText style={styles.classCode}>{item.class_id} / {item.building} {item.room}호</ThemedText>
      </View>
      <View style={styles.addButton}>
        <ThemedText style={styles.addButtonText}>추가하기</ThemedText>
        <IconSymbol name="chevron.right" size={16} color="#666666" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#000000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>강의 검색</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="수업명 또는 과목코드로 검색"
            placeholderTextColor="#999999"
            autoFocus
          />
          <IconSymbol name="search" size={20} color="#666666" />
        </View>

        {isLoading ? (
            <ActivityIndicator style={{ marginTop: 20 }} />
        ) : (
            <FlatList
                data={searchResults}
                renderItem={renderResultItem}
                keyExtractor={(item) => item.id!.toString()}
                style={styles.resultsList}
                ListHeaderComponent={searchResults.length > 0 ? <ThemedText style={styles.resultsTitle}>검색결과</ThemedText> : null}
            />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#000000' },
  placeholder: { width: 24 },
  content: { flex: 1, paddingHorizontal: 20 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, color: '#000000' },
  resultsList: { marginTop: 20 },
  resultsTitle: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 12 },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
    backgroundColor: '#FFFFFF',
  },
  classInfo: { flex: 1, marginRight: 10 },
  className: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 4 },
  classCode: { fontSize: 14, color: '#666666' },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addButtonText: { fontSize: 14, color: '#007AFF', fontWeight: '500' },
});