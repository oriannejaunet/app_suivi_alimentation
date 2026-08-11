import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';
import { todayLogDate, scaleNutrition } from '../services/calorie.service.js';

export async function createLog(req, res, next) {
  try {
    const { barcode, foodName, quantityG, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, logDate } = req.body;

    const log = await prisma.foodLog.create({
      data: {
        userId: req.userId,
        logDate: logDate || todayLogDate(),
        barcode: barcode || null,
        foodName,
        quantityG,
        ...scaleNutrition({ caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g }, quantityG),
      },
    });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function listLogs(req, res, next) {
  try {
    const logDate = req.validatedQuery.logDate || todayLogDate();
    const logs = await prisma.foodLog.findMany({
      where: { userId: req.userId, logDate },
      orderBy: { createdAt: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    next(err);
  }
}

export async function deleteLog(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      throw new HttpError(404, 'Entrée introuvable');
    }

    const { count } = await prisma.foodLog.deleteMany({
      where: { id, userId: req.userId },
    });
    if (count === 0) {
      throw new HttpError(404, 'Entrée introuvable');
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
