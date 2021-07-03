var express = require('express');
var router = express.Router();
const { initCrypto, VirgilCrypto, VirgilAccessTokenSigner } = require('virgil-crypto');
const { JwtGenerator } = require('virgil-sdk');
const { uploadFile } = require('../middleware/multer');

async function getJwtGenerator() {
  await initCrypto();

  const virgilCrypto = new VirgilCrypto();
  // initialize JWT generator with your App ID and App Key ID you got in
  // Virgil Dashboard.
  return new JwtGenerator({
    appId: process.env.APP_ID,
    apiKeyId: process.env.APP_KEY_ID,
    // import your App Key that you got in Virgil Dashboard from string.
    apiKey: virgilCrypto.importPrivateKey(process.env.APP_KEY),
    // initialize accessTokenSigner that signs users JWTs
    accessTokenSigner: new VirgilAccessTokenSigner(virgilCrypto),
    // JWT lifetime - 20 minutes (default)
    millisecondsToLive: 20 * 60 * 1000
  });
}

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});

const generatorPromise = getJwtGenerator();

router.get('/jwt', async function (req, res) {
  const generator = await generatorPromise;
  const virgilJwtToken = generator.generateToken(req.query.identity);
  res.json({ virgilToken: virgilJwtToken.toString() });
});

router.post("/upload", async (req, res) => {
  try {
    await uploadFile(req, res);

    if (req.file == undefined) {
      return res.status(400).send({ message: "Please upload a file!" });
    }

    res.status(200).send({
      message: "Uploaded the file successfully: " + req.file.originalname,
    });
  } catch (err) {
    console.log(err);

    if (err.code == "LIMIT_FILE_SIZE") {
      return res.status(500).send({
        message: "File size cannot be larger than 2MB!",
      });
    }

    res.status(500).send({
      message: `Could not upload the file: ${req.file.originalname}. ${err}`,
    });
  }
});

router.get("/files", (req, res) => {
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      res.status(500).send({
        message: "Unable to scan files!",
      });
    }

    let fileInfos = [];

    files.forEach((file) => {
      fileInfos.push({
        name: file,
        url: baseUrl + file,
      });
    });

    res.status(200).send(fileInfos);
  });
});

router.get("/files/:name", (req, res) => {
  const fileName = req.params.name;
  const directoryPath = __basedir + "/resources/static/assets/uploads/";

  res.download(directoryPath + fileName, fileName, (err) => {
    if (err) {
      res.status(500).send({
        message: "Could not download the file. " + err,
      });
    }
  });
});

module.exports = router;
