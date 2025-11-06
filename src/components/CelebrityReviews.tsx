import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StarRating from './StarRating';
import { MessageSquare, Send, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  rating: number;
  review_text: string | null;
  created_at: string;
  user_ip: string | null;
}

interface CelebrityReviewsProps {
  celebrityId: string;
  averageRating: number;
  totalReviews: number;
  onReviewSubmitted?: () => void;
}

const CelebrityReviews: React.FC<CelebrityReviewsProps> = ({
  celebrityId,
  averageRating,
  totalReviews,
  onReviewSubmitted
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [celebrityId]);

  const fetchReviews = async () => {
    try {
      const { data, error } = await supabase
        .from('celebrity_reviews')
        .select('*')
        .eq('celebrity_id', celebrityId)
        .eq('is_verified', true)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserIP = async () => {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      console.error('Error getting IP:', error);
      return 'unknown';
    }
  };

  const handleSubmitReview = async () => {
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a star rating before submitting.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const userIP = await getUserIP();

      const { error } = await supabase
        .from('celebrity_reviews')
        .insert({
          celebrity_id: celebrityId,
          rating,
          review_text: reviewText.trim() || null,
          user_ip: userIP,
          is_verified: false // Will be reviewed by admin
        });

      if (error) throw error;

      toast({
        title: "Review Submitted",
        description: "Your review has been submitted and will appear after admin verification.",
      });

      // Reset form
      setRating(0);
      setReviewText('');
      setShowForm(false);

      // Callback to refresh rating data
      if (onReviewSubmitted) {
        onReviewSubmitted();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      toast({
        title: "Error",
        description: "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Reviews & Ratings
            </CardTitle>
            <CardDescription>
              {totalReviews > 0 
                ? `${totalReviews} verified ${totalReviews === 1 ? 'review' : 'reviews'}`
                : 'No reviews yet. Be the first to review!'}
            </CardDescription>
          </div>
          {!showForm && (
            <Button onClick={() => setShowForm(true)} size="sm">
              Write Review
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Average Rating Display */}
        {totalReviews > 0 && (
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">{averageRating.toFixed(1)}</div>
              <div className="text-sm text-muted-foreground">out of 5</div>
            </div>
            <div className="flex-1">
              <StarRating rating={averageRating} readonly size="lg" />
              <p className="text-sm text-muted-foreground mt-1">
                Based on {totalReviews} verified {totalReviews === 1 ? 'review' : 'reviews'}
              </p>
            </div>
          </div>
        )}

        {/* Review Form */}
        {showForm && (
          <div className="space-y-4 p-4 border border-primary/20 rounded-lg">
            <div className="space-y-2">
              <label className="text-sm font-medium">Your Rating</label>
              <StarRating 
                rating={rating} 
                onRatingChange={setRating}
                size="lg"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Your Review (Optional)</label>
              <Textarea
                placeholder="Share your experience..."
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {reviewText.length}/500 characters
              </p>
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={handleSubmitReview} 
                disabled={submitting || rating === 0}
                className="flex-1"
              >
                {submitting ? (
                  <>Submitting...</>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Submit Review
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowForm(false);
                  setRating(0);
                  setReviewText('');
                }}
                disabled={submitting}
              >
                Cancel
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Your review will be verified by our admin team before appearing publicly.
            </p>
          </div>
        )}

        {/* Reviews List */}
        {loading ? (
          <div className="text-center text-muted-foreground py-4">Loading reviews...</div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="p-4 border border-border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <StarRating rating={review.rating} readonly size="sm" />
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  </div>
                </div>
                {review.review_text && (
                  <p className="text-sm text-foreground">{review.review_text}</p>
                )}
                <Badge variant="secondary" className="text-xs">
                  Verified Review
                </Badge>
              </div>
            ))}
          </div>
        ) : !showForm && (
          <div className="text-center text-muted-foreground py-8">
            <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No reviews yet. Be the first to share your experience!</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CelebrityReviews;
