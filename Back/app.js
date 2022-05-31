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
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, user);
});

app.post("/user/create", async (req, res) => {
	const newUserObj = req.body || {};

	let user;
	try { user = await userController.createNewUser(newUserObj);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, user);
});

app.post("/flashcard/create", async (req, res) => {
	const newFlashCardObj = req.body || {};

	let flashcard;
	try { flashcard = await flashcardController.createNewFlashCard(newFlashCardObj);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, flashcard);
});

app.delete("/flashcard/delete", async (req, res) => {
	const flashCardToDelete = req.query.flashcard;
	const requester = req.query.requester;

	try { await flashcardController.deleteFlashCard(flashCardToDelete, requester);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, "FlashCard excluído com sucesso");
});

app.put("/flashcard/edit", async (req, res) => {
	const flashCardObj = req.body || {};

	let flashCard;
	try { flashCard = await flashcardController.editFlashCard(flashCardObj);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, flashCard);
});

app.post("/tag/create", async (req, res) => {
	const newTagObj = req.body || {};

	let tag;
	try { tag = await flashcardController.createNewTag(newTagObj);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, tag);
});

app.get("/study", async (req, res) => {
	const studyQuery = req.query || {};

	let flashCard;
	try { flashCard = await flashcardController.getFlashCardToStudy(studyQuery);
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, flashCard);
});