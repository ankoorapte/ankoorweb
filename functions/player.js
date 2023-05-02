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
  async updateUsername(arg) {
    this.validateArg(arg);
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
    try {
      this.user = await this.authenticate(arg.id);
      console.log(user);
      console.log(arg.endpoint_name);
      console.log(arg.params);
      const res = await this[arg.endpoint_name](arg.params);
      console.log(res);
      return res;
    } catch (e) {
      return e;
    }
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
