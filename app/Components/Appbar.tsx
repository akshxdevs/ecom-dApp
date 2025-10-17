import localFont from "next/font/local";
import WalletConnect from "./WalletConnect";
import {  BellIcon, PlusSquareIcon, SearchIcon, ShoppingBagIcon, Wallet2Icon } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, clusterApiUrl,LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useEffect, useState } from "react";

// const alone = localFont({
//   src: '../fonts/Ventus/Ventus Italic.otf',
// });
export const Appbar = () => {
    const { publicKey, connected } = useWallet();
    const connection = new Connection(clusterApiUrl("devnet"));
    const [balance,setBalance] = useState<number>(0.0013);

    useEffect(()=>{
        fetchBalance();
    },[publicKey])

    const fetchBalance = async() => {
        try {
            if(!publicKey) throw new Error("Wallet not connected..")
            const lamports = (await connection.getBalance(publicKey));
            setBalance(lamports/1_000_000_000);
        } catch (error) {
            
        }
    }
    return (
            <div className="max-w-7xl w-full mx-auto p-2">
                <div className="flex justify-between items-center gap-16">
                    <div className="flex items-center gap-1">
                        <ShoppingBagIcon size={25}/>
                        <h1 className={`font-bold text-xl`}>blockBazzar</h1>
                    </div>
                    <div className="w-full flex items-center gap-4">
                        <div className="px-2 flex items-center gap-1 w-[40%] mr-8 border border-transparent outline-none focus:outline-none focus:border-blue-600 bg-[#223351] rounded-md">
                            <SearchIcon size={19} className="text-gray-300"/>
                            <input
                                type="text"
                                placeholder="Search"
                                className="w-full text-md py-1 outline-none border-none"
                            />
                        </div>
                        <button className="flex items-center text-slate-400 gap-2 p-2 text-sm font-semibold border-2 border-blue-900 rounded-lg hover:text-slate-100">
                            <PlusSquareIcon size={18} />
                            List a product
                        </button>
                        <button className="flex items-center gap-2 p-2 text-sm font-medium border border-zinc-800 rounded-lg hover:border-blue-900 ">
                            <Wallet2Icon size={18} />
                                $ {balance.toFixed(4)}
                        </button>
                        <button className="flex items-center gap-2 p-2 text-sm font-medium border border-zinc-800 rounded-lg hover:border-blue-900 ">
                            🪙 
                            <p className="px-1">{"0"}</p>
                        </button>
                        <div>
                            <WalletConnect/>
                        </div>
                        <div className="border p-2 rounded-md border-zinc-800 hover:border-blue-900 ">
                            <BellIcon size={18}/>
                        </div>
                    </div>
                </div>
            </div>
        );
}