import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { celebrityIds } = await req.json();

    if (!celebrityIds || !Array.isArray(celebrityIds)) {
      throw new Error('celebrityIds array is required');
    }

    // Manually expire the subscriptions
    const { error: updateError } = await supabase
      .from('celebrity_subscriptions')
      .update({ 
        subscription_end: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        is_active: false
      })
      .in('celebrity_id', celebrityIds);

    if (updateError) throw updateError;

    // Unverify the celebrities
    const { error: unverifyError } = await supabase
      .from('celebrity_profiles')
      .update({ 
        is_verified: false,
        is_available: false
      })
      .in('id', celebrityIds);

    if (unverifyError) throw unverifyError;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Expired and unverified ${celebrityIds.length} celebrities`
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});