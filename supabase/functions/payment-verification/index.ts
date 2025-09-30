import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  console.log('Payment verification function called with method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { celebrityId, phoneNumber, mpesaCode, amount, tier } = await req.json();

    if (!celebrityId || !phoneNumber || !mpesaCode) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing required fields" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Create Supabase client with service role key to bypass RLS
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Get the auth header to identify the user
    const authHeader = req.headers.get('Authorization');
    let userId = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const supabaseClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? "",
        {
          global: {
            headers: { Authorization: authHeader },
          },
        }
      );
      
      const { data: { user } } = await supabaseClient.auth.getUser(token);
      userId = user?.id;
    }

    console.log('Creating payment verification for celebrity:', celebrityId);

    // Insert payment verification record
    const { data: paymentData, error: paymentError } = await supabaseServiceRole
      .from('payment_verification')
      .insert({
        celebrity_id: celebrityId,
        phone_number: phoneNumber.trim(),
        mpesa_code: mpesaCode.trim().toUpperCase(),
        amount: amount || 10,
        payment_date: new Date().toISOString(),
        is_verified: false
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment verification:', paymentError);
      throw new Error('Failed to submit payment verification');
    }

    console.log('Payment verification created successfully:', paymentData.id);

    // If tier is provided, also create/update subscription record
    if (tier) {
      const subscriptionAmount = tier === 'premium' ? 2500 : 2000;
      
      const { error: subscriptionError } = await supabaseServiceRole
        .from('celebrity_subscriptions')
        .upsert({
          celebrity_id: celebrityId,
          subscription_tier: tier,
          amount_paid: subscriptionAmount,
          is_active: false, // Will be activated when admin verifies
          last_payment_id: paymentData.id
        }, {
          onConflict: 'celebrity_id'
        });

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        // Don't fail the request, payment is still recorded
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Payment verification submitted successfully",
        data: paymentData
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in payment verification function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})