"use client";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useState, useEffect } from "react";
import { ArrowBigRight, UserCircle2Icon } from "lucide-react";
import toast from "react-hot-toast";

export default function WalletConnect() {
  const { publicKey, connected, connect, disconnect, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const copyAddress = async () => {
    if (!publicKey) return;
    try {
      await navigator.clipboard.writeText(publicKey.toString());
      setCopied(true);
      toast.success("Copied address!");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error("Failed to copy address");
    }
  };

  if (!mounted)
    return <div className="h-10 w-36 bg-zinc-700 rounded animate-pulse" />;

  if (connected && publicKey) {
    const shortened =
      publicKey.toString().slice(0, 4) +
      "..." +
      publicKey.toString().slice(-4);

    return (
      <div className="border border-zinc-800 rounded-lg px-2 hover:border-blue-900 transition">
        <button className="flex items-center gap-2">
          <UserCircle2Icon className="border-2 rounded-full border-gray-500"/>
          <span className="flex flex-col justify-start">
            <span className="text-sm font-medium">{shortened}</span>
            <span className="flex text-xs font-medium text-orange-600">{"Level 1"}</span>     
          </span>     
        </button>
      </div>
    );
  }
  return (
  <div className="border border-zinc-800 p-2 rounded-lg hover:border-blue-900 transition">
        <button onClick={async () => {
        try {
          if (!wallet) {
            setVisible(true);
            return;
          }
          await connect();
        } catch (e) {  
          setVisible(true);
        }
      }} className="flex items-center gap-1">
            <span className="w-full text-sm font-medium">Connect Wallet</span>
            <ArrowBigRight/>
        </button>
      </div>
  );
}
