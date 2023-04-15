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
  updatePassword,
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
  setDoc,
  updateDoc,
  onSnapshot,
  arrayUnion  } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";

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
    <b-row style="font-size:40px">
      <b-col align="left">
        <b-spinner v-show="busy" variant="dark" type="grow"></b-spinner>
        <b-dropdown left v-show="!busy" v-if="signedIn" variant="outline-dark">
          <template #button-content>
            <b-icon icon="music-note-list"></b-icon>
          </template>
          <b-dropdown-item @click="showCreatorTools = !showCreatorTools">create</b-dropdown-item>
          <b-dropdown-item @click="showSettings = !showSettings">you</b-dropdown-item>
        </b-dropdown>
      </b-col>
      <b-col align="center">
        <h1 class="mt-2" style="font-family:Georgia, serif;"><b>pLayer</b></h1>
      </b-col>
      <b-col align="right">
        <b-button v-show="!busy" variant="outline-danger" @click="signOut" v-if="signedIn"><b-icon icon="box-arrow-right" aria-hidden="true"></b-icon></b-button>
      </b-col>
    </b-row>
    <hr>
    <b-row><b-col align="center">
      <b-card v-if="!signedIn" align="center" class="w-75">
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
      <b-row><b-col align="center">
        <b-card v-show="!busy" class="mb-3 pb-0" border-variant="dark" bg-variant="transparent">
          <div ref="pLayer"></div>
          <p style="font-size:22px">
            <b>{{trackName}}</b> by <b>{{artistNames.join(", ")}}</b>
          </p>
          <p v-show="draft.length" style="font-size:14px">
            <i>draft version with new layer <b>{{getLayerName(draft)}}</b></i>
          </p>
          <p>
            <b-button :disabled="busy" variant="dark" @click="toggleTrack(0)"><b-icon icon="skip-backward-fill"></b-icon></b-button>
            <b-button :disabled="busy" variant="dark" @click="togglePlay()" v-show="!paused"><b-icon icon="pause-fill"></b-icon></b-button>
            <b-button :disabled="busy" variant="dark" @click="togglePlay()" v-show="paused"><b-icon icon="play-fill"></b-icon></b-button>
            <b-button :disabled="busy" variant="dark" @click="toggleTrack(1)"><b-icon icon="skip-forward-fill"></b-icon></b-button>
          </p>
        </b-card>
      </b-col></b-row>
      <b-collapse v-model="showCreatorTools">
        <b-tabs card align="center">
          <b-tab title="inbox">
            <b-row><b-col align="center">
              <p v-if="!inbox.length">you have no new layer requests...</p>
            </b-col></b-row>
            <b-list-group v-for="(inbox_item, index) in inbox" v-bind:key="inbox_item.layerID">
              <b-list-group-item class="d-flex justify-content-between align-items-center">
                <p>
                  <b>{{ getUserName(inbox_item.userID) }}</b> wants to layer <b>{{ getLayerName(inbox_item.layerID) }}</b> on top of <b>{{ getLayerName(inbox_item.baseID) }}</b>
                </p>
                <p>
                  <b-badge href="#" variant="dark" @click="playDraft(index, 'inbox')">play</b-badge>
                  <b-badge href="#" variant="success" @click="resolveDraft(index, 1)">accept</b-badge>
                  <b-badge href="#" variant="danger" @click="resolveDraft(index, 0)">reject</b-badge>
                </p>
              </b-list-group-item>
            </b-list-group>
          </b-tab>
          <b-tab title="create" active>
            <b-row><b-col align="center" v-show="!busy">
              <b-form-file
                placeholder=""
                accept="audio/wav"
                v-model="layer"
                browse-text="upload"
                class="mb-1"
                :disabled="busy"
              ></b-form-file>
              <b-input-group append="name" class="mb-1">
                <b-form-input v-model="newTrackName" :disabled="busy"></b-form-input>
              </b-input-group>
              <p class="mt-2">
                <b-button :disabled="busy" variant="outline-dark" @click="layering = !layering" v-if="!layering"> click to layer on top of <b>{{trackName}}</b> by <b>{{artistNames.join(", ")}}</b></b-button>
                <b-button :disabled="busy" variant="danger" @click="layering = !layering" v-if="layering"> layering on top of <b>{{trackName}}</b> by <b>{{artistNames.join(", ")}}</b></b-button>
                <b-button :disabled="busy || !layer" variant="success" @click="post()">post</b-button>
              </p>
            </b-col></b-row>
          </b-tab>
          <b-tab title="outbox">
            <b-row><b-col align="center">
              <p v-if="!outbox.length">you have not submitted any new layers...</p>
            </b-col></b-row>
            <b-list-group v-for="(outbox_item, index) in outbox" v-bind:key="outbox_item.layerID">
              <b-list-group-item class="d-flex justify-content-between align-items-center">
                <p>You want to layer <b>{{ getLayerName(outbox_item.layerID) }}</b> on top of <b>{{ getLayerName(outbox_item.baseID) }}</b> by <b>{{ getUserName(getBaseUser(outbox_item.baseID)) }}</b></p>
                <p>
                  <b-badge href="#" variant="dark" @click="playDraft(index, 'outbox')">play</b-badge>
                </p>
              </b-list-group-item>
            </b-list-group>
          </b-tab>
        </b-tabs>
      </b-collapse>
      <hr>
      <b-collapse v-model="showSettings">
        <b-row v-if="signedIn">
          <b-col align="center">
            <h5><b>ACCOUNT</b></h5>
            <b-input-group class="m-2">
              <b-form-input
                placeholder="new username"
                @keydown.native="usernameKeydownHandler" 
                v-model="newUsername" 
                :state="stateUsername" 
                trim
              >
              </b-form-input>
              <b-input-group-append>
                <b-button variant="dark" :sign="busy || !newUsername" @click="changeUsername(0)">update username</b-button>
              </b-input-group-append>
            </b-input-group>
          </b-col>
        </b-row>
        <b-row v-if="signedIn">
          <b-col align="center">
            <b-input-group class="m-2">
              <b-form-input
                placeholder="new password"
                @keydown.native="passwordKeydownHandler" 
                v-model="newPassword" 
                type="password" 
                :state="statePassword" 
                trim
              >
              </b-form-input>
              <b-input-group-append>
                <b-button variant="dark" :sign="busy || !newPassword" @click="changePassword()">update password</b-button>
              </b-input-group-append>
            </b-input-group>
          </b-col>
        </b-row>
        <b-row><b-col align="center">
          <h5><b>DISC<b-icon class="mt-1 mb-1" icon="disc-fill"></b-icon>GRAPHY</b></h5>
          <b-list-group v-for="(disco_item, index) in discography" v-bind:key="disco_item.trackID">
            <b-list-group-item class="d-flex justify-content-between align-items-center">
              <p>{{ getTrackName(disco_item.trackID) }}</p>
              <p>
                <b-badge href="#" variant="dark" @click="playDiscography(index)">play</b-badge>
              </p>
            </b-list-group-item>
          </b-list-group>
        </b-col></b-row>
      </b-collapse>
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
      newPassword: "",
      busy: true,
      showSettings: false,
      showCreatorTools: false,
      layer: null,
      layers: [],
      layerBuffers: [],
      trackName: "",
      artistNames: [],
      newTrackName: "",
      trackID: "",
      trackIdx: 0,
      layering: false,
      paused: true,
      audioContext: null,
      merger: null,
      mixedAudio: null,
      seeker: 0,
      inbox: [],
      outbox: [],
      discography: [],
      draft: "",
    }
  },
  async created() {
    let self = this;
    onAuthStateChanged(auth, async (user) => {
      self.busy = true;
      if(user) { await self.signIn(user); }
      if(self.signedIn) {
        self.resetAudioContext();
        unsubscribe_layers = onSnapshot(collection(db, "layers"), (layerDocs) => {
          layers = {};
          layerDocs.forEach((doc) => {
            layers[doc.id] = doc.data();
          });
          self.updateBoxes();
        });

        unsubscribe_tracks = onSnapshot(collection(db, "tracks"), (trackDocs) => {
          tracks = {};
          trackDocs.forEach((doc) => {
            tracks[doc.id] = doc.data();
          });
          self.trackID = Object.keys(tracks)[0];
          self.updateDiscography();
          self.getTrack();
        });

        unsubscribe_users = onSnapshot(collection(db, "users"), (userDocs) => {
          users = {};
          userDocs.forEach((doc) => {
            users[doc.id] = doc.data();
          });
        });
      }
      self.busy = false;
    });
    self.busy = false;
  },
  computed: {
    stateCredentials() {
      return this.password.length >= 6 && this.email.includes("@") && this.email.includes(".");
    },
    invalidCredentials() {
      return 'enter a valid email ID and password with minimum 6 characters.'
    },
    stateUsername() {
      return this.user
        && !Object.keys(users).includes(this.newUsername)
        && Boolean(this.newUsername.length);
    },
    statePassword() {
      return this.newPassword.length >= 6;
    }
  },
  methods: {
    getLayerName(uid) {
      if(!uid || !Object.keys(layers).length) return;
      return layers[uid].name;
    },
    getBaseUser(uid) {
      if(!uid || !Object.keys(layers).length) return;
      return layers[uid].user;
    },
    getTrackName(uid) {
      if(!uid || !Object.keys(tracks).length) return;
      return tracks[uid].name;
    },
    getUserName(uid) {
      if(!uid || !Object.keys(users).length) return;
      return users[uid].displayName;
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
          this.newUsername = user.displayName;
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
        if(e.code == "auth/wrong-password") {
          alert("Wrong password!")
        }
      }
    },
    async signOut() {
      if(!this.paused) await this.togglePlay();
      this.resetAudioContext();
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
    async changePassword() {
      let self = this;
      self.busy = true;
      await updatePassword(auth.currentUser, self.newPassword);
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
    passwordKeydownHandler(event) {
      if (event.which === 13 && this.statePassword) {
        this.changePassword();
      }
    },
    resetAudioContext() {
      this.audioContext = new AudioContext();
      this.merger = this.audioContext.createChannelMerger(2);
      this.mixedAudio = this.audioContext.createMediaStreamDestination();
      this.merger.connect(this.mixedAudio);
      this.merger.connect(this.audioContext.destination);
    },
    async toggleTrack(forward) {
      this.busy = true;
      if(!this.paused) await this.togglePlay();
      if(forward) { this.trackIdx++; }
      else { 
        if(!this.trackIdx) this.trackIdx = Object.keys(tracks).length;
        this.trackIdx--;
      }
      this.trackIdx = this.trackIdx % Object.keys(tracks).length;
      this.trackID = Object.keys(tracks)[this.trackIdx];
      this.seeker = 0;
      await this.getTrack();
      await this.togglePlay();
      this.busy = false;
    },
    async togglePlay() {
      if(this.paused) {
        this.resetAudioContext();
        for(const layerBuffer of this.layerBuffers) {
          let source = this.audioContext.createBufferSource();
          source.buffer = layerBuffer;
          source.connect(this.merger, 0, 0);
          source.connect(this.merger, 0, 1);
          source.start(0, this.seeker);
          this.layers.push(source);
        }
      } else {
        this.seeker += this.audioContext.currentTime;
        this.layers.forEach((node) => node.stop());
      }
      this.paused = !this.paused;
    },
    async layerBuffer(layerID) {
      return this.audioContext.decodeAudioData(
        await (
          await fetch(await getDownloadURL(ref(storage, layerID)))
        ).arrayBuffer()
      );
    },
    async getTrack(draftLayer="") {
      if(!Object.keys(tracks).length) return;
      this.busy = true;
      let trackLayers = tracks[this.trackID].layers.slice();
      if(draftLayer.length) trackLayers.push(draftLayer);
      this.draft = draftLayer;
      this.layerBuffers = await Promise.all(trackLayers.map(this.layerBuffer));
      this.artistNames = trackLayers.map((layerID) => users[layers[layerID]['user']]['displayName']);
      this.artistNames = [...new Set(this.artistNames)];
      this.trackName = tracks[this.trackID]['name'];
      this.busy = false;
    },
    async post() {
      let self = this;
      if(!self.paused) await self.togglePlay();
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
    },
    updateBoxes() {
      let self = this;
      let layersArray = Object.keys(layers).map((layerID) => layers[layerID]);
      let myLayers = layersArray.filter((layer) => layer.user === self.user.uid);
      let myBaseIDs = myLayers.filter((layer) => !layer.base.length).map((layer) => layer.bucket);
      let submissions = myLayers.filter((layer) => !layer.resolved);

      self.inbox = layersArray.filter((layer) => myBaseIDs.includes(layer.base) && !layer.resolved).map((layer) => {
        return {
          layerID: layer.bucket,
          userID: layer.user,
          baseID: layer.base
        }
      });

      self.outbox = submissions.map((layer) => { 
        return {
          layerID: layer.bucket,
          userID: layer.user,
          baseID: layer.base
        }  
      });
    },
    async playDraft(index, whichbox) {
      if(!this.paused) await this.togglePlay();
      this.seeker = 0;
      await this.getTrack(this[whichbox][index].layerID);
      await this.togglePlay();
    },
    async resolveDraft(index, accept) {
      let layerID = this.inbox[index].layerID;
      let baseID = this.inbox[index].baseID;
      await setDoc(doc(db, "layers", layerID), {
        resolved: true
      }, {merge: true});
      if(accept) {
        await updateDoc(doc(db, "tracks", baseID), {
          layers: arrayUnion(layerID),
        }, {merge: true});
      }
    },
    updateDiscography() {
      // there has to be a better way
      this.discography = Object.keys(tracks).filter((trackID) => layers[trackID].user == this.user.uid).map((t) => {return {trackID:t}})
    },
    async playDiscography(index) {
      if (!this.paused) await this.togglePlay();
      this.trackID = this.discography[index].trackID;
      await this.getTrack();
      await this.togglePlay();
    }
  }
});