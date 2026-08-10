import { prisma } from '../lib/prisma.js';
import { HttpError } from '../middleware/errorHandler.js';

function todayLogDate() {
  return new Date().toISOString().slice(0, 10);
}

export async function createLog(req, res, next) {
  try {
    const { barcode, foodName, quantityG, caloriesPer100g, proteinPer100g, carbsPer100g, fatPer100g, logDate } = req.body;
    const factor = quantityG / 100;

    const log = await prisma.foodLog.create({
      data: {
        userId: req.userId,
        logDate: logDate || todayLogDate(),
        barcode: barcode || null,
        foodName,
        quantityG,
        calories: caloriesPer100g * factor,
        proteinG: proteinPer100g != null ? proteinPer100g * factor : null,
        carbsG: carbsPer100g != null ? carbsPer100g * factor : null,
        fatG: fatPer100g != null ? fatPer100g * factor : null,
      },
    });
    res.status(201).json(log);
  } catch (err) {
    next(err);
  }
}

export async function listLogs(req, res, next) {
  try {
    const logDate = req.query.logDate || todayLogDate();
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
    const log = await prisma.foodLog.findUnique({ where: { id } });
    if (!log || log.userId !== req.userId) {
      throw new HttpError(404, 'Entrée introuvable');
    }
    await prisma.foodLog.delete({ where: { id } });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}
