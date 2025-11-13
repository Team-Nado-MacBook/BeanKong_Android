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

// Normalize building name from class_schedule.json to match merged_buildings.json
function normalizeBuildingName(fullBuilding: any): string {
  try {
    const text = typeof fullBuilding === 'string' ? fullBuilding : '';
    if (!text) return '';
    const norm = (s: string) => s.replace(/\s+/g, '').replace(/캠퍼스/g, '').toUpperCase();
    const nText = norm(text);
    // Find the longest building name whose normalized form is contained in the full text
    let best: any = null;
    for (const b of buildingData) {
      const nb = norm(b.name || '');
      if (!nb) continue;
      if (nText.includes(nb)) {
        if (!best || (best.name && nb.length > norm(best.name).length)) {
          best = b;
        }
      }
    }
    if (best && best.name) return best.name;
    // Fallback: return original string trimmed of leading campus phrases by taking last 2 tokens
    const parts = text.trim().split(/\s+/);
    if (parts.length >= 2) return parts.slice(-2).join(' ');
    return parts[parts.length - 1] || text;
  } catch {
    return typeof fullBuilding === 'string' ? fullBuilding : '';
  }
}

function normalizeRoomValue(room: string): string {
  return (room || '').toString().toUpperCase().replace(/\s+/g, '').replace(/-/g, '');
}


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
                const normalizedBuilding = normalizeBuildingName(course.building);
                await db.runAsync(
                    `INSERT OR IGNORE INTO courses (subject, class_id, building, room, schedule) VALUES (?, ?, ?, ?, ?);`,
                    course.subject, course.class_id, normalizedBuilding, course.room, JSON.stringify(course.schedule || [])
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

export const getCoursesByClassroom = async (buildingName: string, roomNumber: string): Promise<Course[]> => {
    try {
        const db = await getDb();
        // Match by building equality or containing the canonical name, and room with normalized comparison
        return await db.getAllAsync<Course>(
            `SELECT * FROM courses
             WHERE (building = ? OR building LIKE ?)
               AND (
                 room = ? OR
                 REPLACE(REPLACE(UPPER(room), '-', ''), ' ', '') = REPLACE(REPLACE(UPPER(?), '-', ''), ' ', '')
               );`,
            [buildingName, `%${buildingName}%`, roomNumber, roomNumber]
        );
    } catch (e) {
        console.error("Error in getCoursesByClassroom:", e);
        throw e;
    }
}

export const getClassroomById = async (id: number): Promise<Classroom | null> => {
    try {
        const db = await getDb();
        const result = await db.getFirstAsync<Classroom>('SELECT * FROM classrooms WHERE id = ?;', [id]);
        return result || null;
    } catch (e) {
        console.error("Error in getClassroomById:", e);
        throw e;
    }
}
