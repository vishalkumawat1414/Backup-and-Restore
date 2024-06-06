// scheduler.js
const cron = require("node-cron");
const axios = require("axios");

const PORT = process.env.PORT || 3000;

function startScheduler() {
	// Schedule the cron job to call the /backup endpoint every day at midnight
	// cron.schedule("0 0 * * *", () => {
	// 	axios
	// 		.get(`http://localhost:${PORT}/backup`)
	// 		.then((response) => {
	// 			console.log("Backup API called successfully:", response.data);
	// 		})
	// 		.catch((error) => {
	// 			console.error("Error calling Backup API:", error);
	// 		});
	// });

	// For testing purposes, you can use the following cron expression to call the /backup endpoint every minute
	cron.schedule("*/1 * * * *", () => {
	    axios.get(`http://localhost:${PORT}/backup`)
	        .then(response => {
	            console.log("Backup API called successfully:", response.data);
	        })
	        .catch(error => {
	            console.error("Error calling Backup API:", error);
	        });
	});

	console.log("Scheduler started.");
}

module.exports = { startScheduler };
