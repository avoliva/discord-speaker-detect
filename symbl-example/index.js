const { Client, GatewayIntentBits } = require("discord.js");
const { joinVoiceChannel, getGroups, getVoiceConnection } = require("@discordjs/voice");
const { addSpeechEvent } = require("discord-speaker-detect");
const { sdk } = require("@symblai/symbl-js");
const { v4 } = require('uuid');
require('dotenv').config()


sdk.init({
  appId: process.env.APP_ID,
  appSecret: process.env.APP_SECRET
}).then(async () => {
  const connectionConfig = {
    id: v4(),
    insightTypes: ["question", "action_item", "follow_up"],
    config: {
      meetingTitle: 'My Test Meeting',
      confidenceThreshold: 0.7,
      timezoneOffset: 480, // Offset in minutes from UTC
      languageCode: 'en-US',
      encoding: 'opus',
      sampleRateHertz: 48000
    },
    handlers: {
      onSpeechDetected: (data) => {
        if (data) {
          const {punctuated} = data
          console.log('Live: ', punctuated && punctuated.transcript)
          console.log('');
        }
        console.log('onSpeechDetected ', JSON.stringify(data, null, 2));
      },
    },
    speaker: {
      userId: "user@example.com",
      name: "Your Name Here"
    }
  };
  const symblConnection = await sdk.startRealtimeRequest(connectionConfig);
  const client = new Client({
    intents: [
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.Guilds,
    ],
  });
  addSpeechEvent(client);

  client.on("messageCreate", (msg) => {
    const voiceChannel = msg.member?.voice.channel;
    if (voiceChannel) {
      const connection = joinVoiceChannel({
        channelId: voiceChannel.id,
        guildId: voiceChannel.guild.id,
        adapterCreator: voiceChannel.guild.voiceAdapterCreator,
        selfDeaf: false,
      });
    }
  });

  client.on("speaking", (msg) => {
    symblConnection.sendAudio(msg);
  });

  client.on("ready", () => {
    console.log("Ready!");
  });

  client.login(process.env.DISCORD_BOT_TOKEN);
});

