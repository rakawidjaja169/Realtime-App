const router = require("express").Router();
const User = require("../model/User");
const UserVerification = require("../model/UserVerification");
const PasswordReset = require("../model/PasswordReset");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { parse, stringify, toJSON, fromJSON } = require("flatted");
const ObjectId = require("mongoose").Types.ObjectId;
const {
	registerValidation,
	loginValidation,
} = require("../validation/validation");
const { response } = require("express");
const { json } = require("body-parser");

const maxAge = 1000 * 60 * 60 * 24 * 7;

//Email Handler
const nodemailer = require("nodemailer");

//Unique String
const {v4: uuidv4} = require("uuid");

//Env Variables
const dotenv = require("dotenv");
dotenv.config();

//Path for Static Verified Page
const path = require("path");

//Nodemailer Stuff
let transporter = nodemailer.createTransport({
	service: "gmail",
	auth: {
		user: process.env.AUTH_EMAIL,
		pass: process.env.AUTH_PASS
	}
});

//Testing Nodemailer
transporter.verify((error) => {
	if(error) {
		console.log(error);
	} else {
		console.log("Ready for Message");
	}
});

//Register
router.post("/register", async (req, res) => {
	//Validate Data
	const { error } = registerValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Checking Unique User
	const emailExist = await User.findOne({ email: req.body.email });
	if (emailExist) return res.status(400).json("Email already exists");

	//Hash the Password
	const salt = await bcrypt.genSalt(10);
	const hashedPassword = await bcrypt.hash(req.body.password, salt);

	//Create New User
	const user = new User({
		name: req.body.name,
		email: req.body.email.toLowerCase(),
		password: hashedPassword,
	});

	try {
		await user.save().then((result) => {
			//Handle Account Verification
			sendVerificationEmail(result, res);
		});
	} catch (err) {
		res.status(400).json(err);
	}
});

//Send Verification Email
const sendVerificationEmail = ({ _id, email, name }, res) => {
	//URL to be used in the email
	const currentURL = "http://localhost:3000/";

	const uniqueString = uuidv4() + _id;

	//Mail Options
	const mailOptions = {
		from: process.env.AUTH_EMAIL,
		to: email,
		subject: "Verify Your Email",
		html: `<p> Verify your email address to complete the Register and login into your account. </p>
			   <p> This link <b>expires in 6 hours</b>. </p> <p> Press <a href=${
				   currentURL + "api/auth/verify/" + _id + "/" + uniqueString
				}>here</a> to proceed.</p>`
	};

	const saltRounds = 10;
	bcrypt
		.hash(uniqueString, saltRounds)
		.then((hashedUniqueString) => {
			//Set values in userVerification collection
			const newVerification = new UserVerification({
				userId: _id,
				uniqueString: hashedUniqueString,
				createdAt: Date.now(),
				expiresAt: Date.now() + 21600000,
			});

			newVerification
				.save()
				.then(() => {
					transporter
						.sendMail(mailOptions)
						.then(() => {
							//Email send and verification record saved
							const token = jwt.sign({ _id: _id }, process.env.TOKEN_SECRET);
							const registerResponse = {
								user: {
									id: _id,
									name: name,
								},
								token: token,
								status: "PENDING",
								message: "Verification email sent",
							};
							res.json(registerResponse);
						})
						.catch((error) => {
							console.log(error);
							res.json({
								status: "FAILED",
								message: "Verification email failed!",
							})
						})
				})	
				.catch((error) => {
					console.log(error);
					res.json({
						status: "FAILED",
						message: "Couldn't save verification email data!",
					})
				})
		})
		.catch(() => {
			res.json({
				status: "FAILED",
				message: "An error occured while hashing email data!",
			});
		});
};

