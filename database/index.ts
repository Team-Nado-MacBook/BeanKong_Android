import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

function getDb(): SQLite.SQLiteDatabase {
  if (!db) {
    // Note: Using the synchronous API
    db = SQLite.openDatabaseSync('knu-timetable.db');
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

export const setupDatabase = () => {
  try {
    const db = getDb();
    db.execSync(`
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

    const countResult = db.getAllSync<{ count: number }>('SELECT COUNT(*) as count FROM classrooms;');
    if (countResult[0].count === 0) {
      console.log('Database is empty, populating with initial data...');
      db.withTransactionSync(() => {
        const insertStmt = db.prepareSync(
          'INSERT INTO classrooms (building_name, lat, lng, room_number, mon, tue, wed, thu, fri) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
        );
        for (const building of initialData) {
          for (const room of building.rooms) {
            insertStmt.executeSync([
              building.name,
              building.lat,
              building.lng,
              room.room,
              JSON.stringify(room.mon || []),
              JSON.stringify(room.tue || []),
              JSON.stringify(room.wen || []),
              JSON.stringify(room.thu || []),
              JSON.stringify(room.fri || [])
            ]);
          }
        }
      });
    }
  } catch (e) {
    console.error("Error during database setup:", e);
    throw e;
  }
};

export const getAllClassrooms = (): Classroom[] => {
  try {
    const db = getDb();
    const allRows = db.getAllSync<Classroom>('SELECT * FROM classrooms;');
    return allRows;
  } catch (e) {
    console.error("Error in getAllClassrooms:", e);
    throw e;
  }
};