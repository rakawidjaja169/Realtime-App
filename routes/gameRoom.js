const router = require("express").Router();
const GameRoom = require("../model/GameRoom");
const PlayerList = require("../model/PlayerList");
//const verify = require('../middleware/verifyToken');
const { roomValidation } = require("../validation/validation");
const jwt = require("jsonwebtoken");

router.get("/playerdata", async (req, res) => {
	const getPlayerList = PlayerList.find({
		gameRoomID: req.query.gameRoomID,
	});

	var returnList = new Array();
	const listLength = (await getPlayerList).length;

	for (var i = 0; i < listLength; ++i) {
		const checkReady = getPlayerList[i];
		if (checkReady.abandonStatus == false) {
			returnValue = {
				userID: checkReady.userID,
				isReady: checkReady.isReady,
			};
			returnList.push(returnValue);
		}
	}

	res.status(200).json(returnList);
});

module.exports = router;
