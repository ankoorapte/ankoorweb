const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

const db = admin.firestore();

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info("Hello logs!", {structuredData: true});
  response.send("Hello from Firebase!");
});

// To deploy, run in "functions" directory:
// gcloud functions deploy addLayer --runtime nodejs16
// --trigger-resource player-76353.appspot.com
// --trigger-event google.storage.object.finalize
exports.addLayer = (file, context) => {
  console.log(`  File: ${file.name}`);
  console.log(`  Metageneration: ${file.metageneration}`);
  console.log(`  Updated: ${file.updated}`);

  console.log(file.metadata);
  
  const layer = {
    bucket: file.name,
    uid: file.name.replace("public/", ""),
    timestamp: file.updated,
  };

  db.collection("L1").add(layer).then(() => {});
};
