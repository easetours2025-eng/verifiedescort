import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerifyPaymentRequest {
  paymentId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Create service role client for admin operations
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Create client with user's auth token to verify they're an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    // Verify the user is an admin
    const { data: adminCheck, error: adminError } = await supabaseAdmin
      .from('admin_users')
      .select('id, is_super_admin')
      .eq('email', user.email)
      .single();

    if (adminError || !adminCheck) {
      console.error('Admin check failed:', adminError);
      throw new Error('User is not an admin');
    }

    console.log('Admin verified:', user.email);

    // Parse request body
    const { paymentId }: VerifyPaymentRequest = await req.json();

    if (!paymentId) {
      throw new Error('Payment ID is required');
    }

    console.log('Verifying payment:', paymentId);

    // Fetch payment details using service role
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from('payment_verification')
      .select('*')
      .eq('id', paymentId)
      .single();

    if (paymentError || !payment) {
      console.error('Payment not found:', paymentError);
      throw new Error('Payment not found');
    }

    console.log('Payment found:', payment);

    // Check if already verified
    if (payment.is_verified) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Payment already verified',
          alreadyVerified: true
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if payment meets expected amount
    const isUnderpaid = payment.expected_amount && payment.amount < payment.expected_amount;
    
    // Update payment verification status
    const { error: verifyError } = await supabaseAdmin
      .from('payment_verification')
      .update({
        is_verified: true,
        verified_at: new Date().toISOString(),
        verified_by: user.id,
      })
      .eq('id', paymentId);

    if (verifyError) {
      console.error('Error updating payment:', verifyError);
      throw new Error(`Failed to update payment: ${verifyError.message}`);
    }

    console.log('Payment marked as verified');

    let message = 'Payment verified successfully';

    // Only activate subscription if payment is not underpaid
    if (!isUnderpaid && payment.subscription_tier && payment.duration_type) {
      // Calculate subscription end date based on duration
      let durationDays = 30; // default 1 month
      if (payment.duration_type === '1_week') durationDays = 7;
      else if (payment.duration_type === '2_weeks') durationDays = 14;

      const subscriptionEnd = new Date();
      subscriptionEnd.setDate(subscriptionEnd.getDate() + durationDays);

      // Activate or create subscription using service role
      const { error: subscriptionError } = await supabaseAdmin
        .from('celebrity_subscriptions')
        .upsert({
          celebrity_id: payment.celebrity_id,
          subscription_tier: payment.subscription_tier,
          duration_type: payment.duration_type,
          amount_paid: payment.amount,
          is_active: true,
          subscription_start: new Date().toISOString(),
          subscription_end: subscriptionEnd.toISOString(),
          last_payment_id: payment.id,
        }, {
          onConflict: 'celebrity_id'
        });

      if (subscriptionError) {
        console.error('Error creating subscription:', subscriptionError);
        throw new Error(`Failed to create subscription: ${subscriptionError.message}`);
      }

      console.log('Subscription activated');

      // Mark celebrity as verified and available using service role
      const { error: profileError } = await supabaseAdmin
        .from('celebrity_profiles')
        .update({
          is_verified: true,
          is_available: true,
        })
        .eq('id', payment.celebrity_id);

      if (profileError) {
        console.error('Error updating profile:', profileError);
        throw new Error(`Failed to update profile: ${profileError.message}`);
      }

      console.log('Celebrity profile updated');

      message = 'Payment verified and subscription activated';
      
      if (payment.credit_balance && payment.credit_balance > 0) {
        message += `. KSH ${payment.credit_balance} credited to celebrity account.`;
      }
    } else if (isUnderpaid) {
      message = 'Payment verified but subscription not activated due to insufficient amount';
      console.log('Payment underpaid, subscription not activated');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message,
        isUnderpaid
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in verify-payment function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'An error occurred' 
      }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
