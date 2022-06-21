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
  setDoc  } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";


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

let app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E1F3F6;">
    <h1 class="m-2" align="center" style="font-family:Georgia, serif;"><b-icon icon="music-note-list"></b-icon> <b>pLayer</b></h1>
    <b-row><b-col align="center">
      <b-card v-if="!signedIn" align="center" class="w-50">
        <b-form-group
          label="enter your credentials"
          label-for="input-1"
          :invalid-feedback="invalidCredentials"
          :state="stateCredentials"
          align="center"
        >
          <b-form-input placeholder="email" @keydown.native="signinKeydownHandler" id="input-1" v-model="email" :state="stateCredentials" trim></b-form-input>
          <b-form-input placeholder="password" @keydown.native="signinKeydownHandler" type="password" id="input-2" v-model="password" :state="stateCredentials" trim></b-form-input>
        </b-form-group>
        <b-button :disabled="!stateCredentials" @click="signIn(0)" variant="success">sign in</b-button>
      </b-card>
    </b-col></b-row>
    <b-collapse v-model="signedIn">
      <b-card bg-variant="light" no-body class="m-3">
        <b-tabs pills card align="center" v-model="tab">
          <b-tab :title-link-class="tabClass(0)">
            <template slot="title">
            <b-icon icon="music-note"></b-icon> create  
            </template>
            <b-row><b-col align="center">
              <b>upload your audio</b>
              <b-form-file
                placeholder="drop here"
                accept="audio/wav"
                @input="layerHandler"
                class="m-2 w-75"
              ></b-form-file>
              <audio ref="layer" class="m-2" controls controlsList="nodownload noplaybackrate">
                <source :src="layerURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
              <hr>
              <b>(OPTIONAL) layer your audio on an existing track </b>
              <b-form-input class="m-2 w-75" v-model="baseTrackID" :state="stateBaseTrack" placeholder="enter track ID" @keyup.native="baseTrackIDHandler"></b-form-input>
              <p v-show="stateBaseTrack">preview</p>
              <audio v-show="stateBaseTrack" class="m-2" ref="newTrack" controls controlsList="nodownload noplaybackrate">
                <source :src="newTrackURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
              <hr>
              <b>name your track and post it!</b>
              <b-form-input class="m-2 w-75" v-model="newTrackName" :state="stateTrackName" placeholder="name your track"></b-form-input>
              <b-button class="m-2" :disabled="postDisabled" variant="info" @click="post()">post to pLayer</b-button>
            </b-col></b-row>
          </b-tab>
          <b-tab active :title-link-class="tabClass(1)">
            <template slot="title">
            <b-icon icon="music-note-beamed"></b-icon> play 
            </template>
            <b-row><b-col align="center">
            </b-col></b-row>
          </b-tab>
          <b-tab :title-link-class="tabClass(2)">
            <template slot="title">
              <b-icon icon="wrench"></b-icon> settings 
            </template>
            <b-row></b-col align="center">
              <b-button align="center" variant="danger" @click="signOut">sign out</b-button>  
            </b-col></b-row>
            <hr>
            <p align="center" v-if="user"> your username is <b>{{ user.displayName }}</b></p>
            <b-form-group
              :invalid-feedback="invalidUsername"
              :state="stateUsername"
              align="center"
            >
              <b-form-input placeholder="new username" @keydown.native="usernameKeydownHandler" v-model="newUsername" :state="stateUsername" trim></b-form-input>
              <b-button variant="primary" :disabled="posting || !newUsername" @click="changeUsername(0)">update username</b-button>  
            </b-form-group>
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
      layer: null,
      layerURL: null,
      baseTrackID: "",
      baseTrackExists: false,
      newTrack: null,
      newTrackURL: null,
      newTrackName: ""
    }
  },
  async created() {
    let self = this;
    onAuthStateChanged(auth, async (user) => {
      if(user) { await self.signIn(user); }
      self.tab = 1;

      let queryResponse = {};
      if(self.signedIn) {
        queryResponse = await getDocs(collection(db, "tracks"));
        queryResponse.forEach((doc) => {
          tracks[doc.id] = doc.data();
        });

        queryResponse = {};
        queryResponse = await getDocs(collection(db, "users"));
        queryResponse.forEach((doc) => {
          users[doc.id] = doc.data();
        });
      }
    });
  },
  computed: {
    postDisabled() {
      if(this.layer && this.newTrackName.length && !this.posting) {
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
      return 'username is already taken.'
    },
    stateUsername() {
      return this.user
        && !Object.keys(users).includes(this.newUsername)
        && (this.user.displayname != this.newUsername)
        && Boolean(this.newUsername.length);
    },
    stateTrackName() {
      return Boolean(this.newTrackName.length);
    },
    stateBaseTrack() {
      return this.baseTrackExists;
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
    async layerHandler(layer) {
      this.layer = layer;
      this.layerURL = window.URL.createObjectURL(layer);
      this.$refs.layer.load();
      await this.baseTrackIDHandler();
    },
    async baseTrackIDHandler(event) {
      let self = this;
      self.baseTrackExists = Object.keys(tracks).includes(self.baseTrackID);
      if(self.baseTrackExists) {
        console.log('get base track id + metadata');
        let base = ref(storage, 'tracks/'+self.baseTrackID);
        let baseTrackURL = await getDownloadURL(base);
        let baseMetadata = await getMetadata(base);

        console.log('convert to arrayBuffers');
        let layerArrayBuffer = await self.layer.arrayBuffer();
        let baseTrack = await fetch(baseTrackURL);
        let baseArrayBuffer = await baseTrack.arrayBuffer();

        let ended = [false, false];
        let chunks = [];
        let channels = [
          [0, 1],
          [1, 0]
        ];

        console.log('wire up audio');
        let audio = new AudioContext();
        let merger = audio.createChannelMerger(2);
        let splitter = audio.createChannelSplitter(2);
        let mixedAudio = audio.createMediaStreamDestination();

        let audioSetup = async (buffer, index) => {
          let bufferSource = await audio.decodeAudioData(buffer);
          let channel = channels[index];
          let source = audio.createBufferSource();
          source.buffer = bufferSource;
          source.connect(splitter);
          splitter.connect(merger, channel[0], channel[1]);          
          return source;
        }

        let promises = [];
        promises.push(audioSetup(layerArrayBuffer, 0));
        promises.push(audioSetup(baseArrayBuffer, 0));
        let audioNodes = await Promise.all(promises);
        merger.connect(mixedAudio);
        merger.connect(audio.destination);
        let recorder = new MediaRecorder(mixedAudio.stream);

        recorder.ondataavailable = function(event) {
          console.log('ondataavailable');
          chunks.push(event.data);
          console.log(chunks);
        };
        recorder.onstop = function(event) {
          console.log('onstop');
          self.newTrack = new Blob(chunks, {
            "type": "audio/wav"
          });
          self.newTrackURL = URL.createObjectURL(self.newTrack);
          self.$refs.newTrack.load();
        };
        console.log('start recorder + nodes');
        recorder.start(0);
        audioNodes.forEach(function(node, index) {
          node.onended = () => {
            ended[index] = true;
            if(ended.every((e) => e)) recorder.stop();
          }
          node.start(0);
        });
      }
    },
    async post() {
      let self = this;
      self.posting = true;

      const metadata = {
        customMetadata: {
          'name': self.newTrackName,
          'user': self.user.uid,
          'base': self.baseTrackID
        }
      };

      const uid = uuidv4();
      const layerPath = ref(storage, 'layers/'+uid);
      await uploadBytes(layerPath, self.layer, metadata);
      if(self.baseTrackExists) {
        const trackPath = ref(storage, 'tracks/'+uid);
        await uploadBytes(trackPath, self.newTrack, metadata);
      }
      self.posting = false;
    }
  }
});