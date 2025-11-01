import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import classSchedule from '@/assets/data/class_schedule.json';
import allBuildings from '@/assets/data/merged_buildings.json';

const timeSlots = {
  '1A': { start: '09:00', end: '09:25' },
  '1B': { start: '09:30', end: '09:55' },
  '2A': { start: '10:00', end: '10:25' },
  '2B': { start: '10:30', end: '10:55' },
  '3A': { start: '11:00', end: '11:25' },
  '3B': { start: '11:30', end: '11:55' },
  '4A': { start: '12:00', end: '12:25' },
  '4B': { start: '12:30', end: '12:55' },
  '5A': { start: '13:00', end: '13:25' },
  '5B': { start: '13:30', end: '13:55' },
  '6A': { start: '14:00', end: '14:25' },
  '6B': { start: '14:30', end: '14:55' },
  '7A': { start: '15:00', end: '15:25' },
  '7B': { start: '15:30', end: '15:55' },
  '8A': { start: '16:00', end: '16:25' },
  '8B': { start: '16:30', end: '16:55' },
  '9A': { start: '17:00', end: '17:25' },
  '9B': { start: '17:30', end: '17:55' },
  '10A': { start: '18:00', end: '18:25' },
  '10B': { start: '18:30', end: '18:55' },
  '11A': { start: '19:00', end: '19:25' },
  '11B': { start: '19:30', end: '19:55' },
  '12A': { start: '20:00', end: '20:25' },
  '12B': { start: '20:30', end: '20:55' },
  '13A': { start: '21:00', end: '21:25' },
  '13B': { start: '21:30', end: '21:55' },
};

const dayMapping: { [key: number]: string } = {
  1: 'mon',
  2: 'tue',
  3: 'wed',
  4: 'thu',
  5: 'fri',
  6: 'sat',
  0: 'sun',
};

const getCurrentTimeSlot = () => {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  for (const slot in timeSlots) {
    const [startHour, startMinute] = timeSlots[slot].start.split(':').map(Number);
    const [endHour, endMinute] = timeSlots[slot].end.split(':').map(Number);
    const startTime = startHour * 60 + startMinute;
    const endTime = endHour * 60 + endMinute;
    if (currentTime >= startTime && currentTime < endTime) {
      return slot;
    }
  }
  return null;
};

export default function EmptyClassroomModal({ building, visible, onClose }: { building: any, visible: boolean, onClose: () => void }) {
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);

  useEffect(() => {
    if (building) {
      const day = dayMapping[new Date().getDay()];
      const timeSlot = getCurrentTimeSlot();

      if (timeSlot) {
        const buildingData = allBuildings.find(b => b.name === building.name);
        if (buildingData) {
          const allRoomsInBuilding = buildingData.rooms.map(r => r.room);
          const occupiedRooms = classSchedule
            .filter(c => c.building === building.name && c.schedule.some(s => s.day === day && s.time.includes(timeSlot)))
            .map(c => c.room);
          
          const uniqueOccupiedRooms = [...new Set(occupiedRooms)];
          const emptyRooms = allRoomsInBuilding.filter(room => !uniqueOccupiedRooms.includes(room));
          setAvailableRooms(emptyRooms);
        } else {
          setAvailableRooms([]);
        }
      } else {
        setAvailableRooms([]);
      }
    }
  }, [building]);

  if (!building) return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <ThemedText style={styles.buildingName}>{building.name}</ThemedText>
          <ThemedText style={styles.title}>현재 이용가능한 강의실</ThemedText>
          <ScrollView style={styles.scrollView}>
            {availableRooms.length > 0 ? (
              availableRooms.map(room => <ThemedText key={room} style={styles.roomText}>{room}</ThemedText>)
            ) : (
              <ThemedText>No available classrooms at the moment.</ThemedText>
            )}
          </ScrollView>
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  buildingName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  scrollView: {
    marginBottom: 20,
  },
  roomText: {
    fontSize: 16,
    marginBottom: 5,
  },
  closeButton: {
    padding: 10,
    backgroundColor: '#007AFF',
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});
