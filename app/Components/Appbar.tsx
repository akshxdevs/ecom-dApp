import { SiWeb3Dotjs } from "react-icons/si";
import localFont from "next/font/local";
import WalletConnect from "./WalletConnect";
import { Wallet } from "lucide-react";

const alone = localFont({
  src: '../fonts/Ventus/Ventus Italic.otf',
});
export const Appbar = () => {
    return (
        <div className="max-w-5xl w-full mx-auto py-4 px-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <SiWeb3Dotjs size={70} color="red"/>
                    <h1 className={`font-bold text-2xl`}>E-com DApp</h1>
                </div>
                <div className="flex items-center gap-2">
                    <Wallet/>
                    <WalletConnect/>
                </div>
            </div>
        </div>
    );
}