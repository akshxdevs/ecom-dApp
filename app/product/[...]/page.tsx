"use client";
import { Appbar } from "@/app/Components/Appbar";
import {
  AddToCart,
  fetchCartList,
  fetchProduct,
  fetchCart,
} from "@/sdk/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
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

export default function () {
  const params = useParams();
  const productPubkey = Array.isArray(params[""])
    ? decodeURIComponent(params[""][0] || "")
    : "Invalid URL..";

  const { publicKey, signAllTransactions, signTransaction } = useWallet();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
      // console.log("Fetch result from cart:", result);
      if (result.success && result.cart) {
        // console.log("Cart Fetched Successfully: ",result.cart);
        let cartList = result.cart.cartList;
        console.log("Product PublicKey: ", cartList);

        for (let i = 0; i < cartList.length; i++) {
          const cartKeyObj = cartList[i];
          if (!cartKeyObj) continue;

          try {
            // Convert the cart public key
            const cartKey = new PublicKey(cartKeyObj);
            const cartPubkeyString = cartKey.toBase58();

            console.log("Cart Key (Pubkey):", cartPubkeyString);

            // Fetch the cart account first
            const cartDetails = await fetchCart(
              cartPubkeyString,
              walletAdapter
            );
            console.log("Cart details:", cartDetails.data);

            if (cartDetails.success && cartDetails.data) {
              // Now derive the product PDA using seller_pubkey and product_name from cart
              const sellerPubkey = cartDetails.data.sellerPubkey;
              const productName = cartDetails.data.productName;

              // Derive the product PDA
              const productPda = PublicKey.findProgramAddressSync(
                [
                  Buffer.from("product"),
                  sellerPubkey.toBuffer(),
                  Buffer.from(productName),
                ],
                new PublicKey("FYo4gi69vTJZJMnNxj2mZz2Q9CbUu12rQDVtHNUFQ2o7")
              )[0];

              console.log("Derived Product PDA:", productPda.toString());

              // Now fetch the actual product
              const productDetails = await fetchProduct(
                productPda.toString(),
                walletAdapter
              );
              console.log("Product details from cart:", productDetails.data);
            }
          } catch (err) {
            console.error("Error converting or fetching cart/product:", err);
          }
        }
        console.log("Total Amount: ", Number(result.cart.totalAmount));
      } else {
        console.log("No products found or error occurred:", result.error);
      }
    } catch (err: any) {
      console.error("Error loading products:", err);
      setError(err.message || "Failed to load products");
      console.log(error);
    }
  };

  const loadProduct = async () => {
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
      const result = await fetchProduct(productPubkey, walletAdapter);

      if (result.success && result.data) {
        setProduct(result.data);
      } else {
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
  };

  useEffect(() => {
    if (publicKey && productPubkey) {
      loadProduct();
      loadCartList();
    }
  }, [publicKey, productPubkey]);

  const handleAddToCart = async () => {
    if (!publicKey) return;

    try {
      const walletAdapter = {
        publicKey,
        signTransaction,
        signAllTransactions,
      };

      const cart = await AddToCart(
        walletAdapter,
        product?.sellerPubkey.toString(),
        product?.productName,
        1,
        product?.price,
        product?.productImgurl
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
      <Appbar />
      <img src={product?.productImgurl} alt="" />
      <h1>{product?.productName}</h1>
      <p>{product?.productShortDescription}</p>
      <button onClick={handleAddToCart} className="px-4 py-2 border">
        AddToCart
      </button>
    </div>
  );
}
