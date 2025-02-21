import { getFirestore, collection, addDoc } from "firebase/firestore"; 

const db = getFirestore();

export async function logUserAction(userId: string, action: string, details: string) {
  try {
    await addDoc(collection(db, "userActions"), {
      userId,
      action,
      details,
      timestamp: new Date(),
    });
    console.log("User action logged:", action);
  } catch (e) {
    console.error("Error logging user action:", e);
  }
} 