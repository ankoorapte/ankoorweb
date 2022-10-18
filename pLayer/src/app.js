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

let tracks = {};
let users = {};
let unsubscribe_tracks = () => {};
let unsubscribe_users = () => {};

let app = new Vue({
  el: '#app',
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
            <p v-show="trackName.length && artistNames.length && !layer && !busy">
              <b>{{trackName}}</b> by <b>{{artistNames.join(", ")}}</b>
            </p>
            <audio ref="pLayer" controls controlsList="noplaybackrate">
              <source :src="trackURL" type="audio/wav">
              Your browser does not support the <code>audio</code> element.
            </audio>
            <p class="m-0">
              <b-button class="p-1" variant="info" @click="toggleTrack(0)" v-if="!baseTrackExists && !layer"><b-icon icon="skip-backward-fill"></b-icon></b-button>
              <b-button class="p-1" variant="info" @click="pickBase" v-if="!baseTrackExists && !layer"><b-icon icon="plus-circle"></b-icon></b-button>
              <b-button class="p-1" variant="danger" @click="clearBase" v-if="baseTrackExists"><b-icon icon="dash-circle"></b-icon></b-button>
              <b-button class="p-1" variant="info" @click="showSettings = !showSettings"><b-icon icon="wrench"></b-icon></b-button>
              <b-button class="p-1" variant="info" @click="toggleTrack(1)" v-if="!baseTrackExists && !layer"><b-icon icon="skip-forward-fill"></b-icon></b-button>
            </p>
          </b-col></b-row>
          <b-collapse v-model="showSettings" class="mt-2">
            <p align="center" v-if="user"><b>hello, {{ user.displayName }}</b></p>
            <b-row><b-col align="center">
              <b-input-group class="m-2 w-75">
                <b-form-input type="number" min="0" v-model="layerCount" @change="filterTracks"></b-form-input>
                <b-input-group-append>
                  <b-input-group-text>
                    layers
                  </b-input-group-text>
                </b-input-group-append>
              </b-input-group>
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
        </template>
        <b-row><b-col align="center">
          <p class="m-2" v-if="layer && !baseTrackExists">
            {{ baseTrackExists && layer ? "mix " + layer.name + " with " + trackName + " by " + artistNames.join(", "): ""}}
          </p>
          <p class="m-2" v-if="baseTrackExists && !layer && trackName.length && artistNames.length">
            upload new layer to <b>{{trackName}}</b> by <b>{{artistNames.join(", ")}}</b>
          </p>
          <b-form-file
            placeholder=""
            accept="audio/wav"
            @input="refreshLayer"
            browse-text="upload"
            class="m-2 w-75"
          ></b-form-file>
          <b-input-group append="name" class="m-2 w-75">
            <b-form-input v-model="newTrackName"></b-form-input>
          </b-input-group>
          <b-button class="m-2" :disabled="postDisabled" variant="info" @click="postTrack()">post</b-button>
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
      baseTrackID: "",
      baseTrackExists: false,
      newTrack: null,
      newTrackName: "",
      trackIdx: 0,
      trackID: "",
      trackName: "",
      trackURL: null,
      artistNames: [],
      layerCount: 1,
      tracks: {}
    }
  },
  async created() {
    let self = this;
    onAuthStateChanged(auth, async (user) => {
      self.busy = true;
      if(user) { await self.signIn(user); }
      if(self.signedIn) {
        unsubscribe_tracks = onSnapshot(collection(db, "users"), (userDocs) => {
          userDocs.forEach((doc) => {
            users[doc.id] = doc.data();
          });
        });
        
        unsubscribe_tracks = onSnapshot(collection(db, "tracks"), (trackDocs) => {
          tracks = {}
          trackDocs.forEach((doc) => {
            tracks[doc.id] = doc.data();
          });

          self.filterTracks();

          if(Object.keys(self.tracks).length) 
            self.getTrack(Object.keys(self.tracks)[0]).then(() => {
              self.busy = false;
            });
        });
      }
      self.busy = false;
    });
    self.busy = false;
  },
  computed: {
    postDisabled() {
      if(this.newTrackName.length && !this.busy) {
        return false;
      }
      return true;
    },
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
    async pickBase() {
      this.baseTrackID = this.trackID;
      await this.refreshLayer(this.layer);
    },
    async clearBase() {
      this.layer = null;
      this.baseTrackID = null;
      await this.refreshLayer(this.layer);
    },
    async refreshLayer(layer) {
      if(this.busy) return;
      this.busy = true;
      this.layer = layer;
      this.baseTrackExists = Object.keys(this.tracks).includes(this.baseTrackID);
      if(this.baseTrackExists) {
        let baseTrack = await fetch(await getDownloadURL(
          ref(storage, 'tracks/'+this.baseTrackID)
        ));
        this.newTrack = this.layer ? await this.mixBuffers([
          await baseTrack.arrayBuffer(), 
          await this.layer.arrayBuffer()
        ]) : await baseTrack.blob();
      } else { 
        this.newTrack = this.layer; 
      }
      if(this.newTrack) {
        this.trackURL = URL.createObjectURL(this.newTrack);
        this.$refs.pLayer.load();
      } else {
        await this.getTrack(Object.keys(this.tracks)[this.trackIdx]);
      }
      this.busy = false;
    },
    async mixBuffers(audioBuffers) {
      let ended = [false, false];
      let chunks = [];
      let channels = [[0, 1],[1, 0]];
      let audio = new AudioContext();
      let merger = audio.createChannelMerger(2);
      let splitter = audio.createChannelSplitter(2);
      let mixedAudio = audio.createMediaStreamDestination();
      merger.connect(mixedAudio);
      merger.connect(audio.destination);

      let audioSetup = async (buffer, index) => {
        let bufferSource = await audio.decodeAudioData(buffer);
        let channel = channels[index];
        let source = audio.createBufferSource();
        source.buffer = bufferSource;
        source.connect(splitter);
        splitter.connect(merger, channel[0], channel[1]);          
        return source;
      }

      let audioNodes = await Promise.all(audioBuffers.map(audioSetup));
      let recorder = new MediaRecorder(mixedAudio.stream);

      return new Promise((resolve, reject) => {
        recorder.ondataavailable = (event) => {
          chunks.push(event.data);
        };
        recorder.onstop = () => {
          resolve(new Blob(chunks, {"type": "audio/wav"}));
        };
        recorder.start(0);
        audioNodes.forEach((node, index) => {
          node.onended = () => {
            ended[index] = true;
            if(ended.every((e) => e)) recorder.stop();
          }
          node.start(0);
        });
      });
    },
    async postTrack() {
      let self = this;
      self.busy = true;
      const uid = uuidv4();
      const layerPath = ref(storage, 'layers/'+uid);
      const trackPath = ref(storage, 'tracks/'+uid);
      const metadata = {
        customMetadata: {
          'name': self.newTrackName,
          'user': self.user.uid,
          'base': self.baseTrackID
        },
        contentType: 'audio/wav',
      }; 
      await uploadBytes(layerPath, self.layer, metadata);
      await uploadBytes(trackPath, self.newTrack, metadata);
      self.newTrackName = "";
      self.layer = null;
      self.baseTrackID = null;
      self.busy = false;
      
    },
    async toggleTrack(forward) {
      this.filterTracks();
      this.busy = true;
      if(forward) { this.trackIdx++; }
      else { 
        if(!this.trackIdx) this.trackIdx = Object.keys(this.tracks).length;
        this.trackIdx--;
      }
      this.trackIdx = this.trackIdx % Object.keys(this.tracks).length;
      await this.getTrack(Object.keys(this.tracks)[this.trackIdx]);
      this.busy = false;
    },
    async getTrack(uuid) {
      let url = await getDownloadURL(ref(storage, 'tracks/'+uuid));
      let response = await fetch(url);
      if(response.status === 200) {
        this.trackID = uuid;
        this.trackName = this.tracks[uuid]['name'];
        this.artistNames = [users[this.tracks[uuid]['user']]['displayName']];
        this.trackURL = window.URL.createObjectURL(await response.blob());
        this.$refs.pLayer.load();
      } else {
        console.log('Looks like there was a problem. Status Code: ' + response.status);
      }
    },
    async filterTracks() {
      this.busy = true;
      this.tracks = {};
      let baseList = Object.keys(tracks).map((id) => tracks[id].base);
      for(const id in tracks) {
        console.log(this.layerCount);
        console.log(baseList.includes(id));
        console.log(id);
        console.log(tracks[id]);
        if((this.layerCount > 0) && baseList.includes(id)) continue;
        this.tracks[id] = tracks[id];
      }
      await this.refreshLayer(this.layer);
      this.busy = false;
    }
  }
});