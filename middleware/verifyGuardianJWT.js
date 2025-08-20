const jwt = require('jsonwebtoken');

const verifyGuardianJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET, // Using the same secret, but the payload is different
        (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' });
            
            // Attach the studentId from the Guardian JWT to the request
            if (!decoded.GuardianInfo || !decoded.GuardianInfo.studentId) {
                return res.status(403).json({ message: 'Forbidden: Invalid token payload' });
            }
            req.studentId = decoded.GuardianInfo.studentId;
            next();
        }
    );
};

module.exports = verifyGuardianJWT;