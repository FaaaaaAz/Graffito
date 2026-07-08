import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  type User,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export function subscribeToAuth(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function login(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  await setDoc(
    doc(db, "usuarios", credential.user.uid),
    {
      email: credential.user.email,
      rol: "admin",
      ultimoLogin: serverTimestamp(),
    },
    { merge: true }
  );
  return credential.user;
}

export async function logout() {
  await firebaseSignOut(auth);
}

export async function changePassword(newPassword: string) {
  if (!auth.currentUser) throw new Error("No hay una sesión activa.");
  await updatePassword(auth.currentUser, newPassword);
}

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? "";
  switch (code) {
    case "auth/invalid-email":
      return "El correo electrónico no es válido.";
    case "auth/user-disabled":
      return "Esta cuenta ha sido deshabilitada.";
    case "auth/user-not-found":
    case "auth/invalid-credential":
      return "Correo o contraseña incorrectos.";
    case "auth/wrong-password":
      return "Correo o contraseña incorrectos.";
    case "auth/too-many-requests":
      return "Demasiados intentos fallidos. Intenta de nuevo más tarde.";
    case "auth/requires-recent-login":
      return "Por seguridad, vuelve a iniciar sesión antes de cambiar la contraseña.";
    default:
      return "Ocurrió un error inesperado. Intenta de nuevo.";
  }
}
