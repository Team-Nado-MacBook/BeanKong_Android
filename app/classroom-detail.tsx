import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Classroom, getClassroomById, setupDatabase } from "@/database";
import { useFavorites } from "@/hooks/use-favorites";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const buildingsData = require("../assets/data/merged_buildings.json");
const courseJson = require("../assets/data/class_schedule.json");

interface ScheduleItemFromJson {
  day: string;
  time: string[];
}

interface CourseFromJson {
  subject: string;
  class_id: string;
  building: string;
  room: string;
  schedule: ScheduleItemFromJson[] | string;
}

const timeSlots: { [key: string]: { start: string; end: string } } = {
  "0": { start: "08:00", end: "08:55" },
  "1A": { start: "09:00", end: "09:35" },
  "1B": { start: "09:30", end: "10:00" },
  "2A": { start: "10:00", end: "10:30" },
  "2B": { start: "10:30", end: "11:00" },
  "3A": { start: "11:00", end: "11:30" },
  "3B": { start: "11:30", end: "12:00" },
  "4A": { start: "12:00", end: "12:30" },
  "4B": { start: "12:30", end: "13:00" },
  "5A": { start: "13:00", end: "13:30" },
  "5B": { start: "13:30", end: "14:00" },
  "6A": { start: "14:00", end: "14:30" },
  "6B": { start: "14:30", end: "15:00" },
  "7A": { start: "15:00", end: "15:30" },
  "7B": { start: "15:30", end: "16:00" },
  "8A": { start: "16:00", end: "16:30" },
  "8B": { start: "16:30", end: "17:00" },
  "9A": { start: "17:00", end: "17:30" },
  "9B": { start: "17:30", end: "18:00" },
  "10A": { start: "18:00", end: "18:30" },
  "10B": { start: "18:30", end: "19:00" },
  "11A": { start: "19:00", end: "19:30" },
  "11B": { start: "19:30", end: "20:00" },
  "12A": { start: "20:00", end: "20:30" },
  "12B": { start: "20:30", end: "21:00" },
  "13A": { start: "21:00", end: "21:30" },
  "13B": { start: "21:30", end: "22:00" },
};

const BLUE_PALETTE = [
  "#4F8EF7",
  "#3E7BD9",
  "#2F6AC2",
  "#2254A4",
  "#1B3F80",
  "#6AA8FF",
  "#9CC4FF",
  "#7B9FFF",
];

const getCourseColor = (course: CourseFromJson) => {
  const key = course.class_id || course.subject || "";
  let hash = 0;

  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }

  const index = Math.abs(hash) % BLUE_PALETTE.length;
  return BLUE_PALETTE[index];
};

const days = ["mon", "tue", "wed", "thu", "fri"];
const dayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri"];

const DEFAULT_START_HOUR = 9;
const DEFAULT_END_HOUR = 18;
const BASE_GRID_HEIGHT = 600;
const BASE_MINUTES = (DEFAULT_END_HOUR - DEFAULT_START_HOUR) * 60; // 540분

const timeOrder = [
  "0",
  "1A",
  "1B",
  "2A",
  "2B",
  "3A",
  "3B",
  "4A",
  "4B",
  "5A",
  "5B",
  "6A",
  "6B",
  "7A",
  "7B",
  "8A",
  "8B",
  "9A",
  "9B",
  "10A",
  "10B",
  "11A",
  "11B",
  "12A",
  "12B",
  "13A",
  "13B",
  "14A",
];

const normalizeDay = (day: string): string => (day === "wen" ? "wed" : day);

const norm = (s: any) =>
  (s ?? "").toString().toUpperCase().replace(/\s+/g, "").replace(/-/g, "");

const groupContinuous = (slots: string[]): string[][] => {
  if (!Array.isArray(slots) || slots.length === 0) return [];
  const sorted = [...new Set(slots)].sort(
    (a, b) => timeOrder.indexOf(a) - timeOrder.indexOf(b)
  );
  const groups: string[][] = [];
  let current: string[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const slot = sorted[i];
    if (current.length === 0) {
      current.push(slot);
      continue;
    }
    const prev = current[current.length - 1];
    const prevIdx = timeOrder.indexOf(prev);
    const slotIdx = timeOrder.indexOf(slot);
    if (slotIdx === prevIdx + 1) {
      current.push(slot);
    } else {
      groups.push(current);
      current = [slot];
    }
  }
  if (current.length) groups.push(current);
  return groups;
};

