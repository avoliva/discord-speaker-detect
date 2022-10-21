import {
  EndBehaviorType,
  entersState,
  VoiceConnection,
  VoiceConnectionStatus,
} from "@discordjs/voice";
import { Client } from "discord.js";

declare module "discord.js" {
  interface ClientEvents {
    speaking: [data: Uint8Array];
  }
}

/**
 * Starts listening on connection and emits `speech` event when someone stops speaking
 * @param connection Connection to listen
 */
const handleSpeakingEvent = ({
  client,
  connection
}: {
  client: Client;
  connection: VoiceConnection;
}) => {
  connection.receiver.speaking.on(
    "start",
    function handleSpeechEventOnConnectionReceiver(userId) {
      const user = client.users.cache.get(userId);

      // Shouldn't proceed if user is undefined, some checks will fail even if they shouldn't
      if (!user) return;

      const { receiver } = connection;

      // Subscribe to the "end" event, which happens after 300ms of silence.
      const opusStream = receiver.subscribe(userId, {
        end: {
          behavior: EndBehaviorType.AfterSilence,
          duration: 300,
        },
      });

      const bufferData: Uint8Array[] = [];
      opusStream
        .on("data", (data: Uint8Array) => {
          client.emit("speaking", data);
        });

    }
  );
};

/**
 * Enables `speech` event on Client, which is called whenever someone stops speaking
 */
export default <T>(
  client: Client
): void => {
  client.on("voiceJoin", async (connection) => {
    if (!connection) {
      return;
    }

    await entersState(connection, VoiceConnectionStatus.Ready, 20e3);
    handleSpeakingEvent({ client, connection });
  });
};
