const express = require("express");
const bodyParser = require("body-parser");

const userController = require("./controllers/user");
const flashcardController = require("./controllers/flashcard");

function trackRequest (req, res) {
    console.log(`${req.method} ${req.url} ${res.statusCode}`);
}

function getResponse (req, res, code, message) {
	res.status(code).send(message)
	trackRequest(req, res);
}

let app = express();

app.use(bodyParser.json());

app.listen(3001, () => {
	console.log(`server is up on port 3001`);
});

app.post("/login", async (req, res) => {
	const loginObj = req.body || {};

	let user;
	try { user = await userController.getUserByLogin(loginObj.username, loginObj.password);
	} catch(e) { return getResponse(req, res, 404, e); }

	return getResponse(req, res, 200, user);
});