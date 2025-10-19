"use client";
import { Appbar } from "./Components/Appbar";
import { Main } from "./Components/HomePage/Main";

export default function Home() {
  return (
    <div>
      <div>
        <Appbar/>
      </div>
      <div>
        <Main/>
      </div>
    </div>
  );
}
