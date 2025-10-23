"use client";
import { fetchConfirmPayment, initCreateEscrow, initCreatePayment, initDepositeEscrow, initWithdrawEscrow, fetchAccountBalances } from "@/sdk/program";
import { useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useSellerPubkey } from "../cart/page";
import { Appbar } from "../Components/Appbar";

export default function(){
    const [totalAmount,setTotalAmount] = useState<number>(0);
    const [isClient, setIsClient] = useState(false);
    const [balances, setBalances] = useState<any>(null);
    const [escrowPda, setEscrowPda] = useState<string | null>(null);
    const wallet = useWallet();
    const {publicKey,signAllTransactions,signTransaction} = wallet;
    const {sellerPubkey} = useSellerPubkey();
    
    useEffect(()=>{
        setIsClient(true);
        if(localStorage.getItem("totalAmount")){
            setTotalAmount(Number(localStorage.getItem("totalAmount")));
            console.log("total Amount in SOL:",
                ((Number(localStorage.getItem("totalAmount"))/LAMPORTS_PER_SOL)).toFixed(5) + " SOL");
        }else{
            console.log("No total amount found");
            setTotalAmount(0);
        } 
    },[]);

    const fetchBalances = async () => {
        if (!publicKey || !sellerPubkey || !escrowPda) {
            console.log("Missing required data for balance fetch");
            return;
        }

        try {
            const balanceResult = await fetchAccountBalances(
                wallet, 
                publicKey.toString(), 
                sellerPubkey, 
                escrowPda
            );
            
            if (balanceResult.success) {
                setBalances(balanceResult.balances);
                console.log("Balances updated:", balanceResult.balances);
            } else {
                console.error("Failed to fetch balances:", balanceResult.error);
            }
        } catch (error) {
            console.error("Error fetching balances:", error);
        }
    };

    const handlePayment = async() => {
        if (!publicKey) {
            toast.error("Please connect your wallet first");
            return;
        }
        if (!sellerPubkey) {
            toast.error("Seller information not available");
            return;
        }
        if (!totalAmount || totalAmount <= 0) {
            toast.error("Invalid total amount");
            return;
        }
        const walletAdapter = wallet;
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
                    toast.success("Escrow created successfully!");
                    
                    if (escrowInit.data) {
                        setEscrowPda(escrowInit.data.toString());
                        console.log("Escrow PDA stored:", escrowInit.data.toString());
                        setTimeout(() => {
                            fetchBalances();
                        }, 1000);
                    }
                    const depositeEscrow = await initDepositeEscrow(walletAdapter, sellerPubkey.toString(), totalAmount, escrowInit.mint);
                    console.log("Escrow Details: ",depositeEscrow);
                    
                    if (depositeEscrow.success) {
                        toast.success("Deposit escrow successful!"); 
                    } else {
                        toast.error(`Deposit escrow failed: ${depositeEscrow.error}`);
                    }
                    
                    const withdrawEscrow = await initWithdrawEscrow(walletAdapter, sellerPubkey.toString(), totalAmount, escrowInit.mint);
                    console.log("Escrow Details: ",withdrawEscrow);
                    
                    if (withdrawEscrow.success) {
                        toast.success("Withdraw escrow successful!"); 
                    } else {
                        toast.error(`Withdraw escrow failed: ${withdrawEscrow.error}`);
                    }
                    
                    const fetchPaymentConfirmation = await fetchConfirmPayment(walletAdapter);
                    console.log("Payment Confirmation: ",fetchPaymentConfirmation);
                    
                    if (fetchPaymentConfirmation.success) {
                        toast.success("Payment confirmed successfully!"); 
                    } else {
                        toast.error(`Payment confirmation failed: ${fetchPaymentConfirmation.error}`);
                    }
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
                        
                        {/* Balance Display Section */}
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 w-full max-w-md">
                            <h3 className="text-lg font-semibold mb-3 text-center">Account Balances</h3>
                            
                            {balances ? (
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                                        <span className="font-medium">Buyer:</span>
                                        <span className="text-green-600 font-bold">{balances.buyer.sol.toFixed(4)} SOL</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                                        <span className="font-medium">Seller:</span>
                                        <span className="text-blue-600 font-bold">{balances.seller.sol.toFixed(4)} SOL</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-white rounded border">
                                        <span className="font-medium">Escrow:</span>
                                        <span className="text-purple-600 font-bold">{balances.escrow.sol.toFixed(4)} SOL</span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-gray-500">
                                    {escrowPda ? 'Loading balances...' : 'Complete payment to see balances'}
                                </div>
                            )}
                            
                            {escrowPda && (
                                <button 
                                    onClick={fetchBalances}
                                    className="mt-3 w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                                >
                                    Refresh Balances
                                </button>
                            )}
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