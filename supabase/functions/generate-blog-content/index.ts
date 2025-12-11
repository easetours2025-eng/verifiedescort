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
    const { type, celebrity1, celebrity2, existingTitle } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    let systemPrompt = '';
    let userPrompt = '';

    if (type === 'topics') {
      systemPrompt = `You are an SEO expert for a Kenyan dating and relationships app. Generate blog topic ideas that target long-tail keywords.`;
      userPrompt = `Generate 5 SEO-friendly blog topic ideas for a Kenyan dating app. Focus on long-tail keywords like:
- How to find love online in Kenya
- Top dating tips for Kenyan men/women
- Best dating app for serious relationships in Kenya
- Where to meet singles in Nairobi/Mombasa/Kisumu
- Is online dating safe in Kenya?

Return as JSON array with format:
[{"title": "...", "tags": ["tag1", "tag2"], "metaDescription": "..."}]`;
    } else if (type === 'content') {
      systemPrompt = `You are a blog writer for Royal Escorts Kenya, a dating and relationships app. Write engaging, SEO-optimized content that features celebrity stories focused on beauty, location, culture, and amusing local anecdotes. Keep content relationship-oriented and safe.`;
      
      userPrompt = `Write a complete blog post about dating in Kenya featuring two celebrity stories.

Title: ${existingTitle || 'Dating Tips from Kenya\'s Most Beautiful Singles'}

Celebrity 1: ${celebrity1?.name || 'Featured Single from Nairobi'}
Celebrity 2: ${celebrity2?.name || 'Featured Single from Mombasa'}

Structure the blog as follows:
1. Introduction (2-3 paragraphs about dating in Kenya, targeting SEO keywords)
2. First Celebrity Story: Focus on their beauty, their location in Kenya, local culture, and an amusing anecdote about dating life
3. Second Celebrity Story: Similar focus - beauty, location, culture, amusing local story
4. Conclusion with dating tips

Return as JSON:
{
  "title": "SEO-optimized title",
  "excerpt": "2-3 sentence excerpt for listing",
  "content": "Full HTML content with h2, h3, p tags",
  "metaTitle": "SEO meta title under 60 chars",
  "metaDescription": "SEO meta description under 160 chars",
  "tags": ["tag1", "tag2"],
  "readTimeMinutes": 5,
  "celebrity1": {
    "caption": "Photo caption for celebrity 1",
    "storyText": "The full story section about celebrity 1"
  },
  "celebrity2": {
    "caption": "Photo caption for celebrity 2", 
    "storyText": "The full story section about celebrity 2"
  }
}`;
    } else {
      throw new Error('Invalid type. Use "topics" or "content"');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0].message.content;
    
    // Parse JSON from response
    let result;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = generatedText.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      const jsonString = jsonMatch ? jsonMatch[1] : generatedText;
      result = JSON.parse(jsonString.trim());
    } catch (parseError) {
      console.error('Failed to parse AI response:', generatedText);
      result = { raw: generatedText };
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-blog-content:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
