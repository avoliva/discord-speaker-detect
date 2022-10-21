import { getVoiceConnection, VoiceConnection } from "@discordjs/voice";
import { Client } from "discord.js";

declare module "discord.js" {
  interface ClientEvents {
    /**
     * This event is emitted when speech recognition is attached to voice connection
     */
    voiceJoin: [connection: VoiceConnection | undefined];
  }
}

/**
 * It's a bit hacky solution to check if speech handler has been already attached to connection receiver
 * It does it by checking if in the listeners of speaking map exists function with the same name as function
 * which handles speech event
 * @param connection
 * @returns
 */
const isSpeechHandlerAttachedToConnection = (
  connection: VoiceConnection
): boolean => {
  return Boolean(
    connection.receiver.speaking
      .listeners("start")
      .find((func) => {
        console.log("func", func.name);
        func.name === "handleSpeechEventOnConnectionReceiver"
      })
  );
};

export default (
  client: Client
): void => {
  client.on("voiceStateUpdate", (_old, newVoiceState) => {
    if (!newVoiceState.channel) return;
    const connection = getVoiceConnection(
      newVoiceState.channel.guild.id
    );
    if (connection && !isSpeechHandlerAttachedToConnection(connection))
      client.emit(
        "voiceJoin",
        connection
      );
  });
};
