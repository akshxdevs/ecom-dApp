"use client";
import { useEffect, useState } from "react";

export default function(){
    const [totalAmount,setTotalAmount] = useState<number>(0);
    useEffect(()=>{
        if(localStorage.getItem("totalAmount")){
            setTotalAmount(Number(localStorage.getItem("totalAmount")));
        }else{
            console.log("No total amount found");
            setTotalAmount(0);
        } 
    },[])
    return(
        <div>
            Total Amount:{totalAmount}$
        </div>
    );
}