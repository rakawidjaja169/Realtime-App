const jwt = require('jsonwebtoken');

// //Verify with Cookies
// const requireAuth = (req, res, next) => {
//   const token = req.cookies.jwt;
//   if(!token) return res.status(401).send('Access Denied');

//   // check JSON Web Token & Verified
//   if (token) {
//     jwt.verify(token, process.env.TOKEN_SECRET, (err, decodedToken) => {
//       if (err) {
//         console.log(err.message);
//         //res.redirect('/login');
//       } else {
//         //console.log(decodedToken);
//         next();
//       }
//     });
//   } else {
//     //res.redirect('/login');
//   }
// };

const maxAge = 1000 * 60 * 60 * 3;
const maxRefresh = 1000 * 60 * 60 * 24 * 365;

//Verify with Bearer Token
const requireAuth = (req, res, next) => {
  const bearerHeader = req.headers['authorization'];
  const bearer = typeof bearerHeader !== 'undefined' && bearerHeader.split(' ');
  const token = bearer && bearer[1];
  if(!token) return res.status(401).send('Access Denied');

  // check JSON Web Token & Verified
  if (token) {
    jwt.verify(token, process.env.TOKEN_SECRET, (err, decodedToken) => {
      if (err) {
        jwt.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decodedToken) => {
          if (err) {
            res.json({
              status: "FAILED",
              message: "The Token isn't Refresh Token"
            });
          } else {
            //Create a Access & Refresh Token
            const token = jwt.sign({ _id: decodedToken }, process.env.TOKEN_SECRET);
            const refToken = jwt.sign({ _id: decodedToken }, process.env.REFRESH_TOKEN_SECRET);

            res.cookie("jwt", token, { maxAge: maxAge });
            res.cookie("Refresh Token", refToken, { maxAge: maxRefresh });

            next();
          }
        });
      } else {
        next();
      }
    });
  } else {
    res.json({
      status: "FAILED",
      message: "The Token is error"
    });
  }
};

module.exports = { requireAuth };