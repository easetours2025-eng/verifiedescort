import { useEffect, useState } from 'react';

const Sitemap = () => {
  const [sitemapXml, setSitemapXml] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSitemap = async () => {
      try {
        // Fetch sitemap directly from edge function URL
        const response = await fetch('https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/sitemap');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const xmlText = await response.text();
        setSitemapXml(xmlText);
      } catch (error) {
        console.error('Error fetching sitemap:', error);
        // Fallback sitemap
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

  useEffect(() => {
    // Set content type for XML
    if (sitemapXml && !loading) {
      const meta = document.querySelector('meta[http-equiv="Content-Type"]');
      if (!meta) {
        const newMeta = document.createElement('meta');
        newMeta.httpEquiv = 'Content-Type';
        newMeta.content = 'application/xml; charset=utf-8';
        document.head.appendChild(newMeta);
      }
    }
  }, [sitemapXml, loading]);

  if (loading) {
    return (
      <div style={{ fontFamily: 'monospace', padding: '20px', color: '#333' }}>
        Loading sitemap...
      </div>
    );
  }

  // Render XML as plain text
  return (
    <pre
      style={{
        fontFamily: 'monospace',
        fontSize: '12px',
        whiteSpace: 'pre-wrap',
        wordWrap: 'break-word',
        margin: 0,
        padding: 0,
        backgroundColor: '#fff',
        color: '#000'
      }}
    >
      {sitemapXml}
    </pre>
  );
};

export default Sitemap;
