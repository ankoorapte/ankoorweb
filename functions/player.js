const admin = require("firebase-admin");
admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();
const tracks = db.collection("tracks");
const layers = db.collection("layers");

class Player {
  validateArg(arg) {
    return arg;
  }
  async authenticate(id) {
    const decodedToken = await auth.verifyIdToken(id);
    return auth.getUser(decodedToken.uid);
  }
  async process(arg) {
    const user = await this.authenticate(arg.id);
    console.log(user);
    this.validateArg(arg);
    return {};
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
