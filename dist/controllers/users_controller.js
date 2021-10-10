"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.createProfile = exports.viewProfile = exports.resetPassword = exports.verifyResetPassword = exports.forgetPassword = exports.changePassword = exports.googleSuccessCallBackFn = exports.loginPage = exports.logout = exports.activateUserAcct = exports.createUser = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const validate_1 = __importDefault(require("../validations/validate"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = __importDefault(require("../models/user"));
const profileModel_1 = __importDefault(require("../models/profileModel"));
const nodemailer_1 = __importDefault(require("../utils/nodemailer"));
const joi_1 = __importDefault(require("joi"));
const _ = require("lodash");
const secret = process.env.JWT_SECRETKEY;
async function createUser(req, res) {
    try {
        const validation = validate_1.default.validate(req.body);
        if (validation.error) {
            return res.status(400).send(validation.error.details[0].message);
        }
        let { fullname, email, password } = req.body;
        const userObj = await user_1.default.findOne({ email: email });
        if (userObj) {
            return res.status(400).send("Email already exist");
        }
        const token = jsonwebtoken_1.default.sign({ fullname, email, password }, process.env.JWT_SECRETKEY, { expiresIn: process.env.JWT_EMAIL_EXPIRES });
        email = email;
        const body = `
            <h2>
            Thank you for successfully signing up, click <a href="${process.env.HOME_URL}:${process.env.PORT}/users/acct-activation/${token}">here</a> to activate your account
            </h2>
            `;
        if (process.env.NODE_ENV != "test") {
            (0, nodemailer_1.default)(email, body);
        }
        res
            .status(201)
            .json({ msg: "Email has been sent, kindly activate your account." });
    }
    catch (err) {
        console.log(err);
        res.status(400).send(`${err}`);
    }
}
exports.createUser = createUser;
async function activateUserAcct(req, res) {
    try {
        const token = req.params.token;
        console.log(token);
        if (token) {
            jsonwebtoken_1.default.verify(token, process.env.JWT_SECRETKEY, async (err, decodedToken) => {
                if (err) {
                    res.status(400).json({ error: "Incorrect or Expired link" });
                    return;
                }
                const { fullname, email, password } = decodedToken;
                console.log(decodedToken);
                const checkEmail = await user_1.default.findOne({ email });
                if (checkEmail)
                    return res
                        .status(400)
                        .json({ msg: "User with this email already exists" });
                const hashPassword = await bcrypt_1.default.hash(password, 10);
                const newUser = new user_1.default({
                    fullname,
                    email,
                    password: hashPassword,
                });
                const user = await newUser.save();
                if (user) {
                    return res.status(201).json({ msg: "New User created", user });
                }
                res
                    .status(400)
                    .json({ success: false, msg: "Unable to activate user account" });
            });
        }
    }
    catch (err) {
        res.status(400).json({ msg: "Something went wrong.." });
    }
}
exports.activateUserAcct = activateUserAcct;
function logout(req, res) {
    req.logOut();
    res.json({
        msg: "Logged out successfully.",
    });
}
exports.logout = logout;
//fake home page for google
function loginPage(req, res) {
    console.log(req.user);
    res.render("loginPage");
}
exports.loginPage = loginPage;
function googleSuccessCallBackFn(req, res) {
    console.log("googleSuccessCB:", req.user);
    res.redirect("/users/welcome");
}
exports.googleSuccessCallBackFn = googleSuccessCallBackFn;
async function changePassword(req, res) {
    const { oldPassword, newPassword, repeatPassword } = req.body;
    //validation of all input fields
    const id = req.user._id;
    try {
        const validUser = await bcrypt_1.default.compare(oldPassword, req.user.password);
        // console.log(validUser, "validUser")
        if (validUser) {
            if (newPassword === repeatPassword) {
                const newPasswordUpdate = await bcrypt_1.default.hash(newPassword, 12);
                const newUserInfo = await user_1.default.findByIdAndUpdate({ _id: id }, { password: newPasswordUpdate }, { new: true });
                // console.log(newUserInfo, "newUserInfo")
                res.status(200).json({
                    newUserInfo,
                });
                return;
            }
            else {
                res.status(404).json({
                    message: "Password and repeat password does not match",
                });
                return;
            }
        }
        else {
            res.status(404).json({
                message: "Incorrect password",
            });
            return;
        }
        return res.json(req.body);
    }
    catch (err) {
        // console.log(err)
        res.status(400).json({
            error: err,
        });
        return;
    }
}
exports.changePassword = changePassword;
async function forgetPassword(req, res) {
    try {
        const { email } = req.body;
        console.log(email);
        // const emailValidation: any = await validate(email)
        // if(emailValidation?.isValidDomain){
        const user = await user_1.default.findOne({ email: email });
        console.log(user);
        // console.log(user)
        if (user) {
            const token = jsonwebtoken_1.default.sign({ id: user._id }, secret, { expiresIn: "30mins" });
            const link = `${process.env.HOME_URL}:${process.env.PORT}/users/password/resetPassword/${token}`;
            // console.log(link)
            // console.log(token)
            //the variables for the nodemailer
            const body = `
        Dear ${user.fullname},
        <p>Follow this <a href=${link}> link </a> to change your password. The link would expire in 30 mins.</P>
              `;
            (0, nodemailer_1.default)(email, body); ///adding the title variable to the nodemailer
            res.status(200).json({
                message: "Link sent to your mail.",
                link: link,
            });
        }
        else {
            res.status(400).json({
                message: "Email not found.",
            });
            return;
        }
    }
    catch (err) {
        console.log(err);
        res.status(404).json({
            message: "Route crashed",
        });
    }
}
exports.forgetPassword = forgetPassword;
async function verifyResetPassword(req, res) {
    let { token } = req.params;
    console.log(token, "token-verify");
    const verification = (await jsonwebtoken_1.default.verify(token, secret)); ///verification
    console.log(verification, "verification");
    const id = verification.id;
    const isValidId = await user_1.default.findOne({ _id: id });
    try {
        if (isValidId) {
            //line missing?
            token = jsonwebtoken_1.default.sign({ id: id }, secret, { expiresIn: "1d" });
            res.render("reset-password", { title: "Reset-Password", token: token });
        }
    }
    catch (err) {
        res.json({
            message: err,
        });
    }
}
exports.verifyResetPassword = verifyResetPassword;
async function resetPassword(req, res) {
    const { token } = req.params;
    console.log(token, "token-reset");
    try {
        const verification = (await jsonwebtoken_1.default.verify(token, secret)); ///verification
        console.log(verification, "verification-reset");
        const id = verification.id;
        if (verification) {
            const user = await user_1.default.findOne({ _id: id });
            if (user) {
                let { newPassword, repeatPassword } = req.body;
                if (newPassword === repeatPassword) {
                    newPassword = await bcrypt_1.default.hash(newPassword, 12);
                    const updatedUser = await user_1.default.findOneAndUpdate({ _id: id }, { password: newPassword }, { new: true });
                    res.status(400).json({
                        updatedUser: updatedUser,
                    });
                    return;
                }
                else {
                    res.status(400).json({
                        message: "newpassword and repeatpassword don't match",
                    });
                    return;
                }
            }
            else {
                res.status(400).json({
                    message: "user does not exist",
                });
                return;
            }
        }
        else {
            res.status(400).json({
                message: "verification error",
            });
            return;
        }
    }
    catch (err) {
        res.status(400).json({
            message: "This is the catch block message",
            // message: "Catch block",
            error: err.message,
        });
        return;
    }
}
exports.resetPassword = resetPassword;
async function viewProfile(req, res) {
    const user_id = req.user._id;
    let viewprofile = await profileModel_1.default.findOne({ userId: user_id });
    return res.status(200).json({
        status: "profile details",
        data: viewprofile,
    });
}
exports.viewProfile = viewProfile;
async function createProfile(req, res) {
    const user_id = req.user._id;
    console.log(req.cookies.token);
    const profileSchema = joi_1.default.object({
        email: joi_1.default.string().min(3).max(255),
        firstName: joi_1.default.string().min(3).max(255),
        lastName: joi_1.default.string().min(3).max(255),
        gender: joi_1.default.string().min(3).max(255),
        role: joi_1.default.string().min(3).max(255),
        location: joi_1.default.string().min(3).max(255),
        about: joi_1.default.string().min(10).max(255),
        profileImage: joi_1.default.string().min(3).max(255),
    });
    const profileValidate = profileSchema.validate(req.body);
    if (profileValidate.error) {
        return res.status(400).json({
            message: profileValidate.error.details[0].message,
        });
    }
    let findProfile = await profileModel_1.default.findOne({ userId: user_id });
    console.log(findProfile);
    console.log("i got befor findprofile");
    if (findProfile) {
        return res.status(400).json({
            message: `Profile  already exist`,
        });
    }
    let profileObject = req.body;
    const createdAt = new Date().toISOString();
    const updatedAt = createdAt;
    profileObject = { ...profileObject, createdAt, updatedAt };
    const profileAccount = await profileModel_1.default.create({
        userId: user_id,
        email: profileObject.email,
        firstName: profileObject.firstName,
        lastName: profileObject.lastName,
        gender: profileObject.gender,
        role: profileObject.role,
        location: profileObject.location,
        about: profileObject.about,
        profileImage: profileObject.profileImage,
        createdAt: profileObject.createdAt,
        updatedAt: profileObject.updatedAt,
    });
    res.status(201).json({
        status: "success",
        data: profileAccount,
    });
}
exports.createProfile = createProfile;
async function updateProfile(req, res) {
    const user_id = req.user._id;
    const { firstName, lastName, gender, role, location, about, profileImage } = req.body;
    console.log("update profile: ", req.user);
    let findProfile = await profileModel_1.default.findOne({ userId: user_id });
    console.log("profile Found:", findProfile);
    if (!findProfile) {
        return res.status(404).json({
            status: "failed",
            message: "Profile does not exist",
        });
    }
    let updatedProfile = await profileModel_1.default.findOneAndUpdate({ userId: user_id }, {
        firstName: firstName,
        lastName: lastName,
        gender: gender,
        role: role,
        location: location,
        about: about,
        profileImage: profileImage,
    }, { new: true });
    res.status(201).json({
        status: "success",
        data: updatedProfile,
    });
}
exports.updateProfile = updateProfile;