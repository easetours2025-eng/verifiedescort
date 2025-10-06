import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, videoId, isActive, adminEmail, filePath } = await req.json();

    // Create Supabase client with service role key
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Verify admin access
    const { data: admin, error: adminError } = await supabaseServiceRole
      .from('admin_users')
      .select('id, email')
      .eq('email', adminEmail)
      .single();

    if (adminError || !admin) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: "Unauthorized - Admin access required" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 403 
        }
      );
    }

    if (action === "upload") {
      // Upload video metadata
      const { error: insertError } = await supabaseServiceRole
        .from('admin_videos')
        .insert({
          file_path: filePath,
          is_active: isActive,
          created_by: admin.id
        });

      if (insertError) {
        console.error("Insert error:", insertError);
        throw new Error("Failed to save video metadata");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Video uploaded successfully'
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

    } else if (action === "toggle_status") {
      // Update video status
      const { error: updateError } = await supabaseServiceRole
        .from('admin_videos')
        .update({ is_active: isActive })
        .eq('id', videoId);

      if (updateError) {
        console.error("Update error:", updateError);
        throw new Error("Failed to update video status");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Video ${isActive ? 'published' : 'unpublished'} successfully`
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

    } else if (action === "delete") {
      // Delete video from database
      const { data: video, error: fetchError } = await supabaseServiceRole
        .from('admin_videos')
        .select('file_path')
        .eq('id', videoId)
        .single();

      if (fetchError) {
        console.error("Fetch error:", fetchError);
        throw new Error("Failed to fetch video details");
      }

      const { error: deleteError } = await supabaseServiceRole
        .from('admin_videos')
        .delete()
        .eq('id', videoId);

      if (deleteError) {
        console.error("Delete error:", deleteError);
        throw new Error("Failed to delete video");
      }

      // Try to delete from storage (non-blocking)
      if (video?.file_path) {
        try {
          const urlParts = video.file_path.split('/');
          const fileName = urlParts[urlParts.length - 1];
          const storagePath = `admin-videos/${fileName}`;

          await supabaseServiceRole.storage
            .from('admin-videos')
            .remove([storagePath]);
        } catch (storageError) {
          console.log("Storage deletion failed (non-critical):", storageError);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Video deleted successfully"
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: "Invalid action" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400 
      }
    );

  } catch (error: any) {
    console.error("Admin video operations error:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        message: error.message || "Internal server error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500 
      }
    );
  }
});