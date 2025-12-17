"use client"

import { useState, useMemo, useEffect, Suspense, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import ProductCard from "@/components/products/product-card"
import { Search, X, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Spinner } from "@/components/ui/spinner"

type SortOption = "relevance" | "price-low" | "price-high" | "rating" | "newest"

interface Product {
  id: string
  name: string
  slug: string
  price: number
  discount: number
  rating: number
  images: string[]
  category: string
  stock: number
}

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { products: number };
}

const ITEMS_PER_PAGE = 9; // Consistent items per page

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get("category") || null
  );
  const [minPrice, setMinPrice] = useState<string>(
    searchParams.get("minPrice") || "0"
  );
  const [maxPrice, setMaxPrice] = useState<string>(
    searchParams.get("maxPrice") || "1000"
  );
  const [sortBy, setSortBy] = useState<SortOption>(
    (searchParams.get("sort") as SortOption) || "relevance"
  );
  const [currentPage, setCurrentPage] = useState(
    parseInt(searchParams.get("page") || "1")
  );

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Fetch Categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch("/api/categories");
        if (!response.ok) {
          throw new Error("Failed to fetch categories.");
        }
        const data = await response.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        toast({
          title: "Error",
          description: "Failed to load categories.",
          variant: "destructive",
        });
      }
    };
    fetchCategories();
  }, [toast]);

  // Memoize the debounced update function
  const updateUrlAndFetch = useCallback(
    async (params: URLSearchParams) => {
      setLoading(true);
      setError(null);
      const queryString = params.toString();
      router.replace(`?${queryString}`, { scroll: false });

      try {
        const response = await fetch(`/api/products?${queryString}`);
        if (!response.ok) {
          throw new Error("Failed to fetch products.");
        }
        const data = await response.json();
        setProducts(data.products);
        setTotalProducts(data.totalProducts);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
        toast({
          title: "Error",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    },
    [router, toast],
  );

  // Fetch Products based on filters and pagination
  useEffect(() => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (selectedCategory) params.set("category", selectedCategory);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    if (sortBy) params.set("sort", sortBy);
    params.set("page", currentPage.toString());
    params.set("limit", ITEMS_PER_PAGE.toString());

    updateUrlAndFetch(params);
  }, [searchQuery, selectedCategory, minPrice, maxPrice, sortBy, currentPage, updateUrlAndFetch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1); // Reset to first page on search
  };

  const handleCategoryChange = (slug: string | null) => {
    setSelectedCategory(slug);
    setCurrentPage(1); // Reset to first page on category change
  };

  const handleMinPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isNaN(Number(value)) && Number(value) >= 0) {
      setMinPrice(value);
      setCurrentPage(1); // Reset to first page
    }
  };

  const handleMaxPriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!isNaN(Number(value)) && Number(value) >= 0) {
      setMaxPrice(value);
      setCurrentPage(1); // Reset to first page
    }
  };

  const handleSortChange = (value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1); // Reset to first page
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory(null);
    setMinPrice("0");
    setMaxPrice("1000"); // Assuming a reasonable default max price
    setSortBy("relevance");
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

  if (loading && products.length === 0 && !error) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-6 md:px-8 py-12 md:py-16 max-w-7xl">
        {/* Breadcrumb */}
        <nav className="mb-12" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-xs tracking-wide">
            <li>
              <Link href="/" className="text-gray-500 hover:text-black transition-colors">
                Home
              </Link>
            </li>
            <li className="text-gray-300">/</li>
            <li className="text-black">Products</li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-light tracking-tight text-black mb-4">
            Products
          </h1>
          <div className="w-24 h-px bg-black"></div>
        </div>

        {/* Search and Mobile Filter */}
        <div className="mb-12 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between border-b border-gray-100 pb-8">
          <div className="flex-1 w-full sm:max-w-md relative">
            <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-8 pr-4 py-2 border-b border-gray-300 focus:border-black focus:outline-none bg-transparent text-sm tracking-wide placeholder:text-gray-400"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
            className="sm:hidden text-xs tracking-widest uppercase text-black border-black border pb-2"
          >
            Filters
          </Button>
        </div>

        <div className="flex flex-col lg:flex-row gap-16">
          {/* Sidebar - Filters */}
          <aside
            className={`lg:w-64 shrink-0 p-4 lg:p-0 border-r lg:border-r-0 border-gray-100 ${mobileFiltersOpen ? "block absolute top-0 left-0 h-full w-full bg-white z-10" : "hidden lg:block"}`}
          >
            <div className="sticky top-24 space-y-12">
              <div className="flex items-center justify-between">
                <h3 className="text-sm tracking-widest uppercase text-black font-light">Filters</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setMobileFiltersOpen(false)}
                  className="lg:hidden text-gray-400 hover:text-black"
                >
                  <X size={18} />
                </Button>
              </div>

              {/* Categories */}
              <div>
                <h4 className="text-xs tracking-widest uppercase text-gray-500 mb-6 font-light">Category</h4>
                <div className="space-y-4">
                  <label className="flex items-center gap-3 cursor-pointer group">
                    <input
                      type="radio"
                      name="category"
                      checked={selectedCategory === null}
                      onChange={() => handleCategoryChange(null)}
                      className="w-4 h-4 text-black border-gray-300 focus:ring-0 focus:ring-offset-0"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-black transition-colors font-light">All</span>
                  </label>
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === cat.slug}
                        onChange={() => handleCategoryChange(cat.slug)}
                        className="w-4 h-4 text-black border-gray-300 focus:ring-0 focus:ring-offset-0"
                      />
                      <span className="text-sm text-gray-600 group-hover:text-black transition-colors font-light">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <h4 className="text-xs tracking-widest uppercase text-gray-500 mb-6 font-light">Price (₹)</h4>
                <div className="flex gap-4">
                  <Input
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={handleMinPriceChange}
                    className="w-full px-0 py-2 border-b border-gray-300 focus:border-black focus:outline-none bg-transparent text-sm"
                    placeholder="Min"
                  />
                  <Input
                    type="number"
                    value={maxPrice}
                    onChange={handleMaxPriceChange}
                    className="w-full px-0 py-2 border-b border-gray-300 focus:border-black focus:outline-none bg-transparent text-sm"
                    placeholder="Max"
                  />
                </div>
              </div>

              {/* Clear Filters */}
              <Button
                variant="link"
                onClick={clearFilters}
                className="text-xs tracking-widest uppercase text-black border-b border-black pb-2 hover:opacity-60 transition-opacity font-light px-0"
              >
                Clear All
              </Button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            {/* Sort and Results Count */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-12 pb-8 border-b border-gray-100">
              <p className="text-xs text-gray-500 tracking-wide">
                Showing {products.length} of {totalProducts} {totalProducts === 1 ? "item" : "items"}
              </p>
              <div className="flex items-center gap-4">
                <span className="text-xs tracking-widest uppercase text-gray-500 font-light">Sort:</span>
                <Select value={sortBy} onValueChange={(value: SortOption) => handleSortChange(value)}>
                  <SelectTrigger className="text-sm border-b border-gray-300 focus:border-black focus:outline-none bg-transparent cursor-pointer appearance-none pr-6 font-light w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Highest Rating</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {error && ( // Display error message prominently
              <div className="text-center py-20 text-red-500">
                <AlertCircle className="w-12 h-12 mx-auto mb-4" />
                <p className="text-lg font-semibold">Failed to load products</p>
                <p className="text-sm">{error}. Please try again later.</p>
                <Button onClick={clearFilters} className="mt-6">Clear Filters</Button>
              </div>
            )}

            {!loading && !error && products.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-sm text-gray-500 mb-6">No products found matching your criteria</p>
                <Button
                  onClick={clearFilters}
                  variant="outline"
                  className="text-xs tracking-widest uppercase text-black border-black pb-2 hover:opacity-60 transition-opacity font-light"
                >
                  Clear filters
                </Button>
              </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && !error && totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  Previous
                </Button>
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  Next
                </Button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

function ProductsLoading() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Spinner />
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}
