const db = require('../config/db');

// How much XP is required to REACH each level
const XP_THRESHOLDS = {
  1: 0,
  2: 100,
  3: 250,
  4: 500,
  5: 1000,
  6: 2000,
  7: 4000,
  8: 8000,
  9: 15000,
  10: 30000
};

const getLevelForXP = (xp) => {
  let level = 1;
  for (const [lvl, threshold] of Object.entries(XP_THRESHOLDS)) {
    if (xp >= threshold) {
      level = parseInt(lvl, 10);
    } else {
      break;
    }
  }
  return level; // Max level 10 currently, or scales infinitely if we calculate it mathematically
};

const awardXP = async (user_id, amount) => {
  try {
    const userResult = await db.query('SELECT xp, level FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) return { xp: 0, level: 1, leveledUp: false };
    
    let currentXp = userResult.rows[0].xp || 0;
    let currentLevel = userResult.rows[0].level || 1;
    
    currentXp += amount;
    
    const newLevel = getLevelForXP(currentXp);
    const leveledUp = newLevel > currentLevel;
    
    await db.query('UPDATE users SET xp = $1, level = $2 WHERE id = $3', [currentXp, newLevel, user_id]);
    
    return { xp: currentXp, level: newLevel, leveledUp };
  } catch (err) {
    console.error("Error awarding XP", err);
    return null;
  }
};

module.exports = { awardXP, XP_THRESHOLDS, getLevelForXP };
