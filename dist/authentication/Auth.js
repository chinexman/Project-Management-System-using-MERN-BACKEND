"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authorization = void 0;
function authorization(req, res, next) {
    if (!req.user) {
        res.json({ msg: "You're not logged in, please login." });
    }
    else {
        console.log("authorization: ", req.user);
        next();
    }
}
exports.authorization = authorization;