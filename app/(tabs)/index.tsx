import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Modal, Alert, FlatList, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { router, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setupDatabase, getAllClassrooms, Classroom } from '../../database';
import { useLocation } from '@/context/location-context';

const timePeriods = [
    { start: "08:00", end: "08:50", periods: ["0"] },
    { start: "09:00", end: "09:50", periods: ["1A", "1B"] },
    { start: "10:00", end: "10:50", periods: ["2A", "2B"] },
    { start: "11:00", end: "11:50", periods: ["3A", "3B"] },
    { start: "12:00", end: "12:50", periods: ["4A", "4B"] },
    { start: "13:00", end: "13:50", periods: ["5A", "5B"] },
    { start: "14:00", end: "14:50", periods: ["6A", "6B"] },
    { start: "15:00", end: "15:50", periods: ["7A", "7B"] },
    { start: "16:00", end: "16:50", periods: ["8A", "8B"] },
    { start: "17:00", end: "17:50", periods: ["9A", "9B"] },
    { start: "18:00", end: "18:50", periods: ["10A", "10B"] },
    { start: "19:00", end: "19:50", periods: ["11A", "11B"] },
    { start: "20:00", end: "20:50", periods: ["12A", "12B"] },
    { start: "21:00", end: "21:50", periods: ["13A", "13B"] },
];

function getCurrentPeriods() {
    const now = new Date();
    const currentTime = now.getHours() * 100 + now.getMinutes();

    for (const slot of timePeriods) {
        const startTime = parseInt(slot.start.replace(':', ''), 10);
        const endTime = parseInt(slot.end.replace(':', ''), 10);
        if (currentTime >= startTime && currentTime < endTime) {
            return slot.periods;
        }
    }
    return [];
}

function getPeriodsForTimeRange(startTime: string, duration: string): string[] {
  if (!startTime) {
    return [];
  }

  if (!duration) {
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;

    for (const slot of timePeriods) {
        const slotStartMinutes = parseInt(slot.start.split(':')[0], 10) * 60 + parseInt(slot.start.split(':')[1], 10);
        const slotEndMinutes = parseInt(slot.end.split(':')[0], 10) * 60 + parseInt(slot.end.split(':')[1], 10);

        if (startTotalMinutes >= slotStartMinutes && startTotalMinutes < slotEndMinutes) {
            return slot.periods;
        }
    }
    return [];
  }

  const [startHour, startMinute] = startTime.split(':').map(Number);
  const startTotalMinutes = startHour * 60 + startMinute;

  let durationHours = 0;
  let durationMinutes = 0;
  if (duration.includes('h')) {
    durationHours = parseInt(duration.split('h')[0], 10);
  }
  if (duration.includes('m')) {
    const minPart = duration.includes('h') ? duration.split('h')[1] : duration;
    durationMinutes = parseInt(minPart.replace('m', ''), 10);
  }

  const durationTotalMinutes = durationHours * 60 + durationMinutes;
  const endTotalMinutes = startTotalMinutes + durationTotalMinutes;

  const periods: string[] = [];
  for (const slot of timePeriods) {
    const slotStartMinutes = parseInt(slot.start.split(':')[0], 10) * 60 + parseInt(slot.start.split(':')[1], 10);
    const slotEndMinutes = parseInt(slot.end.split(':')[0], 10) * 60 + parseInt(slot.end.split(':')[1], 10);

    if (startTotalMinutes < slotEndMinutes && endTotalMinutes > slotStartMinutes) {
      periods.push(...slot.periods);
    }
  }

  return periods;
}

const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

