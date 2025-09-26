import { SiWeb3Dotjs } from "react-icons/si";

export const Appbar = () => {
    return (
        <div className="max-w-5xl w-full mx-auto py-4 px-2">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <SiWeb3Dotjs size={70} color="red"/>
                    <h1 className="font-bold text-2xl">E-com DApp</h1>
                </div>
                <div>
                    <button className="bg-purple-700 rounded-md px-4 py-2 text-slate-100 font-semibold">Connect Wallet</button>
                </div>
            </div>
        </div>
    );
}