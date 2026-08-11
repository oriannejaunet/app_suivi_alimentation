import { prisma } from '../lib/prisma.js';
import { calculateSummary, calculateBMR, calculateTDEE, calculateTargetCalories, todayLogDate, GOAL_RATE_KCAL } from '../services/calorie.service.js';
import { HttpError } from '../middleware/errorHandler.js';

function isoDate(date) {
  return date.toISOString().slice(0, 10);
}

export async function getSummary(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.onboarded) {
      throw new HttpError(400, 'Merci de compléter le questionnaire avant de consulter vos statistiques');
    }

    const logDate = req.validatedQuery.logDate || todayLogDate();
    const logs = await prisma.foodLog.findMany({ where: { userId: req.userId, logDate } });

    const caloriesConsumed = logs.reduce((sum, l) => sum + l.calories, 0);
    const proteinConsumed = logs.reduce((sum, l) => sum + (l.proteinG || 0), 0);
    const carbsConsumed = logs.reduce((sum, l) => sum + (l.carbsG || 0), 0);
    const fatConsumed = logs.reduce((sum, l) => sum + (l.fatG || 0), 0);

    const summary = calculateSummary({
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      age: user.age,
      gender: user.gender,
      activityLevel: user.activityLevel,
      goal: user.goal,
      goalRateKcal: user.goalRateKcal,
      caloriesConsumed,
    });

    res.json({
      ...summary,
      proteinConsumed: Math.round(proteinConsumed * 10) / 10,
      carbsConsumed: Math.round(carbsConsumed * 10) / 10,
      fatConsumed: Math.round(fatConsumed * 10) / 10,
    });
  } catch (err) {
    next(err);
  }
}

export async function getHistory(req, res, next) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user.onboarded) {
      throw new HttpError(400, 'Merci de compléter le questionnaire avant de consulter vos statistiques');
    }

    const days = req.validatedQuery.days ?? 14;
    const dates = Array.from({ length: days }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return isoDate(d);
    });

    const logs = await prisma.foodLog.findMany({
      where: { userId: req.userId, logDate: { in: dates } },
    });

    const caloriesByDate = {};
    for (const log of logs) {
      caloriesByDate[log.logDate] = (caloriesByDate[log.logDate] || 0) + log.calories;
    }

    // Les seuils actuels s'appliquent à tout l'historique affiché : recalculer un
    // seuil différent par jour passé nécessiterait de conserver un profil historisé,
    // hors scope pour un premier historique.
    const bmr = calculateBMR({
      weightKg: user.weightKg,
      heightCm: user.heightCm,
      age: user.age,
      gender: user.gender,
    });
    const tdee = calculateTDEE(bmr, user.activityLevel);
    const maintenanceCalories = Math.round(calculateTargetCalories(tdee, GOAL_RATE_KCAL.maintain));
    const loseCalories = Math.round(calculateTargetCalories(tdee, GOAL_RATE_KCAL.lose));

    const history = dates.map((logDate) => ({
      logDate,
      caloriesConsumed: Math.round(caloriesByDate[logDate] || 0),
      maintenanceCalories,
      loseCalories,
    }));

    res.json(history);
  } catch (err) {
    next(err);
  }
}
