"use client";
import { fetchProduct } from "@/sdk/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function(){
    const params = useParams();
    const productPubkey = Array.isArray(params[""]) ? 
    decodeURIComponent(params[""][0] || "") : "Invalid URL.."
    
    const {publicKey, signAllTransactions, signTransaction} = useWallet();
    const [product,setProduct] = useState<Product | null>(null);
    const [error,setError] = useState<string | null>(null);
    const [loading,setLoading] = useState<boolean>(false);

    const loadProduct = async() => {
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
          const result = await fetchProduct(productPubkey,walletAdapter);
          console.log("Fetch result:", result);
          
          if (result.success && result.data) {
            setProduct(result.data);
            console.log(result);
            
          }else{
            console.log("No products found or error occurred:", result.error);
            setProduct(null);        
          }
        } catch (err: any) {
          console.error("Error loading products:", err);
          setError(err.message || "Failed to load products");
          console.log(error);
          setProduct(null);
        } finally {
          setLoading(false);
        }
      }
      useEffect(()=>{
        loadProduct()
      },[productPubkey])
    return(
        <div>
            <h1>{product?.productName}</h1>
        </div>
    );
}