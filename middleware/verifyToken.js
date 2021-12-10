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
        console.log(err.message);
        //res.redirect('/login');
      } else {
        //console.log(decodedToken);
        next();
      }
    });
  } else {
    //res.redirect('/login');
  }
};

module.exports = { requireAuth };