import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create service role client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Fetch payment verification data with celebrity profiles
    const { data: paymentsData, error: paymentsError } = await supabaseAdmin
      .from('payment_verification')
      .select('*')
      .order('created_at', { ascending: false })

    if (paymentsError) {
      throw paymentsError
    }

    // Fetch celebrity profiles
    const { data: celebrityProfilesData, error: celebrityError } = await supabaseAdmin
      .from('celebrity_profiles')
      .select('id, stage_name, real_name, email, is_verified')

    if (celebrityError) {
      throw celebrityError
    }

    // Fetch celebrity profiles with subscription status
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

    if (celebritiesError) {
      throw celebritiesError
    }

    // Process payments data by joining with celebrity profiles
    const processedPayments = paymentsData?.map(payment => {
      const celebrity = celebrityProfilesData?.find(c => c.id === payment.celebrity_id)
      return {
        ...payment,
        celebrity_profiles: celebrity
      }
    }).filter(payment => payment.celebrity_profiles) || []

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

    return new Response(JSON.stringify({
      success: true,
      payments: processedPayments,
      celebrities: processedCelebrities
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in admin-data function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})