import { Button } from "@/components/ui/button";
import React from "react";
import { Link, useNavigate } from "react-router";

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="h-screen bg-white flex items-center justify-center px-5 lg:px-0">
      <div className="w-[415px] text-center mx-auto flex flex-col items-center gap-[100px]">
        {/* Image */}
        <div className="mb-8 md:mb-[56px]">
          <div className="w-full h-[160px] relative flex justify-center items-center mx-auto">
            <img
              src="../../public/404.jpg"
              alt="404"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-4xl md:text-[56px] leading-[64px] text-[#1A1C16]">
          Page Not Found
        </h3>

        {/* Description + Button */}
        <div className="flex flex-col gap-6 mt-3">
          <p className="text-base leading-6 tracking-wider">
            The page you are looking for might have been removed, had its name
            changed or is temporarily unavailable.
          </p>

          <Link to="/">
            <button className="bg-[#8AC732] text-white max-w-[146px] w-full h-[48px] rounded-full font-medium text-sm">
              Home Page
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;
