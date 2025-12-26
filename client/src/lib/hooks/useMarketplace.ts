import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';

// --- Interfaces ---

export interface MarketplaceListing {
  id: number;
  projectId: number;
  authorId: string;
  title: string;
  subtitle: string | null;
  description: string;
  coverImageUrl: string | null;
  previewUrl: string | null;
  genre: string;
  tags: string[] | null;
  status: string;
  isFeatured: boolean;
  isDigitalOnly: boolean;
  totalSales: number;
  totalRevenue: number;
  averageRating: number | null;
  reviewCount: number;
  pageCount: number | null;
  wordCount: number | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplacePurchase {
  id: number;
  orderNumber: string;
  customerId: string | null;
  customerEmail: string;
  customerName: string;
  status: string;
  subtotal: number;
  shippingCost: number;
  tax: number;
  total: number;
  currency: string;
  createdAt: string;
  listing?: MarketplaceListing;
}

export interface MarketplaceReview {
  id: number;
  listingId: number;
  reviewerId: string;
  orderId: number | null;
  rating: number;
  title: string | null;
  content: string | null;
  isVerifiedPurchase: boolean;
  helpfulCount: number;
  isApproved: boolean;
  createdAt: string;
  updatedAt: string;
  user?: {
    firstName: string | null;
    lastName: string | null;
    profileImageUrl: string | null;
  };
}

export interface CreatorEarnings {
  totalEarned: number;
  availableBalance: number;
  pendingBalance: number;
  payoutHistory: Array<{
    id: number;
    amount: number;
    status: string;
    createdAt: string;
  }>;
}

export interface MarketplaceFilters {
  contentType?: string;
  search?: string;
  tags?: string[];
  sort?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedListings {
  listings: MarketplaceListing[];
  total: number;
  page: number;
  limit: number;
}

// --- Hooks ---

/**
 * Fetch published listings with filters
 */
export function useMarketplaceListings(filters: MarketplaceFilters = {}) {
  const queryParams = new URLSearchParams();
  if (filters.contentType) queryParams.set('contentType', filters.contentType);
  if (filters.search) queryParams.set('search', filters.search);
  if (filters.tags?.length) queryParams.set('tags', filters.tags.join(','));
  if (filters.sort) queryParams.set('sort', filters.sort);
  if (filters.page) queryParams.set('page', filters.page.toString());
  if (filters.limit) queryParams.set('limit', filters.limit.toString());

  const queryString = queryParams.toString();
  const url = `/api/marketplace/listings${queryString ? `?${queryString}` : ''}`;

  return useQuery<PaginatedListings>({
    queryKey: ['/api/marketplace/listings', filters],
    queryFn: async () => {
      const res = await fetch(url, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch marketplace listings');
      return res.json();
    },
  });
}

/**
 * Fetch single listing details
 */
export function useMarketplaceListing(id: number | string | undefined) {
  return useQuery<MarketplaceListing>({
    queryKey: ['/api/marketplace/listings', id],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/listings/${id}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch listing details');
      return res.json();
    },
    enabled: !!id,
  });
}

/**
 * Fetch current user's listings (authenticated)
 */
export function useMyListings() {
  return useQuery<MarketplaceListing[]>({
    queryKey: ['/api/marketplace/my-listings'],
    queryFn: async () => {
      const res = await fetch('/api/marketplace/my-listings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch your listings');
      return res.json();
    },
  });
}

/**
 * Mutation to create new listing
 */
export function useCreateListing() {
  return useMutation({
    mutationFn: async (data: Partial<MarketplaceListing>) => {
      const res = await apiRequest('POST', '/api/marketplace/listings', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/my-listings'] });
    },
  });
}

/**
 * Mutation to update listing
 */
export function useUpdateListing() {
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<MarketplaceListing> & { id: number }) => {
      const res = await apiRequest('PATCH', `/api/marketplace/listings/${id}`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/my-listings'] });
    },
  });
}

/**
 * Mutation to delete listing
 */
export function useDeleteListing() {
  return useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/marketplace/listings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/my-listings'] });
    },
  });
}

/**
 * Fetch user's purchases (authenticated)
 */
export function useMyPurchases() {
  return useQuery<MarketplacePurchase[]>({
    queryKey: ['/api/marketplace/my-purchases'],
    queryFn: async () => {
      const res = await fetch('/api/marketplace/my-purchases', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch your purchases');
      return res.json();
    },
  });
}

/**
 * Fetch reviews for a listing
 */
export function useListingReviews(listingId: number | string | undefined) {
  return useQuery<MarketplaceReview[]>({
    queryKey: ['/api/marketplace/listings', listingId, 'reviews'],
    queryFn: async () => {
      const res = await fetch(`/api/marketplace/listings/${listingId}/reviews`, { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch reviews');
      return res.json();
    },
    enabled: !!listingId,
  });
}

/**
 * Mutation to add a review
 */
export function useCreateReview() {
  return useMutation({
    mutationFn: async (data: { listingId: number; rating: number; title?: string; content?: string }) => {
      const res = await apiRequest('POST', `/api/marketplace/listings/${data.listingId}/reviews`, data);
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings', variables.listingId, 'reviews'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace/listings', variables.listingId] });
    },
  });
}

/**
 * Fetch creator earnings summary
 */
export function useCreatorEarnings() {
  return useQuery<CreatorEarnings>({
    queryKey: ['/api/marketplace/creator-earnings'],
    queryFn: async () => {
      const res = await fetch('/api/marketplace/creator-earnings', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch creator earnings');
      return res.json();
    },
  });
}

/**
 * Mutation to create checkout session
 */
export function useCreateCheckout() {
  return useMutation({
    mutationFn: async (data: { listingId: number; editionId?: number; quantity?: number }) => {
      const res = await apiRequest('POST', '/api/marketplace/checkout', data);
      return res.json();
    },
  });
}
