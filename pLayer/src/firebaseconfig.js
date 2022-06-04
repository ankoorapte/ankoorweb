// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-analytics.js";
import { getStorage, ref } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-storage.js";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyDzJylYhhlw9LVay0OUkAyMmR9vYJsXr8U",
    authDomain: "player-76353.firebaseapp.com",
    projectId: "player-76353",
    storageBucket: "player-76353.appspot.com",
    messagingSenderId: "954598460815",
    appId: "1:954598460815:web:52ae341cbaf40a1c6e8ffa",
    measurementId: "G-VK3H3Y1430"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const storage = getStorage(app);
export const storageRef = ref(storage, 'public');