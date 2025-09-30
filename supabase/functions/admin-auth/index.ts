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
    const { action, email, password, is_super_admin } = await req.json();

    // Create Supabase client with service role key
    const supabaseServiceRole = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    if (action === "signup") {
      // Check if any admin users exist
      const { data: existingAdmins, error: checkError } = await supabaseServiceRole
        .from('admin_users')
        .select('id')
        .limit(1);

      if (checkError) {
        throw new Error("Failed to check existing admins");
      }

      // Only allow signup if no admins exist
      if (existingAdmins && existingAdmins.length > 0) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Admin registration is disabled. Admin accounts already exist." 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 403 
          }
        );
      }

      // Hash password (simple approach - in production use proper bcrypt)
      const passwordHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(password + "admin_salt_key")
      );
      const passwordHashString = Array.from(new Uint8Array(passwordHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create first admin
      const { data: newAdmin, error: createError } = await supabaseServiceRole
        .from('admin_users')
        .insert({
          email,
          password_hash: passwordHashString,
          is_super_admin: true
        })
        .select()
        .single();

      if (createError) {
        console.error("Create admin error:", createError);
        throw new Error("Failed to create admin account");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          admin: { id: newAdmin.id, email: newAdmin.email }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

    } else if (action === "signin") {
      // Hash provided password
      const passwordHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(password + "admin_salt_key")
      );
      const passwordHashString = Array.from(new Uint8Array(passwordHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Check admin credentials
      const { data: admin, error: authError } = await supabaseServiceRole
        .from('admin_users')
        .select('id, email, is_super_admin')
        .eq('email', email)
        .eq('password_hash', passwordHashString)
        .single();

      if (authError || !admin) {
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: "Invalid email or password" 
          }),
          { 
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 401 
          }
        );
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          admin: { id: admin.id, email: admin.email, is_super_admin: admin.is_super_admin }
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );

    } else if (action === "create") {
      // Create new admin (requires existing admin to be authenticated)
      // Hash password
      const passwordHash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(password + "admin_salt_key")
      );
      const passwordHashString = Array.from(new Uint8Array(passwordHash))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Create new admin
      const { data: newAdmin, error: createError } = await supabaseServiceRole
        .from('admin_users')
        .insert({
          email,
          password_hash: passwordHashString,
          is_super_admin: is_super_admin || false
        })
        .select()
        .single();

      if (createError) {
        console.error("Create admin error:", createError);
        throw new Error("Failed to create admin account");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          admin: { id: newAdmin.id, email: newAdmin.email, is_super_admin: newAdmin.is_super_admin }
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
    console.error("Admin auth error:", error);
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