const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const { DateTime } = require('luxon');
const { Profile } = require('../models');
const { giveXP, giveCoins, giveItem, updateChallenge, generateVehiclestats } = require('../utils/main');
const { aiRaces } = require('../data/vehicles');
const { getLogger } = require('../utils/logging');
const { updateBooster } = require('../utils/main');
const sharp = require('sharp');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('race')
        .setDescription('Challenge an AI in a street race. Win to earn rewards.'),
    category: 'Rewards',
    async execute(interaction, guildSettings, client) {
        const profile = await Profile.findOne({ userId: interaction.user.id });
        if (!profile) {
            return interaction.reply('You need a profile to participate in street races.', { ephemeral: true });
        }
        const aiVehicles = aiRaces.filter(car => car.enabled);
        //logger.debug(`Race AI: ${JSON.stringify(aiVehicles)}`);
        const logger = await getLogger();
        if (aiVehicles.length === 0) {
            await logger.warn(`race: ${profile.username} No AI vehicles`);
            await interaction.reply({
                content: "There are currently no races available, check back later.",
                embeds: [],
                components: []
            });
            return;
        }
        const playerVehicle = profile.vehicles.find(v => v.isActive);
        if (!playerVehicle) {
            await logger.debug('Active vehicle not found for user: ' + interaction.user.id);
            return interaction.reply('No active vehicle found.', { ephemeral: true });
        }
        const fuelCost = 25; // 25% fuel cost
        if (playerVehicle.stats.currentFuel < fuelCost) {
            await logger.debug(`race: Low fuel for ${profile.username} | Vehicle: ${playerVehicle.make} ${playerVehicle.model} | Fuel: ${playerVehicle.stats.currentFuel} | Cost: ${fuelCost}`);
            return interaction.reply({ content: 'Not enough fuel to race, use `/refuel` to top off.', ephemeral: true });
        }

        const aiVehicleCurrent = aiVehicles.find(v => v.level === profile.streetRaceStats.highestLevelUnlocked);
        const aiVehicleNext = aiVehicles.find(v => v.level === profile.streetRaceStats.highestLevelUnlocked + 1) || aiVehicleCurrent;
        const resizedBuffer = await sharp(playerVehicle.image)
            .resize(128, 128)
            .toBuffer();

        const attachment = new AttachmentBuilder(resizedBuffer, { name: 'vehicle.png' });

        const embed = new EmbedBuilder()
            .setTitle('Street Race Challenge')
            .setDescription('Choose your race level. Racing will consume 25% of fuel\nYou can use `/refuel` to get more')
            .addFields(
                { name: 'Current Level - ' + aiVehicleCurrent.level, value: `${aiVehicleCurrent.make} ${aiVehicleCurrent.model}`, inline: true },
                { name: 'Next Level - ' + aiVehicleNext.level, value: `${aiVehicleNext.make} ${aiVehicleNext.model}`, inline: true },
                { name: 'Your Vehicle', value: `${playerVehicle.make} ${playerVehicle.model}`, inline: false }
            )
            .setImage('attachment://vehicle.png')
            .setFooter({ text: `${playerVehicle.stats.currentFuel}% of fuel remaining.` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('race_current_level')
                    .setLabel('Race Current Level')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('race_next_level')
                    .setLabel('Race Next Level')
                    .setStyle(ButtonStyle.Success),
            );

        await interaction.reply({ embeds: [embed], components: [row], files: [attachment] });

        const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });
        collector.on('collect', async i => {
            if (!['race_current_level', 'race_next_level'].includes(i.customId)) return;
            await i.deferUpdate().catch(console.error);

            const isNextLevel = i.customId === 'race_next_level';
            const aiVehicle = isNextLevel ? aiVehicleNext : aiVehicleCurrent;
            try {
                const result = await simulateRace(profile, aiVehicle);
                const { xpEarned, coinsEarned } = await calculateStreetRacingReward(profile, i.customId === 'race_next_level' ? aiVehicleNext.level : aiVehicleCurrent.level);
                //logger.debug(`Race rewards: ${xpEarned} XP, ${coinsEarned} coins`); 
                setTimeout(async () => {
                    let rewardsMessage = 'Well, you didn\'t lose your car at least.';
                    if (result) {                     
                        await giveCoins(profile, coinsEarned, 'Race rewards');
                        await giveXP(profile, interaction.guildId, xpEarned, client, 'Race rewards');
                        if (Math.random() < 0.3) {
                            await giveItem(profile, 'junkyard_pass', 1, 'Rare Race Reward');
                            rewardsMessage += '\n\nYou found a Junkyard Pass!';
                        }
                        profile.streetRaceCount += 1;
                        profile.streetRaceStats.wins += 1;
                        profile.streetRaceStats.lastRaceDate = DateTime.now().setZone('America/New_York').toJSDate();
                        playerVehicle.stats.currentFuel -= fuelCost;
                        if (i.customId === 'race_next_level') {
                            profile.streetRaceStats.highestLevelUnlocked++;
                        }
                        rewardsMessage = `${coinsEarned} <:coins:1269411594685644800>\n\n${xpEarned} XP`;
                        await profile.save();
                        await updateChallenge(profile, 'racesCompleted');
                    } else {
                        profile.streetRaceCount += 1;
                        profile.streetRaceStats.losses += 1;
                        playerVehicle.stats.currentFuel -= fuelCost;
                        profile.streetRaceStats.lastRaceDate = DateTime.now().setZone('America/New_York').toJSDate();
                        await profile.save();
                    }
                    
                    const embed = new EmbedBuilder()
                        .setTitle(':checkered_flag: Race Result: ' + (result ? '🏆 You won the race!' : '😞 You lost the race.'))
                        .setDescription(result ? 'Congratulations on your victory!' : 'Better luck next time!')
                        .addFields([{ name: 'Rewards', value: rewardsMessage }])
                        .addFields([{ name: 'Race Stats', value: `${profile.streetRaceStats.wins}W / ${profile.streetRaceStats.losses}L` }])
                        .setColor(result ? '#00FF00' : '#FF0000')
                        .setFooter({ text: `Race consumed 25% of fuel, ${playerVehicle.stats.currentFuel.toLocaleString()}% remaining.` });
                

                    const components = [
                        new ActionRowBuilder()
                            .addComponents(new ButtonBuilder().setCustomId('race_menu').setLabel('Race Again').setStyle(ButtonStyle.Primary))
                    ];
            
                    await i.editReply({ content: null, embeds: [embed], components: components, files: [] });
                }, 1000);
                //logger.debug(interaction.guildId + ' - ' + xpEarned)
                collector.stop();
            } catch (error) {
                logger.error(interaction.user.tag+' | race: '+error);
                await i.followUp('An error occurred during the race.');
            }
        });
    }
};

