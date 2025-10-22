"use client";
import { initCreateEscrow, initCreatePayment } from "@/sdk/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSellerPubkey } from "../cart/page";
import { Appbar } from "../Components/Appbar";

export default function(){
    const [totalAmount,setTotalAmount] = useState<number>(0);
    const [isClient, setIsClient] = useState(false);
    const wallet = useWallet();
    const {publicKey,signAllTransactions,signTransaction} = wallet;
    const {sellerPubkey} = useSellerPubkey();
    
    useEffect(()=>{
        setIsClient(true);
        if(localStorage.getItem("totalAmount")){
            setTotalAmount(Number(localStorage.getItem("totalAmount")));
        }else{
            console.log("No total amount found");
            setTotalAmount(0);
        } 
    },[]);

    const handlePayment = async() => {
        // Check if wallet is connected
        if (!publicKey) {
            toast.error("Please connect your wallet first");
            return;
        }

        // Check if seller pubkey is available
        if (!sellerPubkey) {
            toast.error("Seller information not available");
            return;
        }

        // Check if total amount is valid
        if (!totalAmount || totalAmount <= 0) {
            toast.error("Invalid total amount");
            return;
        }

        // Use the actual wallet object from useWallet()
        const walletAdapter = wallet;
        
        console.log("Checkout - wallet:", wallet);
        console.log("Checkout - wallet keys:", wallet ? Object.keys(wallet) : 'wallet is null/undefined');
        console.log("Checkout - walletAdapter:", walletAdapter);
        console.log("Checkout - walletAdapter.publicKey:", walletAdapter?.publicKey);
        
        // Ensure we have a valid wallet adapter
        if (!walletAdapter || !walletAdapter.publicKey) {
            toast.error("Wallet not properly connected");
            return;
        }
        
        try {
            const result = await initCreatePayment(walletAdapter,totalAmount);
            console.log("Payment Details: ",result);
            
            if (result.success) {
                console.log("About to call initCreateEscrow with:", {
                    walletAdapter,
                    sellerPubkey: sellerPubkey.toString(),
                    totalAmount
                });
                const escrowInit = await initCreateEscrow(walletAdapter,sellerPubkey.toString(),totalAmount);
                console.log("Escrow Details: ",escrowInit);
                
                if (escrowInit.success) {
                    toast.success("Payment and escrow created successfully!"); 
                } else {
                    toast.error(`Escrow creation failed: ${escrowInit.error}`);
                }
            } else {
                toast.error(`Payment creation failed: ${result.error}`);
            }
        } catch (error) {
            console.error(error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            toast.error(`Transaction failed: ${errorMessage}`);
        }
    }

    return(
        <div>
            <Appbar/>
            <div className="flex flex-col justify-center items-center h-screen gap-5">
                <h1>Total Amount: {totalAmount}$</h1>
                {isClient && (
                    <>
                        <div className="text-sm text-gray-600">
                            Wallet Status: {publicKey ? `Connected (${publicKey.toString().slice(0, 8)}...)` : 'Not Connected'}
                        </div>
                        <div className="text-sm text-gray-600">
                            Seller: {sellerPubkey ? `${sellerPubkey.toString().slice(0, 8)}...` : 'Not Available'}
                        </div>
                    </>
                )}
                <button 
                    className={`py-2 px-4 border rounded-lg font-normal ${
                        isClient && publicKey && sellerPubkey && totalAmount > 0 
                            ? 'cursor-pointer bg-white text-black hover:bg-gray-100' 
                            : 'cursor-not-allowed bg-gray-300 text-gray-500'
                    }`} 
                    onClick={handlePayment}
                    disabled={!isClient || !publicKey || !sellerPubkey || totalAmount <= 0}
                >
                    {!isClient ? 'Loading...' :
                     !publicKey ? 'Connect Wallet First' : 
                     !sellerPubkey ? 'Seller Info Missing' : 
                     totalAmount <= 0 ? 'Invalid Amount' : 
                     'Proceed to Payment'}
                </button>
            </div>
        </div>
    );
}