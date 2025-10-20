import { fetchAllProducts } from "@/sdk/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react"
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";

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
export const Products = () => {
    const [products,setProducts] = useState<Product[]>([]);
    const [error,setError] = useState<string | null>(null);
    const [loading,setLoading] = useState<boolean>(false);
    const router = useRouter();
    const {publicKey, signAllTransactions, signTransaction} = useWallet();
    const loadAllProducts = async() => {
        if (!publicKey) {
          setError("Please connect your wallet first");
          return;
        }
    
        setLoading(true);
        setError(null);
        
        const walletAdapter = {
          publicKey,
          signTransaction,
          signAllTransactions,
        }
        try {
          const result = await fetchAllProducts(walletAdapter);
          console.log("Fetch result:", result);
          
          if (result.success && result.products) {
            setProducts(result.products);
          }else{
            console.log("No products found or error occurred:", result.error);
            setProducts([]);        
          }
        } catch (err: any) {
          console.error("Error loading products:", err);
          setError(err.message || "Failed to load products");
          console.log(error);
          setProducts([]);
        } finally {
          setLoading(false);
        }
      }

      const getCategoryName = (category: any) => {
        return Object.keys(category)[0] || "Unknown";
      };
    
      const getDivisionName = (division: any) => {
        return Object.keys(division)[0] || "Unknown";
      };
    
      const getStockStatus = (stockStatus: any) => {
        return Object.keys(stockStatus)[0] || "Unknown";
      };

      useEffect(()=>{
        loadAllProducts();
      },[publicKey])

      function bytesToUuid(bytes: number[]): string {
        if (bytes.length !== 16) throw new Error("Invalid UUID length");
    
        const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("");
        return [
          hex.slice(0, 8),
          hex.slice(8, 12),
          hex.slice(12, 16),
          hex.slice(16, 20),
          hex.slice(20),
        ].join("-");
      }
      
    return <div>
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <motion.div
                      key={product.pubkey}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                      onClick={()=>router.push(`/product/${product.pubkey}`)}
                    >
                      <div className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                        {product.productImgurl ? (
                          <img 
                            src={product.productImgurl || "https://example.com/iphone.jpg"} 
                            alt={product.productName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400 text-6xl">📦</div>
                        )}
                      </div>

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
                      </div>
                    </motion.div>
                  ))}
                </div>
            </div>
    </div>
}