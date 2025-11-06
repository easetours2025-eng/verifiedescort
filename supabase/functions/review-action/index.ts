import { serve } from 'https://deno.land/std@0.190.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.55.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get token from URL query parameter
    const url = new URL(req.url);
    const token = url.searchParams.get('token');

    if (!token) {
      return new Response(
        generateHTML('Error', 'Invalid request - no token provided', 'error'),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    console.log('Processing review action with token');

    // Verify token and get review info
    const { data: tokenData, error: tokenError } = await supabaseClient
      .from('review_action_tokens')
      .select('*, celebrity_reviews!inner(id, celebrity_id, rating, review_text, celebrity_profiles!inner(stage_name))')
      .eq('token', token)
      .is('used_at', null)
      .single();

    if (tokenError || !tokenData) {
      console.error('Token verification failed:', tokenError);
      return new Response(
        generateHTML('Invalid Token', 'This link is invalid or has already been used.', 'error'),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    // Check if token is expired
    if (new Date(tokenData.expires_at) < new Date()) {
      return new Response(
        generateHTML('Expired Link', 'This action link has expired. Please use the admin dashboard to manage reviews.', 'error'),
        { headers: { ...corsHeaders, 'Content-Type': 'text/html' }, status: 400 }
      );
    }

    const actionType = tokenData.action_type;
    const reviewId = tokenData.review_id;
    const review = tokenData.celebrity_reviews as any;

    // Perform the action
    if (actionType === 'approve') {
      const { error: updateError } = await supabaseClient
        .from('celebrity_reviews')
        .update({ is_verified: true })
        .eq('id', reviewId);

      if (updateError) {
        throw new Error(`Failed to approve review: ${updateError.message}`);
      }

      console.log(`Review ${reviewId} approved successfully`);
    } else if (actionType === 'reject') {
      const { error: deleteError } = await supabaseClient
        .from('celebrity_reviews')
        .delete()
        .eq('id', reviewId);

      if (deleteError) {
        throw new Error(`Failed to reject review: ${deleteError.message}`);
      }

      console.log(`Review ${reviewId} rejected successfully`);
    }

    // Mark token as used
    await supabaseClient
      .from('review_action_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // Generate success response
    const stars = '⭐'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
    const message = actionType === 'approve' 
      ? `Review has been approved and is now visible on ${review.celebrity_profiles.stage_name}'s profile.`
      : `Review has been rejected and removed from the system.`;

    return new Response(
      generateHTML(
        `Review ${actionType === 'approve' ? 'Approved' : 'Rejected'}`,
        message,
        'success',
        {
          celebrity: review.celebrity_profiles.stage_name,
          stars,
          reviewText: review.review_text
        }
      ),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' }, status: 200 }
    );

  } catch (error: any) {
    console.error('Error in review-action:', error);
    return new Response(
      generateHTML('Error', error.message || 'An error occurred processing your request', 'error'),
      { headers: { ...corsHeaders, 'Content-Type': 'text/html' }, status: 500 }
    );
  }
});

function generateHTML(
  title: string, 
  message: string, 
  type: 'success' | 'error',
  reviewInfo?: { celebrity: string; stars: string; reviewText: string | null }
): string {
  const bgColor = type === 'success' ? '#10b981' : '#ef4444';
  const icon = type === 'success' ? '✓' : '✗';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${title}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
          }
          .container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 500px;
            width: 100%;
            overflow: hidden;
          }
          .header {
            background: ${bgColor};
            color: white;
            padding: 40px 30px;
            text-align: center;
          }
          .icon {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 20px;
            font-size: 40px;
            font-weight: bold;
          }
          .content {
            padding: 40px 30px;
            text-align: center;
          }
          h1 {
            font-size: 28px;
            margin-bottom: 10px;
          }
          p {
            color: #666;
            line-height: 1.6;
            margin-bottom: 15px;
          }
          .review-info {
            background: #f9f9f9;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            text-align: left;
          }
          .celebrity {
            font-weight: 600;
            color: #667eea;
            margin-bottom: 10px;
          }
          .stars {
            font-size: 20px;
            margin: 10px 0;
          }
          .review-text {
            font-style: italic;
            color: #666;
            margin-top: 10px;
          }
          .dashboard-link {
            display: inline-block;
            margin-top: 20px;
            padding: 12px 24px;
            background: #667eea;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            transition: background 0.3s;
          }
          .dashboard-link:hover {
            background: #5568d3;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="icon">${icon}</div>
            <h1>${title}</h1>
          </div>
          <div class="content">
            <p>${message}</p>
            ${reviewInfo ? `
              <div class="review-info">
                <div class="celebrity">Celebrity: ${reviewInfo.celebrity}</div>
                <div class="stars">${reviewInfo.stars}</div>
                ${reviewInfo.reviewText ? `<div class="review-text">"${reviewInfo.reviewText}"</div>` : ''}
              </div>
            ` : ''}
            <a href="https://6b13bb96-d273-4fa4-b1fd-84855e385570.lovableproject.com/admin" class="dashboard-link">
              Go to Admin Dashboard
            </a>
          </div>
        </div>
      </body>
    </html>
  `;
}
