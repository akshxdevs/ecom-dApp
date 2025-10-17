"use client";

import { useState, useEffect } from "react";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { 
  fetchAllProductsFromSeller, 
  fetchProduct, 
  formatProductData,
  initCreateProduct 
} from "../../sdk/program";
import { PublicKey } from "@solana/web3.js";
import { motion } from "framer-motion";

interface Product {
  pubkey: string;
  productId: number[];
  productName: string;
  productShortDescription: string;
  price: number;
  category: any;
  division: any;
  sellerName: string;
  sellerPubkey: string;
  productImgurl: string;
  quantity: number;
  rating: number;
  stockStatus: any;
}

export const Product = () => {
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const { connection } = useConnection();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  
  // Form state for creating products
  const [formData, setFormData] = useState({
    product_name: "",
    product_short_description: "",
    price: "",
    category: "Electronics",
    division: "Mobile",
    seller_name: "",
    product_imgurl: "",
    quantity: 1
  });

  // Hardcoded seller public keys - Replace with your actual seller public keys
  const SELLER_PUBKEYS: string[] = [
    // Add your seller public keys here from your test file
    // Example: "YourSellerPublicKeyHere"
  ];

  // Fetch products from blockchain
  const loadProducts = async () => {
    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let allProducts: Product[] = [];

      // Fetch products from each seller
      for (const sellerPubkey of SELLER_PUBKEYS) {
        const result = await fetchAllProductsFromSeller(sellerPubkey, {
          publicKey,
          signTransaction,
          signAllTransactions
        } as any);
        
        if (result.success && result.products) {
          allProducts = [...allProducts, ...result.products];
        }
      }

      // Format products for display
      const formattedProducts = allProducts.map(product => {
        const priceValue = typeof product.price === 'object' && product.price !== null && 'toNumber' in product.price
          ? (product.price as any).toNumber()
          : typeof product.price === 'number' ? product.price : 0;
        
        return {
          ...product,
          price: priceValue / 100 // Convert cents to dollars/SOL
        };
      });

      setProducts(formattedProducts);
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // Create new product
  const handleCreateProduct = async () => {
    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    // Validate form
    if (!formData.product_name || !formData.product_short_description || !formData.price) {
      setError("Please fill in all required fields");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      // Get wallet secret key from the wallet adapter
      // Note: This is a simplified approach. In production, you'd want to handle this more securely
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions
      };

      const result = await initCreateProduct(
        walletAdapter, // Pass the wallet adapter instead of secret key
        formData.product_name,
        formData.product_short_description,
        Math.floor(parseFloat(formData.price) * 100), // Convert to cents (u32)
        { [formData.category]: {} },
        { [formData.division]: {} },
        formData.seller_name || publicKey.toString(),
        formData.product_imgurl
      );

      if (result.success) {
        setShowCreateModal(false);
        // Reset form
        setFormData({
          product_name: "",
          product_short_description: "",
          price: "",
          category: "Electronics",
          division: "Mobile",
          seller_name: "",
          product_imgurl: "",
          quantity: 1
        });
        // Reload products
        await loadProducts();
      } else {
        setError(result.error || "Failed to create product");
      }
    } catch (err: any) {
      console.error("Error creating product:", err);
      setError(err.message || "Failed to create product");
    } finally {
      setCreating(false);
    }
  };

  // Load products when wallet connects
  useEffect(() => {
    if (publicKey) {
      loadProducts();
    }
  }, [publicKey]);

  const getCategoryName = (category: any) => {
    return Object.keys(category)[0] || "Unknown";
  };

  const getDivisionName = (division: any) => {
    return Object.keys(division)[0] || "Unknown";
  };

  const getStockStatus = (stockStatus: any) => {
    return Object.keys(stockStatus)[0] || "Unknown";
  };

  return (
    <div className="max-w-7xl w-full mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <motion.h1 
          className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          Products Marketplace
        </motion.h1>
        
        {publicKey && (
          <motion.button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            + Create Product
          </motion.button>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      {/* Wallet Not Connected */}
      {!publicKey && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg mb-4">Please connect your wallet to view products</p>
        </div>
      )}

      {/* Loading State */}
      {loading && publicKey && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      )}

      {/* Products Grid */}
      {!loading && publicKey && products.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.pubkey}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              {/* Product Image */}
              <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                {product.productImgurl ? (
                  <img 
                    src={product.productImgurl} 
                    alt={product.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-6xl">📦</div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">{product.productName}</h3>
                  <span className="text-2xl font-bold text-purple-600">{product.price.toFixed(4)} SOL</span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {product.productShortDescription}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                    {getCategoryName(product.category)}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    {getDivisionName(product.division)}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    getStockStatus(product.stockStatus) === "InStock" 
                      ? "bg-green-100 text-green-700" 
                      : "bg-red-100 text-red-700"
                  }`}>
                    {getStockStatus(product.stockStatus)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
                  <span>Seller: {product.sellerName}</span>
                  <span>⭐ {product.rating.toFixed(1)}</span>
                </div>

                <button className="w-full py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300">
                  Add to Cart
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* No Products */}
      {!loading && publicKey && products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No products found. Create one to get started!</p>
        </div>
      )}

      {/* Create Product Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Create New Product</h2>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Name *
                  </label>
                  <input
                    type="text"
                    value={formData.product_name}
                    onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                    className="w-fulltext-black text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="e.g., iPhone 17 Pro"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Short Description *
                  </label>
                  <textarea
                    value={formData.product_short_description}
                    onChange={(e) => setFormData({ ...formData, product_short_description: e.target.value })}
                    className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    rows={3}
                    placeholder="Brief description of the product"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Price (SOL) *
                    </label>
                    <input
                      type="number"
                      step="0.0001"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="0.5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.quantity || 1}
                      onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) })}
                      className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                      placeholder="1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                      <option value="Electronics">Electronics</option>
                      <option value="BeautyAndPersonalCare">Beauty & Personal Care</option>
                      <option value="SnacksAndDrinks">Snacks & Drinks</option>
                      <option value="HouseholdEssentials">Household Essentials</option>
                      <option value="GroceryAndKitchen">Grocery & Kitchen</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Division
                    </label>
                    <select
                      value={formData.division}
                      onChange={(e) => setFormData({ ...formData, division: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    >
                      <option value="Mobile">Mobile</option>
                      <option value="Laptop">Laptop</option>
                      <option value="Headphone">Headphone</option>
                      <option value="SmartWatch">Smart Watch</option>
                      <option value="ComputerPeripherals">Computer Peripherals</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Seller Name
                  </label>
                  <input
                    type="text"
                    value={formData.seller_name}
                    onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder={publicKey?.toString() || "Your seller name"}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Product Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.product_imgurl}
                    onChange={(e) => setFormData({ ...formData, product_imgurl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder="https://example.com/product-image.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-50 transition-all duration-300"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProduct}
                  disabled={creating}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Product"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};