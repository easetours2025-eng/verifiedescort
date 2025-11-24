import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReminderData {
  celebrity_id: string;
  subscription_id: string;
  celebrity_name: string;
  phone_number: string;
  subscription_tier: string;
  subscription_end: string;
  reminder_type: '3_days' | '1_day' | 'expiry_day' | '1_day_expired' | '3_days_expired' | '7_days_expired';
  days_until_expiry: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Twilio credentials
    const twilioAccountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
    const twilioAuthToken = Deno.env.get('TWILIO_AUTH_TOKEN');
    const twilioWhatsAppNumber = Deno.env.get('TWILIO_WHATSAPP_NUMBER');

    if (!twilioAccountSid || !twilioAuthToken || !twilioWhatsAppNumber) {
      throw new Error('Twilio credentials not configured');
    }

    console.log('Checking for subscriptions needing reminders...');

    // Get subscriptions needing reminders
    const { data: reminders, error: remindersError } = await supabase
      .rpc('get_subscriptions_needing_reminders');

    if (remindersError) {
      console.error('Error fetching reminders:', remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log('No reminders to send');
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No reminders to send',
          reminders_sent: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Found ${reminders.length} reminders to send`);

    let successCount = 0;
    let failCount = 0;

    // Send each reminder
    for (const reminder of reminders as ReminderData[]) {
      try {
        // Format phone number for WhatsApp - ensure it has country code
        let formattedPhone = reminder.phone_number.replace(/[^0-9+]/g, '');
        
        // Add Kenya country code if missing (starts with 07 or 01)
        if (formattedPhone.startsWith('07') || formattedPhone.startsWith('01')) {
          formattedPhone = '+254' + formattedPhone.substring(1);
        } else if (formattedPhone.startsWith('7') || formattedPhone.startsWith('1')) {
          formattedPhone = '+254' + formattedPhone;
        } else if (!formattedPhone.startsWith('+')) {
          formattedPhone = '+' + formattedPhone;
        }
        
        const message = formatReminderMessage(reminder);

        console.log(`Sending ${reminder.reminder_type} reminder to ${reminder.celebrity_name} (${formattedPhone})`);

        // Ensure Twilio WhatsApp number has proper format
        let twilioFrom = twilioWhatsAppNumber;
        if (!twilioFrom.startsWith('+')) {
          twilioFrom = '+' + twilioFrom.replace(/[^0-9]/g, '');
        }

        // Send WhatsApp message via Twilio
        const twilioResponse = await fetch(
          `https://api.twilio.com/2010-04-01/Accounts/${twilioAccountSid}/Messages.json`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              'Authorization': 'Basic ' + btoa(`${twilioAccountSid}:${twilioAuthToken}`)
            },
            body: new URLSearchParams({
              From: `whatsapp:${twilioFrom}`,
              To: `whatsapp:${formattedPhone}`,
              Body: message
            })
          }
        );

        const twilioData = await twilioResponse.json();

        if (twilioResponse.ok) {
          // Log successful send
          await supabase.from('subscription_reminder_logs').insert({
            celebrity_id: reminder.celebrity_id,
            subscription_id: reminder.subscription_id,
            reminder_type: reminder.reminder_type,
            phone_number: reminder.phone_number,
            message_sent: message,
            twilio_message_sid: twilioData.sid,
            status: 'sent'
          });

          successCount++;
          console.log(`✓ Reminder sent successfully to ${reminder.celebrity_name}`);
        } else {
          throw new Error(`Twilio error: ${twilioData.message || 'Unknown error'}`);
        }
      } catch (error) {
        console.error(`✗ Failed to send reminder to ${reminder.celebrity_name}:`, error);
        
        // Log failed send
        await supabase.from('subscription_reminder_logs').insert({
          celebrity_id: reminder.celebrity_id,
          subscription_id: reminder.subscription_id,
          reminder_type: reminder.reminder_type,
          phone_number: reminder.phone_number,
          message_sent: formatReminderMessage(reminder),
          status: 'failed'
        });

        failCount++;
      }
    }

    console.log(`Reminder sending complete: ${successCount} sent, ${failCount} failed`);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Sent ${successCount} reminders, ${failCount} failed`,
        reminders_sent: successCount,
        reminders_failed: failCount
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in send-subscription-reminders:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

function formatReminderMessage(reminder: ReminderData): string {
  const expiryDate = new Date(reminder.subscription_end);
  const formattedDate = expiryDate.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric', 
    year: 'numeric' 
  });

  const tierName = reminder.subscription_tier.replace('_', ' ').toUpperCase();

  // Pre-expiry reminders
  if (reminder.reminder_type === '3_days') {
    return `🔔 Hi ${reminder.celebrity_name}!\n\n` +
      `This is a friendly reminder from Royal Escorts. Your ${tierName} subscription will expire in 3 DAYS on ${formattedDate}.\n\n` +
      `To continue enjoying premium visibility and features, please renew your subscription soon.\n\n` +
      `If you've already renewed, please ignore this message.\n\n` +
      `Thank you for being part of Royal Escorts! 💎`;
  } else if (reminder.reminder_type === '1_day') {
    return `⚠️ URGENT: Hi ${reminder.celebrity_name}!\n\n` +
      `Your ${tierName} subscription expires TOMORROW (${formattedDate})!\n\n` +
      `Don't lose your premium profile visibility. Renew today to maintain your position on our homepage.\n\n` +
      `Contact us immediately to renew your subscription.\n\n` +
      `Thank you for being part of Royal Escorts! 💎`;
  } else if (reminder.reminder_type === 'expiry_day') {
    return `🚨 FINAL NOTICE: Hi ${reminder.celebrity_name}!\n\n` +
      `Your ${tierName} subscription EXPIRES TODAY (${formattedDate})!\n\n` +
      `Your profile will be removed from our homepage at midnight if not renewed.\n\n` +
      `Renew NOW to avoid interruption in your profile visibility.\n\n` +
      `Contact us immediately: [Your Contact Info]\n\n` +
      `Thank you for being part of Royal Escorts! 💎`;
  }
  
  // Post-expiry reminders
  else if (reminder.reminder_type === '1_day_expired') {
    return `❌ SUBSCRIPTION EXPIRED: Hi ${reminder.celebrity_name}!\n\n` +
      `Your ${tierName} subscription EXPIRED yesterday (${formattedDate}).\n\n` +
      `Your profile has been removed from our homepage and is no longer visible to clients.\n\n` +
      `RENEW NOW to restore your profile visibility and continue receiving bookings!\n\n` +
      `Submit your payment and we'll reactivate your profile immediately.\n\n` +
      `Don't miss out on potential clients! 💎`;
  } else if (reminder.reminder_type === '3_days_expired') {
    return `⛔ URGENT RENEWAL REQUIRED: Hi ${reminder.celebrity_name}!\n\n` +
      `Your ${tierName} subscription expired 3 days ago (${formattedDate}).\n\n` +
      `Your profile is currently INACTIVE and not receiving any bookings.\n\n` +
      `Renew TODAY to get back on our platform and start receiving client requests again!\n\n` +
      `The longer you wait, the more opportunities you're missing.\n\n` +
      `Contact us NOW to reactivate your subscription! 💎`;
  } else { // 7_days_expired
    return `🚫 FINAL REMINDER: Hi ${reminder.celebrity_name}!\n\n` +
      `Your ${tierName} subscription expired 7 days ago (${formattedDate}).\n\n` +
      `This is our FINAL reminder. Your profile remains INACTIVE.\n\n` +
      `You are losing potential clients every day you remain unsubscribed!\n\n` +
      `Renew IMMEDIATELY to restore your profile and resume bookings.\n\n` +
      `Don't let your business suffer - reactivate today! 💎\n\n` +
      `Contact us now or risk permanent profile removal.`;
  }
}