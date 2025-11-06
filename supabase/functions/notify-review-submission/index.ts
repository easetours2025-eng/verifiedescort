import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';
import { Resend } from 'npm:resend@2.0.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReviewNotification {
  review_id: string;
  celebrity_id: string;
  rating: number;
  review_text: string | null;
}

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resend = new Resend(Deno.env.get('RESEND_API_KEY'));
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { review_id, celebrity_id, rating, review_text }: ReviewNotification = await req.json();

    console.log('Processing review notification:', { review_id, celebrity_id, rating });

    // Get celebrity information
    const { data: celebrity, error: celebrityError } = await supabaseClient
      .from('celebrity_profiles')
      .select('stage_name')
      .eq('id', celebrity_id)
      .single();

    if (celebrityError) {
      throw new Error(`Failed to fetch celebrity: ${celebrityError.message}`);
    }

    // Get all admin emails
    const { data: admins, error: adminsError } = await supabaseClient
      .from('admin_users')
      .select('email');

    if (adminsError) {
      throw new Error(`Failed to fetch admins: ${adminsError.message}`);
    }

    if (!admins || admins.length === 0) {
      console.log('No admin users found to notify');
      return new Response(
        JSON.stringify({ message: 'No admins to notify' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // Generate secure tokens for approve/reject actions
    const approveToken = crypto.randomUUID();
    const rejectToken = crypto.randomUUID();

    // Store tokens in database
    await supabaseClient.from('review_action_tokens').insert([
      { review_id, token: approveToken, action_type: 'approve' },
      { review_id, token: rejectToken, action_type: 'reject' }
    ]);

    const appUrl = 'https://6b13bb96-d273-4fa4-b1fd-84855e385570.lovableproject.com';
    const approveUrl = `${appUrl}/api/review-action?token=${approveToken}`;
    const rejectUrl = `${appUrl}/api/review-action?token=${rejectToken}`;

    // Create star rating display
    const stars = '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

    // Send email to each admin
    const emailPromises = admins.map(admin =>
      resend.emails.send({
        from: 'Reviews <onboarding@resend.dev>',
        to: [admin.email],
        subject: `New Review Pending Approval - ${celebrity.stage_name}`,
        html: `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
                .content { background: #ffffff; padding: 30px; border: 1px solid #e0e0e0; border-top: none; }
                .review-box { background: #f9f9f9; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px; }
                .stars { font-size: 24px; margin: 10px 0; }
                .actions { margin: 30px 0; text-align: center; }
                .btn { display: inline-block; padding: 14px 28px; margin: 0 10px; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px; transition: all 0.3s; }
                .btn-approve { background: #10b981; color: white; }
                .btn-approve:hover { background: #059669; }
                .btn-reject { background: #ef4444; color: white; }
                .btn-reject:hover { background: #dc2626; }
                .footer { text-align: center; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px; }
                .celebrity-name { font-weight: 600; color: #667eea; }
              </style>
            </head>
            <body>
              <div class="header">
                <h1 style="margin: 0;">📝 New Review Submitted</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Awaiting your moderation</p>
              </div>
              
              <div class="content">
                <p>A new review has been submitted for <span class="celebrity-name">${celebrity.stage_name}</span> and requires your approval.</p>
                
                <div class="review-box">
                  <div class="stars">${stars} (${rating}/5)</div>
                  ${review_text ? `<p style="margin: 15px 0 0 0; font-style: italic;">"${review_text}"</p>` : '<p style="margin: 15px 0 0 0; color: #999;">No review text provided</p>'}
                </div>
                
                <div class="actions">
                  <p style="margin-bottom: 20px; font-weight: 600;">Choose an action:</p>
                  <a href="${approveUrl}" class="btn btn-approve">✓ Approve Review</a>
                  <a href="${rejectUrl}" class="btn btn-reject">✗ Reject Review</a>
                </div>
                
                <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #666; font-size: 14px;">
                  These action links will expire in 7 days. You can also manage reviews in the 
                  <a href="${appUrl}/admin" style="color: #667eea;">admin dashboard</a>.
                </p>
              </div>
              
              <div class="footer">
                <p>This is an automated notification from your Celebrity Review System</p>
              </div>
            </body>
          </html>
        `,
      })
    );

    const results = await Promise.allSettled(emailPromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Email notification results: ${successful} sent, ${failed} failed`);

    return new Response(
      JSON.stringify({ 
        message: 'Notifications sent',
        successful,
        failed
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in notify-review-submission:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
