import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentData {
  celebrity_id: string;
  subscription_tier: string;
  duration_type: string;
  amount: number;
  phone_number: string;
  mpesa_code: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    console.log('Starting test payment data seeding...');

    // Fetch all non-admin celebrities
    const { data: celebrities, error: celebError } = await supabase
      .rpc('get_non_admin_celebrities');

    if (celebError) {
      console.error('Error fetching celebrities:', celebError);
      throw celebError;
    }

    if (!celebrities || celebrities.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No celebrities found to seed payments' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
      );
    }

    console.log(`Found ${celebrities.length} celebrities`);

    // Define tier options with prices
    const tierOptions = [
      { tier: 'vip_elite', duration: '1_month', amount: 10000 },
      { tier: 'vip_elite', duration: '2_weeks', amount: 6000 },
      { tier: 'vip_elite', duration: '1_week', amount: 3500 },
      { tier: 'prime_plus', duration: '1_month', amount: 5000 },
      { tier: 'prime_plus', duration: '2_weeks', amount: 3000 },
      { tier: 'prime_plus', duration: '1_week', amount: 1800 },
      { tier: 'basic_pro', duration: '1_month', amount: 2000 },
      { tier: 'basic_pro', duration: '2_weeks', amount: 1200 },
      { tier: 'basic_pro', duration: '1_week', amount: 700 },
      { tier: 'starter', duration: '1_month', amount: 500 },
      { tier: 'starter', duration: '2_weeks', amount: 300 },
      { tier: 'starter', duration: '1_week', amount: 200 },
    ];

    const paymentsToInsert: PaymentData[] = [];

    // Create random payment for each celebrity
    for (const celebrity of celebrities) {
      // Randomly select a tier option
      const randomTier = tierOptions[Math.floor(Math.random() * tierOptions.length)];
      
      // Generate random phone number (Kenyan format)
      const phoneNumber = `254${Math.floor(700000000 + Math.random() * 99999999)}`;
      
      // Generate random M-PESA code (format: QXXXYYYYYY)
      const mpesaCode = `Q${Math.random().toString(36).substring(2, 5).toUpperCase()}${Math.floor(100000 + Math.random() * 899999)}`;

      paymentsToInsert.push({
        celebrity_id: celebrity.id,
        subscription_tier: randomTier.tier,
        duration_type: randomTier.duration,
        amount: randomTier.amount,
        phone_number: phoneNumber,
        mpesa_code: mpesaCode,
      });

      console.log(`Created payment for ${celebrity.stage_name}: ${randomTier.tier} (${randomTier.duration}) - KES ${randomTier.amount}`);
    }

    // Insert all payments
    const { data: insertedPayments, error: insertError } = await supabase
      .from('payment_verification')
      .insert(paymentsToInsert)
      .select();

    if (insertError) {
      console.error('Error inserting payments:', insertError);
      throw insertError;
    }

    console.log(`Successfully inserted ${insertedPayments?.length || 0} test payments`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully created ${insertedPayments?.length || 0} test payments`,
        payments: insertedPayments,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in seed-test-payments function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Internal server error' 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
