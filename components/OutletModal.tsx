import { ThemedText } from "@/components/themed-text";
import { IconSymbol } from "@/components/ui/icon-symbol";
import React from "react";
import {
  Modal,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface OutletModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (outlet: string) => void;
  selectedOutlets: string[];
  outletOptions: string[];
}

const OutletModal = ({
  visible,
  onClose,
  onSelect,
  selectedOutlets,
  outletOptions,
}: OutletModalProps) => {
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
            <ThemedText style={styles.modalTitle}>콘센트 선택</ThemedText>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol name="xmark" size={24} color="#666666" />
            </TouchableOpacity>
          </View>
          <View style={styles.modalList}>
            {outletOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.modalItem,
                  selectedOutlets.includes(option) && styles.selectedItem,
                ]}
                onPress={() => onSelect(option)}
              >
                <ThemedText
                  style={[
                    styles.modalItemText,
                    selectedOutlets.includes(option) &&
                      styles.selectedItemText,
                  ]}
                >
                  {option}
                </ThemedText>
                {selectedOutlets.includes(option) && (
                  <IconSymbol name="checkmark" size={20} color="#007AFF" />
                )}
              </TouchableOpacity>
            ))}
          </View>
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
  modalList: { paddingVertical: 8 },
  modalItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F5F5F5",
  },
  selectedItem: { backgroundColor: "#F0F8FF" },
  modalItemText: { fontSize: 16, color: "#000000" },
  selectedItemText: { color: "#007AFF", fontWeight: "500" },
});

export default React.memo(OutletModal);
