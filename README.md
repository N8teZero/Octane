# Octane
 A street racing experience, within Discord. Buy and manage cars, race AI opponents, and more!

## Commands

This Discord Racing Bot comes with the following commands:


### /start
Starts your player account, and provides basic commands to get going.

### /profile
Check player stats for yourself or other active players.

### /race
Race against AI opponents to earn coins and XP.

### /daily | /weekly | /lottery | /work | /afk
Other ways to make coins on cool down. 

### /leaderboard
Displays the current leaderboard with the top racers.

### /help
Provides information about the available commands.

## Systems

The Discord Racing Bot utilizes the following systems:


### Player Customizable Profiles
Players are able to customize their username shown, as well as colors and the background image for their generate profile image.

### Passive Incomes
Even when you aren't playing, you are earning! Use /afk to collect the AFK rewards.

### Progressive Level and AI Races
As you level up, you will be able to purchase better cars, upgrades, and challenge higher level AI. 

### Leaderboard System
Keeps track of the top racers and displays the leaderboard.

## Patch Notes
## 2024-08-29 - 2.28.0
### What didn't I touch?
* Added /top command to see top guilds based on various stats. This will be expanded on more with a coming update
* Removed /boosters command as it's fully covered in the /store command now
* Removed dev commands that were used for adding jobs and challenges, no longer needed
* Bug Fix - Scrap command was not removing the items correctly, and has been fixed
* Bug Fix - Fixed the uptime display on the info command, it was showing undefined due to mismatched types
* AFK - Added a maximum afk payout of 48 hours. May adjust this as needed
* Challenges - Added categories to challenges so that we can have Starter challenges in addition to the existing Daily challenges, more to come
* Challenges - Refactored so that doing challenges will complete across multiple categories. For example, opening your profile will complete both the starter and daily challenge. Daily challenges are reset each day
* Cooldowns - Added a Refresh button to the cooldowns command so that it can be reused. Needs testing as buttons will timeout
* Inventory - Added a Scrap button to the inventory command so players can quickly scrap the unusable car parts for coins. (XP coming soon)
* Junkyard - Added a View Inventory button to the junkyard command so that players can quickly see all findings
* Lottery - Overhauled the command to allow players to use up to 10 tokens at once, and improved the UI
* Jobs - Added new jobs to the market to choose from, with varying pay and level requirements
* Jobs - Adjusted Job List so that it sorts by level requirement
* Jobs - Added positions to the jobs that will be unlocked through using the /work command and getting job xp. I'll be expanding on this so that players can become job managers and owners
* Leaderboard - Added buttons to change between Guild and Global leaderboards. This removes the need to repeat the command for both views
* Shop - Changes the command name for the Car Shop to /dealer. But typing /shop should still autopopulate to /dealer
* Many more small things that I should have documented :nodders: I also created a dev web panel for managing items, challenges, jobs, and more!
* Last but not least, I am working on a large update that will be releasing over the next few weeks that contains new items, player bonuses, and new ways to interact as a guild
* Actually last thing, something to note: I have found that when I push command updates, the commands become available for up to an hour. I will try not to push those updates often anymore, but if you experience consistent failed interactions from the bot, this is likely the cause and should resolve shortly

## 2024-08-19 - 2.24.4
### Minor patches
* Refactored /refuel command to have 30minute cooldown
* Improved /race command, logic for checking active vehicle
* Junkyard now accepts a count to visit multiple times. This will show the total amount of parts obtained and values accordingly

## 2024-08-18 - 2.24.0
### Logging Updates, Misc patches
* Improved logging to capture errors and aid in debugging. Separated errors from debug messages
* Log levels can be disabled independently to clean up log files
* Crew Tags converted to uppercase
* Junkyard Items: Removed "Good" condition. Adjusted probabilities and added more information to the embeds to explain
* Leaderboard options to view Guild or Global leaderboards
* Added Store command to view currently available items to /buy
* Updated /buy command to accept dynamic item lists
* Adjusted AI Races: Added lower level car to match player starting stats
* Added Items Schema to save items such as junkyard passes, lottery tokens, xp/coin boosters

