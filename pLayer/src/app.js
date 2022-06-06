import { initializeApp } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-storage.js";
import { getFirestore, collection, getDocs, doc, setDoc  } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-firestore.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification, updateProfile, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.8.2/firebase-auth.js";

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

let L1 = {};
let L1_keys = [];
let users = {};
let user_uids = [];

let app = new Vue({
  el: '#app',
  template: `
  <b-container style="background-color:#E1F3F6;">
    <h1 class="m-2" align="center" style="font-family:Georgia, serif;"><b>pLayer</b></h1>
    <b-row><b-col align="center">
      <b-card v-if="!signedIn" align="center" class="w-50">
        <b-form-group
          id="fieldset-1"
          label="Enter your credentials"
          label-for="input-1"
          :invalid-feedback="invalidFeedback"
          :state="state"
          align="center"
        >
          <b-form-input placeholder="email" @keydown.native="signinKeydown" id="input-1" v-model="email" :state="state" trim></b-form-input>
          <b-form-input placeholder="password" @keydown.native="signinKeydown" type="password" id="input-2" v-model="password" :state="state" trim></b-form-input>
        </b-form-group>
        <b-button :disabled="!state" @click="signIn" variant="success">Sign In</b-button>
      </b-card>
    </b-col></b-row>
    <b-collapse v-model="signedIn">
      <b-card bg-variant="light" no-body class="m-4">
        <b-tabs pills card vertical v-model="tab" nav-wrapper-class="w-25">
          <b-tab title="Home" active :title-link-class="tabClass(0)">
            <b-row><b-col align="center">
              <p><b>{{trackName}}</b> by <b>{{artistName}}</b></p>
            </b-col></b-row>
            <b-row><b-col align="center">
              <audio class="m-2" ref="pLayer" controls>
                <source :src="trackURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
              <b-row><b-col align="center">
                <b-button @click="toggle(0)" class="m-2" variant="info"><b-icon icon="skip-backward-fill"></b-icon></b-button>
                <b-button @click="toggle(1)" class="m-2" variant="info"><b-icon icon="skip-forward-fill"></b-icon></b-button>
              </b-col></b-row>
            </b-col></b-row>
          </b-tab>
          <b-tab title="Create" :title-link-class="tabClass(1)">
            <b-row><b-col align="center">
              <b-form-file
                placeholder="Drop audio here"
                accept="audio/wav"
                @input="onLayer"
                class="m-2 w-75"
              ></b-form-file>
              <b-form-input class="w-75" v-model="layerName" placeholder="Name"></b-form-input>
              <br>
              <audio class="m-2" ref="layer" controls>
                <source :src="layerURL" type="audio/wav">
                Your browser does not support the <code>audio</code> element.
              </audio>
              <br>
              <b-button :disabled="notPostReady" class="m-2" variant="info" @click="upload">post to pLayer</b-button>
            </b-col></b-row>
          </b-tab>
          <b-tab title="Settings" :title-link-class="tabClass(2)"></b-tab>
        </b-tabs>
      </b-card>
    </b-collapse>
  </b-container>
  `,
  data() {
    return {
      tab: 0,
      layer: null,
      layerName: "",
      layerURL: null,
      artistName: "",
      trackName: "",
      trackURL: null,
      trackIdx: 0,
      user: "",
      signedIn: false,
      email: "",
      password: ""
    }
  },
  async created() {
    let self = this;
    let querySnapshot = await getDocs(collection(db, "L1"));
    querySnapshot.forEach((doc) => {
      L1[doc.id] = doc.data();
      L1_keys.push(doc.id);
    });
    if(L1_keys.length) {
      self.getLayer(L1_keys[0]).then(() => {});
    }

    querySnapshot = {};
    querySnapshot = await getDocs(collection(db, "users"));
    querySnapshot.forEach((doc) => {
      users[doc.id] = doc.data();
      user_uids.push(doc.id);
    });
  },
  computed: {
    notPostReady() {
      if(this.layer && this.layerName.length) {
        return false;
      }
      return true;
    },
    state() {
      return this.password.length >= 6 && this.email.includes("@");
    },
    invalidFeedback() {
      return 'Enter a valid email ID and password with minimum 6 characters.'
    }
  },
  methods: {
    tabClass(idx) {
      return (this.tab === idx) ? 
        ['bg-info', 'text-light'] : 
        ['bg-light', 'text-dark'];
    },
    async toggle(forward) {
      if(forward) { this.trackIdx++; }
      else { this.trackIdx--; }
      this.trackIdx = this.trackIdx % L1_keys.length;
      await this.getLayer(L1_keys[this.trackIdx]);
    },
    onLayer(layer) {
      this.layer = layer;
      this.layerURL = window.URL.createObjectURL(layer);
      this.$refs.layer.load();
    },
    async upload() {
      const uuidRef = ref(storage, 'public/'+uuidv4());
      const self = this;
      const metadata = {
        customMetadata: {
          'name': self.layerName,
          'user': self.user.uid
        }
      };
      await uploadBytes(uuidRef, self.layer, metadata);
      console.log('Uploaded file to ' + uuidRef._location.path_);
    },
    async getLayer(uuid) {
      let url = await getDownloadURL(ref(storage, 'public/'+uuid));
      let self = this;
      
      const xhr = new XMLHttpRequest();
      xhr.responseType = 'blob';
      xhr.onload = (event) => {
        self.trackName = L1[uuid]['name'];
        self.artistName = users[L1[uuid]['user']]['displayName'];
        self.trackURL = window.URL.createObjectURL(xhr.response);
        self.$refs.pLayer.load();
      };
      xhr.open('GET', url);
      xhr.send();
    },
    async signIn() {
      try {
        let userCredential = await signInWithEmailAndPassword(auth, this.email, this.password);
        this.user = userCredential.user;
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
        console.log(self.user);
        await sendEmailVerification(auth.currentUser);
        await updateProfile(auth.currentUser, { displayName: self.user.email });
        await setDoc(doc(db, "users", self.user.uid), {
          created: self.user.metadata.creationTime,
          displayName: self.user.displayName
        });
        alert('Please go to your email inbox and verify your email.')
      } catch(e) {
        console.log(e.code + ": " + e.message);
      }
    },
    signinKeydown(event) {
      if (event.which === 13 && this.state) {
        this.signIn();
      }
    }
  }
});

onAuthStateChanged(auth, (user) => {
  console.log(user);
  console.log(app)
});
