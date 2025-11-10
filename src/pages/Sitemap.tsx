import { useEffect } from "react";

const Sitemap = () => {
  useEffect(() => {
    // Redirect to the edge function that serves the sitemap
    window.location.href = "https://kpjqcrhoablsllkgonbl.supabase.co/functions/v1/sitemap";
  }, []);

  return null;
};

export default Sitemap;
