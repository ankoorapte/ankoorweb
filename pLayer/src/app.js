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
  getDownloadURL } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-storage.js";

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

let L0 = {};
let users = {};

// document.addEventListener('click', async function() {
//   var sound = new Howl({
//     src: [app.trackURL],
//     html5: true
//   });
  
//   sound.play();
// })

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
          :invalid-feedback="invalidFeedback"
          :state="state"
          align="center"
        >
          <b-form-input placeholder="email" @keydown.native="signinKeydownHandler" id="input-1" v-model="email" :state="state" trim></b-form-input>
          <b-form-input placeholder="password" @keydown.native="signinKeydownHandler" type="password" id="input-2" v-model="password" :state="state" trim></b-form-input>
        </b-form-group>
        <b-button :disabled="!state" @click="signIn(0)" variant="success">sign in</b-button>
      </b-card>
    </b-col></b-row>
    <b-collapse v-model="signedIn">
      <b-card bg-variant="light" no-body class="m-4">
        <b-tabs pills card align="center" v-model="tab">
          <b-tab :title-link-class="tabClass(0)">
            <template slot="title">
              create <b-icon icon="music-note"></b-icon> 
            </template>
            <b-row><b-col align="center">
              <b-form-file
                placeholder="drop your clip"
                accept="audio/wav"
                @input="refreshLayer"
                class="m-2 w-75"
              ></b-form-file>
              <b-form-input class="w-75" v-model="layerName" :state="stateLayername" placeholder="name your clip"></b-form-input>
              <p class="mt-1"> OPTIONAL: enter track ID below to layer your clip on top</p>
              <b-form-input class="w-75" v-model="rootTrackID" :state="stateRootTrack" placeholder="enter track ID" @keyup.native="rootTrackKeyupHandler"></b-form-input>
              <br>
              <audio class="m-2" ref="layer" controls controlsList="nodownload noplaybackrate">
                <source :src="layerURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
              <br>
              <b-button :disabled="notPostReady" class="m-2" variant="info" @click="postLayer(0)">post to pLayer</b-button>
            </b-col></b-row>
          </b-tab>
          <b-tab active :title-link-class="tabClass(1)">
            <template slot="title">
              play <b-icon icon="music-note-beamed"></b-icon>
            </template>
            <b-row><b-col align="center">
              <p>
                <b-button @click="toggleTrack(0)" class="m-2" variant="info"><b-icon icon="skip-backward-fill"></b-icon></b-button>
                <b>{{trackName}}</b> by <b>{{artistName}}</b>
                <b-button @click="toggleTrack(1)" class="m-2" variant="info"><b-icon icon="skip-forward-fill"></b-icon></b-button>
              </p>
              <audio class="m-2" ref="pLayer" controls controlsList="nodownload noplaybackrate">
                <source :src="trackURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
              <p>{{trackID}}</p>
            </b-col></b-row>
          </b-tab>
          <b-tab :title-link-class="tabClass(2)">
            <template slot="title">
              settings <b-icon icon="wrench"></b-icon> 
            </template>
            <p align="center" v-if="user"> your username is <b>{{ user.displayName }}</b></p>
            <b-form-group
              :invalid-feedback="invalidFeedbackUsername"
              :state="stateUsername"
              align="center"
            >
              <b-form-input placeholder="new username" @keydown.native="usernameKeydownHandler" v-model="newUsername" :state="stateUsername" trim></b-form-input>
              <b-button variant="primary" :disabled="posting || !newUsername" @click="changeUsername(0)">update username</b-button>  
            </b-form-group>
          </b-tab>
          <b-tab :title-link-class="tabClass(3)" @click="signOut">
            <template slot="title">
              sign out <b-icon icon="box-arrow-right"></b-icon>
            </template>
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
      layerName: "",
      layerURL: null,
      artistName: "",
      track: null,
      trackID: "",
      trackName: "",
      trackURL: null,
      trackIdx: 0,
      rootTrack: null,
      rootTrackID: "",
      rootTrackExists: false,
      rootTrackURL: null
    }
  },
  async created() {
    let self = this;
    onAuthStateChanged(auth, async (user) => {
      if(user) { await self.signIn(user); }
      self.tab = 1;

      let queryResponse = {};
      if(self.signedIn) {
        queryResponse = await getDocs(collection(db, "L0"));
        queryResponse.forEach((doc) => {
          L0[doc.id] = doc.data();
        });
        if(Object.keys(L0).length) {
          self.getTrack(Object.keys(L0)[0]).then(() => {});
        }
    
        queryResponse = {};
        queryResponse = await getDocs(collection(db, "users"));
        queryResponse.forEach((doc) => {
          users[doc.id] = doc.data();
        });
      }
    });
  },
  computed: {
    notPostReady() {
      if(this.layer && this.layerName.length && !this.posting) {
        return false;
      }
      return true;
    },
    state() {
      return this.password.length >= 6 && this.email.includes("@");
    },
    invalidFeedback() {
      return 'Enter a valid email ID and password with minimum 6 characters.'
    },
    invalidFeedbackUsername() {
      return 'Username is already taken.'
    },
    stateUsername() {
      return this.user
        && !Object.keys(users).includes(this.newUsername)
        && (this.user.displayname != this.newUsername)
        && Boolean(this.newUsername.length);
    },
    stateLayername() {
      return Boolean(this.layerName.length);
    },
    stateRootTrack() {
      return this.rootTrackExists;
    }
  },
  methods: {   
    async getTrack(uuid) {
      let url = await getDownloadURL(ref(storage, 'public/'+uuid));
      let response = await fetch(url);

      if(response.status === 200) {
        this.track = await response.blob();
        this.trackName = L0[uuid]['name'];
        this.artistName = users[L0[uuid]['user']]['displayName'];
        this.trackURL = window.URL.createObjectURL(this.track);
        this.$refs.pLayer.load();
        return this.track; 
      }
      console.log('Looks like there was a problem. Status Code: ' + response.status);
      return 0;
    },
    async postLayer(level) {
      const uuidRef = ref(storage, 'public/'+uuidv4());
      let self = this;
      self.posting = true;
      const metadata = {
        customMetadata: {
          'name': self.layerName,
          'user': self.user.uid,
          'layer': level.toString()
        }
      };
      await uploadBytes(uuidRef, self.layer, metadata);
      self.posting = false;
    },
    async toggleTrack(forward) {
      if(forward) { this.trackIdx++; }
      else { this.trackIdx--; }
      this.trackIdx = this.trackIdx % Object.keys(L0).length;
      await this.getTrack(Object.keys(L0)[this.trackIdx]);
    },
    async signOut() {
      this.signedIn = false;
      this.user = null;
      this.email = "";
      this.password = "";
      await signOut(auth);
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
    refreshLayer(layer) {
      this.layer = layer;
      this.layerURL = window.URL.createObjectURL(layer);
      this.$refs.layer.load();
      let self = this;
      if(self.rootTrackURL) {
        var sound = new Howl({
          src: [self.layerURL, self.rootTrackURL],
          html5: true
        });
        
        sound.play();
      }
    },
    tabClass(idx) {
      return (this.tab === idx) ? 
        ['bg-info', 'text-light'] : 
        ['bg-light', 'text-dark'];
    },
    signinKeydownHandler(event) {
      if (event.which === 13 && this.state) {
        this.signIn();
      }
    },
    usernameKeydownHandler(event) {
      if (event.which === 13 && this.stateUsername) {
        this.changeUsername(0);
      }
    },
    async rootTrackKeyupHandler(event) {
      this.rootTrackExists = Object.keys(L0).includes(this.rootTrackID);
      this.rootTrack = await this.getTrack(this.rootTrackID);
      this.rootTrackURL = window.URL.createObjectURL(this.rootTrack);
      this.refreshLayer();
    }
  }
});


