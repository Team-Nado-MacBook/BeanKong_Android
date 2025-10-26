import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('knu-timetable.db');
  }
  return db;
}

// --- INTERFACES ---
export interface Classroom {
  id: number;
  building_name: string;
  lat: number;
  lng: number;
  room_number: string;
  mon: string;
  tue: string;
  wed: string;
  thu: string;
  fri: string;
}

export interface Course {
    id?: number;
    subject: string;
    class_id: string;
    building: string;
    room: string;
    schedule: string; // JSON string of schedule array
}


// --- DATA LOADING ---
const buildingData = require('../assets/data/merged_buildings.json');
const courseData = require('../assets/data/class_schedule.json');


// --- DATABASE SETUP ---
export const setupDatabase = async () => {
  try {
    const db = await getDb();
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS classrooms (
        id INTEGER PRIMARY KEY NOT NULL,
        building_name TEXT NOT NULL,
        lat REAL NOT NULL,
        lng REAL NOT NULL,
        room_number TEXT NOT NULL,
        mon TEXT,
        tue TEXT,
        wed TEXT,
        thu TEXT,
        fri TEXT,
        UNIQUE(building_name, room_number)
      );

      CREATE TABLE IF NOT EXISTS courses (
        id INTEGER PRIMARY KEY NOT NULL,
        subject TEXT NOT NULL,
        class_id TEXT NOT NULL UNIQUE,
        building TEXT,
        room TEXT,
        schedule TEXT
      );
    `);

    // Populate classrooms table
    const classroomCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM classrooms');
    if (classroomCount?.count === 0) {
      console.log('Classrooms table is empty, populating...');
      await db.withTransactionAsync(async () => {
        for (const building of buildingData) {
          for (const room of building.rooms) {
            await db.runAsync(
              `INSERT INTO classrooms (building_name, lat, lng, room_number, mon, tue, wed, thu, fri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              building.name, building.lat, building.lng, room.room,
              JSON.stringify(room.mon || []),
              JSON.stringify(room.tue || []),
              JSON.stringify(room.wen || []),
              JSON.stringify(room.thu || []),
              JSON.stringify(room.fri || [])
            );
          }
        }
      });
    }

    // Populate courses table
    const courseCount = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM courses');
    if (courseCount?.count === 0) {
        console.log('Courses table is empty, populating...');
        await db.withTransactionAsync(async () => {
            for (const course of courseData) {
                await db.runAsync(
                    `INSERT OR IGNORE INTO courses (subject, class_id, building, room, schedule) VALUES (?, ?, ?, ?, ?);`,
                    course.subject, course.class_id, course.building, course.room, JSON.stringify(course.schedule || [])
                );
            }
        });
    }

  } catch (e) {
    console.error("Error during database setup:", e);
    throw e;
  }
};


// --- QUERY FUNCTIONS ---

export const getAllClassrooms = async (): Promise<Classroom[]> => {
  try {
    const db = await getDb();
    return await db.getAllAsync<Classroom>('SELECT * FROM classrooms;');
  } catch (e) {
    console.error("Error in getAllClassrooms:", e);
    throw e;
  }
};

export const searchCourses = async (query: string): Promise<Course[]> => {
    try {
        const db = await getDb();
        if (!query.trim()) {
            // Return a small subset if query is empty, not all courses
            return await db.getAllAsync<Course>('SELECT * FROM courses LIMIT 20;');
        }
        const searchTerm = `%${query}%`;
        return await db.getAllAsync<Course>(
            'SELECT * FROM courses WHERE subject LIKE ? OR class_id LIKE ? LIMIT 50;',
            [searchTerm, searchTerm]
        );
    } catch (e) {
        console.error("Error in searchCourses:", e);
        throw e;
    }
}
