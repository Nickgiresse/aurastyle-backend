import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

export const adminOnly = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    res.status(401).json({ message: "Authentification requise." });
    return;
  }
  if (req.user.isAdmin !== true) {
    res.status(403).json({ message: "Accès refusé. Droits administrateur requis." });
    return;
  }
  next();
};
