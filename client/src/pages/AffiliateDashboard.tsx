import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Share2, Users, DollarSign, Copy, Twitter, Facebook, Linkedin, CheckCircle } from "lucide-react";
import { useState } from "react";
import type { ReferralCode, ReferralConversion } from "@shared/schema";

interface AffiliateStats {
  totalReferrals: number;
  pendingCommissions: number;
  paidCommissions: number;
  totalEarnings: number;
  conversions: ReferralConversion[];
}

export default function AffiliateDashboard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  const { data: referralCode, isLoading: codeLoading } = useQuery<ReferralCode>({
    queryKey: ['/api/affiliate/code'],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<AffiliateStats>({
    queryKey: ['/api/affiliate/stats'],
  });

  const referralLink = referralCode 
    ? `${window.location.origin}?ref=${referralCode.code}`
    : '';

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually",
        variant: "destructive",
      });
    }
  };

  const shareOnTwitter = () => {
    const text = encodeURIComponent("Join me on this amazing platform! Use my referral link:");
    const url = encodeURIComponent(referralLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const shareOnFacebook = () => {
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  const shareOnLinkedIn = () => {
    const url = encodeURIComponent(referralLink);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const formatCurrency = (cents: number) => {
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isLoading = codeLoading || statsLoading;

  return (
    <div className="min-h-screen bg-black">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2" data-testid="text-affiliate-title">
            Affiliate Dashboard
          </h1>
          <p className="text-gray-400" data-testid="text-affiliate-description">
            Earn 10% commission on every first purchase from users you refer
          </p>
        </div>

        <Card className="mb-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[#FF6B35]" />
              Your Referral Link
            </CardTitle>
            <CardDescription className="text-gray-400">
              Share this link with friends and earn commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-12 w-full bg-gray-800" />
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1 bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
                    <p className="text-sm text-gray-400 mb-1">Your Code</p>
                    <p className="text-xl font-mono font-bold text-[#FF6B35]" data-testid="text-referral-code">
                      {referralCode?.code || 'Loading...'}
                    </p>
                  </div>
                  <div className="flex-[2] bg-gray-800 rounded-lg px-4 py-3 border border-gray-700 overflow-hidden">
                    <p className="text-sm text-gray-400 mb-1">Referral Link</p>
                    <p className="text-sm text-white font-mono truncate" data-testid="text-referral-link">
                      {referralLink || 'Loading...'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => copyToClipboard(referralLink)}
                    className="bg-[#FF6B35] hover:bg-[#FF6B35]/90 text-white"
                    data-testid="button-copy-link"
                  >
                    {copied ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Link
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareOnTwitter}
                    className="border-gray-700 text-white hover:bg-gray-800"
                    data-testid="button-share-twitter"
                  >
                    <Twitter className="w-4 h-4 mr-2" />
                    Twitter
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareOnFacebook}
                    className="border-gray-700 text-white hover:bg-gray-800"
                    data-testid="button-share-facebook"
                  >
                    <Facebook className="w-4 h-4 mr-2" />
                    Facebook
                  </Button>

                  <Button
                    variant="outline"
                    onClick={shareOnLinkedIn}
                    className="border-gray-700 text-white hover:bg-gray-800"
                    data-testid="button-share-linkedin"
                  >
                    <Linkedin className="w-4 h-4 mr-2" />
                    LinkedIn
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-20 w-full bg-gray-800" />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[#FF6B35]/10 rounded-lg">
                    <Users className="w-6 h-6 text-[#FF6B35]" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Total Referrals</p>
                    <p className="text-3xl font-bold text-white" data-testid="text-total-referrals">
                      {stats?.totalReferrals || 0}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-20 w-full bg-gray-800" />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Pending Commissions</p>
                    <p className="text-3xl font-bold text-white" data-testid="text-pending-commissions">
                      {formatCurrency(stats?.pendingCommissions || 0)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6">
              {isLoading ? (
                <Skeleton className="h-20 w-full bg-gray-800" />
              ) : (
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <DollarSign className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Paid Out</p>
                    <p className="text-3xl font-bold text-white" data-testid="text-paid-commissions">
                      {formatCurrency(stats?.paidCommissions || 0)}
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Recent Conversions</CardTitle>
            <CardDescription className="text-gray-400">
              Track your referral activity and commissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full bg-gray-800" />
                ))}
              </div>
            ) : stats?.conversions && stats.conversions.length > 0 ? (
              <div className="space-y-4">
                {stats.conversions.map((conversion) => (
                  <div
                    key={conversion.id}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-800 rounded-lg border border-gray-700"
                    data-testid={`conversion-row-${conversion.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#FF6B35]/10 rounded-full flex items-center justify-center">
                        <Users className="w-5 h-5 text-[#FF6B35]" />
                      </div>
                      <div>
                        <p className="text-white font-medium">
                          Referral #{conversion.id}
                        </p>
                        <p className="text-sm text-gray-400">
                          {formatDate(conversion.createdAt as unknown as string)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-white font-bold">
                          {formatCurrency(conversion.commission)}
                        </p>
                        <p className="text-xs text-gray-400">Commission</p>
                      </div>
                      <Badge
                        variant={conversion.status === 'paid' ? 'default' : 'secondary'}
                        className={conversion.status === 'paid' 
                          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
                          : 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                        }
                        data-testid={`badge-status-${conversion.id}`}
                      >
                        {conversion.status === 'paid' ? 'Paid' : 'Pending'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">No conversions yet</p>
                <p className="text-sm text-gray-500">
                  Share your referral link to start earning commissions
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="mt-8 bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">How It Works</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#FF6B35] font-bold text-lg">1</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Share Your Link</h3>
                <p className="text-gray-400 text-sm">
                  Copy your unique referral link and share it with friends, family, or your audience.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#FF6B35] font-bold text-lg">2</span>
                </div>
                <h3 className="text-white font-semibold mb-2">They Sign Up</h3>
                <p className="text-gray-400 text-sm">
                  When someone clicks your link and creates an account, they become your referral.
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-[#FF6B35]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-[#FF6B35] font-bold text-lg">3</span>
                </div>
                <h3 className="text-white font-semibold mb-2">Earn 10%</h3>
                <p className="text-gray-400 text-sm">
                  You earn 10% commission on their first purchase. Commissions are paid monthly.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
