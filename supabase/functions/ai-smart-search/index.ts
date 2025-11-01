import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    console.log('Smart search query:', query);

    if (!query) {
      return new Response(
        JSON.stringify({ error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get verified celebrities with active subscriptions
    const { data: celebrities, error: dbError } = await supabase
      .from('celebrity_profiles')
      .select(`
        id, stage_name, bio, location, gender, base_price, hourly_rate, age, is_verified, is_available,
        celebrity_subscriptions!inner(is_active, subscription_end)
      `)
      .eq('is_available', true)
      .eq('is_verified', true)
      .eq('celebrity_subscriptions.is_active', true)
      .gt('celebrity_subscriptions.subscription_end', new Date().toISOString())
      .order('stage_name', { ascending: true });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log(`Found ${celebrities?.length || 0} celebrities`);

    // Use Lovable AI to understand the query and match celebrities
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a smart celebrity recommendation assistant. Analyze the user's query and match them with the most suitable celebrities from the provided list. Consider location, price range, gender preferences, age, and any specific requirements mentioned.

CRITICAL: You MUST use the EXACT celebrity IDs from the provided list. DO NOT make up or modify any IDs. Only return IDs that exist in the celebrities array.

IMPORTANT: Return ONLY raw JSON without any markdown formatting, code blocks, or backticks. Do not wrap your response in \`\`\`json or any other formatting.

Return a JSON array of celebrity IDs with match reasons. Be concise and helpful.`
          },
          {
            role: 'user',
            content: `User query: "${query}"
            
Available celebrities: ${JSON.stringify(celebrities)}

IMPORTANT: Use ONLY the exact "id" values from the celebrities array above. Do not create or modify any IDs.

Return a JSON response in this exact format:
{
  "recommendations": [
    {
      "celebrityId": "exact-uuid-from-celebrities-array",
      "matchScore": 0-100,
      "reason": "brief explanation why this celebrity matches"
    }
  ],
  "searchSummary": "brief summary of what the user is looking for"
}

Example valid celebrityId format: "c921902c-e410-429c-8535-2b0e90560dca" (must be an exact UUID from the list)`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const aiResponse = await response.json();
    let aiContent = aiResponse.choices[0].message.content;
    console.log('AI response:', aiContent);

    // Strip markdown code blocks if present
    aiContent = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    // Parse the AI response
    let recommendations;
    try {
      recommendations = JSON.parse(aiContent);
    } catch (e) {
      console.error('Failed to parse AI response:', e);
      // Fallback: return all celebrities
      recommendations = {
        recommendations: celebrities?.slice(0, 5).map(c => ({
          celebrityId: c.id,
          matchScore: 70,
          reason: 'Available celebrity'
        })) || [],
        searchSummary: 'Showing available celebrities'
      };
    }

    return new Response(
      JSON.stringify(recommendations),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-smart-search:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
