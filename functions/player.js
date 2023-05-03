const admin = require("firebase-admin");
admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();
const tracks = db.collection("tracks");
const layers = db.collection("layers");
const users = db.collection("users");

class Player {
  constructor() {
    this.api_params = {
      updateUsername: ["new_username"],
    };
  }
  async authenticate(id) {
    const decodedToken = await auth.verifyIdToken(id);
    return auth.getUser(decodedToken.uid);
  }
  validateArg(arg, params) {
    const valid = params.every((p) => {
      return Object.keys(arg).includes(p);
    });
    if (!valid) {
      throw new Error("invalid params");
    }
  }
  async updateUsername(arg) {
    this.validateArg(arg, ["new_username"]);
    await auth.updateUser(this.user.uid, {displayName: arg.user_name});
    await users.doc(this.user.uid).update({
      displayName: arg.user_name,
    });
    return {status: "pass"};
  }
  async process(arg) {
    this.user = await this.authenticate(arg.id);
    return this[arg.endpoint_name](arg);
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
