import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { getStorage, ref, uploadBytes } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyDzJylYhhlw9LVay0OUkAyMmR9vYJsXr8U",
  authDomain: "player-76353.firebaseapp.com",
  projectId: "player-76353",
  storageBucket: "player-76353.appspot.com",
  messagingSenderId: "954598460815",
  appId: "1:954598460815:web:52ae341cbaf40a1c6e8ffa",
  measurementId: "G-VK3H3Y1430"
};

const firebaseApp = initializeApp(firebaseConfig);
const storage = getStorage(firebaseApp);

let app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E0FFF2">
    <b-row class="m-1 p-1">
      <b-col align="center">
        <b-form-file v-model="file" class="mt-3" plain @input="onFile"></b-form-file>
        <div class="mt-3">Selected file: {{ file ? file.name : '' }}</div>
        <audio controls>
          <source :src="file" type="audio/wav">
          Your browser does not support the <code>audio</code> element.
        </audio>
        <b-button @click="upload">Upload</b-button>
      </b-col>
    </b-row>
  </b-container>
  `,
  data() {
    return {
      file: null
    }
  },
  methods: {
    async upload() {
      let uuid = uuidv4();
      let uuidRef = ref(storage, 'public/'+uuid);
      await uploadBytes(uuidRef, this.file);
      console.log('Uploaded file to ' + uuidRef._location.path_)
    },
    onFile(file) {
      console.log(file);
    }
  }
})
