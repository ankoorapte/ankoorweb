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

import bpmDetective from 'https://cdn.jsdelivr.net/npm/bpm-detective@2.0.5/+esm';

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
const auth = getAuth(firebaseApp);

NodeList.prototype.forEach = Array.prototype.forEach;

// APP
let app = new Vue({
  el: '#app',
  // GUI
  template: `
  <b-container style="background-color:#E1F3F6;">
    <b-row style="font-size:30px" class="mb-1">
      <b-col align="center" class="d-flex justify-content-between align-items-center">
        <b-button v-if="signedIn" v-b-toggle.sidebar-group variant="outline-dark"><b-icon icon="people"></b-icon></b-button>
        <b class="mt-1 mx-auto" style="font-family:Georgia, serif;"><b>pLayerDEV</b></b>
        <b-button v-if="signedIn" v-b-toggle.sidebar-account variant="outline-dark"><b-icon icon="person"></b-icon></b-button>
      </b-col>
    </b-row>
    <div ref="pLayer"></div>
    <b-sidebar v-if="signedIn" id="sidebar-group" title="groups" header-class="mx-auto" shadow backdrop no-header-close>
      <b-col>
        <b-list-group v-for="(group_item, index) in myGroups" v-bind:key="group_item.uid" flush>
          <b-list-group-item :disabled="busy" variant="secondary" href="#" @click="pause(); activeGroup = group_item.uid; activeGroupName = group_item.name; play()" :active="activeGroup == group_item.uid" class="d-flex justify-content-between align-items-left">
            <p class="p-0 m-0">
              <b>{{group_item.name}}</b>
              {{group_item.users.join(", ")}}
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-list-group flush>
          <b-list-group-item :disabled="busy" variant="dark" href="#" @click="showNewGroup = !showNewGroup; activeGroup = ''; activeGroupName = '';" :active="showNewGroup" class="d-flex justify-content-between align-items-center">
            <p class="mx-auto my-0 p-0">
              create a new group 
              <b-icon icon="plus-circle" v-if="!showNewGroup"></b-icon>
              <b-icon icon="dash-circle" v-if="showNewGroup"></b-icon>
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-collapse v-model="showNewGroup">
          <b-form-group
            :state="stateGroup"
            align="center"
            description="enter emails separated by a space"
            class="my-1"
          >
            <b-form-input class="my-1" placeholder="group name" @keydown.native="groupKeydownHandler" v-model="newGroupName" :state="stateGroup"></b-form-input>
            <b-form-input class="my-1" placeholder="members (optional)" @keydown.native="groupKeydownHandler" v-model="newGroupUsers" :state="stateGroup"></b-form-input>
          </b-form-group>
          <b-button @click="createGroup" :disabled="!stateGroup" variant="dark" class="mx-auto my-1">create group</b-button>
        </b-collapse>
      </b-col>
    </b-sidebar>
    <b-sidebar v-if="signedIn" id="sidebar-account" title="account" header-class="mx-auto" align="center" right shadow backdrop no-header-close>
      <b-col align="center">
        <b-input-group class="my-1">
          <b-form-input
            placeholder="new username"
            @keydown.native="usernameKeydownHandler"
            v-model="newUsername" 
            :state="stateUsername" 
            trim
          >
          </b-form-input>
          <b-input-group-append>
            <b-button variant="dark" :sign="busy || !newUsername" @click="changeUsername()">update username</b-button>
          </b-input-group-append>
        </b-input-group>
        <b-input-group class="my-1">
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
        <b-input-group class="my-1">
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
        <a href="https://forms.gle/TSSQvBinSwGLrnyT6" target="_blank" class="text-dark my-1">Report feedback</a>
        <br>
        <b-button class="my-1" v-if="signedIn" variant="outline-danger" @click="signOut">sign out <b-icon icon="box-arrow-right"></b-icon></b-button>
      </b-col>
    </b-sidebar>
    <b-row><b-col align="center">
      <b-card v-if="!signedIn" align="center" class="w-75">
        <b-form-group
          :invalid-feedback="invalidCredentials"
          :state="stateCredentials"
          align="center"
        >
          <b-form-input placeholder="email" @keydown.native="signinKeydownHandler" v-model="email" :state="stateCredentials" trim></b-form-input>
          <b-form-input placeholder="password" @keydown.native="signinKeydownHandler" type="password" v-model="password" :state="stateCredentials" trim></b-form-input>
        </b-form-group>
        <b-button :disabled="!stateCredentials" @click="signIn(0)" variant="success">sign in</b-button>
      </b-card>
    </b-col></b-row>
    <b-collapse v-model="hideLayers"><b-row v-if="signedIn">
      <b-col v-if="activeGroup.length > 0">
        <b-form-group :description="getGroupUsers(activeGroup)" align="center">
          <b-input-group>
            <b-form-input v-model="activeGroupName" :state="groups[activeGroup].name != activeGroupName ? false : null" :disabled="groups[activeGroup].creator != user.uid"></b-form-input>
            <b-input-group-append>
              <b-button variant="outline-dark" @click="changeGroupName" v-show="groups[activeGroup].name != activeGroupName">save <b-icon icon="pencil"></b-icon></b-button>
              <b-button variant="outline-dark" @click="showAddUser = !showAddUser" v-if="groups[activeGroup].creator == user.uid"><b-icon icon="person-plus"></b-icon></b-button>
            </b-input-group-append>
          </b-input-group>
          <b-collapse v-model="showAddUser">
            <b-input-group>
              <b-form-input placeholder="new member email" @keydown.native="addUserKeydownHandler" v-model="userToAdd" :state="stateAddUser" trim></b-form-input>
              <b-input-group-append>
                <b-button variant="outline-dark" @click="addUser" :disabled="!stateAddUser">add user</b-button>
              </b-input-group-append>
            </b-input-group>
          </b-collapse>
        </b-form-group>
        <b-list-group v-for="(track_item, index) in groupTracks" v-bind:key="track_item.uid" flush>
          <b-list-group-item :disabled="busy" variant="secondary" href="#" @click="activeTrack = track_item.uid" :active="activeTrack == track_item.uid" class="d-flex justify-content-between align-items-left">
            <p class="p-0 m-0">
              <b>{{track_item.name}}</b> {{track_item.layers.map((uid) => getUserName(getLayerUser(uid))).join(", ")}}
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-list-group flush>
          <b-list-group-item :disabled="busy" variant="dark" href="#" @click="showNewTrack = !showNewTrack; activeTrack = ''" :active="showNewTrack" class="d-flex justify-content-between align-items-center">
            <p class="mx-auto my-0 p-0">
              create a new track
              <b-icon icon="plus-circle" v-if="!showNewTrack"></b-icon>
              <b-icon icon="dash-circle" v-if="showNewTrack"></b-icon>
            </p>
          </b-list-group-item>
        </b-list-group>
        <b-collapse v-model="showNewTrack" align="center">
          <b-row><b-col align="center">
            <b-input-group class="m-1">
              <b-form-file
                placeholder="click or drop"
                accept="audio/wav"
                v-model="newTrack"
                browse-text="upload"
                @input="detectBPM"
                :disabled="busy"
              ></b-form-file>
            </b-input-group>
            <b-input-group append="name" class="m-1">
              <b-form-input v-model="newTrackName" :disabled="busy"></b-form-input>
            </b-input-group>
            <b-input-group append="BPM" class="m-1">
              <b-form-input v-model="newTrackBPM" :disabled="busy"></b-form-input>
            </b-input-group>
            <p class="m-1">
              <b-button :disabled="busy || !newTrack || !newTrackName.length || !newTrackBPM.length" variant="success" @click="postTrack()">post</b-button>
            </p>
          </b-col></b-row>
        </b-collapse>
      </b-col>
    </b-row></b-collapse>
    <b-navbar v-if="signedIn" variant="faded" fixed="bottom" type="dark">
      <b-col align="center">
        <b-spinner v-show="busy" variant="dark" type="grow"></b-spinner>
        <b-button-group v-if="!busy && activeTrack.length > 0" size="lg" class="my-1">
          <b-button class="p-1" variant="dark" @click="toggleTrack(0)"><b-icon icon="skip-backward-fill"></b-icon></b-button>
          <b-button class="p-1" variant="dark" @click="pause()" v-show="!paused"><b-icon icon="pause-fill"></b-icon></b-button>
          <b-button class="p-1" variant="dark" @click="play()" v-show="paused"><b-icon icon="play-fill"></b-icon></b-button>
          <b-button class="p-1" variant="dark" @click="toggleTrack(1)"><b-icon icon="skip-forward-fill"></b-icon></b-button>
        </b-button-group>
        <b-list-group v-if="!busy && activeTrack.length > 0" flush>
          <b-list-group-item :disabled="busy" variant="secondary" active href="#" @click="showLayers = !showLayers" class="d-flex justify-content-between align-items-center">
              <p class="p-0 m-0"> 
                <b>{{ getTrackName(activeTrack) }}</b>
                {{ getTrackArtists(activeTrack).join(", ") }}
                <i>{{ getTrackBPM(activeTrack) }} BPM</i>
              </p>
              <p class="p-0 m-0">
                {{ trackTimestamp(slider) }}/{{ trackTimestamp(trackDuration) }}
              </p>
          </b-list-group-item>
        </b-list-group>
        <b-collapse v-model="showTimeline">
          <b-list-group v-if="!busy && activeTrack.length > 0" flush>
            <b-list-group-item :disabled="busy" variant="secondary" class="p-0">
              <b-card style="height:300px" no-header class="w-100 m-0">
              </b-card>
            </b-list-group-item>
          </b-list-group>
        </b-collapse>
        <b-collapse v-model="showLayers" v-if="!busy && activeTrack.length > 0">
          <b-list-group v-for="(layer_item, index) in layerBuffers" v-bind:key="index" flush>
            <b-list-group-item :disabled="busy" variant="secondary" class="d-flex justify-content-between align-items-center">
                <p class="p-0 m-0"> 
                  <b>{{ getLayerName(layer_item.id) }}</b>
                  {{ getUserName(layer_item.user) }}
                </p>
                <p class="p-0 m-0">
                  <b-badge href="#" variant="dark" @click="downloadLayer(index)"><b-icon icon="download"></b-icon></b-badge>
                  <b-badge href="#" variant="dark" @click="muteLayer(index)" v-if="layerGains[index] && layerGains[index].gain.value"><b-icon icon="volume-up-fill"></b-icon></b-badge>
                  <b-badge href="#" variant="danger" @click="unmuteLayer(index)" v-if="layerGains[index] && !layerGains[index].gain.value"><b-icon icon="volume-mute-fill"></b-icon></b-badge>
                </p>
            </b-list-group-item>
          </b-list-group>
          <b-list-group flush>
            <b-list-group-item :disabled="busy" variant="dark" href="#" @click="showNewLayer = !showNewLayer" :active="showNewLayer" class="d-flex justify-content-between align-items-center">
              <p class="mx-auto my-0 p-0">
                create a new layer
                <b-icon icon="plus-circle" v-if="!showNewLayer"></b-icon>
                <b-icon icon="dash-circle" v-if="showNewLayer"></b-icon>
              </p>
            </b-list-group-item>
          </b-list-group>
          <b-collapse v-model="showNewLayer" align="center">
            <b-row><b-col align="center">
              <b-input-group class="m-1">
                <b-form-file
                  placeholder="click or drop"
                  accept="audio/wav"
                  v-model="newLayer"
                  browse-text="upload"
                  :disabled="busy"
                ></b-form-file>
              </b-input-group>
              <b-input-group append="name" class="m-1">
                <b-form-input v-model="newLayerName" :disabled="busy"></b-form-input>
              </b-input-group>
              <p class="m-1">
                <b-button :disabled="busy || !newLayer || !newLayerName.length" variant="success" @click="postLayer()">post</b-button>
              </p>
            </b-col></b-row>
          </b-collapse>
        </b-collapse>
        <b-form-input v-if="!busy && activeTrack.length > 0" type="range" @input="seekerInput" v-model="slider" min="0" :max="trackDuration" step="0.1"></b-form-input>
        <p style="font-size:9px" class="m-auto">Copyright © 2023 - Ankoor Apte. All rights reserved.</p>
      </b-col>
    </b-navbar>
  </b-container>
  `,
  data() {
    return {
      busy: true,
      tracks: {},
      layers: {},
      users: {},
      groups: {},
      user: "",
      signedIn: false,
      email: "",
      password: "",
      myGroups: [],
      newGroupName: "",
      newGroupUsers: "",
      activeGroup: "",
      activeGroupName: "",
      newUsername: "",
      newPassword: "",
      newEmail: "",
      showNewGroup: false,
      showAddUser: false,
      showNewTrack: false,
      showNewLayer: false,
      showLayers: false,
      userToAdd: "",
      newTrack: null,
      newTrackName: "",
      newLayer: null,
      newLayerName: "",
      newTrackBPM: "",
      activeTrack: "",
      groupTracks: [],
      paused: true,
      layerBuffers: [],
      audioContext: null,
      merger: null,
      layerMute: [],
      layerGains: [],
      trackLayers: [],
      seeker: 0,
      slider: 0,
      trackDuration: 0,
      interval: 0,
      trackIdx: 0,
    }
  },
  watch: {
    // whenever question changes, this function will run
    activeGroup(newGroup, oldGroup) {
      let self = this;
      self.pause();
      self.groupTracks = Object.keys(self.tracks).filter((trackID) => self.layers[trackID].group === newGroup).map((trackID) => {
        return {
          uid: trackID,
          name: self.tracks[trackID].name,
          layers: self.tracks[trackID].layers
        }
      });
      this.showNewGroup = !newGroup.length;
      if(!newGroup.length) this.activeTrack = "";
      this.showNewTrack = false;
      this.showLayers = false;
    },
    async activeTrack(newTrack, oldTrack) {
      this.busy = true;
      await this.pause()
      await this.getTrack();
      this.showNewTrack = !newTrack.length;
      if(newTrack.length) await this.play();
      this.busy = false;
    }
  },
  async created() {
    let self = this;
    onAuthStateChanged(auth, async (user) => {
      self.busy = true;
      if(user) { await self.signIn(user); }
      if(self.signedIn) {
        self.resetAudioContext();
        await self.updateDB();
      }
      self.busy = false;
    });
    self.busy = false;
  },
  computed: {
    invalidCredentials() {
      return 'enter a valid email ID and password with minimum 6 characters.'
    },
    stateCredentials() {
      return this.password.length >= 6 && this.email.includes("@") && this.email.includes(".");
    },
    stateGroup() {
      return Boolean(this.newGroupName.length) && this.newGroupUsers.split(" ").filter((s) => s.length).every((email) => Object.keys(this.users).map((uid) => this.users[uid].email).includes(email));
    },
    stateAddUser() {
      return Object.keys(this.users).map((uid) => this.users[uid].email).includes(this.userToAdd);
    },
    stateUsername() {
      return this.user
        && !Object.keys(this.users).includes(this.newUsername)
        && Boolean(this.newUsername.length);
    },
    statePassword() {
      return this.newPassword.length >= 6;
    },
    stateEmail() {
      return this.newEmail.includes("@") && this.email.includes(".");
    },
    hideLayers: {
      get() {
        return !this.showLayers;
      },
      set(newValue) {
        // Note: we are using destructuring assignment syntax here.
        this.showLayers = !newValue;
      }
    },
    showTimeline: {
      get() {
        return Boolean(this.activeGroup.length) && Boolean(this.activeTrack.length) && this.showLayers && !this.showNewLayer;
      },
      set(newValue) {
      }
    }
  },
  methods: {
    isMobile() {
      let check = false;
      (function(a){if(/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a)||/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0,4))) check = true;})(navigator.userAgent||navigator.vendor||window.opera);
      return check;
    },
    async pLayerAPI(endpoint = "", arg = {}) {
      this.busy = true;
      if(endpoint != "createUser") arg['id'] = await this.user.getIdToken(/* forceRefresh */ true);
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
    async updateDB() {
      let self = this;
      const db = await self.pLayerAPI("getDB");
      self.tracks = db.tracks;
      self.layers = db.layers;
      self.users = db.users;
      self.groups = db.groups;
      self.myGroups = Object.keys(self.groups).filter((groupID) => self.groups[groupID].users.includes(self.user.uid)).map((uid) => {
        return {
          uid: uid,
          name: self.groups[uid].name,
          users: self.groups[uid].users.map(this.getUserName)
        }
      });
    },
    async createUser() {
      let self = this;
      self.user = await self.pLayerAPI("createUser", {
        email: self.email,
        password: self.password
      });
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
      this.resetAudioContext();
      await this.pause();
      this.signedIn = false;
      this.user = null;
      this.email = "";
      this.password = "";
      this.tracks = {};
      this.layers = {};
      this.users = {};
      await signOut(auth);
    },
    async createGroup() {
      let self = this;
      const newGroupUserList = self.newGroupUsers.split(" ").filter((s) => s.length);
      await self.pLayerAPI("createGroup", {
        name: self.newGroupName,
        groupID: uuidv4(),
        users: Object.keys(self.users).filter((uid) => newGroupUserList.includes(self.users[uid].email))
      });
      await self.updateDB();
    },
    async changeUsername(un) {
      if(!un) un = this.newUsername;
      this.user.displayName = this.newUsername;
      await this.pLayerAPI("updateUser",{
        field: "displayName",
        value: un
      });
      await this.updateDB();
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
    async changeGroupName() {
      let name = this.activeGroupName;
      let gid = this.activeGroup;
      await this.pLayerAPI("updateGroup",{
        groupID: gid,
        field: "name",
        value: name
      });
      await this.updateDB();
    },
    async addUser() {
      let newUser = Object.keys(this.users).filter((uid) => this.users[uid].email == this.userToAdd)[0];
      let gid = this.activeGroup;
      await this.pLayerAPI("updateGroup",{
        groupID: gid,
        field: "users",
        value: newUser
      });
      this.showAddUser = false;
      await this.updateDB();
    },
    async seekerInput(seek) {
      clearInterval(this.interval);
      this.seeker = parseFloat(seek);
      await this.pause();
      await this.play();
    },
    updateSlider() {
      this.slider = this.seeker + this.audioContext.currentTime;
      if(this.slider > this.trackDuration) {
        clearInterval(this.interval);
      }
    },
    resetAudioContext() {
      this.audioContext = new AudioContext();
      this.merger = this.audioContext.createChannelMerger(2)
      this.merger.connect(this.audioContext.createMediaStreamDestination());
      this.merger.connect(this.audioContext.destination);
    },
    async getLayerBuffer(layerID) {
      let fetch_res = await fetch(await getDownloadURL(ref(storage, layerID)));
      let data = await fetch_res.arrayBuffer();
      return {
        id: layerID,
        name: this.layers[layerID].name,
        user: this.layers[layerID].user,
        data: data.slice(),
        decoded_data: await this.audioContext.decodeAudioData(data)
      }
    }, 
    async getTrack() {
      if(!this.groupTracks.length || !this.activeTrack.length) return;
      this.busy = true;
      let trackLayers = this.tracks[this.activeTrack].layers.slice();
      this.layerBuffers = await Promise.all(trackLayers.map(this.getLayerBuffer));
      this.seeker = 0;
      this.slider = 0;
      this.trackDuration = this.layerBuffers[0].decoded_data.duration;
      this.trackIdx = this.groupTracks.findIndex((track) => track.uid == newTrack);
      this.busy = false;
    },
    async pause() {
      if(!this.paused) await this.togglePlay();
    },
    async play() {
      if(this.paused) await this.togglePlay();
    },
    async togglePlay() {
        if(this.paused) {
          this.resetAudioContext();
          for(const idx in this.layerBuffers) {
            var gainNode = this.audioContext.createGain();
            gainNode.gain.value = this.layerMute[idx] ? 0 : 1;
            gainNode.connect(this.merger, 0, 0);
            gainNode.connect(this.merger, 0, 1);
            this.layerGains.push(gainNode);
            let source = this.audioContext.createBufferSource();
            source.buffer = this.layerBuffers[idx].decoded_data;
            source.connect(gainNode);
            source.start(0, this.seeker);
            this.trackLayers.push(source);
            let self = this;
            source.onended = () => {
              if(Math.ceil(self.slider) == Math.ceil(self.trackDuration)) {
                self.pause();
              }
            }
          }
          this.interval = setInterval(this.updateSlider, 100);
        } else {
          clearInterval(this.interval);
          this.seeker += this.audioContext.currentTime;
          this.trackLayers.forEach((node) => node.stop());
          this.trackLayers = [];
          this.layerGains = [];
        }
      this.paused = !this.paused;
    },
    async toggleTrack(forward) {
      await this.pause();
      this.busy = true;
      if(forward) { this.trackIdx++; }
      else { 
        if(!this.trackIdx) this.trackIdx = this.groupTracks.length;
        this.trackIdx--;
      }
      this.trackIdx = this.trackIdx % this.groupTracks.length;
      this.activeTrack = this.groupTracks[this.trackIdx].uid;
      await this.getTrack();
      this.busy = false;
    },
    async postTrack() {
      let self = this;
      self.busy = true;
      const uid = uuidv4();
      const trackPath = ref(storage, uid);
      const metadata = {
        customMetadata: {
          'name': self.newTrackName,
          'user': self.user.uid,
          'base': "",
          'bpm': self.newTrackBPM,
          'group': self.activeGroup
        },
        contentType: 'audio/wav'
      }; 
      await uploadBytes(trackPath, self.newTrack, metadata);
      self.newTrackName = "";
      self.newTrackBPM = "";
      self.newTrack = null;
      self.busy = false;
      self.updateDB();
    },
    async postLayer() {
      let self = this;
      self.busy = true;
      const uid = uuidv4();
      const trackPath = ref(storage, uid);
      const metadata = {
        customMetadata: {
          'name': self.newLayerName,
          'user': self.user.uid,
          'base': self.activeTrack,
          'bpm': self.getTrackBPM(self.activeTrack),
          'group': self.activeGroup
        },
        contentType: 'audio/wav'
      }; 
      await uploadBytes(trackPath, self.newTrack, metadata);
      self.newLayerName = "";
      self.newLayer = null;
      self.busy = false;
      self.showLayers = false;
      self.updateDB();
    },
    muteLayer(index) {
      this.layerMute[index] = true;
      this.layerGains[index].gain.value = 0;
    },
    unmuteLayer(index) {
      this.layerMute[index] = false;
      this.layerGains[index].gain.value = 1;
    },
    async downloadLayer(index) {
      this.busy = true;
      let blob = await (await fetch(await getDownloadURL(ref(storage, this.layerBuffers[index].id)))).blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = this.layerBuffers[index].name + ".wav";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      this.busy = false;
    },
    async detectBPM() {
      if(this.newTrack) {
        let ac = new AudioContext();
        this.newTrackBPM = bpmDetective(await ac.decodeAudioData(await this.newTrack.arrayBuffer())).toString();  
      }
    },
    trackTimestamp(seconds) {
      let minutes = Math.floor(seconds / 60);
      let extraSeconds = seconds % 60;
      minutes = minutes < 10 ? "0" + minutes : minutes;
      extraSeconds = extraSeconds < 10 ? "0" + extraSeconds : extraSeconds;
      return minutes + ":" + extraSeconds.toString().slice(0, 2);
    },
    getGroupUsers(uid) {
      if(!uid || !Object.keys(this.groups).length) return [];
      return this.groups[uid].users.map(this.getUserName).join(", ");
    },
    getTrackBPM(uid) {
      if(!uid || !Object.keys(this.tracks).length) return [];
      return this.layers[uid].bpm;
    },
    getTrackName(uid) {
      if(!uid || !Object.keys(this.tracks).length) return "";
      return this.tracks[uid].name;
    },
    getTrackArtists(uid) {
      if(!uid || !Object.keys(this.tracks).length) return [];
      return [...new Set(this.tracks[uid].layers.map((layerID) => this.getUserName(this.layers[layerID].user)))];
    },
    getLayerName(uid) {
      if(!uid || !Object.keys(this.layers).length) return "";
      return this.layers[uid].name;
    },
    getLayerUser(uid) {
      if(!uid || !Object.keys(this.layers).length) return [];
      return this.layers[uid].user;
    },
    getUserName(uid) {
      if(!uid || !Object.keys(this.users).length) return [];
      return this.users[uid].displayName;
    },
    usernameKeydownHandler(event) {
      if (event.which === 13 && this.stateUsername) {
        this.changeUsername();
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
    },
    async signinKeydownHandler(event) {
      if (event.which === 13 && this.stateCredentials) {
        await this.signIn();
      }
    },
    async groupKeydownHandler(event) {
      if (event.which === 13 && this.stateGroup) {
        await this.createGroup();
      }
    },
    async addUserKeydownHandler(event) {
      if (event.which === 13 && this.stateGroup) {
        await this.addUser();
      }
    }
  }
});