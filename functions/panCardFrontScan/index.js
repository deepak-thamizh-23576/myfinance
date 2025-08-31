const catalyst = require("zcatalyst-sdk-node");
const multiparty = require("multiparty");
const fs = require("fs");

module.exports = async (req, res) => {
  try {
    const app = catalyst.initialize(req, { scope: "admin" });
    const zia = app.zia();

    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
      if (err) {
        return res
          .writeHead(400, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Error parsing form data" }));
      }

      try {
        // Read uploaded files
        const sourceImage = fs.createReadStream(files.faceImage[0].path);
        const queryImage = fs.createReadStream(files.aadharImage[0].path);

        // Call Zia Face Compare
        const content = await zia.compareFace(sourceImage, queryImage);

        // Send only Zia result back
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify(content));
      } catch (e) {
        console.error("Zia error:", e);
        res
          .writeHead(500, { "Content-Type": "application/json" })
          .end(JSON.stringify({ error: "Failed to process with Zia" }));
      }
    });
  } catch (error) {
    console.error("Server error:", error);
    res
      .writeHead(500, { "Content-Type": "application/json" })
      .end(JSON.stringify({ error: "Server error" }));
  }
};
