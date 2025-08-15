import prisma from '../prismaClient.js';

export const checkRole = (allowedRoles = []) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.userId;

      // Get user with role
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true }
      });

      if (!user) {
        return res.status(401).json({ message: 'User not found' });
      }

      // Check if user role is in allowed roles
      if (!allowedRoles.includes(user.role)) {
        return res.status(403).json({ 
          message: 'Access denied. Insufficient permissions.' 
        });
      }

      // Add role to request object for further use
      req.userRole = user.role;
      next();

    } catch (error) {
      console.error('Role check error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  };
};
