// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyAv7pD79Vbg2W0ub5XO71w9xk6C3mJRCHE",
    authDomain: "kyklos-20fcb.firebaseapp.com",
    projectId: "kyklos-20fcb",
    storageBucket: "kyklos-20fcb.firebasestorage.app",
    messagingSenderId: "202377060219",
    appId: "1:202377060219:web:fbe9d6abc61bf3a5ac27de",
    measurementId: "G-MHYDXMBV57"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);