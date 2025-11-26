import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import {
  FlatList,
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface DurationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: () => void;
  selectedDurationHour: number;
  selectedDurationMinute: number;
  setSelectedDurationHour: (hour: number) => void;
  setSelectedDurationMinute: (minute: number) => void;
}

const DurationModal = ({
  visible,
  onClose,
  onSelect,
  selectedDurationHour,
  selectedDurationMinute,
  setSelectedDurationHour,
  setSelectedDurationMinute,
}: DurationModalProps) => {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <ThemedText style={styles.modalTitle}>사용 시간 선택</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <View style={styles.dialContainer}>
            <View style={styles.dialColumn}>
              <ThemedText style={styles.dialLabel}>시간</ThemedText>
              <FlatList
                style={styles.dialScroll}
                showsVerticalScrollIndicator={false}
                data={Array.from({ length: 8 }, (_, i) => i + 1)}
                renderItem={({ item: hour }) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.dialItem,
                      selectedDurationHour === hour &&
                        styles.selectedDialItem,
                    ]}
                    onPress={() => setSelectedDurationHour(hour)}
                  >
                    <ThemedText
                      style={[
                        styles.dialItemText,
                        selectedDurationHour === hour &&
                          styles.selectedDialItemText,
                      ]}
                    >
                      {hour}h
                    </ThemedText>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.toString()}
              />
            </View>
            <View style={styles.dialColumn}>
              <ThemedText style={styles.dialLabel}>분</ThemedText>
              <FlatList
                style={styles.dialScroll}
                showsVerticalScrollIndicator={false}
                data={Array.from({ length: 6 }, (_, i) => i * 10)}
                renderItem={({ item: minute }) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.dialItem,
                      selectedDurationMinute === minute &&
                        styles.selectedDialItem,
                    ]}
                    onPress={() => setSelectedDurationMinute(minute)}
                  >
                    <ThemedText
                      style={[
                        styles.dialItemText,
                        selectedDurationMinute === minute &&
                          styles.selectedDialItemText,
                      ]}
                    >
                      {minute}m
                    </ThemedText>
                  </TouchableOpacity>
                )}
                keyExtractor={(item) => item.toString()}
              />
            </View>
          </View>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={onSelect}
          >
            <ThemedText style={styles.confirmButtonText}>확인</ThemedText>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5E5",
  },
  modalTitle: { fontSize: 18, fontWeight: "600", color: "#000000" },
  dialContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 20,
  },
  dialColumn: { flex: 1, alignItems: "center" },
  dialLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 12,
  },
  dialScroll: { height: 200, width: "100%" },
  dialItem: {
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginVertical: 2,
    borderRadius: 8,
  },
  selectedDialItem: { backgroundColor: "#F0F8FF" },
  dialItemText: { fontSize: 18, color: "#666666" },
  selectedDialItemText: {
    color: "#007AFF",
    fontWeight: "600",
  },
  confirmButton: {
    backgroundColor: "#007AFF",
    marginHorizontal: 20,
    marginBottom: 20,
    height: 50,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
});

export default React.memo(DurationModal);
