require("dotenv").config();
const { exec } = require("child_process");
const { google } = require("googleapis");
const { authorize } = require("./googleDriveAuth");
const fs = require("fs");

const BACKUP_FOLDER_ID = process.env.BACKUP_FOLDER_ID;
const MONGO_URI = process.env.MONGO_URI;

function backupDatabase(res) {
	const backupFile = `backup-${new Date().toISOString().split("T")[0]}.gz`;

	console.log("Starting database backup...");
	exec(
		`mongodump --uri="${MONGO_URI}" --archive=${backupFile} --gzip`,
		(err, stdout, stderr) => {
			if (err) {
				console.error(`Error creating backup: ${stderr}`);
				res.status(500).send(`Error creating backup: ${stderr}`);
				return;
			}
			console.log("Backup created successfully.");
			console.log(`Backup file: ${backupFile}`);
			fs.access(backupFile, fs.constants.F_OK, (err) => {
				if (err) {
					console.error("Backup file does not exist.");
					res.status(500).send("Backup file does not exist.");
				} else {
					console.log("Backup file exists, proceeding to upload...");
					authorize((auth) => uploadToGoogleDrive(auth, backupFile, res));
				}
			});
		},
	);
}

function uploadToGoogleDrive(auth, fileName, res) {
	const drive = google.drive({ version: "v3", auth });
	const fileMetadata = {
		name: fileName,
		parents: [BACKUP_FOLDER_ID],
	};
	const media = {
		mimeType: "application/gzip",
		body: fs.createReadStream(fileName),
	};

	console.log("Uploading backup to Google Drive...");
	drive.files.create(
		{ resource: fileMetadata, media, fields: "id" },
		(err, file) => {
			if (err) {
				console.error("Error uploading file to Google Drive:", err);
				res.status(500).send(`Error uploading file to Google Drive: ${err}`);
			} else {
				console.log("Backup uploaded to Google Drive, File ID:", file.data.id);
				fs.unlinkSync(fileName); // Remove the local backup file after upload
				res.send(`Backup uploaded to Google Drive, File ID: ${file.data.id}`);
			}
		},
	);
}

module.exports = { backupDatabase };
