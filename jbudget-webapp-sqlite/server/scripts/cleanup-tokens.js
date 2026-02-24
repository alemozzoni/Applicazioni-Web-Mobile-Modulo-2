/**
 * Script di Pulizia Token Scaduti
 *
 * Elimina dal database tutti i refresh token scaduti.
 * Può essere eseguito manualmente o schedulato con cron.
 *
 * Uso manuale:
 *   node scripts/cleanup-tokens.js
 *
 * Uso con cron (ogni giorno a mezzanotte):
 *   0 0 * * * cd /opt/jbudget/server && node scripts/cleanup-tokens.js
 */

require('dotenv').config();
const { RefreshToken, sequelize } = require('../src/models');
const { Op } = require('sequelize');

async function cleanupExpiredTokens() {
    try {
        console.log('🧹 Pulizia refresh token scaduti...\n');

        // Conta token scaduti prima di eliminare
        const expiredCount = await RefreshToken.count({
            where: {
                expires_at: { [Op.lt]: new Date() }
            }
        });

        if (expiredCount === 0) {
            console.log('Nessun token scaduto da eliminare.');
        } else {
            // Elimina tutti i token scaduti
            const deletedCount = await RefreshToken.destroy({
                where: {
                    expires_at: { [Op.lt]: new Date() }
                }
            });

            console.log(`Eliminati ${deletedCount} refresh token scaduti.`);
        }

        // Mostra statistiche
        const totalTokens = await RefreshToken.count();
        const activeTokens = await RefreshToken.count({
            where: {
                expires_at: { [Op.gt]: new Date() }
            }
        });

        console.log(`\nStatistiche:`);
        console.log(`   Token totali nel DB: ${totalTokens}`);
        console.log(`   Token ancora attivi: ${activeTokens}`);
        console.log(`\nPulizia completata!`);

    } catch (error) {
        console.error('Errore durante la pulizia:', error);
        process.exit(1);
    } finally {
        await sequelize.close();
    }
}
cleanupExpiredTokens();
