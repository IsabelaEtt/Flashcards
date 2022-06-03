const express = require("express");
const bodyParser = require("body-parser");
const cors = require('cors');

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

app.use(cors());

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

	try { await flashcardController.editFlashCard(flashCardObj);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, "FlashCard alterado com sucesso");
});

app.get("/flashcard/list", async (req, res) => {
	const requester = req.query.requester;
	const skip = req.query.skip;
	const limit = req.query.limit;

	let response;
	try { response = await flashcardController.getUserFlashCards(requester, skip, limit);
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, response);
});

app.post("/flashcard/answer", async (req, res) => {
	const answerObj = req.body || {};

	try { await flashcardController.answerFlashCard(answerObj);
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, "Resposta salva com sucesso!");
});

app.post("/flashcard/share", async (req, res) => {
	const shareObj = req.body || {};

	let newFlashCardRelation;
	try { newFlashCardRelation = await flashcardController.shareFlashCard(shareObj);
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, newFlashCardRelation);
});

app.post("/tag/create", async (req, res) => {
	const newTagObj = req.body || {};

	let tag;
	try { tag = await flashcardController.createNewTag(newTagObj);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, tag);
});

app.delete("/tag/delete", async (req, res) => {
	const tagToDelete = req.query.flashcard;
	const requester = req.query.requester;

	try { await flashcardController.deleteTag(tagToDelete, requester);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, "Tag deletada com sucesso");
});

app.get("/tag/list", async (req, res) => {
	const requester = req.query.requester;

	let tags;
	try { tags = await flashcardController.getUserTags(requester);
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, tags);
});

app.get("/study", async (req, res) => {
	const studyQuery = req.query || {};

	let flashCard;
	try { flashCard = await flashcardController.getFlashCardToStudy(studyQuery);
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, flashCard);
});

app.post("/friend/add", async (req, res) => {
	const friendshipObj = req.body || {};

	let newFriendship;
	try { newFriendship = await userController.createNewFriendship(friendshipObj.requester, friendshipObj.friend);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, newFriendship);
});

app.delete("/friend/delete", async (req, res) => {
	const friendshipObj = req.body || {};

	try { await userController.deleteFriendship(friendshipObj.friendship);
	} catch(e) { return getResponse(req, res, 405, e.message); }

	return getResponse(req, res, 200, "Amizade excluída com sucesso");
});

app.get("/friend/list", async (req, res) => {
	const requester = req.query.requester;
	const skip = req.query.skip;
	const limit = req.query.limit;

	let response;
	try { response = await userController.getUserFriends(requester, skip, limit);
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, response);
});

app.get("/friend/possibilities", async (req, res) => {
	const requester = req.query.requester;

	let response;
	try { response = await userController.getUserPossibleNewFriends(requester);
	} catch(e) { return getResponse(req, res, 404, e.message); }

	return getResponse(req, res, 200, response);
});