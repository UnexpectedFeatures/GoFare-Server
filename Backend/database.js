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
  storageBucket: "gs://appdev-75624.firebasestorage.app",
});

const db = admin.firestore();

export default db;
export const auth = admin.auth();
export const messaging = admin.messaging();
export const bucket = admin.storage().bucket();
