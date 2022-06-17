const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();
const tracks = db.collection("tracks");
const layers = db.collection("layers");

// To deploy, run in "functions" directory:
// gcloud functions deploy addLayer --runtime nodejs16
// --trigger-resource player-76353.appspot.com
// --trigger-event google.storage.object.finalize
exports.addLayer = async (file, context) => {
  const rootUID = file.metadata.root;
  const newUID = file.metadata.uid;
  const layerUID = file.name.replace("public/", "");
  const layerData = {
    bucket: file.name,
    name: file.metadata.name,
    user: file.metadata.user,
    timestamp: file.updated,
  };

  await layers.doc(layerUID).set(layerData);
  await tracks.doc(layerUID).set({
    layers: [layerUID],
    name: file.metadata.name,
  });

  if (rootUID && newUID) {
    const root = await tracks.doc(rootUID).get();
    if (root.exists) {
      await tracks.doc(newUID).set({
        layers: root.data().layers.concat([layerUID]),
        name: file.metadata.name,
      });
    } else {
      throw new Error("Root track " + rootUID + " does not exist!");
    }
  }
};