## 2024-08-17 - 2.23.6
### Minor updates
* Added /guild command to view current guild settings and aggregate stats for players that started in your guild.
* Added /practice command as the first pass at player vs player races. These races are simulated using the other players active vehicle and upgrades.
* Cleaned up outdated commands, deprecated /admin and /botstats commands.
* Bug fixes for decimal places where there should not be, typos, and sentance enhancements (Insert Dolphin noises)

## 2024-08-14 - 2.23.0
### Completed Vehicle upgrades system update
* Added a vehicle upgrades system using the parts retrieved from the junkyard minigame. When a player finds a "Usable" part, they can install it with the /upgrade command
* /Upgade [Item Name] to install a usable part. Upgrades stack, so each usable part you find of the same type, will multiple the bonuses
* /Garage command has been updated to reflect the vehicle stats and upgrade bonuses
* /Inventory command added to see the scrap and usable items found. It shows the quantity of items by condition

## 2024-08-14 - 2.22.0
### Completed Job system update
* Added a job system where players can view jobs, and select one they want. More jobs will be added with various benefits. This system will also get expanded onto where players will be able to get promoted at a job, or even start their own job
* /Job list to view all available jobs. You can apply for a job to gain the benefits of extra passive pay and more
* /Job info to view details about your job such as your pay and experience
* /Job apply to apply for a job. Right now there's no checks, it will auto accept. Will add job experience requirements later
* /Job view to look at specific details about a job using the job tag
* /Job leave to leave a job. This will remove your income and ability to /work. You'll need another job
* Junkyard feature, a looting minigame that grants players randomized junkyard car parts. Players can scrap these parts for coins. There are also rare upgrades they can find that will help their vehicles
* /Junkyard to visit the junkyard and gather random parts. Junkyard passes are 500 coins, with potential payouts for the scrap being much higher
* /Scrap command to get rid of all junk parts. This will not scrap "Usable" parts
* /Buy command to purchase junkyard passes and lottery tickets. Will be expanded onto 

## 2024-08-03 - 2.20.0
### Completed Crew system update
* /Crew Create to start a crew, this will be level restricted at some point
* /Crew List to view all active crews and their joinable status
* /Crew Info to view details about a crew
* /Crew Promote/Demote to change a members rank within the crew, admins can kick and invite members to a closed crew
* /Crew Join/Leave to join or leave a crew 
* /Crew Kick/Invite to kick someone from the crew or invite a member. Crew owners can set the rank of the invitee
* /Crew Disband to disable your crew. This will remove all members including admins and owner, and remove it from the crew list. But donations and bank are in-tact for later updates to handle
* /Crew Donate to donate to the crew, can donate 500 coins per day. The crew owner can use the donations to upgrade the crew, unlocking more member slots and bonuses
* /Crew Upgrade to upgrade your crew, with a max level of 5. 
* /Crew Settings to adjust crew settings including Name, Description, Embed Color, and Open status
* This update was focused on opening up cross-server compatibility. Profiles are not linked to one server, though there will be server leaderboards to come
* Added crews which support cross-server, so players can create a crew that players, across any servers where the bot is, can join. Crews will give bonuses like reward modifiers based on crew level

## 2024-07-31 - 2.19.0
### Completed fuel system update
* /Race consumes 25 fuel, win or lose
* /Refuel command to fill to max capacity
* Fuel shown on /Garage per vehicle
* Purchased cars come with full tank
* Cooldowns command shows cooldown for /Refuel
* Passive refuel system to incrementally restore fuel
* Updated /profile to display fuel


This bot is a long-time passion project of mine. Years ago I started working on it and made decent progress getting several commands working, but between ADHD and issues with trying to use commonJS over ESM I lost interest. A few months ago I got the motivation back, and have been using AI to assist with syntax, as I still refuse to learn ESM. I'll be making regular updates for as long as I can, feel free to join the dev server if you have suggestions/feedback.
https://discord.gg/yWEDMWd4AN