// IMPORTS
import { 
  initializeApp 
} from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";

import { 
  getAuth,
  signInWithEmailAndPassword, 
  sendEmailVerification,
  onAuthStateChanged, 
  signOut } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-auth.js";

import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-storage.js";

import { 
  getFirestore, 
  collection,
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
    <b-row style="font-size:40px">
      <b-col align="left">
        <b-spinner v-show="busy" variant="dark" type="grow"></b-spinner>
        <b-button v-show="!busy" v-if="signedIn" variant="outline-dark" @click="showCreatorTools = !showCreatorTools"><b-icon icon="music-note-list"></b-icon></b-button>
      </b-col>
      <b-col align="center">
        <h1 class="mt-2" style="font-family:Georgia, serif;"><b>pLayer</b></h1>
      </b-col>
      <b-col align="right">
        <b-button v-if="signedIn" v-show="!busy" variant="outline-dark" @click="showSettings = !showSettings"><b-icon icon="wrench" aria-hidden="true"></b-icon></b-button>
      </b-col>
    </b-row>
    <b-collapse v-model="showSettings" v-show="signedIn">
      <b-row><b-col align="center">
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
      </b-col></b-row>
      <b-row><b-col align="center">
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
      </b-col></b-row>
      <b-row><b-col align="center">
        <b-input-group class="m-2">
          <b-form-input
            placeholder="new email"
            @keydown.native="emailKeydownHandler" 
            v-model="newEmail"
            :state="stateEmail" 
            trim
          >
          </b-form-input>
          <b-input-group-append>
            <b-button variant="dark" :sign="busy || !newEmail" @click="changeEmail()">update email</b-button>
          </b-input-group-append>
        </b-input-group>
      </b-col></b-row>
      <b-row class="mb-2"><b-col align="center">
        <a href="https://forms.gle/TSSQvBinSwGLrnyT6" target="_blank">Report feedback</a>
      </b-col></b-row>
      <b-row><b-col align="center">
        <b-button v-show="!busy" variant="danger" @click="signOut">sign out</b-button>
      </b-col></b-row>
    </b-collapse>
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
          <p style="font-size:22px" class="mb-0"><b>{{trackName}}</b></p>
          <p style="font-size:16px">{{artistNames.join(", ")}}</p>
          <p v-show="draft.length" style="font-size:14px">
            <i>draft version with new layer <b>{{getLayerName(draft)}}</b></i>
          </p>
          <p>
            <b-button :disabled="busy" variant="dark" @click="toggleTrack(0)"><b-icon icon="skip-backward-fill"></b-icon></b-button>
            <b-button v-if="!showLayers" :disabled="busy" variant="dark" @click="showLayers = true"><b-icon icon="arrow-down-circle"></b-icon></b-button>
            <b-button v-if="showLayers" :disabled="busy" variant="dark" @click="showLayers = false"><b-icon icon="arrow-up-circle"></b-icon></b-button>
            <b-button :disabled="busy" variant="dark" @click="toggleTrack(1)"><b-icon icon="skip-forward-fill"></b-icon></b-button>
          </p>
          <b-collapse v-model="showLayers">
            <b-list-group v-for="(layer_item, index) in layerBuffers" v-bind:key="index">
              <b-list-group-item class="p-0 d-flex justify-content-between align-items-center">
                <b-col>
                  <p class="mb-0"> {{ getLayerName(layer_item.id) }} - <b>{{ getUserName(layer_item.user)}}</b> </p>
                  <div><audio 
                    class="p-0" 
                    style="height:30px" 
                    controls controlslist="noplaybackrate"
                    :ref="layer_item.id"
                    :src="getLayerURL(layer_item.data)"
                    v-on:pause="layerPaused(layer_item.id)"
                    v-on:play="layerPlayed(layer_item.id)"
                    v-on:seeked="layerSeeked(layer_item.id)"
                    v-on:timeupdate="layerTimeUpdate(layer_item.id)"
                  >
                  </audio></div>
                </b-col>
              </b-list-group-item>
            </b-list-group>
          </b-collapse>
        </b-card>
      </b-col></b-row>
      <b-collapse v-model="showCreatorTools">
        <b-tabs card align="center">
          <b-tab title="new" active>
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
                <b-button :disabled="busy || !layer || !newTrackName.length" variant="success" @click="post()">post</b-button>
              </p>
            </b-col></b-row>
          </b-tab>
          <b-tab title="drafts">
            <b-tabs card align="center">
              <b-tab title="inbox" active>
                <b-list-group v-for="(inbox_item, index) in inbox" v-bind:key="inbox_item.layerID">
                  <b-list-group-item class="p-0 d-flex justify-content-between align-items-center">
                    <p class="ml-1 mb-0">
                      <b>{{ getUserName(inbox_item.userID) }}</b> wants to layer <b>{{ getLayerName(inbox_item.layerID) }}</b> on top of <b>{{ getLayerName(inbox_item.baseID) }}</b>
                    </p>
                    <p class="mr-1 mb-0">
                      <b-badge href="#" variant="dark" @click="playDraft(index, 'inbox')">play</b-badge>
                      <b-badge href="#" variant="success" @click="resolveDraft(index, 1)">accept</b-badge>
                      <b-badge href="#" variant="danger" @click="resolveDraft(index, 0)">reject</b-badge>
                    </p>
                  </b-list-group-item>
                </b-list-group>
              </b-tab>
              <b-tab title="outbox">
                <b-list-group v-for="(outbox_item, index) in outbox" v-bind:key="outbox_item.layerID">
                  <b-list-group-item class="p-0 d-flex justify-content-between align-items-center">
                    <p class="ml-1 mb-0">You want to layer <b>{{ getLayerName(outbox_item.layerID) }}</b> on top of <b>{{ getLayerName(outbox_item.baseID) }}</b> by <b>{{ getUserName(getBaseUser(outbox_item.baseID)) }}</b></p>
                    <p class="mr-1 mb-0">
                      <b-badge href="#" variant="dark" @click="playDraft(index, 'outbox')">play</b-badge>
                    </p>
                  </b-list-group-item>
                </b-list-group>
              </b-tab>
            </b-tabs>
          </b-tab>
          <b-tab title="releases">
            <b-list-group v-for="(disco_item, index) in discography" v-bind:key="disco_item.trackID">
              <b-list-group-item class="p-0 d-flex justify-content-between align-items-center">
                <p class="ml-2 mb-0">{{ getTrackName(disco_item.trackID) }}</p>
                <p class="mr-2 mb-0">
                  <b-badge href="#" variant="dark" @click="playDiscography(index)">play</b-badge>
                </p>
              </b-list-group-item>
            </b-list-group>
          </b-tab>
        </b-tabs>
      </b-collapse>
    </b-collapse>
    <b-navbar variant="faded" fixed="bottom" type="light" class="d-flex">
        <b-navbar-brand style="font-size:12px" class="m-auto">Copyright © 2023 - Ankoor Apte. All rights reserved.</b-navbar-brand>
    </b-navbar>
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
      newEmail: "",
      busy: true,
      showSettings: false,
      showLayers: false,
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
      merger: null,
      mixedAudio: null,
      seeker: 0,
      inbox: [],
      outbox: [],
      discography: [],
      draft: "",
      activeLayer: "",
      inactiveLayers: [],

    }
  },
  async created() {
    let self = this;
    onAuthStateChanged(auth, async (user) => {
      self.busy = true;
      if(user) { await self.signIn(user); }
      if(self.signedIn) {
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
    },
    stateEmail() {
      return this.newEmail.includes("@") && this.email.includes(".");
    }
  },
  methods: {
    async pLayerAPI(endpoint = "", arg = {}) {
      this.busy = true;
      arg['id'] = await this.user.getIdToken(/* forceRefresh */ true);
      arg['endpoint_name'] = endpoint;
      let res = await fetch('https://us-central1-player-76353.cloudfunctions.net/pLayerAPI',{
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(arg)
      });
      let res_json = await res.json();
      this.busy = false;
      if(res_json['stack'] && res_json['stack'].slice(0,5) == "Error") {
        throw new Error(res_json.message);
      } else if(res_json['status'] && res_json['status'] == "ok") {
        return res_json['data'];
      } else {
        throw new Error("No status found in response");
      }
    },
    async createUser() {
      this.user = await this.pLayerAPI("createUser", {
        email: self.email,
        password: self.password
      });
    },
    async signIn(user) {
      this.showSettings = false;
      this.showCreatorTools = false;
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
          alert('oops')
        }
        if(e.code == "auth/wrong-password") {
          alert("Wrong password!")
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
      this.showSettings = false;
      this.showCreatorTools = false;
      await signOut(auth);
    },
    async changeUsername(un) {
      if(!un) un = this.newUsername;
      await this.pLayerAPI("updateUser",{
        field: "username",
        value: un
      });
    },
    async changePassword() {
      let pw = this.newPassword;
      await this.pLayerAPI("updateUser",{
        field: "password",
        value: pw
      });
    },
    async changeEmail() {
      let email = this.newEmail;
      await this.pLayerAPI("updateUser",{
        field: "email",
        value: email
      });
      await this.signOut();
    },
    async getLayerBuffer(layerID) {
      let data = await (await fetch(await getDownloadURL(ref(storage, layerID)))).arrayBuffer()
      return {
        id: layerID,
        user: layers[layerID].user,
        data: data.slice()
      }
    }, 
    async getTrack(draftLayer="") {
      if(!Object.keys(tracks).length) return;
      this.busy = true;
      let trackLayers = tracks[this.trackID].layers.slice();
      if(draftLayer.length) trackLayers.push(draftLayer);
      this.draft = draftLayer;
      this.layerBuffers = await Promise.all(trackLayers.map(this.getLayerBuffer));
      this.artistNames = trackLayers.map((layerID) => users[layers[layerID]['user']]['displayName']);
      this.artistNames = [...new Set(this.artistNames)];
      this.trackName = tracks[this.trackID]['name'];
      this.block = {};
      trackLayers.forEach((l) => this.block[l] = false);
      this.busy = false;
    },
    layerPaused(layerID) {
      let self = this;
      let trackLayers = tracks[self.trackID].layers.slice();
      if(!self.inactiveLayers.length) {
        self.activeLayer = layerID;
        self.inactiveLayers = trackLayers.filter((l) => l != layerID);
      }
      if(self.activeLayer == layerID) {
        trackLayers.forEach((l) => {
          if(l != layerID) self.$refs[l][0].pause();
        });
      } else {
        self.inactiveLayers = self.inactiveLayers.filter((l) => l != layerID);
      }
    },
    layerTimeUpdate(layerID) {
      let self = this;
      if(self.activeLayer == layerID) {
        trackLayers.forEach((l) => {
          if(l != layerID) self.$refs[l][0].currentTime = self.$refs[layerID][0].currentTime;
        });
      }
    },
    layerPlayed(layerID) {
      let self = this;
      let trackLayers = tracks[self.trackID].layers.slice();
      if(!self.inactiveLayers.length) {
        self.activeLayer = layerID;
        self.inactiveLayers = trackLayers.filter((l) => l != layerID);
      }
      if(self.activeLayer == layerID) {
        trackLayers.forEach((l) => {
          if(l != layerID) self.$refs[l][0].play();
        });
      } else {
        self.inactiveLayers = self.inactiveLayers.filter((l) => l != layerID);
      }
    },
    layerSeeked(layerID) {
      let self = this;
      let trackLayers = tracks[self.trackID].layers.slice();
      if(!self.inactiveLayers.length) {
        self.activeLayer = layerID;
        self.inactiveLayers = trackLayers.filter((l) => l != layerID);
      }
      if(self.activeLayer == layerID) {
        trackLayers.forEach((l) => {
          if(l != layerID) self.$refs[l][0].currentTime = self.$refs[layerID][0].currentTime;
        });
      } else {
        self.inactiveLayers = self.inactiveLayers.filter((l) => l != layerID);
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
      this.seeker = 0;
      await this.getTrack();
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
    updateDiscography() {
      this.discography = Object.keys(tracks).filter((trackID) => layers[trackID].user == this.user.uid).map((t) => {return {trackID:t}})
    },
    async playDiscography(index) {
      this.trackID = this.discography[index].trackID;
      await this.getTrack();
    },
    async playDraft(index, whichbox) {
      this.seeker = 0;
      this.trackID = this[whichbox][index].baseID
      await this.getTrack(this[whichbox][index].layerID);
    },
    async resolveDraft(index, accept) {
      let layerID = this.inbox[index].layerID;
      let baseID = this.inbox[index].baseID;
      await this.pLayerAPI("resolveLayer",{
        layerID: layerID,
        baseID: baseID,
        accept: accept
      });
    },
    getLayerName(uid) {
      if(!uid || !Object.keys(layers).length) return;
      return layers[uid].name;
    },
    getLayerURL(buffer) {
      return window.URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
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
    emailKeydownHandler(event) {
      if (event.which === 13 && this.stateEmail) {
        this.changeEmail();
      }
    }
  }
});