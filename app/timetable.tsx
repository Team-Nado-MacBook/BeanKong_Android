import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ClassEntry {
  id: string;
  name: string;
  code: string;
  day: string;
  startTime: string;
  endTime: string;
  color: string;
}

export default function TimetableScreen() {
  const [classes, setClasses] = useState<ClassEntry[]>([]);
  const [currentDay, setCurrentDay] = useState<string>('');

  const days = ['월', '화', '수', '목', '금'];
  const timeSlots = Array.from({ length: 11 }, (_, i) => i + 8); // 8시부터 18시까지

  // 현재 요일 감지 및 저장된 수업 데이터 불러오기
  useEffect(() => {
    const today = new Date();
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    setCurrentDay(dayNames[today.getDay()]);
    
    // 저장된 수업 데이터 불러오기
    loadClasses();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      loadClasses();
    }, [])
  );

  const loadClasses = async () => {
    try {
      const savedClasses = await AsyncStorage.getItem('timetableClasses');
      if (savedClasses) {
        setClasses(JSON.parse(savedClasses));
      }
    } catch (error) {
      console.error('수업 데이터 불러오기 실패:', error);
    }
  };

  const handleSearch = () => {
    router.push('/search');
  };

  const handleDeleteClass = (id: string, name: string) => {
    Alert.alert(
      '수업 삭제',
      `${name} 수업을 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '삭제', 
          style: 'destructive',
          onPress: async () => {
            const updatedClasses = classes.filter(cls => cls.id !== id);
            setClasses(updatedClasses);
            try {
              await AsyncStorage.setItem('timetableClasses', JSON.stringify(updatedClasses));
            } catch (error) {
              console.error('수업 삭제 실패:', error);
            }
          }
        }
      ]
    );
  };

  const getTimePosition = (time: string) => {
    const [hour, minute] = time.split(':').map(Number);
    return (hour - 8) * 60 + minute; // 8시를 기준으로 분 단위로 계산
  };

  const getClassHeight = (startTime: string, endTime: string) => {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    return endMinutes - startMinutes;
  };

  const getClassesForDay = (day: string) => {
    return classes.filter(cls => cls.day === day);
  };

  const getClassColor = (day: string) => {
    return day === currentDay ? '#4169E1' : '#ADD8E6'; // Royal blue for current day, light blue for others
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol name="chevron.left" size={24} color="#000000" />
        </TouchableOpacity>
      </View>
      <ThemedText style={styles.semesterTitle}>2025년 2학기</ThemedText>
      <ScrollView style={styles.content}>
        {/* 시간표 그리드 */}
        <View style={styles.timetableContainer}>
          {/* 요일 헤더 */}
          <View style={styles.dayHeader}>
            <View style={styles.timeColumn} />
            {days.map((day) => (
              <View key={day} style={styles.dayColumn}>
                <ThemedText style={[
                  styles.dayText,
                  day === currentDay && styles.currentDayText
                ]}>
                  {day === '월' ? 'Mon' : day === '화' ? 'Tue' : day === '수' ? 'Wed' : day === '목' ? 'Thu' : day === '금' ? 'Fri' : 'Sat'}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* 시간표 그리드 */}
          <View style={styles.gridContainer}>
            {/* 시간 라벨 */}
            <View style={styles.timeLabels}>
              {timeSlots.map((hour) => (
                <View key={hour} style={styles.timeLabel}>
                  <ThemedText style={styles.timeText}>
                    {hour.toString().padStart(2, '0')}:00
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* 요일별 수업 블록 */}
            {days.map((day) => (
              <View key={day} style={styles.dayColumn}>
                {getClassesForDay(day).map((cls) => (
                  <View
                    key={cls.id}
                    style={[
                      styles.classBlock,
                      {
                        backgroundColor: getClassColor(day),
                        top: getTimePosition(cls.startTime),
                        height: getClassHeight(cls.startTime, cls.endTime),
                      }
                    ]}
                  >
                    <ThemedText style={styles.className} numberOfLines={2}>
                      {cls.name}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* 내 시간표 목록 */}
        <View style={styles.classListContainer}>
          <ThemedText style={styles.listTitle}>내 시간표 목록</ThemedText>
          {classes.map((cls) => (
            <View key={cls.id} style={styles.classItem}>
              <View style={styles.classInfo}>
                <ThemedText style={styles.listClassName}>{cls.name}</ThemedText>
                <ThemedText style={styles.listClassCode}>{cls.code}</ThemedText>
              </View>
              <View style={styles.classActions}>
                <TouchableOpacity 
                  style={styles.deleteButton}
                  onPress={() => handleDeleteClass(cls.id, cls.name)}
                >
                  <ThemedText style={styles.deleteButtonText}>삭제하기</ThemedText>
                </TouchableOpacity>
                <IconSymbol name="chevron.right" size={18} color="#666666" />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* 오른쪽 하단 돋보기 버튼 */}
      <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
        <IconSymbol name="search" size={20} color="#666666" />
      </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  backButton: {
    padding: 5,
  },
  semesterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  timetableContainer: {
    marginTop: 20,
    marginBottom: 30,
  },
  dayHeader: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  timeColumn: {
    width: 60,
  },
  dayColumn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666666',
  },
  currentDayText: {
    color: '#000000',
    fontWeight: '600',
  },
  gridContainer: {
    flexDirection: 'row',
    height: 660,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
  },
  timeLabels: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
  },
  timeLabel: {
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  timeText: {
    fontSize: 12,
    color: '#666666',
  },
  classBlock: {
    position: 'absolute',
    left: 2,
    right: 2,
    padding: 4,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  className: {
    fontSize: 10,
    fontWeight: '500',
    color: '#000000',
    textAlign: 'center',
  },
  classListContainer: {
    marginTop: 20,
    marginBottom: 100,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  classInfo: {
    flex: 1,
  },
  listClassName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  listClassCode: {
    fontSize: 14,
    color: '#666666',
    marginTop: 2,
  },
  classActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteButton: {
  },
  deleteButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  searchButton: {
    position: 'absolute',
    bottom: 70,
    right: 20,
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
});