//Verify Email
router.get("/verify/:userId/:uniqueString", (req, res) => {
	let { userId, uniqueString } = req.params;

	UserVerification
		.find({ userId })
		.then((result) => {
			if (result.length > 0) {
				//User Verification record exists so we proceed
				const { expiresAt } = result[0];
				const hashedUniqueString = result[0].uniqueString;

				//Checking for expired unique string
				if (expiresAt < Date.now()) {
					//Record has expired so we delete it
					UserVerification
						.deleteOne({ userId })
						.then(result => {
							User
								.deleteOne({ _id: userId })
								.then(() => {
									let message = "Link has expired. Please sign up again.";
									res.redirect(`/api/auth/verified/error=true&message=${message}`);
								})
								.catch((error) => {
									console.log(error);
									let message = "Clearing user with expired unique string failed";
									res.redirect(`/api/auth/verified/error=true&message=${message}`);
								})
						})
						.catch((error) => {
							console.log(error);
							let message = "An error occurred while clearing expired user verification record.";
							res.redirect(`/api/auth/verified/error=true&message=${message}`);
						})
				} else {
					//Valid record exists so we validate the user string
					//First compare the hashed unique string
					bcrypt
						.compare(uniqueString, hashedUniqueString)
						.then(result => {
							if (result) {
								//Strings Match
								User
									.updateOne({ _id: userId }, { verified: true })
									.then(() => {
										UserVerification
											.deleteOne({ userId })
											.then(() => {
												res.sendFile(path.join(__dirname, "../views/verified.html"));
											})
											.catch(error => {
												console.log(error);
												let message = "An error occurred while finalizing successful verification.";
												res.redirect(`/api/auth/verified/error=true&message=${message}`);
											})
									})
									.catch((error) => {
										console.log(error);
										let message = "An error occurred while updating user record to show verified.";
										res.redirect(`/api/auth/verified/error=true&message=${message}`);
									})
							} else {
								//Existing record but incorrect verification details passed.
								let message = "Invalid verification details passed. Check your inbox.";
								res.redirect(`/api/auth/verified/error=true&message=${message}`);
							}
						})
						.catch((error) => {
							let message = "An error occurred while comparing unique strings.";
							res.redirect(`/api/auth/verified/error=true&message=${message}`);
						})
				}
			} else {
				//User Verification record doesn't exist
				let message = "Account Record doesn't exist or has been verified already. Please register or log in.";
				res.redirect(`/api/auth/verified/error=true&message=${message}`);
			}
		})
		.catch((error) => {
			console.log(error);
			let message = "An error occurred while checking for existing user verification record";
			res.redirect(`/api/auth/verified/error=true&message=${message}`);
		})
});

//Verified Page Route
router.get("/verified", (req, res) => {
	res.sendFile(path.join(__dirname, "../views/verified.html"));
})

//Login
router.post("/login", async (req, res) => {
	//Validate Data
	const { error } = loginValidation(req.body);
	if (error) return res.status(400).json(error.details[0].message);

	//Checking Email Exist
	const user = await User.findOne({ email: req.body.email.toLowerCase() });
	if (!user) return res.status(400).json("Email or Password is wrong");

	//Checking Password
	const validPass = await bcrypt.compare(req.body.password, user.password);
	if (!validPass) return res.status(400).json("Email or Password is wrong");

	//Checking If User Verified
	const userVerified = await User.findOne({ 
		email: req.body.email.toLowerCase(),
		verified: false });
	if (userVerified) return res.status(400).json("Email hasn't been verified yet. Check your inbox.");

	//Create a Token
	const token = jwt.sign({ _id: user._id }, process.env.TOKEN_SECRET);
	const tokenString = token.toString();

	const returnToken = {
		token: tokenString,
	};
	res.cookie("jwt", token, { maxAge: maxAge });
	res.status(200).json(returnToken);
});

//Log Out
router.get("/logout", async (req, res) => {
	//Erase Cookies
	res.clearCookie("jwt");
	res.status(200).json("Cookie is Deleted");

	//Redirect to Home Page
	//res.redirect('/');
});

//Password Reset
router.post("/requestPasswordReset", (req, res) => {
	const { email } = req.body;

	//Check if email exists
	User
		.find({ email })
		.then((data) => {
			if (data.length) {
				//User exists
				//Check if user is verified
				if (!data[0].verified) {
					res.json({
						status: "FAILED",
						message: "Email hasn't been verified yet. Check your inbox.",
					})
				} else {
					//Proceed with email to reset password
					sendResetEmail(data[0], res);
				}
			} else {
				res.json({
					status: "FAILED",
					message: "No account with the supplied email exists!",
				})
			}
		})
		.catch(error => {
			console.log(error);
			res.json({
				status: "FAILED",
				message: "An error occurred while checking for existing user",
			});
		})
});

