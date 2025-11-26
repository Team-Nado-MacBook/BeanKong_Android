import React, { useState, useEffect } from 'react';
import { StyleSheet, TouchableOpacity, View, TextInput, Alert, FlatList, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { searchCourses, Course } from '../database';

function useDebounce(value: string, delay: number): string {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

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

const dayMap: { [key: string]: string } = { mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri' };

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Course[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const performSearch = async () => {
      if (debouncedSearchQuery.trim() === '') { setSearchResults([]); return; }
      setIsLoading(true);
      try {
        const results = await searchCourses(debouncedSearchQuery);
        setSearchResults(results);
      } catch {
        Alert.alert('Error', 'Failed to search courses.');
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
        Alert.alert('Notice', 'This class is already added.');
        return;
      }
      const schedule = JSON.parse(course.schedule);
      const schedules: any[] = [];
      for (const entry of schedule) {
        const timeKey = entry.time.join(',');
        const timeInfo = timeBlockMap[timeKey];
        if (!timeInfo) continue;
        schedules.push({ day: dayMap[entry.day] || entry.day, startTime: timeInfo.startTime, endTime: timeInfo.endTime });
      }
      if (schedules.length === 0) { Alert.alert('Notice', 'No valid schedule times.'); return; }
      const newClass = { id: course.class_id, name: course.subject, code: course.class_id, schedules, color: '#FFE4B5' };
      existingClasses.push(newClass);
      await AsyncStorage.setItem('timetableClasses', JSON.stringify(existingClasses));
      Alert.alert('Success', 'Class added to timetable.');
    } catch {
      Alert.alert('Error', 'Failed to add class.');
    }
  };

  const renderResultItem = ({ item }: { item: Course }) => (
    <TouchableOpacity style={styles.resultItem} onPress={() => handleAddClass(item)}>
      <View style={styles.classInfo}>
        <ThemedText style={styles.className}>{item.subject}</ThemedText>
        <ThemedText style={styles.classCode}>{item.class_id} / {item.building} {item.room}</ThemedText>
      </View>
      <View style={styles.addButton}>
        <ThemedText style={styles.addButtonText}>추가</ThemedText>
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
        <ThemedText style={styles.headerTitle}>과목 검색</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.content}>
        <View style={styles.searchContainer}>
          <TextInput style={styles.searchInput} value={searchQuery} onChangeText={setSearchQuery} placeholder="검색할 과목명을 입력하세요" placeholderTextColor="#999999" autoFocus />
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
            ListHeaderComponent={searchResults.length > 0 ? <ThemedText style={styles.resultsTitle}>Search Results</ThemedText> : null}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 50, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  headerTitle: { fontSize: 20, fontWeight: '600' },
  placeholder: { width: 24 },
  content: { flex: 1, padding: 16 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: '#E5E5E5', borderRadius: 8 },
  searchInput: { flex: 1, fontSize: 16, padding: 0 },
  resultsList: { marginTop: 12 },
  resultsTitle: { fontSize: 14, color: '#666666', marginBottom: 8 },
  resultItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F2F2F2' },
  classInfo: { flex: 1, marginRight: 12 },
  className: { fontSize: 16, fontWeight: '600' },
  classCode: { fontSize: 12, color: '#666666', marginTop: 4 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  addButtonText: { fontSize: 14, color: '#007AFF' },
});

