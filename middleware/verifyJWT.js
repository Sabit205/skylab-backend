const jwt = require('jsonwebtoken');

const verifyJWT = (req, res, next) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    jwt.verify(
        token,
        process.env.ACCESS_TOKEN_SECRET,
        (err, decoded) => {
            if (err) return res.status(403).json({ message: 'Forbidden' });
            
            // --- THE DEFINITIVE FIX ---
            // Safety check: Ensure the decoded token has the expected UserInfo structure.
            if (!decoded.UserInfo || !decoded.UserInfo.roles) {
                return res.status(403).json({ message: 'Forbidden: Invalid token type' });
            }
            
            req.userInfo = decoded.UserInfo;
            req.roles = decoded.UserInfo.roles;
            next();
        }
    );
};

const verifyRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req?.roles) return res.status(401).json({ message: 'Unauthorized (No roles)' });
        const rolesArray = [...allowedRoles];
        const result = req.roles.map(role => rolesArray.includes(role)).find(val => val === true);
        if (!result) return res.status(401).json({ message: 'Unauthorized (Role not permitted)' });
        next();
    };
};

module.exports = { verifyJWT, verifyRoles };