// Send Password Reset Email
const sendResetEmail = ({ _id, email }, res) => {
	const resetString = uuidv4() + _id;

	const redirectURL = "http://localhost:3000/";

	//Clear all existing reset records
	PasswordReset
		.deleteMany({ userId: _id })
		.then(result => {
			//Reset records deleted successfully
			//Send Email
			//Mail Options
			const mailOptions = {
				from: process.env.AUTH_EMAIL,
				to: email,
				subject: "Password Reset",
				html: `<p> If you forgot your password. </p> <p> Don't worry, use the link below to reset it. </p>
						<p> This link <b>expires in 60 minutes</b>. </p> <p> Press <a href=${
						redirectURL + "api/auth/resetpassword/" + _id + "/" + resetString
						}>here</a> to proceed.</p>`
			};

			const saltRounds = 10;
			bcrypt
				.hash(resetString, saltRounds)
				.then((hashedResetString) => {
					//Set values in Password Reset Collection
					const newPasswordReset = new PasswordReset({
						userId: _id,
						resetString: hashedResetString,
						createdAt: Date.now(),
						expiresAt: Date.now() + 3600000,
					});

					newPasswordReset
						.save()
						.then(() => {
							transporter
								.sendMail(mailOptions)
								.then(() => {
								//Reset email and password reset record saved
								res.json({
									status: "PENDING",
									message: "Password Reset email sent",
								})
								})
								.catch((error) => {
									console.log(error);
									res.json({
										status: "FAILED",
										message: "Password Reset Email failed!",
									})
								})
						})	
						.catch((error) => {
							console.log(error);
							res.json({
								status: "FAILED",
								message: "Couldn't save password reset data!",
							})
						})
				})
				.catch(() => {
					res.json({
						status: "FAILED",
						message: "An error occured while hashing the password reset data!",
					});
				});			
		})
		.catch(error => {
			//Error while clearing existing records
			console.log(error);
			res.json({
				status: "FAILED",
				message: "Clearing existing password reset records failed."
			})
		})
};

//Reset the Password
router.post("/resetPassword", (req, res) => {
	let { userId, resetString, newPassword } = req.body;

	PasswordReset
		.find({ userId })
		.then(result => {
			if (result.length > 0) {
				//Password reset record exists
				const { expiresAt } = result[0];
				const hashedResetString = result[0].resetString;

				//Checking for expired reset string
				if (expiresAt < Date.now()) {
					//Record has expired so we delete it
					PasswordReset
						.deleteOne({ userId })
						.then(() => {
							//Reset password deleted successfully
							res.json({
								status: "FAILED",
								message: "Clearing password reset record failed."
							})
						})
						.catch((error) => {
							//Deletion failed
							console.log(error);
							res.json({
								status: "FAILED",
								message: "Clearing password reset record failed."
							})
						})
				} else {
					//Valid reset record exists so we validate the reset string
					//Compare the hashed reset string
					bcrypt
						.compare(resetString, hashedResetString)
						.then(() => {
							if (result) {
								//String matched
								//Hash password again
								const saltRounds = 10;
								bcrypt
									.hash(newPassword, saltRounds)
									.then(hashedNewPassword => {
										//Update user password
										User
											.updateOne({ _id: userId }, { password: hashedNewPassword })
											.then(() => {
												//Update Complete, delete reset password record
												PasswordReset
													.deleteOne({ userId })
													.then(() => {
														//Both user record and reset record updated
														res.json({
															status: "SUCCESS",
															message: "Password has been reset successfully."
														})
													})
													.catch(error => {
														console.log(error);
														res.json({
															status: "FAILED",
															message: "An error occurred while finalizing password reset."
														})
													})
											})
											.catch(error => {
												console.log(error);
												res.json({
													status: "FAILED",
													message: "Updating user password failed."
												})
											})
									})
									.catch(error => {
										console.log(error);
										res.json({
											status: "FAILED",
											message: "An error occurred while hashing new password."
										})
									})
							} else {
								//Existing record but incorrect reset string passed
								res.json({
									status: "FAILED",
									message: "Invalid password reset details passed."
								})
							}
						})
						.catch(error => {
							res.json({
								status: "FAILED",
								message: "Comparing password reset strings failed."
							})
						})
				}
			} else {
				//Password reset record doesn't exist
				res.json({
					status: "FAILED",
					message: "Password reset request not found."
				})
			}
		})
		.catch(error => {
			console.log(error);
			res.json({
				status: "FAILED",
				message: "Checking for existing password reset records failed."
			})
		})
})

module.exports = router;
