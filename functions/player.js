const admin = require("firebase-admin");
admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();
const tracks = db.collection("tracks");
const layers = db.collection("layers");
const users = db.collection("users");

class Player {
  async authenticate(id) {
    try {
      const decodedToken = await auth.verifyIdToken(id);
      return auth.getUser(decodedToken.uid);
    } catch (e) {
      throw new Error(e);
    }
  }
  async process(arg) {
    if (arg.endpoint_name != "createUser") {
      this.user = await this.authenticate(arg.id);
    }
    return this[arg.endpoint_name](arg);
  }
  validateArg(arg, params) {
    const valid = params.every((p) => {
      return Object.keys(arg).includes(p);
    });
    if (!valid) {
      throw new Error("invalid params");
    }
  }
  async getDB(arg) {
    const db = {};
    (await layers.get()).forEach((doc) => {
      db["layers"][doc.id] = doc.data();
    });

    (await tracks.get()).forEach((doc) => {
      db["tracks"][doc.id] = doc.data();
    });

    (await users.get()).forEach((doc) => {
      db["users"][doc.id] = doc.data();
    });
    return {status: "ok", data: db};
  }
  async createUser(arg) {
    this.validateArg(arg, ["email", "password"]);
    try {
      const userRecord = await auth.createUser({
        email: arg.email,
        emailVerified: false,
        password: arg.password,
        displayName: arg.email,
      });
      console.log(userRecord);
      this.user = userRecord;
      await users.doc(this.user.uid).set({
        displayName: arg.email,
        dateCreated: admin.firestore.Timestamp.now(),
      });
      return {status: "ok", data: userRecord.user};
    } catch (e) {
      throw new Error(e.code + ": " + e.message);
    }
  }
  async updateUser(arg) {
    this.validateArg(arg, ["field", "value"]);
    if (!(["displayName", "password", "email"].includes(arg.field))) {
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
}

exports.api = async (arg) => {
  const player = new Player();
  return player.process(arg);
};

// To deploy, run in "functions" directory:
// gcloud functions deploy updateDB --runtime nodejs16
// --trigger-resource player-76353.appspot.com
// --trigger-event google.storage.object.finalize
exports.updateDB = async (file, context) => {
  const uid = file.name;
  const name = file.metadata.name;
  const user = file.metadata.user;
  const bpm = file.metadata.bpm;
  const base = file.metadata.base;
  const isBase = !base.length; // empty string means isBase

  await layers.doc(uid).set({
    bucket: uid,
    name: name,
    base: base,
    user: user,
    bpm: bpm,
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
