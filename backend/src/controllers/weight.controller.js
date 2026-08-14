import { prisma } from '../lib/prisma.js';
import { todayLogDate, shiftLogDate } from '../services/calorie.service.js';

export async function logWeight(req, res, next) {
  try {
    const { weightKg, logDate } = req.body;
    const date = logDate || todayLogDate();

    const log = await prisma.weightLog.upsert({
      where: { userId_logDate: { userId: req.userId, logDate: date } },
      create: { userId: req.userId, weightKg, logDate: date },
      update: { weightKg },
    });

    // Le poids "actuel" du profil (utilisé pour le calcul du BMR/TDEE) doit refléter
    // la pesée la plus récente chronologiquement, pas la dernière saisie à l'écran :
    // une saisie rétroactive ne doit pas écraser un poids plus récent déjà enregistré.
    const latest = await prisma.weightLog.findFirst({
      where: { userId: req.userId },
      orderBy: { logDate: 'desc' },
    });
    if (latest) {
      await prisma.user.update({ where: { id: req.userId }, data: { weightKg: latest.weightKg } });
    }

    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function listWeights(req, res, next) {
  try {
    const days = req.validatedQuery?.days ?? 90;
    const endDate = req.validatedQuery?.endDate ?? todayLogDate();
    const sinceDate = shiftLogDate(endDate, -(days - 1));

    const logs = await prisma.weightLog.findMany({
      where: { userId: req.userId, logDate: { gte: sinceDate } },
      orderBy: { logDate: 'asc' },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}
