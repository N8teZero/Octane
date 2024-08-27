const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getLogger } = require('../utils/logging');
const { getSetting } = require('../utils/settingsCache');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Displays help information for commands.'),
    category: 'Misc',
    async execute(interaction) {
    let logger = await getLogger();
        await interaction.deferReply({ ephemeral: true });

        try {
            const embeds = await generateHelpEmbeds(interaction);
            for (const embed of embeds) {
                await interaction.followUp({ embeds: [embed], ephemeral: true });
            }
        } catch (error) {
            logger.error(interaction.user.tag+' | help: '+error);
            await interaction.followUp({ content: 'There was an error while sending help information.', ephemeral: true });
        }
    }
};

async function generateHelpEmbeds(interaction) {
    const botVersion = await getSetting('botVersion');
    const devID = await getSetting('devID');
    const commands = interaction.client.commands;
    const categories = {};

    commands.forEach(command => {
        const category = command.category || 'Misc';
        if (!categories[category]) {
            categories[category] = [];
        }
        categories[category].push(command);
    });

    const embeds = Object.keys(categories).filter(category => {
        return !(category === 'Admin' && interaction.user.id !== devID);
    }).map(category => {        
        const embed = new EmbedBuilder()
            .setColor('#00ff00')
            .setTitle(`Category - ${category}`)
            .setDescription('Available commands:')
            .setFooter({ text: botVersion });

        categories[category].forEach(command => {
            embed.addFields({ name: `/${command.data.name}`, value: command.data.description || 'No description available', inline: true });
        });

        return embed;
    });

    return embeds;
}
