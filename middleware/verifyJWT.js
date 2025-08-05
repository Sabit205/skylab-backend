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
            
            // CRITICAL FIX: Attach the full UserInfo object to the request.
            // This makes req.userInfo.id, req.userInfo.roles, etc. available everywhere.
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