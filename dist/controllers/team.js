"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTeam = void 0;
const joi_1 = __importDefault(require("joi"));
const teamModel_1 = __importDefault(require("../models/teamModel"));
const projectModel_1 = __importDefault(require("../models/projectModel"));
///jah'swill////////////////////////////////////
async function createTeam(req, res) {
    var _a;
    const { projectId } = req.params;
    //check for project using Id
    const project = await projectModel_1.default.findOne({ projectId });
    const ownerId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (project) {
        const teamSchema = joi_1.default.object({
            teamName: joi_1.default.string().trim().required(),
            about: joi_1.default.string().trim().required(),
            //   members: Joi.string().trim()//making this fiels not required so an empty array can be stored in DB,//how to mak ethi sfield not compulsory
            //inputting the emails of tea members and using thi sto check the user Db to find the id's to save
        });
        try {
            const inputValidation = await teamSchema.validate(req.body, {
                abortEarly: false, ///essence of this line
            });
            if (inputValidation.error) {
                console.log("validation error");
                res.status(400).json({
                    message: "Invalid input, check and try again",
                    error: inputValidation.error
                });
                return;
            }
            // var membersEmail = members.split(",")///singular use of var bCus of line 45
            // console.log(membersEmail)
            // let membersId = membersEmail.map(async (mail: string) => await UserModel.findOne({email: mail}))
            // let checkForNull = membersId.filter((elem: User ) => elem === null)
            // if(checkForNull)
            //     const newTeam = await Team.create({
            //         teamName,
            //         about,
            //         // "members": membersEmail,
            //         "createdBy": ownerId,
            //         projectId
            //     return res.json({
            //         messsage: "Team crated successfully",
            //         teamCreated: newTeam,
            //         membersStatus: "members added"
            //     })
            // }
            const newTeam = await teamModel_1.default.create({
                teamName,
                about,
                "createdBy": ownerId,
                projectId
            });
            return res.json({
                messsage: "Team crated successfully",
                teamCreated: newTeam,
                membersStatus: "No members added"
            });
        }
        catch (err) {
            res.json({
                message: err
            });
        }
    }
}
exports.createTeam = createTeam;
