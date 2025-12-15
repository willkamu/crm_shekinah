// firebase/firebase.js

// Importar las funciones necesarias
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Si usas Analytics, mantén esta línea:
import { getAnalytics } from "firebase/analytics"; 


// Tu configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyC6BfJxvBMf1umb2tt6nF7fcPpM8edr1X0",
    authDomain: "gen-lang-client-0464179610.firebaseapp.com",
    projectId: "gen-lang-client-0464179610",
    storageBucket: "gen-lang-client-0464179610.firebasestorage.app",
    messagingSenderId: "806420862916",
    appId: "1:806420862916:web:06848063253c585569f691",
    measurementId: "G-0FY48NQTWZ"
};

// 1. Inicializar la aplicación
const app = initializeApp(firebaseConfig);

// 2. Exportar los servicios que usaremos en la aplicación:
export const auth = getAuth(app);      // Para la autenticación (login, registro)
export const db = getFirestore(app);   // Para la base de datos Firestore (miembros, datos)

// 3. Inicializar Analytics (si lo deseas)
const analytics = getAnalytics(app); 

export default app;