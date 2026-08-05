import dotenv from 'dotenv';
import { prisma } from '../lib/prisma/client';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

async function main() {
  const settings = await prisma.communicationSettings.findUnique({ where: { id: 'default' } });
  console.log('COMMUNICATION_SETTINGS', JSON.stringify(settings, null, 2));
  console.log('RESEND_API_KEY_PRESENT', Boolean(process.env.RESEND_API_KEY));
  console.log('COMMUNICATION_SENDER_EMAIL', process.env.COMMUNICATION_SENDER_EMAIL);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
