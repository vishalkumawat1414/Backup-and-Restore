// require("dotenv").config();
// const { exec } = require("child_process");
// const { google } = require("googleapis");
// const { authorize } = require("./googleDriveAuth");
// const fs = require("fs");
// const path = require("path");
//
// function downloadFromGoogleDrive(auth, fileId, dest) {
// 	const drive = google.drive({ version: "v3", auth });
// 	const destPath = path.join(__dirname, dest);
// 	const destStream = fs.createWriteStream(destPath);
//
// 	drive.files.get(
// 		{ fileId, alt: "media" },
// 		{ responseType: "stream" },
// 		(err, res) => {
// 			if (err)
// 				return console.error("Error downloading file from Google Drive:", err);
// 			res.data
// 				.on("end", () => {
// 					console.log("Backup downloaded successfully.");
// 					restoreDatabase(destPath);
// 				})
// 				.on("error", (err) =>
// 					console.error("Error downloading file from Google Drive:", err),
// 				)
// 				.pipe(destStream);
// 		},
// 	);
// }
//
// function restoreDatabase(backupFile) {
// 	exec(
// 		`mongorestore --archive=${backupFile} --gzip --uri=${process.env.MONGO_URI}`,
// 		(err, stdout, stderr) => {
// 			if (err) {
// 				console.error(`Error restoring database: ${stderr}`);
// 			} else {
// 				console.log("Database restored successfully.");
// 				fs.unlinkSync(backupFile); // Remove the backup file after restoration
// 			}
// 		},
// 	);
// }
//
// const fileId = "YOUR_GOOGLE_DRIVE_FILE_ID";
// authorize((auth) => downloadFromGoogleDrive(auth, fileId, "restore.gz"));

require("dotenv").config();
const { exec } = require("child_process");
const { google } = require("googleapis");
const { authorize } = require("./googleDriveAuth");
const fs = require("fs");
const path = require("path");

const BACKUP_FOLDER_ID = process.env.BACKUP_FOLDER_ID;

function listFilesInFolder(auth, callback) {
	const drive = google.drive({ version: "v3", auth });
	drive.files.list(
		{
			q: `'${BACKUP_FOLDER_ID}' in parents`,
			orderBy: "createdTime desc",
			fields: "files(id, name, createdTime)",
		},
		(err, res) => {
			if (err)
				return console.error("Error listing files in Google Drive:", err);
			callback(res.data.files);
		},
	);
}
function downloadFromGoogleDrive(auth, fileId, dest, callback) {
	const drive = google.drive({ version: "v3", auth });
	const destPath = path.join(__dirname, dest);
	const destStream = fs.createWriteStream(destPath);

	drive.files.get(
		{ fileId, alt: "media" },
		{ responseType: "stream" },
		(err, res) => {
			if (err) {
				console.error("Error downloading file from Google Drive:", err);
				return callback(err);
			}
			res.data
				.on("end", () => {
					console.log("Backup downloaded successfully.");
					callback(null, destPath);
				})
				.on("error", (err) => {
					console.error("Error downloading file from Google Drive:", err);
					callback(err);
				})
				.pipe(destStream);
		},
	);
}

function restoreDatabase(backupFile, callback) {
	exec(
		`mongorestore --archive=${backupFile} --gzip --uri=${process.env.MONGO_URI}`,
		(err, stdout, stderr) => {
			if (err) {
				console.error(`Error restoring database: ${stderr}`);
				return callback(err);
			}
			console.log("Database restored successfully.");

			// Attempt to delete the backup file after restoration
			fs.unlinkSync(backupFile, (unlinkErr) => {
				if (unlinkErr) {
					console.error(`Error deleting backup file: ${unlinkErr}`);
					// Don't return here, continue with the callback
				}
				console.log("Backup file deleted successfully.");
				callback(null); // Signal successful restoration and deletion
			});
		},
	);
}

function restoreMostRecentBackup(auth, callback) {
	listFilesInFolder(auth, (files) => {
		if (!files || files.length === 0) {
			return callback("No backup files found in the Google Drive folder.");
		}
		const mostRecentBackup = files[0]; // Most recent file
		console.log(`Most recent backup: ${mostRecentBackup.name}`);
		downloadFromGoogleDrive(
			auth,
			mostRecentBackup.id,
			"restore.gz",
			(err, backupFile) => {
				if (err) {
					console.error("Error downloading backup:", err);
					return callback(err);
				}
				console.log("ssss");
				restoreDatabase(backupFile, (restoreErr) => {
					if (restoreErr) {
						console.error("Error restoring database:", restoreErr);
						return callback(restoreErr);
					}
					console.log("rammmmmmmmm");
					callback(null); // Signal successful restoration and deletion
				});
			},
		);
	});
}

module.exports = {
	restoreMostRecentBackup,
	downloadFromGoogleDrive,
	restoreDatabase,
};