interface CourseBlock {
  day: string;
  slots: string[];
  course: CourseFromJson;
}

const parseSchedule = (
  rawSchedule: ScheduleItemFromJson[] | string
): ScheduleItemFromJson[] => {
  if (Array.isArray(rawSchedule)) return rawSchedule;
  if (typeof rawSchedule === "string") {
    try {
      const parsed = JSON.parse(rawSchedule);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const buildBlocksForDay = (
  day: string,
  courses: CourseFromJson[]
): CourseBlock[] => {
  const d = normalizeDay(day);
  const blocks: CourseBlock[] = [];

  for (const c of courses || []) {
    const sched = parseSchedule(c.schedule);

    for (const s of sched) {
      const sDay = normalizeDay(s.day);
      if (sDay !== d) continue;

      const timeArr = Array.isArray(s.time) ? s.time : [];
      const groups = groupContinuous(timeArr);

      groups.forEach((g) => {
        if (g.length > 0) {
          blocks.push({
            day: d,
            slots: g,
            course: c,
          });
        }
      });
    }
  }
  return blocks;
};

const getTimePosition = (
  timeSlot: string,
  startHour: number,
  totalMinutes: number
): number => {
  const slot = timeSlots[timeSlot];
  if (!slot) return 0;
  const [hour, minute] = slot.start.split(":").map(Number);
  const minutesFromStart = (hour - startHour) * 60 + minute;
  const ratio = minutesFromStart / totalMinutes;
  return ratio * (BASE_GRID_HEIGHT * (totalMinutes / BASE_MINUTES));
};

const getTimeHeight = (
  slotArray: string[],
  startHour: number,
  totalMinutes: number
): number => {
  if (slotArray.length === 0) return 30;
  const firstSlot = slotArray[0];
  const lastSlot = slotArray[slotArray.length - 1];
  const first = timeSlots[firstSlot];
  const last = timeSlots[lastSlot];
  if (!first || !last) return 30;

  const [startHourSlot, startMin] = first.start.split(":").map(Number);
  const [endHourSlot, endMin] = last.end.split(":").map(Number);

  const startMinutes = (startHourSlot - startHour) * 60 + startMin;
  const endMinutes = (endHourSlot - startHour) * 60 + endMin;
  const durationMinutes = endMinutes - startMinutes;

  const totalHeight = BASE_GRID_HEIGHT * (totalMinutes / BASE_MINUTES);
  return Math.max((durationMinutes / totalMinutes) * totalHeight, 30);
};

export default function ClassroomDetailScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const classroomId = params.id ? parseInt(params.id, 10) : null;

  const [classroom, setClassroom] = useState<Classroom | null>(null);
  const [roomSchedule, setRoomSchedule] = useState<{ [key: string]: string[] }>(
    {}
  );
  const [roomCourses, setRoomCourses] = useState<CourseFromJson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toggleFavorite, isFavorite } = useFavorites();

  const [gridStartHour, setGridStartHour] = useState(DEFAULT_START_HOUR);
  const [gridEndHour, setGridEndHour] = useState(DEFAULT_END_HOUR);

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId]);

  const loadData = async () => {
    if (!classroomId) return;

    try {
      setIsLoading(true);
      await setupDatabase();
      const classroomData = await getClassroomById(classroomId);

      if (!classroomData) return;

      setClassroom(classroomData);

      let canonicalBuildingName = classroomData.building_name;
      let canonicalRoomNumber = classroomData.room_number;

      try {
        const building = (buildingsData as any[]).find(
          (b: any) => norm(b.name) === norm(classroomData.building_name)
        );

        const room = building?.rooms?.find(
          (r: any) => norm(r.room) === norm(classroomData.room_number)
        );

        if (building?.name) canonicalBuildingName = building.name;
        if (room?.room) canonicalRoomNumber = room.room;

        const scheduleByDay: { [key: string]: string[] } = {
          mon: room?.mon || [],
          tue: room?.tue || [],
          wed: room?.wen || room?.wed || [],
          thu: room?.thu || [],
          fri: room?.fri || [],
        };
        setRoomSchedule(scheduleByDay);

        const usedSlots = new Set<string>();
        Object.values(scheduleByDay).forEach((arr) =>
          (arr || []).forEach((s) => usedSlots.add(s))
        );

        let minHour = DEFAULT_START_HOUR;
        let maxHour = DEFAULT_END_HOUR;

        usedSlots.forEach((code) => {
          const slot = timeSlots[code];
          if (!slot) return;
          const [sh] = slot.start.split(":").map(Number);
          const [eh] = slot.end.split(":").map(Number);
          if (sh < minHour) minHour = sh;
          if (eh > maxHour) maxHour = eh;
        });

        setGridStartHour(minHour);
        setGridEndHour(maxHour);

        console.log("canonical building/room from merged_buildings:", {
          canonicalBuildingName,
          canonicalRoomNumber,
          minHour,
          maxHour,
        });
      } catch (e) {
        console.error(
          "Failed to load room schedule from merged_buildings.json",
          e
        );
      }

      try {
        let filteredCourses: CourseFromJson[] = (courseJson as any[]).filter(
          (c: any) => {
            if (typeof c.building !== "string") return false;

            const buildMatch =
              norm(c.building).includes(norm(canonicalBuildingName)) ||
              norm(canonicalBuildingName).includes(norm(c.building));

            const roomMatch =
              norm(c.room) === norm(canonicalRoomNumber) ||
              c.room === canonicalRoomNumber;

            return buildMatch && roomMatch;
          }
        );

        if (filteredCourses.length === 0) {
          filteredCourses = (courseJson as any[]).filter(
            (c: any) =>
              norm(c.room) === norm(canonicalRoomNumber) ||
              c.room === canonicalRoomNumber
          );
        }

        setRoomCourses(filteredCourses);
        console.log(
          "Parsed courses from JSON (by canonical room):",
          filteredCourses
        );
      } catch (e) {
        console.error("Failed to filter courses from class_schedule.json", e);
      }
    } catch (error) {
      console.error("Error loading classroom data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFavoritePress = async () => {
    if (classroom) {
      await toggleFavorite(classroom);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#000000" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>강의실 상세정보</ThemedText>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>로딩중...</ThemedText>
        </View>
      </View>
    );
  }

  if (!classroom) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <IconSymbol name="chevron.left" size={24} color="#000000" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>강의실 상세정보</ThemedText>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>
            강의실 정보를 찾을 수 없습니다.
          </ThemedText>
        </View>
      </View>
    );
  }

  const favorite = isFavorite(classroom.id);

  const totalMinutes = (gridEndHour - gridStartHour) * 60;
  const gridHeight = BASE_GRID_HEIGHT * (totalMinutes / BASE_MINUTES);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <IconSymbol name="chevron.left" size={24} color="#000000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>강의실 상세정보</ThemedText>
        <TouchableOpacity
          style={styles.favoriteHeaderButton}
          onPress={handleFavoritePress}
        >
          <IconSymbol
            name={favorite ? "heart.fill" : "heart"}
            size={24}
            color={favorite ? "#FF3B30" : "#666666"}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>시간표</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            {`${classroom.building_name} ${classroom.room_number}`}
          </ThemedText>

          <View style={styles.timetableContainer}>
            <View style={styles.dayHeader}>
              <View style={styles.timeColumn} />
              {dayLabels.map((day) => (
                <View key={day} style={styles.dayColumn}>
                  <ThemedText style={styles.dayText}>{day}</ThemedText>
                </View>
              ))}
            </View>

            <View style={[styles.gridContainer, { height: gridHeight }]}>
              <View style={styles.timeLabels}>
                {Array.from(
                  { length: gridEndHour - gridStartHour + 1 },
                  (_, i) => i + gridStartHour
                ).map((hour) => (
                  <View key={hour} style={styles.timeLabel}>
                    <ThemedText style={styles.timeText}>
                      {hour.toString().padStart(2, "0")}:00
                    </ThemedText>
                  </View>
                ))}
              </View>

              {days.map((day) => (
                <View key={day} style={styles.dayColumn}>
                  {Array.from(
                    { length: gridEndHour - gridStartHour },
                    (_, i) => i + gridStartHour + 1
                  ).map((hour) => {
                    const minutesFromStart = (hour - gridStartHour) * 60;
                    const top =
                      (minutesFromStart / totalMinutes) * gridHeight || 0;
                    return (
                      <View
                        key={`line-${day}-${hour}`}
                        style={[styles.hourLineVertical, { top }]}
                      />
                    );
                  })}

                  {(() => {
                    const blocks = buildBlocksForDay(day, roomCourses);

                    return blocks.map((block, idx) => {
                      const top = getTimePosition(
                        block.slots[0],
                        gridStartHour,
                        totalMinutes
                      );
                      const height = getTimeHeight(
                        block.slots,
                        gridStartHour,
                        totalMinutes
                      );
                      const course = block.course;

                      return (
                        <View
                          key={`block-${day}-${idx}`}
                          style={[
                            styles.classBlock,
                            {
                              backgroundColor: getCourseColor(course),
                              top,
                              height: Math.max(height, 30),
                            },
                          ]}
                        >
                          <ThemedText
                            style={styles.className}
                            numberOfLines={2}
                          >
                            {course.subject}
                          </ThemedText>
                          <ThemedText style={styles.classId} numberOfLines={1}>
                            {course.class_id}
                          </ThemedText>
                        </View>
                      );
                    });
                  })()}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <ThemedText style={styles.sectionTitle}>강의실 정보</ThemedText>
          <ThemedText style={styles.sectionSubtitle}>
            {`${classroom.building_name} ${classroom.room_number}`}
          </ThemedText>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>위치</ThemedText>
              <ThemedText style={styles.infoValue}>
                {classroom.building_name} {classroom.room_number}
              </ThemedText>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>수용인원</ThemedText>
              <ThemedText style={styles.infoValue}>정보 없음</ThemedText>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>콘센트</ThemedText>
              <ThemedText style={styles.infoValue}>정보 없음</ThemedText>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  backButton: {
    padding: 8,
    minWidth: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000000",
    flex: 1,
    textAlign: "center",
  },
  favoriteHeaderButton: {
    padding: 8,
    minWidth: 40,
    alignItems: "flex-end",
  },
  headerRightPlaceholder: {
    width: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666666",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: "#666666",
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginTop: 24,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: "#666666",
    marginTop: 2,
    marginBottom: 8,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    padding: 15,
    paddingTop: 5,
    paddingBottom: 5,
    marginBottom: 13,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  infoLabel: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#000000",
    flex: 1,
    textAlign: "right",
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#E5E5E5",
    marginVertical: 0,
  },
  timetableContainer: {
    marginTop: 8,
    marginBottom: 20,
  },
  dayHeader: {
    flexDirection: "row",
    marginBottom: 10,
  },
  timeColumn: {
    width: 60,
  },
  dayColumn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#666666",
  },
  gridContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: 8,
    overflow: "hidden",
  },
  timeLabels: {
    width: 60,
    borderRightWidth: 1,
    borderRightColor: "#E5E5E5",
  },
  timeLabel: {
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
    position: "relative",
  },
  timeText: {
    fontSize: 12,
    color: "#666666",
  },
  hourLineVertical: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "#E5E5E5",
    zIndex: 0,
  },
  classBlock: {
    position: "absolute",
    left: 2,
    right: 2,
    paddingHorizontal: 4,
    paddingVertical: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  className: {
    fontSize: 10,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 2,
  },
  classId: {
    fontSize: 8,
    color: "#FFFFFF",
    textAlign: "center",
    opacity: 0.9,
  },
});
