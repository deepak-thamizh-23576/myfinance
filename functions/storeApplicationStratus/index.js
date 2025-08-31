const catalyst = require('zcatalyst-sdk-node');
const multiparty = require('multiparty');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const path = require('path');

// Simple JSON responder
function sendJSON(res, obj, status = 200) {
  if (res && typeof res.status === "function") {
    return res.status(status).json(obj);
  }
  if (res && typeof res.writeHead === "function") {
    res.writeHead(status, { "Content-Type": "application/json" });
    return res.end(JSON.stringify(obj));
  }
  try { res.end(JSON.stringify(obj)); } catch {}
}

module.exports = (req, res) => {
  const app = catalyst.initialize(req, { scope: 'admin' });
  const stratus = app.stratus();
  const bucket = stratus.bucket('loandetailskyc');
  const table = app.datastore().table("userDetails");

  const form = new multiparty.Form();
  form.parse(req, async (err, fields, files) => {
    if (err) return sendJSON(res, { error: err.message }, 400);

    try {
      // Required files
      const faceImage = files.faceImage?.[0];
      const aadharFrontImage = files.aadharFrontImage?.[0];
      const aadharBackImage = files.aadharBackImage?.[0];
      if (!faceImage || !aadharFrontImage) {
        return sendJSON(res, { error: "Face or Aadhar front image missing" }, 400);
      }

      // User details
      const firstName = (fields.username?.[0] || "Unknown").toString();
      const lastName = (fields.lastname?.[0] || "").toString();
      const email = (fields.mailIdUser?.[0] || "unknown@example.com").toString();
      const emailPrefix = email.split("@")[0] || "user";

      // PDF filename
      const safeFileName = `${firstName}_${lastName}_${emailPrefix}_${Date.now()}.pdf`.replace(/\s+/g, "_");
      const pdfPath = path.join(__dirname, safeFileName);

      // Create PDF
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      doc.fontSize(18).text("User Application Documents", { align: "center" });
      doc.moveDown(2);
      doc.text(`Name: ${firstName} ${lastName}`);
      doc.text(`Email: ${email}`);
      doc.moveDown(2);

      doc.text("Face Image:"); doc.image(faceImage.path, { fit: [300, 300], align: "center" });
      doc.addPage();

      doc.text("Aadhar Front:"); doc.image(aadharFrontImage.path, { fit: [400, 400], align: "center" });

      if (aadharBackImage) {
        doc.addPage();
        doc.text("Aadhar Back:"); doc.image(aadharBackImage.path, { fit: [400, 400], align: "center" });
      }

      doc.end();
      await new Promise((resolve, reject) => {
        writeStream.on("finish", resolve);
        writeStream.on("error", reject);
      });

      // Upload to Stratus
      const pdfKey = `applications/${safeFileName}`;
      const fileStream = fs.createReadStream(pdfPath);
      let uploadRes;
      try {
        uploadRes = await bucket.putObject(pdfKey, fileStream, { contentType: "application/pdf" });
      } finally {
        try { fileStream.destroy(); } catch {}
      }

      // Generate URL
      let fileUrl = null;
      try {
        if (typeof bucket.generatePreSignedUrl === "function") {
          const presigned = await bucket.generatePreSignedUrl(pdfKey, "GET", { expiryIn: 3600 });
          fileUrl = presigned?.url || presigned?.signature || presigned || null;
        }
      } catch {}

      // Clean up temp files
      try { fs.unlinkSync(pdfPath); } catch {}
      [faceImage, aadharFrontImage, aadharBackImage].forEach(f => {
        if (f && f.path) fs.unlink(f.path, () => {});
      });

      // === Update Datastore with FileUrl ===
      const allRows = await table.getAllRows();
      const existingRow = allRows.find(row =>
        row.FirstName === firstName &&
        row.LastName === lastName &&
        row.EmailId === email
      );

      let dbResult;
      if (existingRow) {
        const updatedRow = {
          ROWID: existingRow.ROWID,
          applicationLink: fileUrl
        };
        dbResult = await table.updateRow(updatedRow);
      } else {
        const newRow = {
          FirstName: firstName,
          LastName: lastName,
          EmailId: email,
          applicationLink: fileUrl
        };
        dbResult = await table.insertRow(newRow);
      }

      // Send response
      sendJSON(res, {
        success: true,
        message: "File uploaded & DB updated",
        fileUrl,
        dbResult
      }, 200);

    } catch (error) {
      console.error("handler error:", error);
      sendJSON(res, { error: error.message || "internal error" }, 500);
    }
  });
};
