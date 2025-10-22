"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { fetchCart, fetchCartList } from "@/sdk/program";
import { PublicKey } from "@solana/web3.js";
import { Products, useCartLength } from "./Products";
import { ShoppingCart } from "lucide-react";
import toast from "react-hot-toast";

interface Cart {
  productName: string;
  amount: any;
  sellerPubkey: string;
  productImgurl: string;
  quantity: number;
}

export const Main = () => {
  const router = useRouter();
  const {cartLength} = useCartLength(); 

  return (
    <div className="p-16">
      <div className="flex justify-between py-5">
        <div>
          <h1>Products</h1>
        </div>
        <div className="text-red-500">
          <button
            onClick={() => router.push("/cart")}
            className="text-white cursor-pointer"
          >
            <ShoppingCart />
          </button>
          {cartLength}
        </div>
      </div>
      <Products />
    </div>
  );
};
