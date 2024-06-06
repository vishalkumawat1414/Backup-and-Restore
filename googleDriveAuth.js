const { google } = require("googleapis");
const path = require("path");
require("dotenv").config();

function authorize(callback) {
	const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

	const auth = new google.auth.GoogleAuth({
		keyFile: credentialsPath,
		scopes: ["https://www.googleapis.com/auth/drive.file"],
	});

	callback(auth);
}

module.exports = { authorize };