async function simulateRace(profile, aiVehicle) {
    const vehicleStats = await generateVehiclestats(profile);

    const playerTotal = vehicleStats.totalPower + (profile.level * 2);
    const aiTotal = aiVehicle.stats.speed + aiVehicle.stats.acceleration + aiVehicle.stats.handling;

    const odds = playerTotal / (playerTotal + aiTotal);
    const rng = Math.random();
    const result = rng < odds;

    //logger.debug(`Odds: ${odds}, RNG: ${rng}, Result: ${result}`);
    return result;   
}

const calculateStreetRacingReward = async (profile, aiLevel) => {
    let logger = await getLogger();
    await updateBooster(profile);
    const prof = await Profile.findOne({ userId: profile.userId, guildId: profile.guildId });
    const xpBooster = prof.booster.xp || 1.0;
    const coinsBooster = prof.booster.coins || 1.0;

    const minCoins = aiLevel * 200;
    const maxCoins = aiLevel * 350;
    const coinsEarned = Math.floor((Math.random() * (maxCoins - minCoins + 1) + minCoins) * coinsBooster);
    const xpEarned = Math.floor(((Math.random() * (200 - 100 + 1) + 100) * xpBooster) * aiLevel);

    //logger.debug(`Player: ${profile.userId}, minCoins: ${minCoins}, maxCoins: ${maxCoins}, coinsEarned: ${coinsEarned}, xpEarned: ${xpEarned} for AI level ${aiLevel}`);

    return { minCoins, maxCoins, coinsEarned, xpEarned };
};