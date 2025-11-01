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
    const requestBody = await req.json();
    console.log('Request body received:', JSON.stringify(requestBody));
    
    const { celebrityId, phoneNumber, mpesaCode, amount, tier, duration, expectedAmount, paymentType } = requestBody;

    // Validate required fields
    if (!celebrityId || !phoneNumber || !mpesaCode) {
      console.error('Missing required fields:', { celebrityId: !!celebrityId, phoneNumber: !!phoneNumber, mpesaCode: !!mpesaCode });
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Missing required fields: celebrityId, phoneNumber, and mpesaCode are required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Validate phone number format (Kenyan format)
    const phoneRegex = /^\+254[17]\d{8}$/;
    const trimmedPhone = phoneNumber.trim();
    if (!phoneRegex.test(trimmedPhone)) {
      console.error('Invalid phone number format:', trimmedPhone);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Invalid phone number format. Must be in format: +254XXXXXXXXX. Received: ${trimmedPhone}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Validate M-Pesa code format
    const mpesaRegex = /^[A-Z0-9]{10,20}$/;
    const trimmedCode = mpesaCode.trim().toUpperCase();
    if (!mpesaRegex.test(trimmedCode)) {
      console.error('Invalid M-Pesa code format:', trimmedCode, 'Length:', trimmedCode.length);
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: `Invalid M-Pesa code format. Must be 10-20 uppercase alphanumeric characters. Received: ${trimmedCode}` 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    // Validate amount
    if (amount && (amount <= 0 || amount > 100000)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Invalid amount. Must be between 0 and 100,000" 
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
    console.log('Payment details:', { tier, duration, amount, expectedAmount, paymentType });

    // Fetch expected price from subscription_packages if tier and duration provided
    let packagePrice = expectedAmount || 0;
    if (tier && duration && !expectedAmount) {
      console.log('Fetching package price for:', { tier, duration });
      const { data: packageData, error: packageError } = await supabaseServiceRole
        .from('subscription_packages')
        .select('price')
        .eq('tier_name', tier)
        .eq('duration_type', duration)
        .eq('is_active', true)
        .single();
      
      if (packageError) {
        console.error('Error fetching package:', packageError);
      }
      
      packagePrice = packageData?.price || 0;
      console.log('Package price fetched:', packagePrice);
    }

    // Insert payment verification record (trigger will auto-calculate status)
    console.log('Inserting payment verification record...');
    const { data: paymentData, error: paymentError } = await supabaseServiceRole
      .from('payment_verification')
      .insert({
        celebrity_id: celebrityId,
        phone_number: phoneNumber.trim(),
        mpesa_code: mpesaCode.trim().toUpperCase(),
        amount: amount || 10,
        expected_amount: packagePrice,
        payment_date: new Date().toISOString(),
        is_verified: false,
        subscription_tier: tier || null,
        duration_type: duration || null,
        payment_type: paymentType || 'subscription'
      })
      .select()
      .single();

    if (paymentError) {
      console.error('Error creating payment verification:', paymentError);
      console.error('Error details:', JSON.stringify(paymentError, null, 2));
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: paymentError.message || 'Failed to submit payment verification',
          error: paymentError
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400 
        }
      );
    }

    console.log('Payment verification created successfully:', paymentData.id);

    // If tier is provided, also create/update subscription record
    if (tier) {
      let durationDays = 30; // default 1 month
      
      if (duration === '1_week') {
        durationDays = 7;
      } else if (duration === '2_weeks') {
        durationDays = 14;
      }
      
      const subscriptionEnd = new Date();
      subscriptionEnd.setDate(subscriptionEnd.getDate() + durationDays);
      
      const { error: subscriptionError } = await supabaseServiceRole
        .from('celebrity_subscriptions')
        .upsert({
          celebrity_id: celebrityId,
          subscription_tier: tier,
          duration_type: duration || '1_month',
          amount_paid: amount || 0,
          is_active: false, // Will be activated when admin verifies
          subscription_start: new Date().toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
          last_payment_id: paymentData.id
        }, {
          onConflict: 'celebrity_id'
        });

      if (subscriptionError) {
        console.error('Error updating subscription:', subscriptionError);
        // Don't fail the request, payment is still recorded
      }
    }

    // Determine message based on payment status
    let message = "Payment verification submitted successfully";
    let warning = "";
    
    if (paymentData.payment_status === 'underpaid') {
      warning = `⚠️ Payment (KSH ${amount}) is less than expected (KSH ${packagePrice}). Subscription will be disabled until full payment is received.`;
    } else if (paymentData.payment_status === 'overpaid') {
      warning = `✅ Payment received! Extra KSH ${paymentData.credit_balance} will be credited to your account for future use.`;
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        warning,
        payment_status: paymentData.payment_status,
        credit_balance: paymentData.credit_balance || 0,
        data: paymentData
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in payment verification function:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(JSON.stringify({
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      error: error instanceof Error ? { name: error.name, message: error.message } : String(error)
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})