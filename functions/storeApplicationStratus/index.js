const catalyst = require('zcatalyst-sdk-node');
const multiparty = require('multiparty');
const fs = require('fs');

module.exports = (req, res) => {
    // For CORS preflight requests
    if (req.method === 'OPTIONS') {
        res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        });
        return res.end();
    }

    // Allow CORS for actual request
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Parse incoming form-data
    const form = new multiparty.Form();

    form.parse(req, async (err, fields, files) => {
        if (err) {
            console.error('Error parsing form:', err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: 'Form parsing failed' }));
        }

        try {
            // Get the Stratus bucket
            const catalystApp = catalyst.initialize(req);
            const stratus = catalystApp.stratus();
            const bucket = stratus.bucket("loandetailskyc");

            // Loop through uploaded files
            for (const key in files) {
                for (const file of files[key]) {
                    const fileName = file.originalFilename; // Keep the same name sent from frontend
                    const readStream = fs.createReadStream(file.path);

                    // Upload file to Stratus
                    await bucket.putObject( fileName, readStream);
                    console.log(`Uploaded: ${fileName}`);
                }
            }

           res.writeHead(200, { 'Content-Type': 'application/json' });
           res.end(JSON.stringify({ message: 'Files uploaded successfully!' }));

        } catch (uploadError) {
            console.error('Upload error:', uploadError);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Upload failed' }));
        }
    });
};