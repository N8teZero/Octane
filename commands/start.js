const Profile = require('../models/Profile');
const { SelectMenuBuilder } = require('@discordjs/builders');
const { starterVehicles } = require('../data/vehicles');
const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder } = require('discord.js');
const { getLogger } = require('../utils/logging');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('start')
        .setDescription('Get started by choosing your first vehicle!'),
    category: 'Misc',
    async execute(interaction) {
    let logger = await getLogger();
        let profile = await Profile.findOne({ userId: interaction.user.id });
        if (profile) {
            return interaction.reply({ content: 'You already have a profile.', ephemeral: true });
        }

        const vehicleMenu = new SelectMenuBuilder()
            .setCustomId('select-starter-vehicle')
            .setPlaceholder('Select your starter vehicle')
            .addOptions([
                {
                    label: 'Ford Fiesta',
                    description: 'A compact and reliable car.',
                    value: '0'
                },
                {
                    label: 'Toyota Corolla',
                    description: 'Perfect for new racers.',
                    value: '1'
                },
                {
                    label: 'Honda Civic',
                    description: 'A durable and efficient vehicle.',
                    value: '2'
                }
            ]);

        const row = new ActionRowBuilder().addComponents(vehicleMenu);

        let embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`Choose a starting vehicle...`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setDescription('They might not be the fastest, but they are free!')
                .addFields(
                    { name: 'Ford Fiesta',    value: `**Stats:**\nSpeed: 50, Acceleration: 30, Handling: 40` },
                    { name: 'Toyota Corolla', value: `**Stats:**\nSpeed: 60, Acceleration: 40, Handling: 50` },
                    { name: 'Honda Civic',    value: `**Stats:**\nSpeed: 55, Acceleration: 35, Handling: 45` }
                )
                .setFooter({ text: 'Type /help for a command list and more information' });

        await interaction.reply({ content: 'Please select your starter vehicle:', embeds: [embed], components: [row] });

        const filter = i => i.customId === 'select-starter-vehicle' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 15000 });

        collector.on('collect', async i => {
            const selectedVehicle = parseInt(i.values[0], 10);
            const vehicle = starterVehicles[selectedVehicle];
            try {
                if (!vehicle) {
                    await i.update({ content: "Selected vehicle not found.", components: [] });
                    return;
                }
                profile = await Profile.create({
                    userId: interaction.user.id,
                    guildId: interaction.guildId,
                    username: interaction.user.username,
                    vehicles: [{ year: vehicle.year, make: vehicle.make, model: vehicle.model, isActive: true, stats: vehicle.stats, image: vehicle.image }]
                });
            } catch (error) {
                logger.error(interaction.user.tag+' | start: '+error);
                return i.update({ content: 'Failed to create profile.', components: [] });
            }            

            embed = new EmbedBuilder()
                .setColor('#00ff00')
                .setTitle(`Welcome to Octane ${profile.username} Racing!`)
                .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }))
                .setDescription('Your profile has been successfully set up!')
                .addFields(
                    { name: 'Free Vehicle', value: `You have received a free ${vehicle.make} ${vehicle.model}!` },
                    { name: 'Get Started', value: 'Use `/race` to start racing immediately' },
                    { name: 'Check Profile', value: 'Use `/profile` to view your profile and stats' },
                    { name: 'Buy Vehicles', value: 'Use `/shop` to buy new vehicles' }
                )
                .setFooter({ text: 'Type /help for a command list and more information' });
            await i.update({ content: '', embeds: [embed], components: [] });
        });

        collector.on('end', collected => {
            if (!collected.size)
                interaction.editReply({ content: 'You did not select a vehicle.', components: [] });
        });
    }
};
