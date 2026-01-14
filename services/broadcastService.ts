
import { supabase } from './supabase';

const CHANNEL_NAME = 'database-changes';

export const broadcastUpdate = async () => {
  try {
    const channel = supabase.channel(CHANNEL_NAME);
    await channel.send({
      type: 'broadcast',
      event: 'refresh',
      payload: { message: 'A database change occurred.' },
    });
  } catch (error) {
    console.error('Error broadcasting update:', error);
  }
};
