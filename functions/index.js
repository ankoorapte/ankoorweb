// const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

// To deploy, run in "functions" directory:
// gcloud functions deploy addLayer --runtime nodejs16
// --trigger-resource player-76353.appspot.com
// --trigger-event google.storage.object.finalize
exports.addLayer = (file, context) => {
  const uid = file.name.replace("public/", "");
  db.collection("L"+file.metadata.layer).doc(uid).set({
    bucket: file.name,
    name: file.metadata.name,
    user: file.metadata.user,
    timestamp: file.updated,
  }).then(() => {});
  console.log(`  File: ${file.name} added to DB`);
};
