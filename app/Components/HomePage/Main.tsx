"use client";
import { ShoppingCart } from "lucide-react"
import { Products } from "./Products"
import { useRouter } from "next/navigation"

export const Main = () => {
    const router = useRouter();
    return <div className="p-16">
        <div className="flex justify-between py-5">
            <div>
                <h1>Products</h1>
            </div>
            <div>
                <button onClick={()=>router.push("/cart")} className="cursor-pointer"><ShoppingCart/></button>
            </div>
        </div>
        <Products/>
    </div>
}