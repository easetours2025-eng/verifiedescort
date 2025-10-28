import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all active, verified celebrities
    const { data: celebrities, error } = await supabase
      .from('celebrity_profiles')
      .select('id, updated_at')
      .eq('is_available', true)
      .eq('is_verified', true)
      .not('profile_picture_path', 'is', null)
      .not('phone_number', 'is', null);

    if (error) throw error;

    const baseUrl = 'https://royalescortsworld.com';
    
    // Generate sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/auth</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/videos</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/faq</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;

    // Add celebrity profile URLs
    celebrities?.forEach((celebrity) => {
      const lastMod = celebrity.updated_at 
        ? new Date(celebrity.updated_at).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0];
      
      sitemap += `
  <url>
    <loc>${baseUrl}/celebrity/${celebrity.id}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>`;
    });

    sitemap += '\n</urlset>';

    return new Response(sitemap, {
      headers: corsHeaders,
    });

  } catch (error) {
    console.error('Error generating sitemap:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
