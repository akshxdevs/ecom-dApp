"use client";
import { createContext, useState, useContext, useEffect } from "react";
import {useWallet } from "@solana/wallet-adapter-react";
import { 
  fetchAllProductsFromSeller,
  initCreateProduct 
} from "../../sdk/program";
import { motion } from "framer-motion";
import { Appbar } from "../Components/Appbar";
import { FaTools } from "react-icons/fa";
import { GrOverview } from "react-icons/gr";
import { MdSell } from "react-icons/md";
import { RiBankCardFill } from "react-icons/ri";
import { TbShoppingCartStar } from "react-icons/tb";
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

interface CreateProdContextType {
  showCreateModal: boolean;
  setShowCreateModal: (value: boolean) => void;
}

interface Select{
  selected:string ;
  setSelected:(value:string) => void;
}
export const CreateProdContext = createContext<CreateProdContextType | undefined>(undefined);

export function CreateProdProvider({ children }: { children: React.ReactNode }) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <CreateProdContext.Provider value={{ showCreateModal, setShowCreateModal }}>
      {children}
    </CreateProdContext.Provider>
  );
}
export const useShowCreateModal = () => {
  const context = useContext(CreateProdContext);
  if (context === undefined) {
    throw new Error('useShowCreateModal must be used within a CreateProdProvider');
  }
  return context;
};
export const selectContext = createContext<Select | undefined>(undefined);

export function SelectProvider({children}: {children:React.ReactNode}) {
    const [selected,setSelected] = useState("");

    return( 
        <selectContext.Provider value={{selected,setSelected}}>{children}</selectContext.Provider>
    );
}

export const useSelector = () => {
    const context = useContext(selectContext);
    if (context === undefined) {
      throw new Error('useSelector must be used within a SelectProvider');
    }
    return context;
}
function CreateProductPage(){
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { showCreateModal, setShowCreateModal } = useShowCreateModal();
  const [creating, setCreating] = useState(false);
  const {selected,setSelected} = useSelector();
  
  const [formData, setFormData] = useState({
    product_name: "iPhone 17 Pro",
    product_short_description: "Premium flagship smartphone",
    price: "799",
    category: "Electronics",
    division: "Mobile",
    seller_name: "Apple",
    product_imgurl: "https://example.com/iphone.jpg",
    quantity: 1
  });




  // Fetch products from blockchain
  const loadProducts = async () => {
    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions
      };

      console.log("Loading products for public key:", publicKey.toString());
      const result = await fetchAllProductsFromSeller(publicKey.toString(), walletAdapter);
      console.log("Fetch result:", result);
      if (result.success && result.products) {
        setProducts(result.products);
        console.log(`Loaded ${result.products.length} products`);
        console.log("Products:", result.products);
      } else {
        console.log("No products found or error occurred:", result.error);
        setProducts([]);
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };


  // Create new product
  const handleCreateProduct = async () => {
    if (creating) {
      return; 
    }

    if (!formData.product_name || !formData.product_short_description || !formData.price) {
      setError("Please fill in all required fields");
      return;
    }

    const walletAdapter = {
      publicKey,
      signTransaction,
      signAllTransactions
    };

    setCreating(true);
    setError(null);
    try {

      
      const result = await initCreateProduct(
        walletAdapter,
        formData.product_name,
        formData.product_short_description,
        formData.price, 
        formData.category,
        formData.division,
        formData.seller_name,
        formData.product_imgurl
      );

      if (result.success) {
        setShowCreateModal(false);
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
        console.log(result);
        console.log("Product PDA:", result.productPda);
        
        // Reload products to show the new one
        await loadProducts();
      } else {
        setError(result.error || "Failed to create product");
      }
      console.log(result);
      
    } catch (err: any) {
      console.error("Error creating product:", err);
      
      // Handle specific transaction errors
      if (err.message && err.message.includes("already been processed")) {
        setError("Transaction already submitted. Please wait for confirmation.");
      } else if (err.message && err.message.includes("User rejected")) {
        setError("Transaction was cancelled by user.");
      } else {
        setError(err.message || "Failed to create product");
      }
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
    <div>
      <motion.div
        initial={{ y: -250 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 50}}
        className="pb-1 border-b border-gray-800 mb-3"
      >
        <Appbar/>
      </motion.div>
      <div className="w-full flex justify-between">
        <div className="w-[20%] h-screen py-2 mt-10 text-slate-200 bg-zinc-900 rounded-tr-xl">
           <div className="flex justify-end mr-10">
                <div className="flex flex-col gap-4 border-b pb-2 border-gray-600">
                    <div className=" text-lg pt-2 pb-6 border-b border-gray-600">
                        <div className="flex items-center gap-3 text-md px-2 py-1  rounded-lg hover:bg-zinc-700">
                            <MdSell/>
                            <button>Sellers Hub</button>
                        </div>
                    </div>
                    <div className={`flex items-center gap-3 text-md mt-5  px-2 py-1 rounded-lg ${selected === "overview" ? "text-[#016cff] bg-[#eaf5fe]" : "hover:bg-zinc-700"}`}>
                        <GrOverview/>
                        <button onClick={()=>setSelected("overview")}>Overview</button>
                    </div>
                    <div className={`flex items-center gap-3 text-md px-2 py-1 rounded-lg ${selected === "products" ? "text-[#016cff] bg-[#eaf5fe]" : "hover:bg-zinc-700"}`}>
                        <TbShoppingCartStar/>
                        <button onClick={()=>setSelected("products")}>My Products</button>
                    </div>
                    <div className={`flex items-center gap-3 text-md px-2 py-1 rounded-lg ${selected === "tools" ? "text-[#016cff] bg-[#eaf5fe]" : "hover:bg-zinc-700"}`}>
                        <FaTools/>
                        <button onClick={()=>setSelected("tools")}>Growth tools</button>
                    </div>
                    <div className={`flex items-center gap-3 text-md px-2 py-1 rounded-lg ${selected === "bill" ? "text-[#016cff] bg-[#eaf5fe]" : "hover:bg-zinc-700"}`}>
                        <RiBankCardFill/>
                        <button onClick={()=>setSelected("bill")}>Manage billing</button>                        
                    </div>
                </div>
            </div>        
        </div>
        <div className="w-[80%] mt-10 mx-10">
          {selected === "overview" &&(
            <div>
              <motion.button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  + Create Product
              </motion.button>
            </div>
          )}
          {selected === "products" &&(
            <div>
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
            </div>
          )}
        </div>
      </div>
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
                    className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                    placeholder={"Your seller name"}
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
                    className="w-full text-black px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
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
}

export default function CreateProductPageWrapper() {
  return (
    <CreateProdProvider>
      <SelectProvider>
        <CreateProductPage />
      </SelectProvider>
    </CreateProdProvider>
  );
}