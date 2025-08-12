const catalyst = require('zcatalyst-sdk-node');
const multiparty = require('multiparty');
const fs = require('fs');

module.exports = (req, res) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  res.setHeader("Access-Control-Allow-Origin", "*");

  const app = catalyst.initialize(req);
  const zia = app.zia();

  const form = new multiparty.Form();

  form.parse(req, (err, fields, files) => {
    console.log("Parsing files...");
    if (err || !files.aadharFront || !files.aadharBack) {
      console.log("Error or missing files:", err, files);
      res.writeHead(400, { "Content-Type": "text/plain" });
      return res.end("Aadhar or PAN file missing.");
    }

    const frontFile = files.aadharFront[0];
    const backFile = files.aadharBack[0];

    const frontStream = fs.createReadStream(frontFile.path);
    const backStream = fs.createReadStream(backFile.path);

    zia.extractAadhaarCharacters(frontStream, backStream, 'eng')
      .then(result => {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      })
      .catch(err => {
        console.error("ZIA Aadhaar extraction failed:", err);
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end("ZIA Aadhaar extraction failed.");
      });
  });
};
