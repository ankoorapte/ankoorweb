const admin = require("firebase-admin");
admin.initializeApp();

const auth = admin.auth();
const db = admin.firestore();
const tracks = db.collection("tracks");
const layers = db.collection("layers");
const users = db.collection("users");
const groups = db.collection("groups");

const onlyUnique = (value, index, array) => {
  return array.indexOf(value) === index;
};

const groupExists = async (groupID) => {
  const doc = await groups.doc(groupID).get();
  return doc.exists;
};

const addGroupToClaims = async (uid, groupID) => {
  const u = await auth.getUser(uid);
  const groups = [];
  if (u.customClaims && u.customClaims["groups"]) {
    for (const groupID of u.customClaims["groups"]) {
      if (await groupExists(groupID)) {
        groups.push(groupID);
      }
    }
  }

  groups.push(groupID);

  await auth.setCustomUserClaims(uid, {
    groups: groups.filter(onlyUnique),
  });
};

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
      console.log(this.user.customClaims);
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
  async getDB() {
    const db = {
      tracks: {},
      layers: {},
      users: {},
      groups: {},
    };
    (await layers.get()).forEach((doc) => {
      db.layers[doc.id] = doc.data();
    });

    (await tracks.get()).forEach((doc) => {
      db.tracks[doc.id] = doc.data();
    });

    (await users.get()).forEach((doc) => {
      db.users[doc.id] = doc.data();
    });

    (await groups.get()).forEach((doc) => {
      db.groups[doc.id] = doc.data();
    });

    for (const uid of Object.keys(db.users)) {
      const userRecord = await auth.getUser(uid);
      db.users[uid]["email"] = userRecord.email;
    }
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
      const now = admin.firestore.Timestamp.now();
      console.log(userRecord);
      this.user = userRecord;
      await users.doc(this.user.uid).set({
        displayName: arg.email,
        dateCreated: now,
        dateUpdated: now,
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
    update["dateUpdated"] = admin.firestore.Timestamp.now();
    if (arg.field === "displayName") {
      await users.doc(this.user.uid).update(update);
    }
    if (arg.field === "email") {
      update["emailVerified"] = false;
    }
    await auth.updateUser(this.user.uid, update);
    return {status: "ok"};
  }
  async createGroup(arg) {
    this.validateArg(arg, ["groupID", "name", "users"]);
    const now = admin.firestore.Timestamp.now();
    const creator = this.user.uid;
    arg.users.push(creator);

    // update database
    await groups.doc(arg.groupID).set({
      name: arg.name,
      creator: creator,
      users: arg.users.filter(onlyUnique),
      dateCreated: now,
      dateUpdated: now,
    });

    // update claims
    for (const uid of arg.users) {
      await addGroupToClaims(uid, arg.groupID);
    }
    return {status: "ok"};
  }
  async updateGroup(arg) {
    this.validateArg(arg, ["groupID", "field", "value"]);
    if (!(["name", "users"].includes(arg.field))) {
      throw new Error("field must be name, or users");
    }
    if (arg.field === "users") {
      await addGroupToClaims(arg.value, arg.groupID);
      arg.value = admin.firestore.FieldValue.arrayUnion(arg.value);
    }
    const update = {};
    update[arg.field] = arg.value;
    update["dateUpdated"] = admin.firestore.Timestamp.now();
    await groups.doc(arg.groupID).update(update);
    return {status: "ok"};
  }
  async resolveLayer(arg) {
    this.validateArg(arg, ["layerID", "baseID", "accept"]);
    const now = admin.firestore.Timestamp.now();
    await layers.doc(arg.layerID).update({
      resolved: true,
      dateUpdated: now,
    });
    if (arg.accept) {
      await tracks.doc(arg.baseID).update({
        layers: admin.firestore.FieldValue.arrayUnion(arg.layerID),
        dateUpdated: now,
      });
    }
    return {status: "ok"};
  }
  async getTimeline(arg) {
    this.validateArg(arg, ["trackID"]);
    const timeline = [];
    const trackDoc = await tracks.doc(arg.trackID).get();
    if (trackDoc.data()["comments"]) {
      timeline.push(...trackDoc.data()["comments"]);
    }

    timeline.push({
      uid: trackDoc.id,
      user: trackDoc.data().user,
      when: trackDoc.data().dateCreated,
      message: "created track " + trackDoc.data().name,
      resolved: true,
    });

    const layerDocs = await layers.where("base", "==", arg.trackID).get();
    layerDocs.forEach((doc) => {
      timeline.push({
        uid: doc.id,
        user: doc.data().user,
        when: doc.data().dateCreated,
        message: "added layer " + doc.data().name,
        resolved: doc.data().resolved,
      });
    });

    timeline.sort((a, b) => a.when.toMillis() - b.when.toMillis());
    timeline.forEach((event) => event.when = event.when.toDate().getTime());
    return {status: "ok", data: timeline};
  }
  async addComment(arg) {
    this.validateArg(arg, ["trackID", "message"]);
    const now = admin.firestore.Timestamp.now();
    const userID = this.user.uid;
    await tracks.doc(arg.trackID).update({
      comments: admin.firestore.FieldValue.arrayUnion({
        uid: arg.trackID,
        user: userID,
        when: now,
        message: arg.message,
        resolved: true,
      }),
    });
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
  const group = file.metadata.group;
  const isBase = !base.length; // empty string means isBase
  const now = admin.firestore.Timestamp.now();

  await layers.doc(uid).set({
    bucket: uid,
    name: name,
    base: base,
    user: user,
    bpm: bpm,
    group: group,
    resolved: isBase, // if isBase, resolved!
    dateCreated: now,
    dateUpdated: now,
  });

  if (isBase) {
    await tracks.doc(uid).set({
      layers: [uid],
      user: user,
      name: name,
      group: group,
      dateCreated: now,
      dateUpdated: now,
    });
  }
};
