import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import StarRating from './StarRating';
import { 
  MessageSquare, 
  CheckCircle, 
  XCircle, 
  Search, 
  Filter,
  AlertTriangle,
  Trash2,
  Eye,
  Calendar,
  User
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Review {
  id: string;
  celebrity_id: string;
  rating: number;
  review_text: string | null;
  user_ip: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  celebrity_profiles: {
    stage_name: string;
  };
}

const AdminReviewManagement = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified'>('pending');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [spamKeywords, setSpamKeywords] = useState<string[]>(['spam', 'fake', 'scam', 'bot']);
  const { toast } = useToast();

  useEffect(() => {
    fetchReviews();
  }, [statusFilter]);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('celebrity_reviews')
        .select(`
          *,
          celebrity_profiles!inner (
            stage_name
          )
        `)
        .order('created_at', { ascending: false });

      if (statusFilter === 'pending') {
        query = query.eq('is_verified', false);
      } else if (statusFilter === 'verified') {
        query = query.eq('is_verified', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      setReviews(data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast({
        title: "Error",
        description: "Failed to fetch reviews",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproveReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('celebrity_reviews')
        .update({ is_verified: true })
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review approved successfully",
      });

      fetchReviews();
      setSelectedReviews(new Set());
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: "Error",
        description: "Failed to approve review",
        variant: "destructive",
      });
    }
  };

  const handleRejectReview = async (reviewId: string) => {
    try {
      const { error } = await supabase
        .from('celebrity_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Review rejected and deleted",
      });

      fetchReviews();
      setSelectedReviews(new Set());
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: "Error",
        description: "Failed to reject review",
        variant: "destructive",
      });
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.size === 0) return;

    try {
      const reviewIds = Array.from(selectedReviews);
      const { error } = await supabase
        .from('celebrity_reviews')
        .update({ is_verified: true })
        .in('id', reviewIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedReviews.size} reviews approved successfully`,
      });

      fetchReviews();
      setSelectedReviews(new Set());
    } catch (error) {
      console.error('Error bulk approving reviews:', error);
      toast({
        title: "Error",
        description: "Failed to approve reviews",
        variant: "destructive",
      });
    }
  };

  const handleBulkReject = async () => {
    if (selectedReviews.size === 0) return;

    try {
      const reviewIds = Array.from(selectedReviews);
      const { error } = await supabase
        .from('celebrity_reviews')
        .delete()
        .in('id', reviewIds);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${selectedReviews.size} reviews rejected and deleted`,
      });

      fetchReviews();
      setSelectedReviews(new Set());
    } catch (error) {
      console.error('Error bulk rejecting reviews:', error);
      toast({
        title: "Error",
        description: "Failed to reject reviews",
        variant: "destructive",
      });
    }
  };

  const detectSpam = (review: Review): boolean => {
    if (!review.review_text) return false;
    
    const text = review.review_text.toLowerCase();
    return spamKeywords.some(keyword => text.includes(keyword.toLowerCase()));
  };

  const toggleReviewSelection = (reviewId: string) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews.map(r => r.id)));
    }
  };

  const filteredReviews = reviews.filter(review => {
    // Search filter
    const searchMatch = searchTerm === '' || 
      review.celebrity_profiles.stage_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      review.review_text?.toLowerCase().includes(searchTerm.toLowerCase());

    // Rating filter
    const ratingMatch = ratingFilter === 'all' || 
      review.rating === parseInt(ratingFilter);

    return searchMatch && ratingMatch;
  });

  const spamReviews = filteredReviews.filter(detectSpam);
  const pendingCount = reviews.filter(r => !r.is_verified).length;
  const verifiedCount = reviews.filter(r => r.is_verified).length;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Review Management
              </CardTitle>
              <CardDescription>
                Manage and verify customer reviews
              </CardDescription>
            </div>
            <div className="flex gap-2 text-sm">
              <Badge variant="secondary">
                Pending: {pendingCount}
              </Badge>
              <Badge variant="default">
                Verified: {verifiedCount}
              </Badge>
              {spamReviews.length > 0 && (
                <Badge variant="destructive">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Spam: {spamReviews.length}
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by celebrity or review text..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by rating" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ratings</SelectItem>
                <SelectItem value="5">5 Stars</SelectItem>
                <SelectItem value="4">4 Stars</SelectItem>
                <SelectItem value="3">3 Stars</SelectItem>
                <SelectItem value="2">2 Stars</SelectItem>
                <SelectItem value="1">1 Star</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedReviews.size > 0 && (
            <Alert>
              <AlertDescription className="flex items-center justify-between">
                <span>{selectedReviews.size} review(s) selected</span>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="default"
                    onClick={handleBulkApprove}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve All
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={handleBulkReject}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject All
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Tabs */}
          <Tabs value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="pending">
                Pending ({pendingCount})
              </TabsTrigger>
              <TabsTrigger value="verified">
                Verified ({verifiedCount})
              </TabsTrigger>
              <TabsTrigger value="all">
                All ({reviews.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={statusFilter} className="space-y-4 mt-4">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading reviews...
                </div>
              ) : filteredReviews.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No reviews found</p>
                </div>
              ) : (
                <>
                  {/* Select All */}
                  <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
                    <Checkbox
                      checked={selectedReviews.size === filteredReviews.length && filteredReviews.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm font-medium">Select All</span>
                  </div>

                  {/* Reviews List */}
                  <div className="space-y-3">
                    {filteredReviews.map((review) => {
                      const isSpam = detectSpam(review);
                      
                      return (
                        <Card 
                          key={review.id} 
                          className={`${isSpam ? 'border-destructive' : ''} ${selectedReviews.has(review.id) ? 'bg-primary/5' : ''}`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <Checkbox
                                checked={selectedReviews.has(review.id)}
                                onCheckedChange={() => toggleReviewSelection(review.id)}
                              />
                              
                              <div className="flex-1 space-y-2">
                                {/* Header */}
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <StarRating rating={review.rating} readonly size="sm" />
                                    <Badge variant={review.is_verified ? 'default' : 'secondary'}>
                                      {review.is_verified ? 'Verified' : 'Pending'}
                                    </Badge>
                                    {isSpam && (
                                      <Badge variant="destructive">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        Potential Spam
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Calendar className="h-3 w-3" />
                                    {formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                                  </div>
                                </div>

                                {/* Celebrity */}
                                <div className="flex items-center gap-2 text-sm">
                                  <User className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-medium">{review.celebrity_profiles.stage_name}</span>
                                </div>

                                {/* Review Text */}
                                {review.review_text && (
                                  <p className="text-sm text-foreground p-3 bg-muted/50 rounded-lg">
                                    {review.review_text}
                                  </p>
                                )}

                                {/* User Info */}
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  <Eye className="h-3 w-3" />
                                  IP: {review.user_ip || 'Unknown'}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                  {!review.is_verified && (
                                    <Button
                                      size="sm"
                                      variant="default"
                                      onClick={() => handleApproveReview(review.id)}
                                    >
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Approve
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleRejectReview(review.id)}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminReviewManagement;
