import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

Deno.serve(async (req) => {
  console.log('Admin-data function called with method:', req.method)
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse body once and reuse it
    const requestBody = await req.json();
    const { action, adminEmail } = requestBody;

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

    if (action === "get_celebrities") {
      const { data: celebrities, error } = await supabaseServiceRole
        .from('celebrity_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching celebrities:", error);
        throw new Error("Failed to fetch celebrities");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          celebrities: celebrities || [] 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "get_all_users") {
      // Get both auth users and celebrity profiles
      const { data: authUsers, error: authError } = await supabaseServiceRole.auth.admin.listUsers();
      
      if (authError) {
        console.error("Error fetching auth users:", authError);
        throw new Error("Failed to fetch auth users");
      }

      const { data: celebrityProfiles, error: profileError } = await supabaseServiceRole
        .from('celebrity_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profileError) {
        console.error("Error fetching celebrity profiles:", profileError);
        throw new Error("Failed to fetch celebrity profiles");
      }

      // Merge auth users with their celebrity profiles
      const users = authUsers.users.map(authUser => {
        const profile = celebrityProfiles?.find(p => p.user_id === authUser.id);
        return {
          id: authUser.id,
          email: authUser.email,
          created_at: authUser.created_at,
          last_sign_in_at: authUser.last_sign_in_at,
          email_confirmed_at: authUser.email_confirmed_at,
          phone: authUser.phone,
          user_id: authUser.id,
          // Celebrity profile data
          stage_name: profile?.stage_name,
          real_name: profile?.real_name,
          is_verified: profile?.is_verified,
          is_available: profile?.is_available,
        };
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          users: users || [] 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "delete_user") {
      const { userId } = requestBody;
      
      if (!userId) {
        throw new Error("User ID is required");
      }

      // Delete celebrity profile first
      const { error: profileError } = await supabaseServiceRole
        .from('celebrity_profiles')
        .delete()
        .eq('user_id', userId);

      if (profileError) {
        console.error("Error deleting celebrity profile:", profileError);
      }

      // Delete auth user
      const { error: authError } = await supabaseServiceRole.auth.admin.deleteUser(userId);

      if (authError) {
        console.error("Error deleting auth user:", authError);
        throw new Error("Failed to delete user");
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "User deleted successfully" 
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    if (action === "toggle_user_verification") {
      const { userId, isVerified } = requestBody;
      
      if (!userId) {
        throw new Error("User ID is required");
      }

      console.log('Toggling user verification:', { userId, isVerified });

      // Update celebrity profile verification status
      const { data: updateData, error: updateError } = await supabaseServiceRole
        .from('celebrity_profiles')
        .update({ is_verified: isVerified })
        .eq('user_id', userId)
        .select();

      if (updateError) {
        console.error("Error updating user verification:", updateError);
        throw new Error(`Failed to update user verification: ${updateError.message}`);
      }

      console.log('Update result:', updateData);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
          data: updateData
        }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    // Fetch payment verification data with celebrity profiles
    console.log('Fetching payment verification data...');
    const { data: paymentsData, error: paymentsError } = await supabaseServiceRole
      .from('payment_verification')
      .select('*')
      .order('created_at', { ascending: false })

    console.log('Payment query result:', { paymentsData, paymentsError });
    
    if (paymentsError) {
      console.error('Payment error:', paymentsError);
      throw paymentsError
    }

    // Fetch celebrity profiles
    console.log('Fetching celebrity profiles...');
    const { data: celebrityProfilesData, error: celebrityError } = await supabaseServiceRole
      .from('celebrity_profiles')
      .select('id, stage_name, real_name, email, is_verified')

    console.log('Celebrity profiles result:', { celebrityProfilesData, celebrityError });

    if (celebrityError) {
      console.error('Celebrity error:', celebrityError);
      throw celebrityError
    }

    // Fetch celebrity profiles with subscription status
    console.log('Fetching celebrities with subscriptions...');
    const { data: celebritiesData, error: celebritiesError } = await supabaseServiceRole
      .from('celebrity_profiles')
      .select(`
        *,
        celebrity_subscriptions (
          is_active,
          subscription_end
        )
      `)
      .order('created_at', { ascending: false })

    console.log('Celebrities with subscriptions result:', { celebritiesData, celebritiesError });

    if (celebritiesError) {
      console.error('Celebrities with subscriptions error:', celebritiesError);
      throw celebritiesError
    }

    console.log('Processing data...');
    
    // Process payments data by joining with celebrity profiles
    const processedPayments = paymentsData?.map(payment => {
      const celebrity = celebrityProfilesData?.find(c => c.id === payment.celebrity_id)
      return {
        ...payment,
        celebrity_profiles: celebrity
      }
    }).filter(payment => payment.celebrity_profiles) || []

    console.log('Processed payments:', processedPayments.length);

    // Process celebrities data with subscription status
    const processedCelebrities = celebritiesData?.map(celebrity => {
      const activeSubscription = celebrity.celebrity_subscriptions?.find(
        (sub: any) => sub.is_active && new Date(sub.subscription_end) > new Date()
      )
      
      return {
        ...celebrity,
        subscription_status: activeSubscription ? 'active' : 'inactive',
        subscription_end: activeSubscription?.subscription_end
      }
    }) || []

    console.log('Processed celebrities:', processedCelebrities.length);

    const response = {
      success: true,
      payments: processedPayments,
      celebrities: processedCelebrities
    };
    
    console.log('Returning response:', response);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Error in admin-data function:', error)
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500
    })
  }
})