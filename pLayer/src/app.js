// IMPORTS
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";

import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  updateProfile, 
  onAuthStateChanged, 
  signOut } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-auth.js";

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  getMetadata } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-storage.js";

import { 
  getFirestore, 
  doc,
  collection, 
  getDocs,
  setDoc,
  onSnapshot  } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

// FIREBASE
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
const auth = getAuth(firebaseApp);

// CACHES
let tracks = {};
let layers = {};
let users = {};
let unsubscribe_tracks = () => {};
let unsubscribe_layers = () => {};
let unsubscribe_users = () => {};

NodeList.prototype.forEach = Array.prototype.forEach;

// APP
let app = new Vue({
  el: '#app',
  // GUI
  template: `
  <b-container style="background-color:#E1F3F6;">
    <h1 class="m-2" align="center" style="font-family:Georgia, serif;"><b-icon v-show="!busy" icon="music-note-list"></b-icon><b-spinner v-show="busy" variant="dark" type="grow"></b-spinner> <b>pLayer</b></h1>
    <b-row><b-col align="center">
      <b-card v-if="!signedIn" align="center" class="w-50">
        <b-form-group
          :invalid-feedback="invalidCredentials"
          :state="stateCredentials"
          align="center"
        >
          <b-form-input placeholder="email" @keydown.native="signinKeydownHandler" v-model="email" :state="stateCredentials" trim></b-form-input>
          <b-form-input placeholder="password" @keydown.native="signinKeydownHandler" type="password" id="input-2" v-model="password" :state="stateCredentials" trim></b-form-input>
        </b-form-group>
        <b-button :disabled="!stateCredentials" @click="signIn(0)" variant="success">sign in</b-button>
      </b-card>
    </b-col></b-row>
    <b-collapse v-model="signedIn">
      <b-card bg-variant="light" no-body class="m-3">
        <template #header>
          <b-row><b-col align="center">
            <p v-show="!busy">
              <b>{{trackName}}</b> by <b>{{artistNames.join(", ")}}</b>
            </p>
            <div ref="pLayer"></div>
            <p class="m-0">
              <b-button class="p-1" variant="info" @click="toggleTrack(0)"><b-icon icon="skip-backward-fill"></b-icon></b-button>
              <b-button class="p-1" variant="info" @click="togglePlay(0)" v-show="!paused"><b-icon icon="pause-fill"></b-icon></b-button>
              <b-button class="p-1" variant="info" @click="togglePlay(1)" v-show="paused"><b-icon icon="play-fill"></b-icon></b-button>
              <b-button class="p-1" variant="info" @click="toggleTrack(1)"><b-icon icon="skip-forward-fill"></b-icon></b-button>
            </p>
            <p class="m-0 mt-3">
              <b-button class="p-1" variant="info" @click="layering = !layering" v-if="!layering"><b-icon icon="plus-circle"></b-icon> layer</b-button>
              <b-button class="p-1" variant="danger" @click="layering = !layering" v-if="layering"><b-icon icon="dash-circle"></b-icon> layering</b-button>
            </p>
          </b-col></b-row>
        </template>
        <b-row><b-col align="center">
          <b-form-file
            placeholder=""
            accept="audio/wav"
            v-model="layer"
            browse-text="upload"
            class="m-2 w-75"
            :disabled="busy"
          ></b-form-file>
          <b-input-group append="name" class="w-75">
            <b-form-input v-model="newTrackName"></b-form-input>
          </b-input-group>
          <b-button class="m-2" variant="info" @click="post()">post</b-button>
          <br>
          <b-button class="m-2" variant="info" @click="showSettings = !showSettings"><b-icon icon="wrench"></b-icon></b-button>
          <br>
          <b-collapse v-model="showSettings" class="mt-2">
            <p align="center" v-if="user"><b>hello, {{ user.displayName }}</b></p>
            <b-row><b-col align="center">
              <b-input-group class="m-2 w-75">
                <b-form-input 
                  :invalid-feedback="invalidUsername" 
                  class="w-75" 
                  placeholder="new username" 
                  @keydown.native="usernameKeydownHandler" 
                  v-model="newUsername" 
                  :state="stateUsername" 
                  trim
                >
                </b-form-input>
                <b-input-group-append>
                  <b-button variant="info" :disabled="busy || !newUsername" @click="changeUsername(0)">update</b-button>
                </b-input-group-append>
              </b-input-group>
            </b-col></b-row>
            <p align="center"><b-button variant="danger" @click="signOut">sign out</b-button></p>
          </b-collapse>
        </b-col></b-row>
      </b-card>
    </b-collapse>
  </b-container>
  `,
  data() {
    return {
      tab: 0,
      user: "",
      signedIn: false,
      email: "",
      password: "",
      newUsername: "",
      busy: true,
      showSettings: false,
      layer: null,
      trackName: "",
      artistNames: [],
      newTrackName: "",
      trackID: "",
      trackIdx: 0,
      layering: false,
      paused: true,
    }
  },
  async created() {
    let self = this;
    onAuthStateChanged(auth, async (user) => {
      self.busy = true;
      if(user) { await self.signIn(user); }
      if(self.signedIn) {
        unsubscribe_layers = onSnapshot(collection(db, "layers"), (layerDocs) => {
          layerDocs.forEach((doc) => {
            layers[doc.id] = doc.data();
          });
        });

        unsubscribe_users = onSnapshot(collection(db, "users"), (userDocs) => {
          userDocs.forEach((doc) => {
            users[doc.id] = doc.data();
          });
        });
        
        unsubscribe_tracks = onSnapshot(collection(db, "tracks"), (trackDocs) => {
          tracks = {}
          trackDocs.forEach((doc) => {
            tracks[doc.id] = doc.data();
            self.trackID = doc.id;
          });

          self.getTrack().then(() => {});
          console.log(tracks);
        });
      }
      self.busy = false;
    });
    self.busy = false;
  },
  computed: {
    stateCredentials() {
      return this.password.length >= 6 && this.email.includes("@");
    },
    invalidCredentials() {
      return 'enter a valid email ID and password with minimum 6 characters.'
    },
    invalidUsername() {
      return this.newUsername.length ? 'username is already taken.' : '';
    },
    stateUsername() {
      return this.user
        && !Object.keys(users).includes(this.newUsername)
        && (this.user.displayname != this.newUsername)
        && Boolean(this.newUsername.length);
    }
  },
  methods: {
    tabClass(idx) {
      return (this.tab === idx) ? 
        ['bg-info', 'text-light'] : 
        ['bg-light', 'text-dark'];
    },
    async createUser() {
      try {
        let self = this;
        let userCredential = await createUserWithEmailAndPassword(auth, self.email, self.password);
        self.user = userCredential.user;
        await self.changeUsername(self.user.email);
      } catch(e) {
        console.log(e.code + ": " + e.message);
      }
    },
    async signIn(user) {
      try {
        if(user) {
          this.user = user;
        } else {
          this.user = (await signInWithEmailAndPassword(
            auth, 
            this.email, 
            this.password
          )).user;
        }
        if(this.user.emailVerified) {
          this.signedIn = true;
        } else {
          alert('Please go to your email inbox and verify your email.')
          await sendEmailVerification(auth.currentUser);
          this.signedIn = false;
        }
      } catch(e) {
        console.log(e.code + ": " + e.message);
        if(e.code == "auth/user-not-found") {
          await this.createUser();
        }
      }
    },
    async signOut() {
      unsubscribe_tracks();
      unsubscribe_layers();
      unsubscribe_users();
      this.signedIn = false;
      this.user = null;
      this.email = "";
      this.password = "";
      await signOut(auth);
    },
    async changeUsername(un) {
      let self = this;
      self.busy = true;
      if(!un) {
        un = self.newUsername;
      }
      await updateProfile(auth.currentUser, { displayName: un });
      await setDoc(doc(db, "users", self.user.uid), {
        displayName: un
      });
      self.busy = false;
    },
    signinKeydownHandler(event) {
      if (event.which === 13 && this.stateCredentials) {
        this.signIn();
      }
    },
    usernameKeydownHandler(event) {
      if (event.which === 13 && this.stateUsername) {
        this.changeUsername(0);
      }
    },
    async toggleTrack(forward) {
      this.busy = true;
      if(forward) { this.trackIdx++; }
      else { 
        if(!this.trackIdx) this.trackIdx = Object.keys(tracks).length;
        this.trackIdx--;
      }
      this.trackIdx = this.trackIdx % Object.keys(tracks).length;
      this.trackID = Object.keys(tracks)[this.trackIdx];
      await this.getTrack();
      this.busy = false;
    },
    togglePlay() {
      this.paused = !this.paused;
      var layers = this.$refs.pLayer.childNodes;
      if(this.paused) {
        layers.forEach((layer) => layer.pause());
      } else {
        layers.forEach((layer) => layer.play());
      }
    },
    async getLayerURL(layerID) {
      let blob = await (await fetch(await getDownloadURL(
        ref(storage, layerID)
      ))).blob();
      return window.URL.createObjectURL(blob);
    },
    async getTrack() {
      this.busy = true;
      const pLayer = this.$refs.pLayer;
      while (pLayer.firstChild) {
        pLayer.removeChild(pLayer.lastChild);
      }

      this.artistNames = [];

      for(const layerID of tracks[this.trackID].layers) {
        this.artistNames.push(users[layers[layerID]['user']]['displayName'])
        let layer = document.createElement('audio');
        layer.src      = await this.getLayerURL(layerID);
        layer.type     = 'audio/wav';
        pLayer.appendChild(layer);
      }

      this.artistNames = [...new Set(this.artistNames)];
      this.trackName = tracks[this.trackID]['name'];
      this.busy = false;
    },
    async post() {
      let self = this;
      self.busy = true;
      const uid = uuidv4();
      const layerPath = ref(storage, uid);
      const metadata = {
        customMetadata: {
          'name': self.newTrackName,
          'user': self.user.uid,
          'base': self.layering ? self.trackID : ""
        },
        contentType: 'audio/wav'
      }; 
      await uploadBytes(layerPath, self.layer, metadata);
      self.newTrackName = "";
      self.layer = null;
      self.layering = false;
      self.busy = false;
    }
  }
});