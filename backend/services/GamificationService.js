const User = require('../models/User');
const PointsLog = require('../models/PointsLog');

const MULTIPLIER_WELCOME = 1.2;
const WELCOME_DAYS = 15;

function getCurrentSeason() {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-11
    let quarter = 1;

    if (month >= 0 && month <= 2) quarter = 1;
    else if (month >= 3 && month <= 5) quarter = 2;
    else if (month >= 6 && month <= 8) quarter = 3;
    else quarter = 4;

    return `${year}-Q${quarter}`;
}

const ACTION_POINTS = {
    FIRST_TO_GREET: 10,
    FIRST_TO_QUOTE: 15,
    QUOTE_WON: 30,
    JOB_COMPLETED_IN_TIME: 40,
    REVIEW_5_STAR: 50,
    REVIEW_4_STAR: 20,
    REVIEW_POOR: -50
};

class GamificationService {
    static async addPoints(professionalId, actionType, relatedId = null) {
        try {
            const professional = await User.findById(professionalId);
            if (!professional || professional.role !== 'professional') return null;

            const basePoints = ACTION_POINTS[actionType];
            if (!basePoints) {
                console.warn(`Action type ${actionType} not found in GamificationService`);
                return null;
            }

            let appliedMultiplier = 1.0;
            const msSinceCreation = Date.now() - new Date(professional.createdAt).getTime();
            const daysSinceCreation = msSinceCreation / (1000 * 60 * 60 * 24);
            
            if (daysSinceCreation <= WELCOME_DAYS && basePoints > 0) {
                appliedMultiplier = MULTIPLIER_WELCOME; // Boost! (Solo si son puntos positivos)
            }

            const finalPoints = Math.round(basePoints * appliedMultiplier);
            const season = getCurrentSeason();

            // Guardamos log
            await PointsLog.create({
                professionalId,
                season,
                actionType,
                relatedId,
                basePoints,
                multiplier: appliedMultiplier,
                finalPoints
            });

            // Usamos $inc en base de datos para no tener race conditions tan fácilmente en la caché de user
            const gamification = professional.gamification || { currentLevel: 1, projectedLevel: 1, currentSeasonPoints: 0 };
            
            let newTotalPoints = (gamification.currentSeasonPoints || 0) + finalPoints;
            if (newTotalPoints < 0) newTotalPoints = 0; // No menos que cero puntos
            
            let newProjected = 1; 
            if (newTotalPoints >= 3500) newProjected = 4;
            else if (newTotalPoints >= 1500) newProjected = 3;
            else if (newTotalPoints >= 500) newProjected = 2;

            const updateData = {
                'gamification.currentSeasonPoints': newTotalPoints,
                'gamification.projectedLevel': newProjected,
            };

            // Elevador automático de rango
            if (newProjected > (gamification.currentLevel || 1)) {
                updateData['gamification.currentLevel'] = newProjected;
            }

            const updatedUser = await User.findByIdAndUpdate(professionalId, updateData, { new: true });
            return updatedUser;

        } catch (err) {
            console.error('Error adding gamification points:', err);
            return null;
        }
    }
}

module.exports = { GamificationService, getCurrentSeason, ACTION_POINTS };
