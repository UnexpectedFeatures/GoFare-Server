import admin from "firebase-admin";
import dotenv from "dotenv";
import { readFile } from "fs/promises";

dotenv.config();

const serviceAccount = JSON.parse(
  await readFile(new URL("key.json", import.meta.url))
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIREBASE_DATABASE_URL,
});

console.log("Firebase Realtime Database connected successfully!");

const db = admin.database();

export default db;
export const auth = admin.auth();
