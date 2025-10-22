"use client";
import { fetchCart, fetchCartList } from "@/sdk/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { motion } from "framer-motion";
import { Appbar } from "../Components/Appbar";
import { IoBagCheckOutline } from "react-icons/io5";
import { BiMoney } from "react-icons/bi";

interface Cart {
  productName: string;
  amount: any;
  sellerPubkey: string;
  productImgurl: string;
  quantity: number;
}




export default function Cart() {
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Cart[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const router = useRouter();
  const { publicKey, signAllTransactions, signTransaction } = useWallet();

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
        const totalAmount = Number(result.cart.totalAmount || 0);
        setTotalAmount(Math.floor(totalAmount/100));

        const items = await Promise.all(
          cartList.map(async (cartKeyObj: string) => {
            if (!cartKeyObj) return null;
            try {
              const cartKey = new PublicKey(cartKeyObj);
              const cartPubkeyString = cartKey.toBase58();
              const cartDetails = await fetchCart(cartPubkeyString, walletAdapter);
              if (!cartDetails?.success || !cartDetails?.data) return null;
              const data = cartDetails.data as any;

              return {
                productName: data.productName ?? "",
                amount: data.price ?? data.amount ?? 0,
                sellerPubkey:
                  typeof data.sellerPubkey === "string"
                    ? data.sellerPubkey
                    : new PublicKey(data.sellerPubkey).toBase58(),
                productImgurl: data.productImgurl ?? "",
                quantity: Number(data.quantity ?? 1),
              } as Cart;
            } catch (err) {
              console.error("Error converting or fetching cart/product:", err);
              return null;
            }
          })
        );

        const validItems = items.filter(Boolean) as Cart[];
        setCart(validItems);
      } else {
        console.log("No products found or error occurred:", result.error);
        setTotalAmount(0);
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setCart([]);
      setTotalAmount(0);
      setError(err.message || "Failed to load products");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (publicKey) {
      loadCartList();
    }
  }, [publicKey]);
  
  
  return (
    <div>
      <Appbar/>
      <div className="max-w-xl mx-auto flex flex-col gap-4">
        {cart.map((product, index) => (
          <motion.div
            key={index}
            className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-shadow duration-300"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
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
                <h3 className="text-xl font-bold text-gray-800">
                  {product.productName}
                </h3>
                <span className="text-2xl font-bold text-purple-600">
                  {Math.floor(Number(product.amount)/100)} $
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-200">
          <BiMoney/>Total Amount: {totalAmount} $
        </h1>
        <button onClick={()=>{
          router.push("/checkout");
          localStorage.setItem("totalAmount",totalAmount.toString())
        }} className="cursor-pointer flex items-center justify-center gap-2 my-5 py-2 px-4 border">
          <span>Check Out</span>
          <IoBagCheckOutline size={25}/>
        </button>
      </div>
    </div>
  );
}
