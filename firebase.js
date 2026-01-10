import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBLVUQ03jQbpQiEDlIxbHeoL6EwljILQcQ",
  authDomain: "autopartes-ccddf.firebaseapp.com",
  projectId: "autopartes-ccddf"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
