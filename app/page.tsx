"use client";
import {motion}  from "framer-motion";
import { Appbar } from "./Components/Appbar";

export default function Home() {
  return (
    <div>
      <motion.div
        initial={{ y: -250 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 50}}
      >
        <Appbar/>
      </motion.div>
      <div>

      </div>
    </div>
  );
}
