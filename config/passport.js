// import all the things we need  
const GoogleStrategy = require('passport-google-oauth20').Strategy
const mongoose = require('mongoose')
const GoogleUser = require('../model/GoogleUser')
const dotenv = require("dotenv");
dotenv.config();

module.exports = function (passport) {
    passport.use(
        new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
        },
        async (accessToken, refreshToken, profile, done) => {
            //get the user data from google 
            const newUser = {
            googleId: profile.id,
            displayName: profile.displayName,
            firstName: profile.name.givenName,
            lastName: profile.name.familyName,
            image: profile.photos[0].value,
            email: profile.emails[0].value
            }

            try {
            //find the user in our database 
            let googleuser = await GoogleUser.findOne({ googleId: profile.id })

            if (googleuser) {
                //If user present in our database.
                done(null, googleuser)
            } else {
                // if user is not preset in our database save user data to database.
                googleuser = await GoogleUser.create(newUser)
                done(null, googleuser)
            }
            } catch (err) {
            console.error(err)
            }
        }
        )
    )

    // used to serialize the user for the session
    passport.serializeUser((googleuser, done) => {
        done(null, googleuser.id)
    })

    // used to deserialize the user
    passport.deserializeUser((id, done) => {
        GoogleUser.findById(id, (err, user) => done(err, user))
    })
}