const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// To deploy, run in "functions" directory:
// gcloud functions deploy addLayer --runtime nodejs16
// --trigger-resource player-76353.appspot.com
// --trigger-event google.storage.object.finalize
exports.addLayer = async (file, context) => {
  const layerUID = file.name.replace("public/", "");
  const trackUID = "t-" + layerUID;
  const tracks = db.collection("library").doc("tracks");

  await tracks.set({
    tracks: admin.firestore.FieldValue.arrayUnion(trackUID),
  }, {merge: true});
  await tracks.collection(trackUID).doc(layerUID).set({
    bucket: file.name,
    name: file.metadata.name,
    user: file.metadata.user,
    timestamp: file.updated,
  });

  if (file.metadata.root && file.metadata.uid) {
    await tracks.set({
      tracks: admin.firestore.FieldValue.arrayUnion(file.metadata.uid),
    }, {merge: true});
    const newTrack = tracks.collection(file.metadata.uid);
    const rootTrackLayers = await tracks.collection(file.metadata.root).get();
    const promises = [];
    rootTrackLayers.forEach((layerDoc) => {
      promises.push(newTrack.doc(layerDoc.id).set(layerDoc.data()));
    });

    await Promise.all(promises);
  }
};
