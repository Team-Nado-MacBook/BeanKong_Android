import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!db) {
    db = await SQLite.openDatabaseAsync('knu-timetable.db');
  }
  return db;
}

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

const initialData = require('../assets/data/merged_buildings.json');

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
    `);

    const countResult = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM classrooms');
    const count = countResult?.count ?? 0;

    if (count === 0) {
      console.log('Database is empty, populating with initial data...');
      await db.withTransactionAsync(async () => {
        for (const building of initialData) {
          for (const room of building.rooms) {
            await db.runAsync(
              `INSERT INTO classrooms (building_name, lat, lng, room_number, mon, tue, wed, thu, fri)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
              building.name,
              building.lat,
              building.lng,
              room.room,
              JSON.stringify(room.mon || []),
              JSON.stringify(room.tue || []),
              JSON.stringify(room.wen || []),
              JSON.stringify(room.thu || []),
              JSON.stringify(room.fri || [])
            );
          }
        }
      });
      console.log('Database population complete.');
    }
  } catch (e) {
    console.error("Error during database setup:", e);
    throw e;
  }
};

export const getAllClassrooms = async (): Promise<Classroom[]> => {
  try {
    const db = await getDb();
    const allRows = await db.getAllAsync<Classroom>('SELECT * FROM classrooms;');
    return allRows;
  } catch (e) {
    console.error("Error in getAllClassrooms:", e);
    throw e;
  }
};