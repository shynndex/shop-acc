import React from "react";
import { Button } from "../../ui/button";
import {
  Bell,
  CreditCard,
  Eye,
  History,
  LogOut,
  Menu,
  Search,
  User,
} from "lucide-react";
import { Input } from "../../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../../ui/avatar";
import { Link, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../ui/dropdown-menu";
import { Badge } from "../../ui/badge";
import DepositDialog from "../DepositDialog";

const Header = () => {
  const navigate = useNavigate();
  const { user, signOut, accessToken } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      ?.split(" ")
      .map((n) => n[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur support-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* logo và menu */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold bg-gradient-to-r from-cyan-500 via-orange-500 to-cyan-500 bg-clip-text text-transparent">
              <Link to="/">ShopSamcc</Link>
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
          <DepositDialog
            trigger={
              <Button className={"bg-blue-600 hover:bg-blue-700"}>
                Nạp tiền
              </Button>
            }
          />
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="size-5" />
            <span className="absolute -top-1 -right-1 size-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
              3
            </span>
          </Button>
          {accessToken && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Avatar className="size-9 cursor-pointer ring-2 ring-transparent hover:ring-blue-500 transition-all">
                  {user.avatarUrl && (
                    <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                  )}

                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white font-semibold">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="center" className={"w-40 space-y-2"}>
                {/* User Info Header */}
                <DropdownMenuLabel
                  className={"flex flex-col gap-1 pb-2 border-b"}
                >
                  <span className="font-semibold text-sm">
                    {user.displayName}
                  </span>
                  {user.balance !== undefined && (
                    <Badge variant={"secondary"} className="w-fit mt-1">
                      <CreditCard className="size-3 mr-1">
                        {user.balance.toLocaleString("vi-VN")}đ
                      </CreditCard>
                    </Badge>
                  )}
                </DropdownMenuLabel>

                {/* Menu Items */}
                <DropdownMenuItem
                  className={"cursor-pointer gap-2"}
                  onClick={() => navigate("/me")}
                >
                  <User className="size-4" />
                  Thông tin cá nhân
                </DropdownMenuItem>

                <DropdownMenuItem
                  className={"cursor-pointer gap-2"}
                  onClick={() => navigate("/me/orders")}
                >
                  <History className="size-4" />
                  Lịch sử mua nick
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                  className={
                    "cursor-pointer gap-2 text-red-600 focus:text-red-600"
                  }
                  onClick={handleSignOut}
                >
                  <LogOut className="size-4" />
                  Đăng xuất
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Button variant={"ghost"} onClick={() => navigate("/signin")}>
                Đăng nhập
              </Button>
              <Button
                onClick={() => navigate("/signup")}
                className={"bg-blue-600 hover:bg-blue-700"}
              >
                Đăng ký
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
