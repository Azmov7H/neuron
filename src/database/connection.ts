/**
 * MongoDB Connection Management
 * Singleton pattern for database connection with retry logic
 */

import mongoose, { Connection } from 'mongoose';
import { config } from '@/config/env';

let cachedConnection: Connection | null = null;

interface MongoDB {
  conn: Connection | null;
  promise: Promise<Connection> | null;
}

const mongodb: MongoDB = {
  conn: null,
  promise: null,
};

export async function connectDB(): Promise<Connection> {
  if (mongodb.conn) {
    console.log('Using cached database connection');
    return mongodb.conn;
  }

  if (!mongodb.promise) {
    mongodb.promise = connectWithRetry();
  }

  mongodb.conn = await mongodb.promise;
  return mongodb.conn;
}

async function connectWithRetry(
  retries = 5,
  delay = 1000
): Promise<Connection> {
  const { mongodb: mongoConfig } = config.database;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(
        `[DB] Connection attempt ${attempt}/${retries} to ${mongoConfig.uri}`
      );

      const conn = await mongoose.connect(mongoConfig.uri, {
        dbName: mongoConfig.dbName,
        maxPoolSize: mongoConfig.maxPoolSize,
        minPoolSize: mongoConfig.minPoolSize,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        // Connection monitoring
        retryWrites: true,
        w: 'majority',
      });

      console.log('[DB] ✓ Successfully connected to MongoDB');

      // Setup connection event listeners
      conn.connection.on('disconnected', () => {
        console.warn('[DB] Connection disconnected');
      });

      conn.connection.on('error', (error) => {
        console.error('[DB] Connection error:', error.message);
      });

      return conn.connection;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`[DB] Connection attempt ${attempt} failed:`, message);

      if (attempt === retries) {
        throw new Error(
          `Failed to connect to MongoDB after ${retries} attempts: ${message}`
        );
      }

      // Exponential backoff
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw new Error('Failed to establish database connection');
}

export async function disconnectDB(): Promise<void> {
  if (mongodb.conn) {
    await mongoose.disconnect();
    mongodb.conn = null;
    mongodb.promise = null;
    console.log('[DB] Disconnected from MongoDB');
  }
}

export function getConnection(): Connection | null {
  return mongodb.conn;
}
