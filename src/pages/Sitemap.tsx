import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const Sitemap = () => {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        // Fetch sitemap from edge function
        const { data, error } = await supabase.functions.invoke('sitemap', {
          method: 'GET'
        });

        if (error) throw error;

        // The response should be XML text
        const xmlText = typeof data === 'string' ? data : new XMLSerializer().serializeToString(data);
        setSitemapXml(xmlText);
      } catch (error) {
        console.error('Error fetching sitemap:', error);
        setSitemapXml(`<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://royalescortsworld.com/</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
</urlset>`);
      } finally {
        setLoading(false);
      }
    };

    fetchSitemap();
  }, []);

  if (loading) {
    return (
      <div style={{ fontFamily: 'monospace', padding: '20px' }}>
        Loading sitemap...
      </div>
    );
  }

  // Render XML as plain text with proper formatting
  return (
    <pre
      style={{
        fontFamily: 'monospace',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        margin: 0,
        padding: '20px',
        backgroundColor: '#f5f5f5'
      }}
      dangerouslySetInnerHTML={{ __html: sitemapXml }}
    />
  );
};

export default Sitemap;
