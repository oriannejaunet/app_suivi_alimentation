import { prisma } from '../lib/prisma.js';

function toPublicUser(user) {
  const { passwordHash, ...publicUser } = user; // eslint-disable-line no-unused-vars
  return publicUser;
}

export async function getProfile(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const data = { ...req.body };
    const requiredFields = ['heightCm', 'weightKg', 'age', 'gender', 'activityLevel', 'goal'];
    const merged = { ...(await prisma.user.findUnique({ where: { id: req.userId } })), ...data };
    const isComplete = requiredFields.every((field) => merged[field] != null);

    const user = await prisma.user.update({
      where: { id: req.userId },
      data: { ...data, onboarded: isComplete },
    });
    res.json(toPublicUser(user));
  } catch (err) {
    next(err);
  }
}
