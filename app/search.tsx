import React, { useState } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, TextInput, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SearchClass {
  id: string;
  name: string;
  code: string;
  day: string;
  startTime: string;
  endTime: string;
}

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<SearchClass[]>([]);

  // 임시 검색 데이터
  const allClasses: SearchClass[] = [
    { id: '1', name: '데이타 과학기초', code: 'comp3434-002', day: '월', startTime: '09:00', endTime: '10:50' },
    { id: '2', name: '데이타 베이스', code: 'comp3434-001', day: '월', startTime: '11:00', endTime: '12:50' },
    { id: '3', name: '데이타 통신', code: 'comp3434-003', day: '화', startTime: '14:00', endTime: '15:50' },
    { id: '4', name: '데이타 구조', code: 'comp3434-004', day: '수', startTime: '10:00', endTime: '11:50' },
    { id: '5', name: '데이타 알고리즘', code: 'comp3434-005', day: '목', startTime: '13:00', endTime: '14:50' },
    { id: '6', name: '데이타 마이닝', code: 'comp3434-006', day: '금', startTime: '09:00', endTime: '10:50' },
    { id: '7', name: '데이타 분석', code: 'comp3434-007', day: '금', startTime: '13:00', endTime: '14:50' },
    { id: '8', name: '운영체제', code: 'comp3210-001', day: '수', startTime: '15:00', endTime: '16:50' },
    { id: '9', name: '컴퓨터 구조', code: 'comp3110-001', day: '화', startTime: '16:00', endTime: '17:50' },
  ];

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === '') {
      setSearchResults([]);
      return;
    }

    const filtered = allClasses.filter(cls => 
      cls.name.toLowerCase().includes(query.toLowerCase()) ||
      cls.code.toLowerCase().includes(query.toLowerCase())
    );
    setSearchResults(filtered);
  };

  const handleAddClass = async (classItem: SearchClass) => {
    try {
      const existingClasses = await AsyncStorage.getItem('timetableClasses');
      let classes = existingClasses ? JSON.parse(existingClasses) : [];

      // Check for conflicts
      const newClassStartTime = parseInt(classItem.startTime.replace(':', ''), 10);
      const newClassEndTime = parseInt(classItem.endTime.replace(':', ''), 10);

      const conflictingClass = classes.find((c: any) => {
        if (c.day !== classItem.day) {
          return false;
        }
        const existingClassStartTime = parseInt(c.startTime.replace(':', ''), 10);
        const existingClassEndTime = parseInt(c.endTime.replace(':', ''), 10);

        return (
          (newClassStartTime < existingClassEndTime && newClassEndTime > existingClassStartTime)
        );
      });

      if (conflictingClass) {
        // Remove conflicting class
        classes = classes.filter((c: any) => c.id !== conflictingClass.id);
      }

      // Add the new class
      const newClass = {
        id: Date.now().toString(),
        name: classItem.name,
        code: classItem.code,
        day: classItem.day,
        startTime: classItem.startTime,
        endTime: classItem.endTime,
        color: '#FFE4B5'
      };
      const updatedClasses = [...classes, newClass];

      await AsyncStorage.setItem('timetableClasses', JSON.stringify(updatedClasses));

      Alert.alert('추가 완료', `${classItem.name} 수업이 시간표에 추가되었습니다.`);
      router.back();
    } catch (error) {
      Alert.alert('오류', '수업 추가에 실패했습니다.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#000000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>검색</ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* 검색 입력 */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholder="수업명 또는 과목코드로 검색"
            placeholderTextColor="#999999"
          />
          <IconSymbol name="search" size={20} color="#666666" />
        </View>

        {/* 검색 결과 */}
        {searchQuery.trim() !== '' && (
          <View style={styles.resultsContainer}>
            <ThemedText style={styles.resultsTitle}>검색결과</ThemedText>
            <ThemedView style={styles.resultsList}>
              {searchResults.map((classItem) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={styles.resultItem}
                  onPress={() => handleAddClass(classItem)}
                >
                  <View style={styles.classInfo}>
                    <ThemedText style={styles.className}>{classItem.name}</ThemedText>
                    <ThemedText style={styles.classCode}>{classItem.code}</ThemedText>
                  </View>
                  <View style={styles.addButton}>
                    <ThemedText style={styles.addButtonText}>추가하기</ThemedText>
                    <IconSymbol name="chevron.right" size={16} color="#666666" />
                  </View>
                </TouchableOpacity>
              ))}
            </ThemedView>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000000',
  },
  resultsContainer: {
    marginTop: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 12,
  },
  resultsList: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    overflow: 'hidden',
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  classInfo: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 4,
  },
  classCode: {
    fontSize: 14,
    color: '#666666',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  addButtonText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
});
