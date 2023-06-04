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
  <div>
    <b-button v-b-toggle.sidebar-left variant="outline-dark"><b-icon icon="people"></b-icon></b-button>
    <b-sidebar id="sidebar-left" title="Groups" shadow>
      <p>Hello</p>
    </b-sidebar>
    <b-container style="background-color:#E1F3F6;" v-if=false>
      <b-row style="font-size:40px">
        <b-col>
          <b-button v-b-toggle.sidebar-left variant="outline-dark"><b-icon icon="people"></b-icon></b-button>
        </b-col>
        <b-col align="center">
          <h1 @click="tabIndex = 0" class="mt-2" style="font-family:Georgia, serif;"><b>pLayerDEV</b></h1>
        </b-col>
        <b-col>
        </b-col>
      </b-row>
      <div ref="pLayer"></div>
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
      <b-navbar v-if="signedIn" variant="faded" fixed="bottom" type="dark">
        <b-col align="center">
          <b-spinner v-show="busy" variant="dark" type="grow"></b-spinner>
          <p style="font-size:9px" class="m-auto">Copyright © 2023 - Ankoor Apte. All rights reserved.</p>
        </b-col>
      </b-navbar>
    </b-container>
  </div>
  `,
  data() {
    return {
      user: "",
      signedIn: false,
      email: "",
      password: "",
      busy: true,
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
        });

        unsubscribe_tracks = onSnapshot(collection(db, "tracks"), (trackDocs) => {
          tracks = {};
          trackDocs.forEach((doc) => {
            tracks[doc.id] = doc.data();
          });
          self.trackID = Object.keys(tracks)[0];
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
    },
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
      unsubscribe_tracks();
      unsubscribe_layers();
      unsubscribe_users();
      this.signedIn = false;
      this.user = null;
      this.email = "";
      this.password = "";
      await signOut(auth);
    },
    signinKeydownHandler(event) {
      if (event.which === 13 && this.stateCredentials) {
        this.signIn();
      }
    },
  }
});