const admin = require("firebase-admin");
admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();
const tracks = db.collection("tracks");
const layers = db.collection("layers");

class Player {
  constructor() {
    this.api_params = {
      updateUsername: ["new_username"],
    };
  }
  validateParams(endpoint, params) {
    const valid = this.api_params[endpoint].every((p) => {
      return Object.keys(params).includes(p);
    });
    if (valid) {
      console.log("valid params");
      return;
    } else {
      throw new Error("invalid params");
    }
  }
  async updateUsername(params) {
    // await updateProfile(this.user, { displayName: arg.user_name });
    // await setDoc(doc(db, "users", self.user.uid), {
    //   displayName: un
    // });
    return {pass: true};
  }
  async authenticate(id) {
    const decodedToken = await auth.verifyIdToken(id);
    return auth.getUser(decodedToken.uid);
  }
  async process(arg) {
    this.user = await this.authenticate(arg.id);
    this.validateParams(arg.endpoint_name, arg.params);
    const res = await this[arg.endpoint_name](arg.params);
    return res;
  }
}

exports.api = async (arg) => {
  const player = new Player();
  return player.process(arg);
};

exports.updateDB = async (file, context) => {
  const uid = file.name;
  const name = file.metadata.name;
  const user = file.metadata.user;
  const base = file.metadata.base;
  const isBase = !base.length; // empty string means isBase

  await layers.doc(uid).set({
    bucket: uid,
    name: name,
    base: base,
    user: user,
    resolved: isBase, // if isBase, resolved!
    timestamp: file.updated,
  });

  if (isBase) {
    await tracks.doc(uid).set({
      layers: [uid],
      name: name,
    });
  }
};
