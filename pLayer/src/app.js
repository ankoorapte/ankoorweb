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
  <b-container style="background-color:#E1F3F6">
    <h1 align="center"><b>pLayer<b></h1>
    <h5 align="center">social music networking</h5>
    <b-card bg-variant="light" no-body class="m-4">
      <b-tabs pills card vertical end v-model="tabIndex" nav-wrapper-class="w-25">
        <b-tab title="Home" active :title-link-class="linkClass(0)"><b-card-text>Browse library</b-card-text></b-tab>
        <b-tab title="Create" :title-link-class="linkClass(1)">
          <b-row><b-col align="center">
            <b-form-file
              v-model="file"
              placeholder="Drop .wav here"
              accept="audio/wav"
              @input="onFile"
              class="m-2 w-75"
            ></b-form-file>
            <audio class="m-2" ref="audioPlayer" controls>
              <source :src="audio" type="audio/wav">
              Your browser does not support the <code>audio</code> element.
            </audio>
            <br>
            <b-button class="m-2" variant="info" @click="upload">post to pLayer</b-button>
          </b-col></b-row>
        </b-tab>
        <b-tab title="Settings" :title-link-class="linkClass(2)"><b-card-text>Account settings</b-card-text></b-tab>
      </b-tabs>
    </b-card>
  </b-container>
  `,
  data() {
    return {
      file: null,
      audio: null,
      tabIndex: 0
    }
  },
  methods: {
    async upload() {
      let uuidRef = ref(storage, 'public/'+uuidv4());
      await uploadBytes(uuidRef, this.file);
      console.log('Uploaded file to ' + uuidRef._location.path_);
    },
    onFile(file) {
      this.audio = window.URL.createObjectURL(file);
      this.$refs.audioPlayer.load();
    },
    linkClass(idx) {
      if (this.tabIndex === idx) {
        return ['bg-info', 'text-light']
      } else {
        return ['bg-light', 'text-dark']
      }
    }
  }
})
