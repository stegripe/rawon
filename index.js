const Discord = require('discord.js');
const bot = new Discord.Client({
 disableMentions: 'everyone'
});

const PREFIX = '#!';

const { Player } = require('discord-player');

const player = new Player(bot, 'Your YouTube v3 API KEY');

bot.on('ready', async () => {
 console.log('Bot ready!');
});

bot.on('message', async message => {
 if (message.author.bot) return;
 if (message.channel.type === 'dm') return;

 const msg = message.content.toLowerCase();
 const args = message.content.slice(PREFIX.length).trim().split(' ');
 const cmd = args.shift().toLowerCase();

 

 if (cmd === 'play' || cmd === 'p') {
  if (!message.member.voice.channel) return message.channel.send('You are not in voice channel!');

  let songQueue = args.join(' ');
  if (!songQueue) return message.reply('Please enter your music name.');

  let playingStats = player.isPlaying(message.guild.id);

  if (playingStats) {
    let song = await player.addToQueue(message.guild.id, songQueue, message.member.user.tag);
    message.channel.send(`**${song.name} added to queue!**`);
  } else {
   let song = await player.play(message.member.voice.channel, songQueue, message.member.user.tag);
   message.channel.send(`**Now playing ${song.name}...`);

   song.queue.on('end', () => {
    message.channel.send('Queue completed, add some more songs to play!')
    });

    song.queue.on('songChanged', (oldSong, newSong, skipped, repeatMode) => {
        if(repeatMode){
            message.channel.send(`Repeating:\n ${oldSong.name}`);
        } else {
            message.channel.send(`Now Playing:\n ${newSong.name}`);
        }
    });
   
   song.queue.on('channelEmpty', () => {
    message.channel.send('Stop playing, there is no more members in voice channel.');
   });
  }
 }

 if (cmd === 'skip' || cmd === 's') {
  if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel!`);
    
  if(!client.player.isPlaying(message.guild.id)) return message.channel.send(`There is nothing playing!`);
  
  let song = await client.player.skip(message.guild.id);

  message.channel.send(`Skipped:\n${song.name}`);
 }

 if (cmd === 'stop' || cmd === 'leave') {
  if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel!`);
    
  if(!client.player.isPlaying(message.guild.id)) return message.channel.send(`There is nothing playing!`);
  
  let song = await client.player.stop(message.guild.id);

  message.channel.send(`🚫 Disconnected`);
 }
  if (cmd === 'pause') {
   if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel!`);
    
  if(!client.player.isPlaying(message.guild.id)) return message.channel.send(`There is nothing playing!`);
  
  let song = await client.player.pause(message.guild.id);
            
  message.channel.send(`✅ Paused!`);
    
 }
  if (cmd === 'resume') {
  if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel!`);
    
  if(!client.player.isPlaying(message.guild.id)) return message.channel.send(`There is nothing playing!`);
  
  let song = await client.player.resume(message.guild.id);
            
  message.channel.send(`✅ Resumed!`);
 }
 if (cmd === 'set-volume') {
   if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel!`);
    
  if(!client.player.isPlaying(message.guild.id)) return message.channel.send(`There is nothing playing!`);
  let volume = parseInt(args[0]);
  if (!volume) return message.channel.send(`Please enter a number!`);
  if (isNaN(args[0])) return message.channel.send(`Please enter a valid number!`);
  if (volume > 100) return message.reply('I can\'t hate your ear!');
  client.player.setVolume(message.guild.id, volume);
    
  message.channel.send(`Volume set to \`%${volume}\` `);

 }
 if (cmd === 'queue') {
  if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel!`);
  
    let queue = client.player.getQueue(message.guild.id);

    if(!queue) return message.channel.send(`There is nothing playing!`);

    let q = queue.songs.map((song, i) => {
        return `${i === 0 ? 'Current' : `${i+1}`}- ${song.name} : ${song.author}`
    }).join('\n');  
       message.channel.send({embed: {color: 56758, description: `📝 | ${q}` }})

 }
 if (cmd === 'help' || cmd === 'h') {
  const Embed = new Discord.MessageEmbed()
	.setColor('#0099ff')
        .setTitle(`Commands for ${bot.user.username}!`)
        .setDescription(`\`help\`,\`play\`,\`skip\`,\`stop\`,\`pause\`,\`resume\`,\`queue\`,\`set-volume\`,\`clear-queue\`,\`np\`,\`loop\``)
	.setTimestamp()

message.channel.send(Embed)
 }
 if (cmd === 'clear-queue') {
  if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel!`);

  if(!client.player.isPlaying(message.guild.id)) return message.channel.send(`There is nothing playing!`);

  client.player.clearQueue(message.guild.id);

   message.channel.send(`Queue cleared!`);
 }
 if (cmd === 'np' || cmd === 'now-playing') {
  if(!message.member.voice.channel) return  message.channel.send(`You must be in a voice channel!`);

    if(!client.player.isPlaying(message.guild.id)) return message.channel.send(`There is nothing playing!`);

    let song = await client.player.nowPlaying(message.guild.id);

    message.channel.send(`🎶 Now Playing:\n${song.name} by \`${song.requestedBy}\``);

 }
 if (cmd === 'loop' || cmd === 'repeat') {
  if(!message.member.voice.channel) return message.channel.send(`You must be in a voice channel!`);
if(!client.player.isPlaying(message.guild.id)) return message.channel.send(`You must be in a voice channel!`);

client.player.setRepeatMode(message.guild.id, true);
 // Get the current song
 let song = await client.player.nowPlaying(message.guild.id);
  
 message.channel.send(`🚀 | Repeating ${song.name}!`);  

 }
});

 

bot.login('Your Bot Token');