export default function HomeScreen() {
  const { location: userLocation, locationPermission, isLoading: isLocationLoading, refreshLocation } = useLocation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [hasTimetable, setHasTimetable] = useState(false);
  const [nextClass, setNextClass] = useState<any>(null);
  const [nearestClassroom, setNearestClassroom] = useState<any>(null);
  const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
  const [emptyClassrooms, setEmptyClassrooms] = useState<(Classroom & { distance?: number })[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStartTime, setSelectedStartTime] = useState<string>('');
  const [selectedDuration, setSelectedDuration] = useState<string>('');
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showOutletModal, setShowOutletModal] = useState(false);
  const [timeModalType, setTimeModalType] = useState<'start' | 'duration'>('start');
  
  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedDurationHour, setSelectedDurationHour] = useState<number>(1);
  const [selectedDurationMinute, setSelectedDurationMinute] = useState<number>(0);

  const getFilteredEmptyClassrooms = (allClassrooms: Classroom[], selectedStartTime: string, selectedDuration: string): Classroom[] => {
    const dayMapping = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
    const currentDayKey = dayMapping[new Date().getDay()] as keyof Omit<Classroom, 'id' | 'building_name' | 'lat' | 'lng' | 'room_number'>;

    let periodsToFilter: string[] = [];
    if (selectedStartTime) {
      periodsToFilter = getPeriodsForTimeRange(selectedStartTime, selectedDuration);
    } else {
      periodsToFilter = getCurrentPeriods();
    }

    if (periodsToFilter.length === 0 || !currentDayKey || !['mon', 'tue', 'wed', 'thu', 'fri'].includes(currentDayKey)) {
        return allClassrooms;
    }

    return allClassrooms.filter(classroom => {
        try {
            const daySchedule = JSON.parse(classroom[currentDayKey] as string);
            if (!Array.isArray(daySchedule)) return true;
            const isOccupied = daySchedule.some((classPeriod: string) => periodsToFilter.includes(classPeriod));
            return !isOccupied;
        } catch {
            return true;
        }
    });
  }

  const findEmptyClassrooms = useCallback(() => {
    const empty = getFilteredEmptyClassrooms(allClassrooms, selectedStartTime, selectedDuration);

    if (locationPermission && userLocation) {
      const classroomsWithDistance = empty.map(classroom => {
        const distance = getDistance(userLocation.coords.latitude, userLocation.coords.longitude, classroom.lat, classroom.lng);
        return { ...classroom, distance };
      });

      classroomsWithDistance.sort((a, b) => a.distance - b.distance);
      setEmptyClassrooms(classroomsWithDistance);
    } else {
      empty.sort((a, b) => a.building_name.localeCompare(b.building_name));
      setEmptyClassrooms(empty);
    }
  }, [allClassrooms, selectedStartTime, selectedDuration, locationPermission, userLocation]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        const savedClasses = await AsyncStorage.getItem('timetableClasses');
        if (savedClasses) {
          const classes = JSON.parse(savedClasses);
          setHasTimetable(classes.length > 0);
          if (classes.length > 0) findNextClass(classes);
        }
        await setupDatabase();
        const allClassroomsFromDB = await getAllClassrooms();
        setAllClassrooms(allClassroomsFromDB);
        setIsLoading(false);
      };
      loadData();
    }, [])
  );

  useEffect(() => {
    if (allClassrooms.length > 0) {
      findEmptyClassrooms();
    }
  }, [allClassrooms, findEmptyClassrooms]);

  const findNextClass = (classes: any[]) => {
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    const now = new Date();
    const currentDay = dayNames[now.getDay()];
    const currentTime = now.getHours() * 100 + now.getMinutes();

    const allSchedules = classes.flatMap(c => 
      c.schedules.map(s => ({
        name: c.name,
        day: s.day,
        startTime: s.startTime,
        dayIndex: dayNames.indexOf(s.day),
        startTimeNum: parseInt(s.startTime.replace(':', ''), 10),
      }))
    );

    const sortedSchedules = allSchedules.sort((a, b) => {
      if (a.dayIndex !== b.dayIndex) {
        return a.dayIndex - b.dayIndex;
      }
      return a.startTimeNum - b.startTimeNum;
    });

    let next = null;
    for (const s of sortedSchedules) {
      if (s.day === currentDay && s.startTimeNum > currentTime) {
        next = s;
        break;
      }
    }
    if (!next) {
      for (const s of sortedSchedules) {
        if (s.dayIndex > dayNames.indexOf(currentDay)) {
          next = s;
          break;
        }
      }
    }
    if (!next && sortedSchedules.length > 0) {
      next = sortedSchedules[0];
    }
    setNextClass(next);
  };

  const findNearestEmptyClassroom = useCallback(() => {
    if (!locationPermission || emptyClassrooms.length === 0) {
      setNearestClassroom({ name: locationPermission ? '빈 강의실 없음' : '위치 권한 필요', distance: '' });
      return;
    }
    const nearest = emptyClassrooms[0] as (Classroom & { distance: number });
    setNearestClassroom({
      name: `${nearest.building_name} ${nearest.room_number}`,
      distance: `${Math.round(nearest.distance * 1000)}m`,
    });
  }, [emptyClassrooms, locationPermission]);

  useEffect(() => {
    if (emptyClassrooms.length > 0) {
      findNearestEmptyClassroom();
    }
  }, [emptyClassrooms, findNearestEmptyClassroom]);

  const handleTimetablePress = () => router.push('/timetable');
  const handleStartTimePress = () => { setTimeModalType('start'); setShowTimeModal(true); };
  const handleDurationPress = () => { setTimeModalType('duration'); setShowDurationModal(true); };
  const handleOutletPress = () => setShowOutletModal(true);

  const handleTimeSelect = () => {
    const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;
    if (timeModalType === 'start') {
      setSelectedStartTime(timeString);
    } else {
      setSelectedDuration(timeString);
    }
    setShowTimeModal(false);
    setShowDurationModal(false);
  };

  const handleDurationSelect = () => {
    let durationString = '';
    if (selectedDurationHour > 0 && selectedDurationMinute > 0) {
      durationString = `${selectedDurationHour}h ${selectedDurationMinute}m`;
    } else if (selectedDurationHour > 0) {
      durationString = `${selectedDurationHour}h`;
    } else if (selectedDurationMinute > 0) {
      durationString = `${selectedDurationMinute}m`;
    }
    setSelectedDuration(durationString);
    setShowDurationModal(false);
  };

  const handleOutletSelect = (outlet: string) => {
    if (outlet === '없음') {
      setSelectedOutlets([]);
      setShowOutletModal(false);
    } else {
      if (selectedOutlets.includes(outlet)) {
        setSelectedOutlets(selectedOutlets.filter(item => item !== outlet));
      } else {
        const newOutlets = [...selectedOutlets, outlet];
        setSelectedOutlets(newOutlets);
        if (newOutlets.includes('책상') && newOutlets.includes('벽')) {
          setShowOutletModal(false);
        }
      }
    }
  };

  const handleMapPress = () => router.push('/map');
  const handleClassroomPress = (classroom: any) => console.log('강의실 선택:', classroom.building_name, classroom.room_number);

  const handleRefreshLocation = async () => {
    if (!locationPermission) {
      Alert.alert("위치 권한 필요", "위치 권한을 허용해야 현재 위치를 기준으로 정렬할 수 있습니다.");
      return;
    }
    await refreshLocation();
  };

  const outletOptions = ['책상', '벽', '없음'];

  const renderClassroom = ({ item }: { item: Classroom }) => (
    <TouchableOpacity key={item.id} style={styles.classroomItem} onPress={() => handleClassroomPress(item)} activeOpacity={0.7}>
      <View style={styles.classroomInfo}>
        <ThemedText style={styles.classroomName}>{`${item.building_name} ${item.room_number}`}</ThemedText>
      </View>
      <TouchableOpacity style={styles.detailButton}>
        <ThemedText style={styles.detailButtonText}>상세정보 &gt;</ThemedText>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const finalIsLoading = isLoading || isLocationLoading;

  return (
    <View style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>BeanKong</ThemedText>
        <TouchableOpacity style={styles.menuButton} onPress={handleTimetablePress}>
          <IconSymbol name="ellipsis" size={24} color="#666666" />
        </TouchableOpacity>
      </View>

      {hasTimetable ? (
        <View style={styles.twoBoxesContainer}>
          <View style={styles.box}>
            <ThemedText style={styles.boxTitle}>다음 강의</ThemedText>
            {nextClass ? (
              <>
                <ThemedText style={styles.boxText}>{nextClass.name}</ThemedText>
                <ThemedText style={styles.boxSubText}>{nextClass.day} {nextClass.startTime}</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.boxText}>오늘 남은 강의가 없습니다.</ThemedText>
            )}
          </View>
          <View style={styles.box}>
            <ThemedText style={styles.boxTitle}>가까운 빈 강의실</ThemedText>
            {nearestClassroom ? (
              <>
                <ThemedText style={styles.boxText}>{nearestClassroom.name}</ThemedText>
                <ThemedText style={styles.boxSubText}>{nearestClassroom.distance}</ThemedText>
              </>
            ) : (
              <ThemedText style={styles.boxText}>찾는 중...</ThemedText>
            )}
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.timetableCard} onPress={handleTimetablePress}>
          <View style={styles.timetableIconContainer}>
            <IconSymbol name="calendar" size={32} color="#666666" />
            <IconSymbol name="exclamationmark" size={16} color="#FF3B30" style={styles.exclamationIcon} />
          </View>
          <ThemedText style={styles.timetableText}>시간표를 입력하세요</ThemedText>
        </TouchableOpacity>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>빈 강의실</ThemedText>
          <TouchableOpacity style={styles.refreshButton} onPress={handleRefreshLocation}>
            <IconSymbol name="location.fill" size={16} color="#666666" />
            <ThemedText style={styles.refreshButtonText}>현위치</ThemedText>
          </TouchableOpacity>
        </View>
        <View style={styles.filterContainer}>
          <View style={styles.sortIcon}>
            <IconSymbol name="arrow.up.arrow.down" size={16} color="#666666" />
          </View>
          <TouchableOpacity style={styles.filterButton} onPress={handleStartTimePress}>
            <IconSymbol name="clock" size={16} color="#666666" />
            <ThemedText style={[styles.filterButtonText, selectedStartTime && styles.selectedFilterText]}>
              {selectedStartTime || '시작 시간'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={handleDurationPress}>
            <ThemedText style={[styles.filterButtonText, selectedDuration && styles.selectedFilterText]}>
              {selectedDuration || '사용 시간'}
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterButton} onPress={handleOutletPress}>
            <ThemedText style={[styles.filterButtonText, selectedOutlets.length > 0 && styles.selectedFilterText]}>
              {selectedOutlets.length > 0 ? selectedOutlets.join(', ') : '콘센트'}
            </ThemedText>
          </TouchableOpacity>
        </View>
        
        {finalIsLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <ThemedText style={styles.loadingText}>빈 강의실을 찾는 중...</ThemedText>
          </View>
        ) : (
          <FlatList
            data={emptyClassrooms}
            renderItem={renderClassroom}
            keyExtractor={(item) => item.id.toString()}
            style={styles.classroomList}
          />
        )}

      </View>

      <View style={styles.floatingNavigation}>
        <TouchableOpacity style={[styles.floatingButton, styles.activeFloatingButton]}>
          <IconSymbol name="heart.fill" size={20} color="#FFFFFF"/>
        </TouchableOpacity>
        <TouchableOpacity style={styles.floatingButton} onPress={handleMapPress}>
          <IconSymbol name="map" size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      <Modal visible={showTimeModal} transparent animationType="slide" onRequestClose={() => setShowTimeModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowTimeModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>시작 시간 선택</ThemedText>
              <TouchableOpacity onPress={() => setShowTimeModal(false)}><IconSymbol name="xmark" size={24} color="#666666" /></TouchableOpacity>
            </View>
            <View style={styles.dialContainer}>
              <View style={styles.dialColumn}>
                <ThemedText style={styles.dialLabel}>시간</ThemedText>
                <ScrollView style={styles.dialScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 12 }, (_, i) => i + 9).map((hour) => (
                    <TouchableOpacity key={hour} style={[styles.dialItem, selectedHour === hour && styles.selectedDialItem]} onPress={() => setSelectedHour(hour)}>
                      <ThemedText style={[styles.dialItemText, selectedHour === hour && styles.selectedDialItemText]}>{hour.toString().padStart(2, '0')}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dialColumn}>
                <ThemedText style={styles.dialLabel}>분</ThemedText>
                <ScrollView style={styles.dialScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 6 }, (_, i) => i * 10).map((minute) => (
                    <TouchableOpacity key={minute} style={[styles.dialItem, selectedMinute === minute && styles.selectedDialItem]} onPress={() => setSelectedMinute(minute)}>
                      <ThemedText style={[styles.dialItemText, selectedMinute === minute && styles.selectedDialItemText]}>{minute.toString().padStart(2, '0')}</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleTimeSelect}><ThemedText style={styles.confirmButtonText}>확인</ThemedText></TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showDurationModal} transparent animationType="slide" onRequestClose={() => setShowDurationModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowDurationModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>사용 시간 선택</ThemedText>
              <TouchableOpacity onPress={() => setShowDurationModal(false)}><IconSymbol name="xmark" size={24} color="#666666" /></TouchableOpacity>
            </View>
            <View style={styles.dialContainer}>
              <View style={styles.dialColumn}>
                <ThemedText style={styles.dialLabel}>시간</ThemedText>
                <ScrollView style={styles.dialScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 8 }, (_, i) => i + 1).map((hour) => (
                    <TouchableOpacity key={hour} style={[styles.dialItem, selectedDurationHour === hour && styles.selectedDialItem]} onPress={() => setSelectedDurationHour(hour)}>
                      <ThemedText style={[styles.dialItemText, selectedDurationHour === hour && styles.selectedDialItemText]}>{hour}시간</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
              <View style={styles.dialColumn}>
                <ThemedText style={styles.dialLabel}>분</ThemedText>
                <ScrollView style={styles.dialScroll} showsVerticalScrollIndicator={false}>
                  {Array.from({ length: 6 }, (_, i) => i * 10).map((minute) => (
                    <TouchableOpacity key={minute} style={[styles.dialItem, selectedDurationMinute === minute && styles.selectedDialItem]} onPress={() => setSelectedDurationMinute(minute)}>
                      <ThemedText style={[styles.dialItemText, selectedDurationMinute === minute && styles.selectedDialItemText]}>{minute}분</ThemedText>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            <TouchableOpacity style={styles.confirmButton} onPress={handleDurationSelect}><ThemedText style={styles.confirmButtonText}>확인</ThemedText></TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal visible={showOutletModal} transparent animationType="slide" onRequestClose={() => setShowOutletModal(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowOutletModal(false)}>
          <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>콘센트 선택</ThemedText>
              <TouchableOpacity onPress={() => setShowOutletModal(false)}><IconSymbol name="xmark" size={24} color="#666666" /></TouchableOpacity>
            </View>
            <View style={styles.modalList}>
              {outletOptions.map((option) => (
                <TouchableOpacity key={option} style={[styles.modalItem, selectedOutlets.includes(option) && styles.selectedItem]} onPress={() => handleOutletSelect(option)}>
                  <ThemedText style={[styles.modalItemText, selectedOutlets.includes(option) && styles.selectedItemText]}>{option}</ThemedText>
                  {selectedOutlets.includes(option) && <IconSymbol name="checkmark" size={20} color="#007AFF"/>}
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 45, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000000', paddingBottom: 1},
  menuButton: { padding: 8 },
  timetableCard: { backgroundColor: '#FFFFFF', marginHorizontal: 20, marginBottom: 30, paddingVertical: 40, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  timetableText: { fontSize: 16, color: '#666666', marginTop: 12 },
  timetableIconContainer: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  exclamationIcon: { position: 'absolute', top: -4, right: -4 },
  twoBoxesContainer: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: 20, marginBottom: 30 },
  box: { backgroundColor: '#FFFFFF', width: '48%', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#E5E5E5', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3.84, elevation: 5 },
  boxTitle: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 10 },
  boxText: { fontSize: 14, color: '#333333' },
  boxSubText: { fontSize: 12, color: '#999999', marginTop: 5 },
  section: { flex: 1, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#000000' },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  refreshButtonText: {
    fontSize: 14,
    color: '#666666',
  },
  filterContainer: { flexDirection: 'row', marginBottom: 20, gap: 8 },
  sortIcon: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 2 },
  filterButton: { flex: 1, height: 40, backgroundColor: '#F5F5F5', borderRadius: 8, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, flexDirection: 'row', gap: 4 },
  filterButtonText: { fontSize: 14, color: '#666666' },
  selectedFilterText: { color: '#007AFF', fontWeight: '500' },
  classroomList: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666'
  },
  classroomItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 16, marginBottom: 8, backgroundColor: '#FFFFFF', borderRadius: 8, borderWidth: 1, borderColor: '#E5E5E5' },
  classroomInfo: { flex: 1 },
  classroomName: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 4 },
  classroomDistance: { fontSize: 14, color: '#666666' },
  detailButton: { paddingHorizontal: 12, paddingVertical: 8 },
  detailButtonText: { fontSize: 14, color: '#666666' },
  floatingNavigation: { position: 'absolute', bottom: 70, left: 20, flexDirection: 'row', gap: 8 },
  floatingButton: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5, borderWidth: 1, borderColor: '#E5E5E5' },
  activeFloatingButton: { backgroundColor: '#007AFF' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '70%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#000000' },
  modalList: { paddingVertical: 8 },
  modalItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  selectedItem: { backgroundColor: '#F0F8FF' },
  modalItemText: { fontSize: 16, color: '#000000' },
  selectedItemText: { color: '#007AFF', fontWeight: '500' },
  dialContainer: { flexDirection: 'row', paddingHorizontal: 20, paddingVertical: 20, gap: 20 },
  dialColumn: { flex: 1, alignItems: 'center' },
  dialLabel: { fontSize: 16, fontWeight: '600', color: '#000000', marginBottom: 12 },
  dialScroll: { height: 200, width: '100%' },
  dialItem: { height: 50, justifyContent: 'center', alignItems: 'center', marginVertical: 2, borderRadius: 8 },
  selectedDialItem: { backgroundColor: '#F0F8FF' },
  dialItemText: { fontSize: 18, color: '#666666' },
  selectedDialItemText: { color: '#007AFF', fontWeight: '600' },
  confirmButton: { backgroundColor: '#007AFF', marginHorizontal: 20, marginBottom: 20, height: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  confirmButtonText: { fontSize: 16, color: '#FFFFFF', fontWeight: '500' },
});