import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  console.log('Admin-data function called with method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Starting admin-data function...')
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    
    console.log('Environment check:', {
      hasUrl: !!supabaseUrl,
      hasKey: !!serviceRoleKey,
      urlPrefix: supabaseUrl?.substring(0, 20)
    })
    // Create service role client
    const supabaseAdmin = createClient(
      supabaseUrl ?? '',
      serviceRoleKey ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
    
    console.log('Supabase client created successfully')

    // Fetch payment verification data with celebrity profiles
    console.log('Fetching payment verification data...');
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from('payment_verification')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Payment query result:', { paymentsData, paymentsError });
    
    if (paymentsError) {
      console.error('Payment error:', paymentsError);
      throw paymentsError
    }

    // Fetch celebrity profiles
    console.log('Fetching celebrity profiles...');
    const { data: celebrityProfilesData, error: celebrityError } = await supabaseAdmin
      .from('celebrity_profiles')
      .select('id, stage_name, real_name, email, is_verified')

    console.log('Celebrity profiles result:', { celebrityProfilesData, celebrityError });

    if (celebrityError) {
      console.error('Celebrity error:', celebrityError);
      throw celebrityError
    }

    // Fetch celebrity profiles with subscription status
    console.log('Fetching celebrities with subscriptions...');
    const { data: celebritiesData, error: celebritiesError } = await supabaseAdmin
      .from('celebrity_profiles')
      .select(`
        *,
        celebrity_subscriptions (
          is_active,
          subscription_end
        )
      `)
      .order('created_at', { ascending: false })

    console.log('Celebrities with subscriptions result:', { celebritiesData, celebritiesError });

    if (celebritiesError) {
      console.error('Celebrities with subscriptions error:', celebritiesError);
      throw celebritiesError
    }

    console.log('Processing data...');
    
    // Process payments data by joining with celebrity profiles
    const processedPayments = paymentsData?.map(payment => {
      const celebrity = celebrityProfilesData?.find(c => c.id === payment.celebrity_id)
      return {
        ...payment,
        celebrity_profiles: celebrity
      }
    }).filter(payment => payment.celebrity_profiles) || []

    console.log('Processed payments:', processedPayments.length);

    // Process celebrities data with subscription status
    const processedCelebrities = celebritiesData?.map(celebrity => {
      const activeSubscription = celebrity.celebrity_subscriptions?.find(
        (sub: any) => sub.is_active && new Date(sub.subscription_end) > new Date()
      )
      
      return {
        ...celebrity,
        subscription_status: activeSubscription ? 'active' : 'inactive',
        subscription_end: activeSubscription?.subscription_end
      }
    }) || []

    console.log('Processed celebrities:', processedCelebrities.length);

    const response = {
      success: true,
      payments: processedPayments,
      celebrities: processedCelebrities
    };
    
    console.log('Returning response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in admin-data function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})