const express = require("express");
const { authorize } = require("./googleDriveAuth");
const {
	restoreMostRecentBackup,
	downloadFromGoogleDrive,
	restoreDatabase,
} = require("./restore");

const { backupDatabase } = require("./backup");

const app = express();
const PORT = process.env.PORT || 3000;

app.get("/restore", (req, res) => {
	authorize((auth) => {
		const fileId = req.query.fileId; // Get fileId from query parameter
		if (fileId) {
			downloadFromGoogleDrive(auth, fileId, "restore.gz", (err, backupFile) => {
				if (err) return res.status(500).send(err);
				restoreDatabase(backupFile, (err) => {
					if (err) return res.status(500).send(err);
					res.status(200).send("Database restored successfully.");
				});
			});
		} else {
			restoreMostRecentBackup(auth, (err) => {
				if (err) return res.status(500).send(err);
				res.send("Database restored successfully.");
			});
		}
	});
});
app.get("/backup", (req, res) => {
	backupDatabase(res);
});

app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}`);
  

    //for cron job
     if (process.argv.includes("--start-scheduler")) {
				const { startScheduler } = require("./scheduler");
				startScheduler();
			}
});
