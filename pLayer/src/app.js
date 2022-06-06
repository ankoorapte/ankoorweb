import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-storage.js";
import { getFirestore, collection, getDocs  } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

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
const db = getFirestore(firebaseApp);

let L1 = {};
let L1_keys = [];

let app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E1F3F6">
    <h1 class="m-2" align="center"><b>pLayer</b></h1>
    <b-card bg-variant="light" no-body class="m-4">
      <b-tabs pills card vertical v-model="tab" nav-wrapper-class="w-25">
        <b-tab title="Home" active :title-link-class="tabClass(0)">
          <b-row>
            <b-col align="center">
              <b-button @click="toggle(0)" class="m-2" variant="info"><b-icon icon="skip-backward-fill"></b-icon></b-button>
            </b-col>
            <b-col align="center">
              <audio class="m-2" ref="pLayer" controls>
                <source :src="trackURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
            </b-col>
            <b-col align="center">
              <b-button @click="toggle(1)" class="m-2" variant="info"><b-icon icon="skip-forward-fill"></b-icon></b-button>
            </b-col>
          </b-row>
        </b-tab>
        <b-tab title="Create" :title-link-class="tabClass(1)">
          <b-row><b-col align="center">
            <b-form-file
              placeholder="Drop audio here"
              accept="audio/wav"
              @input="onLayer"
              class="m-2 w-75"
            ></b-form-file>
            <audio class="m-2" ref="layer" controls>
              <source :src="layerURL" type="audio/wav">
              Your browser does not support the <code>audio</code> element.
            </audio>
            <br>
            <b-button class="m-2" variant="info" @click="upload">post to pLayer</b-button>
          </b-col></b-row>
        </b-tab>
        <b-tab title="Settings" :title-link-class="tabClass(2)"><b-card-text>Account settings</b-card-text></b-tab>
      </b-tabs>
    </b-card>
  </b-container>
  `,
  created() {
    let self = this;
    getDocs(collection(db, "L1")).then((querySnapshot) => {
      querySnapshot.forEach((doc) => {
        L1[doc.id] = doc.data();
        L1_keys.push(doc.id);
      });
      if(L1_keys.length) {
        self.getLayer(L1[L1_keys[0]]['uid']).then(() => {});
      }
    });
  },
  data() {
    return {
      tab: 0,
      layer: null,
      layerURL: null,
      trackURL: null,
      trackIdx: 0
    }
  },
  methods: {
    tabClass(idx) {
      return (this.tab === idx) ? 
        ['bg-info', 'text-light'] : 
        ['bg-light', 'text-dark']
    },
    async toggle(forward) {
      if(forward) { this.trackIdx++; }
      else { this.trackIdx--; }
      trackIdx = trackIdx % L1_keys.length;
      await this.getLayer(L1[L1_keys[trackIdx]]['uid']);
    },
    onLayer(layer) {
      this.layer = layer;
      this.layerURL = window.URL.createObjectURL(layer);
      this.$refs.layer.load();
    },
    async upload() {
      let uuidRef = ref(storage, 'public/'+uuidv4());
      await uploadBytes(uuidRef, this.layer);
      console.log('Uploaded file to ' + uuidRef._location.path_);
    },
    async getLayer(uuid) {
      console.log(uuid);
      let url = await getDownloadURL(ref(storage, 'public/'+uuid));
      let self = this;
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = (event) => {
        self.trackURL = window.URL.createObjectURL(xhr.response);
        self.$refs.pLayer.load();
      };
      xhr.open('GET', url);
      xhr.send();
    }
  }
})
