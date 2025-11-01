import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { stageName, realName, location, age, gender, style } = await req.json();
    
    console.log('Generating bio for:', stageName);

    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    // Build the prompt based on provided information
    const prompt = `Create an attractive, engaging bio for a celebrity profile with these details:

Stage Name: ${stageName || 'Not provided'}
Real Name: ${realName || 'Not provided'}
Location: ${location || 'Not provided'}
Age: ${age || 'Not provided'}
Gender: ${gender || 'Not provided'}
Preferred Style: ${style || 'attractive and engaging'}

Requirements:
- Write in third person
- Create EXACTLY TWO lines (two sentences separated by a line break)
- Each line should be 40-60 words
- Make it attractive and appealing for ALL genders
- Be captivating, charismatic, and engaging
- Focus on personality, presence, and allure
- Use the preferred style: ${style || 'attractive and engaging'}
- Be tasteful and sophisticated
- Age must be 19 or above

Return ONLY the bio text as two lines, no additional formatting or labels.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a professional bio writer specializing in creating compelling, authentic celebrity profiles. Write engaging bios that capture personality and achievements while maintaining professionalism.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 300,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const generatedBio = aiResponse.choices[0].message.content.trim();
    
    console.log('Bio generated successfully');

    return new Response(
      JSON.stringify({ 
        bio: generatedBio,
        success: true 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in ai-bio-generator:', error);
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
