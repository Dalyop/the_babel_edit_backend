// import jwt from "jsonwebtoken";

// export const authenticateToken = (req, res, next) => {
//   let token;

//   // 1. First check Authorization header
//   const authHeader = req.headers['authorization'];
//   if (authHeader && authHeader.startsWith("Bearer ")) {
//     token = authHeader.split(" ")[1];
//   }

//   // 2. If no header, check cookies
//   if (!token && req.cookies?.access_token) {
//     token = req.cookies.access_token;
//   }

//   if (!token) {
//     return res.status(401).json({ message: "Access token required" });
//   }

//   // 3. Verify token
//   jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
//     if (err) {
//       console.error("Token verification failed:", err);
//       return res.status(403).json({ message: "Invalid or expired token" });
//     }

//     req.user = user;
//     next();
//   });
// };


// // Check if user is admin
// export const isAdmin = (req, res, next) => {
//   try {
//     if (req.user && req.user.role === 'ADMIN') {
//       next();
//     } else {
//       return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
//     }
//   } catch (error) {
//     return res.status(403).json({ message: 'Access denied' });
//   }
// };


import jwt from "jsonwebtoken";

// Temporary "no-auth" version
export const authenticateToken = (req, res, next) => {
  // 🔓 Skip authentication completely for now
  // Attach a fake user so your controllers don't break
  req.user = {
    userId: "cmfml9fkr0001lft4bjcc1bgj",
    role: "USER",
  };

  next();
};

// Check if user is admin
export const isAdmin = (req, res, next) => {
  try {
    if (req.user && req.user.role === 'ADMIN') {
      next();
    } else {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
  } catch (error) {
    return res.status(403).json({ message: 'Access denied' });
  }
};
