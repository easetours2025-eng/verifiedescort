import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Content-Type': 'application/xml',
};

const CACHE_TTL = 3600; // 1 hour cache

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check for cached sitemap
    const { data: cachedSitemap } = await supabase
      .from('sitemap_cache')
      .select('sitemap_xml, created_at')
      .single();

    // Return cached version if less than 1 hour old
    if (cachedSitemap && cachedSitemap.sitemap_xml) {
      const cacheAge = (Date.now() - new Date(cachedSitemap.created_at).getTime()) / 1000;
      if (cacheAge < CACHE_TTL) {
        console.log('Returning cached sitemap');
        return new Response(cachedSitemap.sitemap_xml, { headers: corsHeaders });
      }
    }

    // Fetch all active, verified celebrities
    const { data: celebrities, error } = await supabase
      .from('celebrity_profiles')
      .select('id, stage_name, updated_at')
      .eq('is_available', true)
      .eq('is_verified', true)
      .not('profile_picture_path', 'is', null)
      .not('phone_number', 'is', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;

    const baseUrl = 'https://royalescortsworld.com';
    const now = new Date().toISOString().split('T')[0];
    
    // Generate sitemap XML
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${now}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/auth</loc>
    <lastmod>${now}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/videos</loc>
    <lastmod>${now}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/faq</loc>
    <lastmod>${now}</lastmod>
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

    // Cache the generated sitemap
    await supabase
      .from('sitemap_cache')
      .upsert({ 
        id: 1, 
        sitemap_xml: sitemap,
        created_at: new Date().toISOString()
      });

    console.log('Generated and cached new sitemap');

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
