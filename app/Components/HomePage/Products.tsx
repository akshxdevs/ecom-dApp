"use client";
import { AddToCart, fetchAllProducts, fetchCartList } from "@/sdk/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { createContext, useContext, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { MinusCircleIcon, PlusCircleIcon } from "lucide-react";

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

interface CartLengthContextType {
  cartLength: number;
  setCartLength: (value: number) => void;
}

export const CartLengthContext = createContext<
  CartLengthContextType | undefined
>(undefined);

export const CartLengthProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [cartLength, setCartLength] = useState(0);
  return (
    <CartLengthContext.Provider value={{ cartLength, setCartLength }}>
      {children}
    </CartLengthContext.Provider>
  );
};

export const useCartLength = () => {
  const context = useContext(CartLengthContext);
  if (context === undefined) {
    throw new Error("useCartLength must be used within a CartLengthProvider");
  }
  return context;
};

export const Products = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [quantities, setQuantities] = useState<{[key:string]:number}>({});
  const { setCartLength } = useCartLength();
  const router = useRouter();
  const { publicKey, signAllTransactions, signTransaction } = useWallet();


  const handleInc = (pubkey:string) => {
    setQuantities(prev => ({
      ...prev,
      [pubkey]: (prev[pubkey] || 0) + 1,
    }));
  };

  const handleDinc = (pubkey:string) => {
    setQuantities(prev =>({
      ...prev,
      [pubkey]:Math.max((prev[pubkey] ||0) -1, 1),
    }));
  };


  const loadAllProducts = async () => {
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
    };
    try {
      const result = await fetchAllProducts(walletAdapter);
      console.log("Fetch result:", result);

      if (result.success && result.products) {
        setProducts(result.products);
      } else {
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
  };

  const getCategoryName = (category: any) => {
    return Object.keys(category)[0] || "Unknown";
  };

  const getDivisionName = (division: any) => {
    return Object.keys(division)[0] || "Unknown";
  };

  const getStockStatus = (stockStatus: any) => {
    return Object.keys(stockStatus)[0] || "Unknown";
  };

  const loadCartList = async () => {
    const walletAdapter = {
      publicKey,
      signTransaction,
      signAllTransactions,
    };

    if (!publicKey) {
      setError("Please connect your wallet first");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const result = await fetchCartList(walletAdapter);
      if (result.success && result.cart) {
        const cartList = result.cart.cartList || [];
        console.log("CartList Length: ", cartList.length);
        setCartLength(cartList.length);
      } else {
        console.log("No products found or error occurred:", result.error);
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    if (products && products.length > 0) {
      const initialQuantities = products.reduce((acc, product) => {
        acc[product.pubkey] = 1;
        return acc;
      }, {} as { [key: string]: number });

      setQuantities(initialQuantities);
    }
  }, [products]);

  useEffect(() => {
    loadCartList();
    loadAllProducts();
  }, [publicKey]);

  const handleAddToCart = async (
    sellerPubkey: string,
    productName: string,
    quantity: number,
    price: number,
    productImgurl: string
  ) => {
    if (!publicKey) return;

    try {
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };
      const cart = await AddToCart(
        walletAdapter,
        sellerPubkey.toString(),
        productName,
        quantity,
        price,
        productImgurl
      );
      if (cart.success && cart.cartListPda) {
        console.log("Added To Cart Successfully..");
      } else {
        console.log("No products found or error occurred:", cart.error);
        setProduct(null);
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product, index) => (
            <motion.div
              key={product.pubkey}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div
                onClick={() => router.push(`/product/${product.pubkey}`)}
                className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center"
              >
                {product.productImgurl ? (
                  <img
                    src={
                      product.productImgurl || "https://example.com/iphone.jpg"
                    }
                    alt={product.productName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-gray-400 text-6xl">📦</div>
                )}
              </div>

              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-gray-800">
                    {product.productName}
                  </h3>
                  <span className="text-2xl font-bold text-purple-600">
                    {Math.round(product.price / 100)} $
                  </span>
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
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      getStockStatus(product.stockStatus) === "InStock"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {getStockStatus(product.stockStatus)}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <div className="w-full border">
                    <button
                      onClick={() =>
                        handleAddToCart(
                          product.sellerPubkey.toString(),
                          product.productName,
                          quantities[product.pubkey || 1],
                          Number(product.price),
                          product.productImgurl
                        )
                      }
                      className="w-full py-2 rounded-lg bg-zinc-800 font-semibold text-slate-100 shadow-md shadow-black"
                    >
                      Add To Cart
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-black">
                    <button onClick={()=>handleInc(product.pubkey)}>
                      <PlusCircleIcon />
                    </button>
                    <p>{quantities[product.pubkey || 1]}</p>
                    <button onClick={()=>handleDinc(product.pubkey)}>
                      <MinusCircleIcon />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
