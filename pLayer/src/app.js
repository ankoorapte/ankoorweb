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
let unsubscribe = () => {};

let app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E1F3F6;">
    <h1 class="m-2" align="center" style="font-family:Georgia, serif;"><b-icon icon="music-note-list"></b-icon> <b>pLayer</b></h1>
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
          <audio ref="newTrack" class="m-2" controls controlsList="nodownload noplaybackrate">
            <source :src="newTrackURL" type="audio/wav">
            Your browser does not support the <code>audio</code> element.
          </audio>
        </template>
        <b-tabs pills card align="center" v-model="tab">
          <b-tab :title-link-class="tabClass(0)">
            <template slot="title">
            <b-icon icon="music-note" font-scale="1"></b-icon>  
            </template>
            <b-row><b-col align="center">
              <audio ref="newTrack" class="m-2" controls controlsList="nodownload noplaybackrate">
                <source :src="newTrackURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
              <br>
              <p v-if="baseTrackExists" class="m-2">layer over <b>{{trackName}}</b> by <b>{{artistNames.join(", ")}}</b>  <b-button variant="danger" @click="clearBase" class="p-1">clear</b-button></p>
              <hr>
              <b class="m-2">upload</b>
              <br>
              <b-form-file
                placeholder=""
                accept="audio/wav"
                @input="refreshLayer"
                class="m-2 w-75"
              ></b-form-file>
              <hr>
              <b class="m-2">name</b>
              <b-form-input class="m-2 w-75" v-model="newTrackName" :state="stateTrackName"></b-form-input>
              <b-button class="m-2" :disabled="postDisabled" variant="info" @click="postTrack()">post</b-button>
              <p align="center"><b-spinner v-show="posting || layering" variant="dark" type="grow"></b-spinner></p>
            </b-col></b-row>
          </b-tab>
          <b-tab active :title-link-class="tabClass(1)">
            <template slot="title">
            <b-icon icon="house-door-fill" font-scale="1"></b-icon> 
            </template>
            <b-row><b-col align="center">
              <audio class="m-2" ref="pLayer" controls controlsList="noplaybackrate">
                <source :src="trackURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
              <p>
                <b-button @click="toggleTrack(0)" class="m-2 p-1" variant="info"><b-icon icon="skip-backward-fill"></b-icon></b-button>
                <b>{{trackName}}</b> by <b>{{artistNames.join(", ")}}</b>
                <b-button @click="toggleTrack(1)" class="m-2 p-1" variant="info"><b-icon icon="skip-forward-fill"></b-icon></b-button>
              </p>
              <p><b-button variant="info" @click="layerOptions = !layerOptions"><b-icon icon="music-note-list"></b-icon> layers</b-button></p>
              <b-collapse v-model="layerOptions">
                <p><b-button variant="primary" @click="pickBase"><b-icon icon="plus-circle"></b-icon> add layer</b-button></p>
              </b-collapse>
            </b-col></b-row>
          </b-tab>
          <b-tab :title-link-class="tabClass(2)">
            <template slot="title">
              <b-icon icon="wrench" font-scale="1"></b-icon> 
            </template>
            <p align="center" v-if="user"><b>hello, {{ user.displayName }}</b></p>
            <p align="center"><b-button variant="danger" @click="signOut">sign out</b-button></p>
            <hr>
            <p align="center"><b-form-input :invalid-feedback="invalidUsername" class="w-75" placeholder="new username" @keydown.native="usernameKeydownHandler" v-model="newUsername" :state="stateUsername" trim></b-form-input></p>
            <p align="center"><b-button variant="primary" :disabled="posting || !newUsername" @click="changeUsername(0)">update username</b-button></p>
          </b-tab>
        </b-tabs>
      </b-card>
    </b-collapse>
  </b-container>
  `,
  data() {
    return {
      tab: 1,
      user: "",
      signedIn: false,
      email: "",
      password: "",
      newUsername: "",
      posting: false,
      layerOptions: false,
      layering: false,
      layer: null,
      baseTrackID: "",
      baseTrackExists: false,
      newTrack: null,
      newTrackURL: null,
      newTrackName: "",
      trackIdx: 0,
      trackID: "",
      trackName: "",
      trackURL: null,
      artistNames: []
    }
  },
  async created() {
    let self = this;
    onAuthStateChanged(auth, async (user) => {
      if(user) { await self.signIn(user); }
      self.tab = 1;
      if(self.signedIn) {
        let userDocs = await getDocs(collection(db, "users"));
        userDocs.forEach((doc) => {
          users[doc.id] = doc.data();
        });

        unsubscribe = onSnapshot(collection(db, "tracks"), (trackDocs) => {
          tracks = {}
          trackDocs.forEach((doc) => {
            tracks[doc.id] = doc.data();
          });

          if(Object.keys(tracks).length) 
            self.getTrack(Object.keys(tracks)[0]).then(() => {});
        });
      }
    });
  },
  computed: {
    postDisabled() {
      if(this.newTrack && this.newTrackName.length && !this.posting && !this.layering) {
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
    },
    stateTrackName() {
      return Boolean(this.newTrackName.length);
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
      unsubscribe();
      this.signedIn = false;
      this.user = null;
      this.email = "";
      this.password = "";
      await signOut(auth);
    },
    async changeUsername(un) {
      let self = this;
      self.posting = true;
      if(!un) {
        un = self.newUsername;
      }
      await updateProfile(auth.currentUser, { displayName: un });
      await setDoc(doc(db, "users", self.user.uid), {
        displayName: un
      });
      self.posting = false;
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
      this.tab = 0;
      await this.refreshLayer(this.layer);
    },
    async clearBase() {
      this.baseTrackID = null;
      await this.refreshLayer(this.layer);
    },
    async refreshLayer(layer) {
      if(this.layering) return;
      this.layering = true;
      this.layer = layer;
      this.baseTrackExists = Object.keys(tracks).includes(this.baseTrackID);
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
      this.newTrackURL = this.newTrack ? URL.createObjectURL(this.newTrack) : null;
      this.$refs.newTrack.load();
      this.layering = false;
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
      self.posting = true;
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
      self.clearBase();
      self.posting = false;
      
    },
    async toggleTrack(forward) {
      if(forward) { this.trackIdx++; }
      else { this.trackIdx--; }
      this.trackIdx = this.trackIdx % Object.keys(tracks).length;
      await this.getTrack(Object.keys(tracks)[this.trackIdx]);
    },
    async getTrack(uuid) {
      let url = await getDownloadURL(ref(storage, 'tracks/'+uuid));
      let response = await fetch(url);
      if(response.status === 200) {
        this.trackID = uuid;
        this.trackName = tracks[uuid]['name'];
        this.artistNames = [users[tracks[uuid]['user']]['displayName']];
        this.trackURL = window.URL.createObjectURL(await response.blob());
        this.$refs.pLayer.load();
      } else {
        console.log('Looks like there was a problem. Status Code: ' + response.status);
      }
    },
  }
});