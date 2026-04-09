import React from "react";
import Header from "./Header";
import { Outlet } from "react-router-dom";
import { Footer } from "./Footer";

const AppLayout = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="container mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
};

export default AppLayout;
