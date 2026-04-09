import React from "react";
import { Button } from "../ui/button";
import { Bell, Eye, Menu, Search, User } from "lucide-react";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur support-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* logo và menu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-orange-500 to-cyan-500 bg-clip-text text-transparent">
              ShopSamcc
            </span>
          </div>

          <nav className="hidden md:flex items-center gap-4">
            <Button variant={"ghost"} size={"sm"} className={"gap-2"}>
              <Menu className="size-4" />
              Danh mục
            </Button>
            <Button variant="ghost" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              Đã xem
            </Button>
          </nav>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <Input
              type="search"
              placeholder="Tìm kiếm theo tên skin,tướng"
              className="w-full bg-muted/50 pr-10"
            />
            <Button
              size={"icon"}
              variant={"ghost"}
              className={"absolute right-1 top-1 size-8"}
            >
              <Search className="size-4"></Search>
            </Button>
          </div>
        </div>

        {/* User Actions */}
        <div className="flex items-center gap-3">
          <Button className={"bg-blue-600 hover:bg-blue-700"}>Nạp tiền</Button>
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>
          <Avatar className="size-9 cursor-pointer">
            <AvatarImage src="/" alt="User" />
            <AvatarFallback>
              <User className="size-4" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};

export default Header;
