"use client";

import React, { useEffect } from "react";
import Sidebar from "@/components/sidebar/Sidebar";
import Header from "@/components/header/Header";
import Screen1Import from "@/components/screens/Screen1Import";
import Screen2Timeline from "@/components/screens/Screen2Timeline";
import Screen3Captions from "@/components/screens/Screen3Captions";
import Screen4Customize from "@/components/screens/Screen4Customize";
import Screen5Export from "@/components/screens/Screen5Export";
import Screen6DownloadCenter from "@/components/screens/Screen6DownloadCenter";
import { useClipStore } from "@/stores/clipStore";

export default function Home() {
  const { currentStep } = useClipStore();

  return (
    <div className="flex min-h-screen bg-[#0B0C15] text-[#F1F5F9]">
      {/* Fixed Left Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header />

        <main className="flex-1 pb-16 overflow-y-auto">
          {currentStep === 1 && <Screen1Import />}
          {currentStep === 2 && <Screen2Timeline />}
          {currentStep === 3 && <Screen3Captions />}
          {currentStep === 4 && <Screen4Customize />}
          {currentStep === 5 && <Screen5Export />}
          {currentStep === 6 && <Screen6DownloadCenter />}
        </main>
      </div>
    </div>
  );
}
