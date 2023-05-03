const admin = require("firebase-admin");
admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();
const tracks = db.collection("tracks");
const layers = db.collection("layers");
const users = db.collection("users");

class Player {
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
  async updateUser(arg) {
    this.validateArg(arg, ["field", "value"]);
    if (!(["username", "password", "email"].includes(arg.field))) {
      throw new Error("field must be username, password, or email");
    }
    const update = {};
    update[arg.field] = arg.value;
    if (arg.field === "displayName") {
      await users.doc(this.user.uid).update(update);
    }
    if (arg.field === "email") {
      update["emailVerified"] = false;
    }
    await auth.updateUser(this.user.uid, update);
    return {status: "ok"};
  }
  async resolveLayer(arg) {
    this.validateArg(arg, ["layerID", "baseID", "accept"]);
    await layers.doc(arg.layerID).update({
      resolved: true,
    });
    if (arg.accept) {
      await tracks.doc(arg.baseID).update({
        layers: admin.firestore.FieldValue.arrayUnion(arg.layerID),
      });
    }
    return {status: "ok"};
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
