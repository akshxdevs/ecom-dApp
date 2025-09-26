"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useState, useEffect } from "react";
import { Check, Copy } from "lucide-react";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";

const DynamicWalletMultiButton = dynamic(
    () => import("@solana/wallet-adapter-react-ui").then(mod=>({default:mod.WalletMultiButton})),
    {ssr:false}
);


export default function WalletConnect(){
    const {publicKey,connected} = useWallet();
    const [copied,setCopied] = useState(false);
    const [mounted,setMounted] = useState(false);
    const [theme,] = useState("dark");
    useEffect(()=>{
        setMounted(true);
    },[]);

    const copyAddress = async() => {
        if (!publicKey) return;
        try {
            await navigator.clipboard.writeText(publicKey.toString());
            setCopied(true);
            toast.success("Address copied to clipboard!");
            setTimeout(() => setCopied(false), 5000);
        } catch (error) {
            toast.error("Failed to copy address!")
        }
    }

    if (!mounted) {
        return <div className="h-10 w-32 bg-gray-700 rounded animate-pulse"></div>;
    }

    {connected && publicKey &&(
        <div>
            <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse transition-transform duration-100"></div>
            </div>
            {copied ? <Check className="text-green-400" /> : <Copy className={`${theme == "dark" ? "text-gray-400" : "text-black"}`} />}
            <button onClick={copyAddress} className={`flex space-x-3 items-center ${theme == "dark" ? "bg-gray-800 hover:bg-gray-700" : "bg-gray-200 hover:bg-gray-300"} px-3 py-2 rounded-lg transition-colors`}>
            </button>
            <DynamicWalletMultiButton/>
        </div>
    )}
    return(
        <div>
            <DynamicWalletMultiButton/>
        </div>
    );
}