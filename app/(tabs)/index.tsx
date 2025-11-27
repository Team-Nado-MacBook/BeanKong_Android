import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useLocation } from "@/context/location-context";
import { useColorScheme } from "@/hooks/use-color-scheme";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import DurationModal from "@/components/DurationModal";
import OutletModal from "@/components/OutletModal";
import TimeModal from "@/components/TimeModal";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { Classroom, getAllClassrooms, setupDatabase } from "../../database";

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
    const startTime = parseInt(slot.start.replace(":", ""), 10);
    const endTime = parseInt(slot.end.replace(":", ""), 10);
    if (currentTime >= startTime && currentTime < endTime) {
      return slot.periods;
    }
  }
  return [];
}

function getPeriodsForTimeRange(startTime: string, duration: string): string[] {
  let startTotalMinutes: number;

  if (!startTime) {
    if (!duration) {
      return [];
    }
    // Only duration is provided, use current time as start time
    const now = new Date();
    startTotalMinutes = now.getHours() * 60 + now.getMinutes();
  } else {
    const [startHour, startMinute] = startTime.split(":").map(Number);
    startTotalMinutes = startHour * 60 + startMinute;
  }

  if (!duration) {
    // Only startTime is provided
    for (const slot of timePeriods) {
      const slotStartMinutes =
        parseInt(slot.start.split(":")[0], 10) * 60 +
        parseInt(slot.start.split(":")[1], 10);
      const slotEndMinutes =
        parseInt(slot.end.split(":")[0], 10) * 60 +
        parseInt(slot.end.split(":")[1], 10);

      if (
        startTotalMinutes >= slotStartMinutes &&
        startTotalMinutes < slotEndMinutes
      ) {
        return slot.periods;
      }
    }
    return [];
  }

  // Both startTime (or current time) and duration are provided
  let durationHours = 0;
  let durationMinutes = 0;
  if (duration.includes("h")) {
    durationHours = parseInt(duration.split("h")[0], 10);
  }
  if (duration.includes("m")) {
    const minPart = duration.includes("h") ? duration.split("h")[1] : duration;
    durationMinutes = parseInt(minPart.replace("m", ""), 10);
  }

  const durationTotalMinutes = durationHours * 60 + durationMinutes;
  const endTotalMinutes = startTotalMinutes + durationTotalMinutes;

  const periods: string[] = [];
  for (const slot of timePeriods) {
    const slotStartMinutes =
      parseInt(slot.start.split(":")[0], 10) * 60 +
      parseInt(slot.start.split(":")[1], 10);
    const slotEndMinutes =
      parseInt(slot.end.split(":")[0], 10) * 60 +
      parseInt(slot.end.split(":")[1], 10);

    if (
      startTotalMinutes < slotEndMinutes &&
      endTotalMinutes > slotStartMinutes
    ) {
      periods.push(...slot.periods);
    }
  }

  return periods;
}

const getDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
) => {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const deg2rad = (deg: number) => deg * (Math.PI / 180);

export default function HomeScreen() {
  const {
    location: userLocation,
    locationPermission,
    isLoading: isLocationLoading,
  } = useLocation();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];


  const [nearestClassroom, setNearestClassroom] = useState<any>(null);
  const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
  const [emptyClassrooms, setEmptyClassrooms] = useState<
    (Classroom & { distance?: number })[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedDuration, setSelectedDuration] = useState<string>("");
  const [selectedOutlets, setSelectedOutlets] = useState<string[]>([]);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showDurationModal, setShowDurationModal] = useState(false);
  const [showOutletModal, setShowOutletModal] = useState(false);

  const [selectedHour, setSelectedHour] = useState<number>(9);
  const [selectedMinute, setSelectedMinute] = useState<number>(0);
  const [selectedDurationHour, setSelectedDurationHour] = useState<number>(1);
  const [selectedDurationMinute, setSelectedDurationMinute] =
    useState<number>(0);

  const getFilteredEmptyClassrooms = (
    allClassrooms: Classroom[],
    selectedStartTime: string,
    selectedDuration: string,
    selectedOutlets: string[]
  ): Classroom[] => {
    const dayMapping = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const currentDayKey = dayMapping[new Date().getDay()];

    let periodsToFilter: string[] = [];
    if (selectedStartTime || selectedDuration) {
      periodsToFilter = getPeriodsForTimeRange(
        selectedStartTime,
        selectedDuration
      );
    } else {
      periodsToFilter = getCurrentPeriods();
    }

    let filteredClassrooms = allClassrooms;

    if (
      periodsToFilter.length > 0 &&
      currentDayKey &&
      ["mon", "tue", "wed", "thu", "fri"].includes(currentDayKey)
    ) {
      filteredClassrooms = filteredClassrooms.filter((classroom) => {
        const daySchedule = classroom.parsedSchedule?.[currentDayKey];
        if (!daySchedule || !Array.isArray(daySchedule)) return true;
        const isOccupied = daySchedule.some((classPeriod: string) =>
          periodsToFilter.includes(classPeriod)
        );
        return !isOccupied;
      });
    }

    if (selectedOutlets.length > 0) {
      filteredClassrooms = filteredClassrooms.filter((classroom) => {
        if (!classroom.outlets) return false;
        return selectedOutlets.every((outlet) =>
          classroom.outlets?.includes(outlet)
        );
      });
    }

    return filteredClassrooms;
  };

  const filteredEmptyClassrooms = useMemo(() => {
    return getFilteredEmptyClassrooms(
      allClassrooms,
      selectedStartTime,
      selectedDuration,
      selectedOutlets
    );
  }, [allClassrooms, selectedStartTime, selectedDuration, selectedOutlets]);

  useEffect(() => {
    if (locationPermission && userLocation) {
      const classroomsWithDistance = filteredEmptyClassrooms.map(
        (classroom) => {
          const distance = getDistance(
            userLocation.coords.latitude,
            userLocation.coords.longitude,
            classroom.lat,
            classroom.lng
          );
          return { ...classroom, distance };
        }
      );

      classroomsWithDistance.sort(
        (a, b) => (a.distance ?? 0) - (b.distance ?? 0)
      );
      setEmptyClassrooms(classroomsWithDistance);
    } else {
      const sortedClassrooms = [...filteredEmptyClassrooms].sort((a, b) =>
        a.building_name.localeCompare(b.building_name)
      );
      setEmptyClassrooms(sortedClassrooms);
    }
  }, [filteredEmptyClassrooms, locationPermission, userLocation]);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        await setupDatabase();
        const allClassroomsFromDB = await getAllClassrooms();
        const parsedClassrooms = allClassroomsFromDB.map((classroom) => {
          const parsedSchedule: { [key: string]: string[] } = {};
          const dayMapping = ["mon", "tue", "wed", "thu", "fri"];
          dayMapping.forEach((day) => {
            try {
              parsedSchedule[day] = JSON.parse(
                classroom[day as keyof Classroom] as string
              );
            } catch {
              parsedSchedule[day] = [];
            }
          });
          return { ...classroom, parsedSchedule };
        });
        setAllClassrooms(parsedClassrooms);
        setIsLoading(false);
      };
      loadData();
    }, [])
  );

  const findNearestEmptyClassroom = useCallback(() => {
    if (!locationPermission || emptyClassrooms.length === 0) {
      setNearestClassroom({
        name: locationPermission ? "근처 빈 강의실 없음" : "위치 권한 필요",
        distance: "",
      });
      return;
    }
    const nearest = emptyClassrooms[0] as Classroom & { distance: number };
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

  const handleStartTimePress = () => {
    setShowTimeModal(true);
  };
  const handleDurationPress = () => {
    setShowDurationModal(true);
  };
  const handleOutletPress = () => setShowOutletModal(true);

  const handleTimeSelect = () => {
    const timeString = `${selectedHour
      .toString()
      .padStart(2, "0")}:${selectedMinute.toString().padStart(2, "0")}`;
    setSelectedStartTime(timeString);
    setShowTimeModal(false);
    setShowDurationModal(true);
  };

  const handleDurationSelect = () => {
    let durationString = "";
    if (selectedDurationHour > 0 && selectedDurationMinute > 0) {
      durationString = `${selectedDurationHour}h ${selectedDurationMinute}m`;
    } else if (selectedDurationHour > 0) {
      durationString = `${selectedDurationHour}h`;
    } else if (selectedDurationMinute > 0) {
      durationString = `${selectedDurationMinute}m`;
    }
    setSelectedDuration(durationString);
    setShowDurationModal(false);
    setShowOutletModal(true);
  };

  const handleOutletSelect = (outlet: string) => {
    if (outlet === "상관없음") {
      setSelectedOutlets([]);
      setShowOutletModal(false);
    } else {
      if (selectedOutlets.includes(outlet)) {
        setSelectedOutlets(selectedOutlets.filter((item) => item !== outlet));
      } else {
        const newOutlets = [...selectedOutlets, outlet];
        setSelectedOutlets(newOutlets);
        // 예: 벽/바닥 둘 다 선택되면 닫기
        if (newOutlets.includes("벽면") && newOutlets.includes("바닥")) {
          setShowOutletModal(false);
        }
      }
    }
  };

  const handleMapPress = () => router.push("/map");
  const handleFavoritesPress = () => router.push("/(tabs)/favorites");
  const handleClassroomPress = useCallback((classroom: any) => {
    console.log("강의실 선택:", classroom.building_name, classroom.room_number);
  }, []);
  const handleDetailPress = useCallback((classroom: Classroom) => {
    router.push(`/classroom-detail?id=${classroom.id}`);
  }, []);



  const outletOptions = ["벽면", "바닥", "상관없음"];

  const renderClassroom = useCallback(
    ({ item }: { item: Classroom }) => {
      return (
        <TouchableOpacity
          key={item.id}
          style={styles.classroomItem}
          onPress={() => handleClassroomPress(item)}
          activeOpacity={0.7}
        >
          <View style={styles.classroomInfo}>
            <View style={styles.classroomNameRow}>
              <ThemedText style={styles.classroomName}>
                {`${item.building_name} ${item.room_number}`}
              </ThemedText>
            </View>
          </View>
          <View style={styles.classroomActions}>
            <TouchableOpacity
              style={styles.detailButton}
              onPress={() => handleDetailPress(item)}
            >
              <ThemedText style={styles.detailButtonText}>
                상세정보 &gt;
              </ThemedText>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      );
    },
    [handleClassroomPress, handleDetailPress]
  );

  const finalIsLoading = isLoading || isLocationLoading;

  return (
    <View style={[styles.container, { backgroundColor: "#FFFFFF" }]}>
      <ScrollView>
        <View style={styles.header}>
          <ThemedText style={styles.title}>BeanKong</ThemedText>
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleFavoritesPress}
            >
              <IconSymbol name="star" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.twoBoxesContainer}>
          <View style={styles.box}>

            <ThemedText style={styles.boxTitle}>인기 강의실</ThemedText>
            <ThemedText style={styles.boxText}>
              산격동 캠퍼스 IT대학5호관(IT융복합관) 434
            </ThemedText>
          </View>
          <View style={styles.box}>
            <ThemedText style={styles.boxTitle}>가까운 빈 강의실</ThemedText>
            {nearestClassroom ? (
              <>
                <ThemedText style={styles.boxText}>
                  {nearestClassroom.name}
                </ThemedText>
                <ThemedText style={styles.boxSubText}>
                  {nearestClassroom.distance}
                </ThemedText>
              </>
            ) : (
              <ThemedText style={styles.boxText}>불러오는 중...</ThemedText>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>빈 강의실</ThemedText>
          </View>
          <View style={styles.filterContainer}>
            <View style={styles.sortIcon}>
              <IconSymbol
                name="arrow.up.arrow.down"
                size={16}
                color="#666666"
              />
            </View>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleStartTimePress}
            >
              <IconSymbol name="clock" size={16} color="#666666" />
              <ThemedText
                style={[
                  styles.filterButtonText,
                  selectedStartTime && styles.selectedFilterText,
                ]}
              >
                {selectedStartTime || "시작 시간"}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleDurationPress}
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  selectedDuration && styles.selectedFilterText,
                ]}
              >
                {selectedDuration || "사용 시간"}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.filterButton}
              onPress={handleOutletPress}
            >
              <ThemedText
                style={[
                  styles.filterButtonText,
                  selectedOutlets.length > 0 && styles.selectedFilterText,
                ]}
              >
                {selectedOutlets.length > 0
                  ? selectedOutlets.join(", ")
                  : "콘센트"}
              </ThemedText>
            </TouchableOpacity>
          </View>

          {finalIsLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
              <ThemedText style={styles.loadingText}>
                빈 강의실을 찾는 중...
              </ThemedText>
            </View>
          ) : (
            <View>
              {emptyClassrooms.map((item) => renderClassroom({ item }))}
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.floatingNavigation}>
        <TouchableOpacity
          style={[styles.floatingButton, styles.activeFloatingButton]}
          onPress={handleFavoritesPress}
        >
          <IconSymbol name="heart.fill" size={20} color="#FFFFFF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={handleMapPress}
        >
          <IconSymbol name="map" size={20} color="#666666" />
        </TouchableOpacity>
      </View>

      <TimeModal
        visible={showTimeModal}
        onClose={() => setShowTimeModal(false)}
        onSelect={handleTimeSelect}
        selectedHour={selectedHour}
        selectedMinute={selectedMinute}
        setSelectedHour={setSelectedHour}
        setSelectedMinute={setSelectedMinute}
      />

      <DurationModal
        visible={showDurationModal}
        onClose={() => setShowDurationModal(false)}
        onSelect={handleDurationSelect}
        selectedDurationHour={selectedDurationHour}
        selectedDurationMinute={selectedDurationMinute}
        setSelectedDurationHour={setSelectedDurationHour}
        setSelectedDurationMinute={setSelectedDurationMinute}
      />

      <OutletModal
        visible={showOutletModal}
        onClose={() => setShowOutletModal(false)}
        onSelect={handleOutletSelect}
        selectedOutlets={selectedOutlets}
        outletOptions={outletOptions}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 45,
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000000",
    paddingBottom: 1,
  },
  headerButtons: {
    flexDirection: "row",
  },
  menuButton: { padding: 8 },
  timetableCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  timetableText: { fontSize: 16, color: "#666666", marginTop: 12 },
  timetableIconContainer: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  exclamationIcon: { position: "absolute", top: -4, right: -4 },
  twoBoxesContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginHorizontal: 20,
    marginBottom: 30,
  },
  box: {
    backgroundColor: "#FFFFFF",
    width: "48%",
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E5E5",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  boxTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 10,
  },
  boxText: { fontSize: 14, color: "#333333" },
  boxSubText: { fontSize: 12, color: "#999999", marginTop: 5 },
  section: { flex: 1, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 18, fontWeight: "600", color: "#000000" },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  refreshButtonText: { fontSize: 14, color: "#666666" },
  filterContainer: {
    flexDirection: "row",
    marginBottom: 20,
    gap: 8,
  },
  sortIcon: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
    gap: 2,
  },
  filterButton: {
    flex: 1,
    height: 40,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    flexDirection: "row",
    gap: 4,
  },
  filterButtonText: { fontSize: 14, color: "#666666" },
  selectedFilterText: { color: "#007AFF", fontWeight: "500" },
  classroomList: { flex: 1 },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666666" },
  classroomItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  classroomInfo: { flex: 1 },
  classroomNameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  classroomName: { fontSize: 16, fontWeight: "600", color: "#000000" },
  classroomDistance: { fontSize: 14, color: "#666666" },
  classroomActions: { flexDirection: "row", alignItems: "center" },
  favoriteButton: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginRight: 8,
  },
  detailButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
  },
  detailButtonText: { fontSize: 14, color: "#666666" },
  floatingNavigation: {
    position: "absolute",
    bottom: 70,
    left: 20,
    flexDirection: "row",
    gap: 8,
  },
  floatingButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    borderWidth: 1,
    borderColor: "#E5E5E5",
  },
  activeFloatingButton: { backgroundColor: "#007AFF" },
});