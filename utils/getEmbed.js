const { DateTime } = require('luxon');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { calculateShrineLevel } = require('./main');

async function getShrineEmbed(profile) {
    const shrineLvl = await calculateShrineLevel(profile.shrineXP);
    const embed = new EmbedBuilder()
        .setColor(0x00AE86)
        .setTitle(`Car Gods Shrine - Level ${shrineLvl}`)
        .setDescription(`**Feast Supplies:** ${[profile.feastSupplies]}\n\nSpend 100 Feast Supplies to unlock a random blessing.`)
        .setFooter({text: 'Shrine XP: ' + profile.shrineXP});

    now = DateTime.now().setZone('America/New_York').toJSDate()
    const rows = [
        new ActionRowBuilder(),
        new ActionRowBuilder()
    ];

    profile.blessings.forEach((blessing, index) => {
        const lockState = blessing.locked ? '🔒' : '🔓';
        const lockLabel = blessing.locked ? 'Unlock' : 'Lock';
        const bonusInfo = Object.entries(blessing.stats)
        .filter(([stat, value]) => value > 0)
        .map(([stat, value]) => `${stat} ${value}x`)
        .join('\n');
        const bonusDescription = blessing.active ? `${bonusInfo}\n**Level:** ${blessing.level}` : 'Inactive';
        embed.addFields({
            name: `Blessing ${index + 1} (${lockState})`,
            value: bonusDescription,
            inline: true
        });

        //console.log(`toggle_lock_${index}`);
        const disableButton = !blessing.active;
        const button = new ButtonBuilder()
            .setCustomId(`toggle_lock_${index}`)
            .setLabel(lockLabel)
            .setEmoji(lockState)
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(disableButton);

        if (index < 3) {
            rows[0].addComponents(button);
        } else {
            rows[1].addComponents(button);
        }
    });

    const getBlessingButton = new ButtonBuilder()
        .setCustomId('getBlessing')
        .setLabel('Get Blessing')
        .setStyle(ButtonStyle.Success)
        .setDisabled(profile.feastSupplies < 100);

    rows[1].addComponents(getBlessingButton);

    return { embed, rows };
}

module.exports = {
    getShrineEmbed
};