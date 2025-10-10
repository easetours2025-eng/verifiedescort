import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { celebrityId } = await req.json();

    if (!celebrityId) {
      return new Response(
        JSON.stringify({ error: 'Celebrity ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch analytics from Lovable Analytics API
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const analyticsUrl = `${Deno.env.get('SUPABASE_URL')}/rest/v1/rpc/read_project_analytics`;
    const response = await fetch(analyticsUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': Deno.env.get('SUPABASE_ANON_KEY') || '',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''}`,
      },
      body: JSON.stringify({
        startdate: startDate,
        enddate: endDate,
        granularity: 'daily'
      })
    });

    if (!response.ok) {
      throw new Error('Failed to fetch analytics');
    }

    const data = await response.json();
    
    // Find the profile page views
    const profilePath = `/celebrity/${celebrityId}`;
    const pageData = data?.lists?.page?.data?.find((p: any) => p.label === profilePath);
    
    return new Response(
      JSON.stringify({ 
        views: pageData?.value || 0,
        celebrityId,
        profilePath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error fetching profile analytics:', error);
    return new Response(
      JSON.stringify({ error: error.message, views: 0 }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
