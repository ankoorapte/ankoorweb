const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const tracks = db.collection("tracks");
const layers = db.collection("layers");

// To deploy, run in "functions" directory:
// gcloud functions deploy updateDB --runtime nodejs16
// --trigger-resource player-76353.appspot.com
// --trigger-event google.storage.object.finalize
exports.updateDB = async (file, context) => {
  const uid = file.name;
  const base = file.metadata.base;
  const name = file.metadata.name;

  await layers.doc(uid).set({
    bucket: uid,
    name: name,
    base: base,
    user: file.metadata.user,
    timestamp: file.updated,
  });

  if (base) {
    await tracks.doc(base).set({
      layers: admin.firestore.FieldValue.arrayUnion(base),
    }, {merge: true});
  } else {
    await tracks.doc(uid).set({
      layers: [uid],
      name: file.metadata.name,
    });
  }
};
