import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ActivateOfferRequest {
  celebrityId: string;
  offerAmount: number;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's token for auth check
    const userClient = createClient(
      supabaseUrl,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // Verify user is authenticated
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin
    const { data: adminData, error: adminError } = await supabaseClient
      .from('admin_users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (adminError || !adminData) {
      console.error('Admin check failed:', adminError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const { celebrityId, offerAmount }: ActivateOfferRequest = await req.json();

    if (!celebrityId || offerAmount === undefined) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: celebrityId, offerAmount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Activating promotional offer for celebrity ${celebrityId} with amount ${offerAmount}`);

    // Get celebrity details
    const { data: celebrity, error: celebError } = await supabaseClient
      .from('celebrity_profiles')
      .select('id, phone_number, stage_name')
      .eq('id', celebrityId)
      .single();

    if (celebError || !celebrity) {
      console.error('Celebrity not found:', celebError);
      return new Response(
        JSON.stringify({ error: 'Celebrity not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const offerStart = new Date();
    const offerEnd = new Date();
    offerEnd.setDate(offerEnd.getDate() + 7); // 1 week offer

    // Create promotional payment record
    const { data: paymentRecord, error: paymentError } = await supabaseClient
      .from('payment_verification')
      .insert({
        celebrity_id: celebrityId,
        phone_number: celebrity.phone_number,
        mpesa_code: `PROMO_OFFER_${celebrityId}_${Date.now()}`,
        amount: offerAmount,
        expected_amount: offerAmount,
        subscription_tier: 'vip_elite',
        duration_type: '1_week',
        payment_type: 'promotional_offer',
        payment_status: 'completed',
        is_verified: true,
        verified_at: offerStart.toISOString(),
        verified_by: user.id,
        payment_date: offerStart.toISOString(),
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation failed:', paymentError);
      return new Response(
        JSON.stringify({ error: 'Failed to create payment record' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create VIP Elite subscription for 1 week
    const { error: subscriptionError } = await supabaseClient
      .from('celebrity_subscriptions')
      .insert({
        celebrity_id: celebrityId,
        subscription_tier: 'vip_elite',
        duration_type: '1_week',
        subscription_start: offerStart.toISOString(),
        subscription_end: offerEnd.toISOString(),
        is_active: true,
        amount_paid: offerAmount,
        last_payment_id: paymentRecord.id,
      });

    if (subscriptionError) {
      console.error('Subscription creation failed:', subscriptionError);
      return new Response(
        JSON.stringify({ error: 'Failed to create subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update celebrity profile to mark as verified and available
    const { error: updateError } = await supabaseClient
      .from('celebrity_profiles')
      .update({
        is_verified: true,
        is_available: true,
      })
      .eq('id', celebrityId);

    if (updateError) {
      console.error('Profile update failed:', updateError);
    }

    console.log(`Successfully activated promotional offer for ${celebrity.stage_name}`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Promotional offer activated successfully for ${celebrity.stage_name}`,
        subscription_end: offerEnd.toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in activate-promotional-offer function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
