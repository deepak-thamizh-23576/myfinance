const catalyst = require('zcatalyst-sdk-node');
const formidable = require('formidable');
const fs = require('fs');
const multiparty = require('multiparty');

module.exports = (req, res) => {
  if(req.method === 'OPTIONS'){
    res.writeHead(204);
    return res.end();
  }	
  var app = catalyst.initialize(req); 
  var zia = app.zia();

  const form = new multiparty.Form();

  form.parse(req, (err, fields, files) => {
    if (err || !files || !files.image) {
      res.writeHead(400);
      return res.end("No image loaded");
    }
    const uploadedFilePath = files.image[0].path;

    zia.analyseFace(fs.createReadStream(uploadedFilePath), {
      mode: 'moderate',
      age: true,
      emotion: true,
      gender: true
    }).then((result) => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    })
    .catch((err) => {
      console.error(err);
      res.writeHead(500);
      res.end('ZIA error');
    });
  });
};