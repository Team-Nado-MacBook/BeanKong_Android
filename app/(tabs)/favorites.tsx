import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useFavorites } from '@/hooks/use-favorites';
import { getAllClassrooms, Classroom } from '@/database';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

export default function FavoritesScreen() {
  const { favorites, isLoading: favoritesLoading, removeFavorite, loadFavorites } = useFavorites();
  const [allClassrooms, setAllClassrooms] = useState<Classroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        setIsLoading(true);
        await loadFavorites();
        const classrooms = await getAllClassrooms();
        setAllClassrooms(classrooms);
        setIsLoading(false);
      };
      loadData();
    }, [loadFavorites])
  );

  const getClassroomInfo = (favorite: typeof favorites[0]) => {
    return allClassrooms.find(c => c.id === favorite.id);
  };

  const handleRemoveFavorite = async (classroomId: number) => {
    await removeFavorite(classroomId);
  };

  const favoriteClassrooms = favorites
    .map(fav => {
      const classroom = getClassroomInfo(fav);
      return classroom ? { ...classroom, favoriteId: fav.id } : null;
    })
    .filter((c): c is Classroom & { favoriteId: number } => c !== null);

  if (isLoading || favoritesLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.back()}>
            <IconSymbol name="chevron.left" size={24} color="#000000" />
          </TouchableOpacity>
          <ThemedText style={styles.headerTitle}>즐겨찾기</ThemedText>
          <View style={styles.headerRightPlaceholder} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>로딩 중...</ThemedText>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonContainer} onPress={() => router.back()}>
          <IconSymbol name="chevron.left" size={24} color="#000000" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>즐겨찾기</ThemedText>
        <View style={styles.headerRightPlaceholder} />
      </View>

      <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
        {favoriteClassrooms.length === 0 ? (
          <View style={styles.emptyContainer}>
            <IconSymbol name="heart" size={48} color="#CCCCCC" />
            <ThemedText style={styles.emptyText}>즐겨찾기한 강의실이 없습니다</ThemedText>
            <ThemedText style={styles.emptySubText}>빈 강의실 목록에서 하트 버튼을 눌러 즐겨찾기에 추가하세요</ThemedText>
          </View>
        ) : (
          favoriteClassrooms.map((classroom) => (
            <TouchableOpacity
              key={classroom.id}
              style={styles.classroomItem}
              activeOpacity={0.7}
            >
              <View style={styles.classroomInfo}>
                <ThemedText style={styles.classroomName}>
                  {`${classroom.building_name} ${classroom.room_number}`}
                </ThemedText>
              </View>
              <TouchableOpacity
                style={styles.favoriteButton}
                onPress={() => handleRemoveFavorite(classroom.id)}
              >
                <IconSymbol name="heart.fill" size={20} color="#FF3B30" />
              </TouchableOpacity>
            </TouchableOpacity>
          ))
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButtonContainer: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
  },
  headerRightPlaceholder: {
    width: 44,
    height: 44,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
    flex: 1,
    textAlign: 'center',
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  classroomItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  classroomInfo: {
    flex: 1,
  },
  classroomName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  favoriteButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666666',
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999999',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666666',
  },
});

