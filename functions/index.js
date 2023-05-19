const functions = require("firebase-functions");
const pLayer = require("./player");
const cors = require("cors")({origin: true});

exports.pLayerAPI = functions.https.onRequest((req, res) => {
  return cors(req, res, async () => {
    try {
      const data = await pLayer.api(req.body);
      res.status(200).send(data);
    } catch (e) {
      res.status(404).send(JSON.stringify(e, Object.getOwnPropertyNames(e)));
      throw e;
    }
  });
});

exports.updateDB = async (file, context) => {
  await pLayer.updateDB(file);
};
