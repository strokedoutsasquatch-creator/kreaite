import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Store, Plus, Star, Users, Calendar, DollarSign, Package,
  Clock, CheckCircle2, Settings, TrendingUp, CreditCard,
  Award, MapPin, Loader2, ExternalLink, Edit, Trash2, Eye
} from "lucide-react";

interface TherapistProduct {
  id: number;
  therapistId: string;
  title: string;
  description: string;
  productType: "coaching" | "course" | "subscription" | "session";
  price: number;
  currency: string;
  duration: number;
  sessionCount: number;
  features: string[];
  isActive: boolean;
  stripePriceId: string | null;
  stripeProductId: string | null;
  enrollmentCount: number;
  createdAt: string;
}

interface TherapistStorefront {
  id: number;
  therapistId: string;
  therapist: {
    firstName: string;
    lastName: string;
    profileImageUrl: string;
  };
  profile: {
    licenseType: string;
    specializations: string[];
    yearsExperience: number;
    bio: string;
    rating: number;
    reviewCount: number;
    hourlyRate: number;
    acceptingPatients: boolean;
    isVerified: boolean;
  };
  products: TherapistProduct[];
}

export default function TherapistMarketplace() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [selectedStorefront, setSelectedStorefront] = useState<TherapistStorefront | null>(null);

  const [productForm, setProductForm] = useState({
    title: "",
    description: "",
    productType: "session" as const,
    price: 0,
    duration: 60,
    sessionCount: 1,
    features: [] as string[],
    isActive: true,
  });
  const [newFeature, setNewFeature] = useState("");

  const { data: storefronts, isLoading } = useQuery<TherapistStorefront[]>({
    queryKey: ["/api/therapist-marketplace"],
    queryFn: async () => {
      const res = await fetch("/api/therapist-marketplace");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: myProducts } = useQuery<TherapistProduct[]>({
    queryKey: ["/api/therapist-marketplace/my-products"],
    queryFn: async () => {
      const res = await fetch("/api/therapist-marketplace/my-products");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: myEarnings } = useQuery<any>({
    queryKey: ["/api/therapist-marketplace/earnings"],
    queryFn: async () => {
      const res = await fetch("/api/therapist-marketplace/earnings");
      if (!res.ok) return { total: 0, thisMonth: 0, pending: 0 };
      return res.json();
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/therapist-marketplace/products", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/therapist-marketplace/my-products"] });
      setCreateProductOpen(false);
      setProductForm({
        title: "",
        description: "",
        productType: "session",
        price: 0,
        duration: 60,
        sessionCount: 1,
        features: [],
        isActive: true,
      });
      toast({ title: "Product created!", description: "Your product is now live" });
    },
  });

  const purchaseProductMutation = useMutation({
    mutationFn: async (productId: number) => {
      return apiRequest("POST", `/api/therapist-marketplace/products/${productId}/purchase`, {});
    },
    onSuccess: (data: any) => {
      if (data?.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      }
    },
  });

  const addFeature = () => {
    if (newFeature.trim()) {
      setProductForm({
        ...productForm,
        features: [...productForm.features, newFeature.trim()],
      });
      setNewFeature("");
    }
  };

  const removeFeature = (index: number) => {
    setProductForm({
      ...productForm,
      features: productForm.features.filter((_, i) => i !== index),
    });
  };

  const getProductTypeLabel = (type: string) => {
    switch (type) {
      case "coaching": return "Coaching Package";
      case "course": return "Course";
      case "subscription": return "Monthly Subscription";
      case "session": return "Single Session";
      default: return type;
    }
  };

  const filteredStorefronts = storefronts?.filter(s => {
    const matchesSearch = searchQuery === "" ||
      `${s.therapist.firstName} ${s.therapist.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.profile.specializations?.some(sp => sp.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesSpecialty = selectedSpecialty === "all" ||
      s.profile.specializations?.includes(selectedSpecialty);
    
    return matchesSearch && matchesSpecialty;
  });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-marketplace-title">
              Therapist Marketplace
            </h1>
            <p className="text-gray-400 mt-1">
              Find expert therapists or sell your coaching services
            </p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-gray-900 mb-6">
            <TabsTrigger value="browse" data-testid="tab-browse">Browse Therapists</TabsTrigger>
            <TabsTrigger value="my-products" data-testid="tab-my-products">My Products</TabsTrigger>
            <TabsTrigger value="earnings" data-testid="tab-earnings">Earnings</TabsTrigger>
          </TabsList>

          <TabsContent value="browse" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search therapists or specialties..."
                className="flex-1 bg-gray-900 border-gray-800"
                data-testid="input-search-therapists"
              />
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
                <SelectTrigger className="w-full md:w-48 bg-gray-900 border-gray-800">
                  <SelectValue placeholder="Specialty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Specialties</SelectItem>
                  <SelectItem value="PT">Physical Therapy</SelectItem>
                  <SelectItem value="OT">Occupational Therapy</SelectItem>
                  <SelectItem value="SLP">Speech Language</SelectItem>
                  <SelectItem value="Neurological">Neurological</SelectItem>
                  <SelectItem value="Cognitive">Cognitive Rehab</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {isLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
            ) : filteredStorefronts && filteredStorefronts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStorefronts.map((storefront) => (
                  <Card
                    key={storefront.id}
                    className="bg-gray-900 border-gray-800 hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedStorefront(storefront)}
                    data-testid={`storefront-${storefront.id}`}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4 mb-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={storefront.therapist.profileImageUrl} />
                          <AvatarFallback className="bg-gray-700 text-primary text-xl">
                            {storefront.therapist.firstName?.[0]}{storefront.therapist.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-semibold text-foreground">
                              {storefront.therapist.firstName} {storefront.therapist.lastName}
                            </h3>
                            {storefront.profile.isVerified && (
                              <CheckCircle2 className="w-4 h-4 text-blue-400" />
                            )}
                          </div>
                          <p className="text-gray-400 text-sm">{storefront.profile.licenseType}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-foreground text-sm">
                              {((storefront.profile.rating || 0) / 10).toFixed(1)}
                            </span>
                            <span className="text-gray-500 text-sm">
                              ({storefront.profile.reviewCount} reviews)
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-gray-300 text-sm line-clamp-2 mb-4">
                        {storefront.profile.bio || "Experienced therapist helping stroke survivors recover."}
                      </p>

                      <div className="flex flex-wrap gap-2 mb-4">
                        {storefront.profile.specializations?.slice(0, 3).map((spec, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {spec}
                          </Badge>
                        ))}
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold text-primary">
                            ${((storefront.profile.hourlyRate || 0) / 100).toFixed(0)}
                          </p>
                          <p className="text-gray-500 text-xs">per hour</p>
                        </div>
                        <Badge className={storefront.profile.acceptingPatients ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                          {storefront.profile.acceptingPatients ? "Accepting Clients" : "Waitlist"}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Store className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg">No therapists found</p>
                <p className="text-gray-500">Try adjusting your search filters</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="my-products" className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Your Products & Services</h2>
              <Dialog open={createProductOpen} onOpenChange={setCreateProductOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90" data-testid="button-create-product">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800 max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">Create New Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto">
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Product Type</label>
                      <Select
                        value={productForm.productType}
                        onValueChange={(v: any) => setProductForm({ ...productForm, productType: v })}
                      >
                        <SelectTrigger className="bg-gray-800 border-gray-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="session">Single Session</SelectItem>
                          <SelectItem value="coaching">Coaching Package</SelectItem>
                          <SelectItem value="subscription">Monthly Subscription</SelectItem>
                          <SelectItem value="course">Course</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Title</label>
                      <Input
                        value={productForm.title}
                        onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                        placeholder="e.g., 1:1 Recovery Coaching"
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Description</label>
                      <Textarea
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        placeholder="Describe what's included..."
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Price ($)</label>
                        <Input
                          type="number"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) })}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Duration (mins)</label>
                        <Input
                          type="number"
                          value={productForm.duration}
                          onChange={(e) => setProductForm({ ...productForm, duration: parseInt(e.target.value) })}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                    </div>
                    {productForm.productType === "coaching" && (
                      <div>
                        <label className="text-sm text-gray-400 mb-2 block">Number of Sessions</label>
                        <Input
                          type="number"
                          value={productForm.sessionCount}
                          onChange={(e) => setProductForm({ ...productForm, sessionCount: parseInt(e.target.value) })}
                          className="bg-gray-800 border-gray-700"
                        />
                      </div>
                    )}
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Features</label>
                      <div className="flex gap-2 mb-2">
                        <Input
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          placeholder="Add a feature..."
                          className="bg-gray-800 border-gray-700"
                          onKeyPress={(e) => e.key === "Enter" && addFeature()}
                        />
                        <Button type="button" onClick={addFeature} variant="outline" size="icon">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {productForm.features.map((feature, i) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-gray-800 rounded">
                            <span className="text-sm text-foreground">{feature}</span>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => removeFeature(i)}
                              className="h-6 w-6"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-sm text-gray-400">Active</label>
                      <Switch
                        checked={productForm.isActive}
                        onCheckedChange={(v) => setProductForm({ ...productForm, isActive: v })}
                      />
                    </div>
                    <Button
                      onClick={() => createProductMutation.mutate({
                        ...productForm,
                        price: Math.round(productForm.price * 100),
                      })}
                      disabled={createProductMutation.isPending || !productForm.title || !productForm.price}
                      className="w-full bg-primary hover:bg-primary/90"
                    >
                      {createProductMutation.isPending ? "Creating..." : "Create Product"}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {myProducts && myProducts.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myProducts.map((product) => (
                  <Card key={product.id} className="bg-gray-900 border-gray-800">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline">{getProductTypeLabel(product.productType)}</Badge>
                        <Badge className={product.isActive ? "bg-green-500/20 text-green-400" : "bg-gray-500/20 text-gray-400"}>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">{product.title}</h3>
                      <p className="text-gray-400 text-sm line-clamp-2 mb-4">{product.description}</p>
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-2xl font-bold text-primary">
                          ${(product.price / 100).toFixed(0)}
                        </p>
                        <div className="flex items-center gap-1 text-gray-400 text-sm">
                          <Users className="w-4 h-4" />
                          {product.enrollmentCount} enrolled
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </Button>
                        <Button size="sm" variant="outline">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="py-12 text-center">
                  <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-400 text-lg">No products yet</p>
                  <p className="text-gray-500 mb-4">Create your first coaching product or course</p>
                  <Button onClick={() => setCreateProductOpen(true)} className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Product
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="earnings" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <DollarSign className="w-8 h-8 text-green-400" />
                    <TrendingUp className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Total Earnings</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${((myEarnings?.total || 0) / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Calendar className="w-8 h-8 text-blue-400" />
                  </div>
                  <p className="text-gray-400 text-sm">This Month</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${((myEarnings?.thisMonth || 0) / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-gray-900 border-gray-800">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 text-yellow-400" />
                  </div>
                  <p className="text-gray-400 text-sm">Pending Payout</p>
                  <p className="text-3xl font-bold text-foreground">
                    ${((myEarnings?.pending || 0) / 100).toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-foreground flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payout Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-400 mb-4">
                  Stroke Recovery Academy takes a 15% platform fee. Payouts are processed weekly.
                </p>
                <Button variant="outline">
                  <Settings className="w-4 h-4 mr-2" />
                  Configure Stripe Connect
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={!!selectedStorefront} onOpenChange={() => setSelectedStorefront(null)}>
          <DialogContent className="bg-gray-900 border-gray-800 max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedStorefront && (
              <>
                <DialogHeader>
                  <div className="flex items-start gap-4">
                    <Avatar className="w-20 h-20">
                      <AvatarImage src={selectedStorefront.therapist.profileImageUrl} />
                      <AvatarFallback className="bg-gray-700 text-primary text-2xl">
                        {selectedStorefront.therapist.firstName?.[0]}{selectedStorefront.therapist.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <DialogTitle className="text-foreground text-xl">
                          {selectedStorefront.therapist.firstName} {selectedStorefront.therapist.lastName}
                        </DialogTitle>
                        {selectedStorefront.profile.isVerified && (
                          <CheckCircle2 className="w-5 h-5 text-blue-400" />
                        )}
                      </div>
                      <p className="text-gray-400">{selectedStorefront.profile.licenseType}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                          <span className="text-foreground">
                            {((selectedStorefront.profile.rating || 0) / 10).toFixed(1)}
                          </span>
                          <span className="text-gray-500">
                            ({selectedStorefront.profile.reviewCount} reviews)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-400">
                          <Award className="w-4 h-4" />
                          {selectedStorefront.profile.yearsExperience} years exp.
                        </div>
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="mt-6 space-y-6">
                  <div>
                    <h4 className="text-foreground font-medium mb-2">About</h4>
                    <p className="text-gray-400">{selectedStorefront.profile.bio}</p>
                  </div>
                  <div>
                    <h4 className="text-foreground font-medium mb-2">Specializations</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedStorefront.profile.specializations?.map((spec, i) => (
                        <Badge key={i} variant="outline">{spec}</Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-foreground font-medium mb-4">Services & Products</h4>
                    <div className="space-y-4">
                      {selectedStorefront.products?.map((product) => (
                        <Card key={product.id} className="bg-gray-800 border-gray-700">
                          <CardContent className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h5 className="text-foreground font-medium">{product.title}</h5>
                                <p className="text-gray-400 text-sm">{product.description}</p>
                                <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                                  <span>{product.duration} mins</span>
                                  {product.sessionCount > 1 && <span>{product.sessionCount} sessions</span>}
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-primary">
                                  ${(product.price / 100).toFixed(0)}
                                </p>
                                <Button
                                  size="sm"
                                  onClick={() => purchaseProductMutation.mutate(product.id)}
                                  disabled={purchaseProductMutation.isPending}
                                  className="mt-2 bg-primary hover:bg-primary/90"
                                >
                                  Book Now
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {(!selectedStorefront.products || selectedStorefront.products.length === 0) && (
                        <p className="text-gray-400 text-center py-4">No products available</p>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
