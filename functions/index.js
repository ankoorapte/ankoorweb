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
  const collection = file.name.includes("layers") ? layers : tracks;
  const uid = file.name.split("/")[1];
  const data = {
    bucket: file.name,
    timestamp: file.updated,
    name: file.metadata.name,
    user: file.metadata.user,
    base: file.metadata.base,
  };

  await collection.doc(uid).set(data);
};
