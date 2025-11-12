import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Classroom } from '@/database';

const FAVORITES_KEY = 'favorite_classrooms';

export interface FavoriteClassroom {
  building_name: string;
  room_number: string;
  id: number;
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteClassroom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadFavorites = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const saveFavorites = useCallback(async (newFavorites: FavoriteClassroom[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      setFavorites(newFavorites);
    } catch (error) {
      console.error('Error saving favorites:', error);
    }
  }, []);

  const addFavorite = useCallback(async (classroom: Classroom) => {
    const favorite: FavoriteClassroom = {
      id: classroom.id,
      building_name: classroom.building_name,
      room_number: classroom.room_number,
    };
    const newFavorites = [...favorites, favorite];
    await saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  const removeFavorite = useCallback(async (classroomId: number) => {
    const newFavorites = favorites.filter(fav => fav.id !== classroomId);
    await saveFavorites(newFavorites);
  }, [favorites, saveFavorites]);

  const toggleFavorite = useCallback(async (classroom: Classroom) => {
    const isFavorite = favorites.some(fav => fav.id === classroom.id);
    if (isFavorite) {
      await removeFavorite(classroom.id);
    } else {
      await addFavorite(classroom);
    }
  }, [favorites, addFavorite, removeFavorite]);

  const isFavorite = useCallback((classroomId: number) => {
    return favorites.some(fav => fav.id === classroomId);
  }, [favorites]);

  return {
    favorites,
    isLoading,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    loadFavorites,
  };
}

