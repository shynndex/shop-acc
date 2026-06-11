import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { useAuthStore } from "@/stores/useAuthStore";
import { useThemeStore } from "@/stores/useThemeStore";
import { useSiteConfig } from "@/hooks/usePublicSiteConfig";
import { cn, formatVND } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

import DepositDialog from "@/components/client/DepositDialog";
import {
  Home,
  CreditCard,
  History,
  Wallet,
  Search,
  Menu,
  User,
  LogOut,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  ShoppingBag,
  Bell,
  X,
  Check,
} from "lucide-react";

/* ─── Navigation Config ─── */
const navItems = [
  { label: "Trang chủ", href: "/", icon: Home },
  { label: "Nạp tiền", href: null, icon: Wallet, action: "deposit" as const },
  { label: "Lịch sử mua", href: "/me/orders", icon: ShoppingBag, query: "?tab=purchases" },
];

const userMenuItems = [
  { label: "Thông tin cá nhân", href: "/me", icon: User },
  { label: "Lịch sử mua hàng", href: "/me/orders", icon: ShoppingBag },
];

/* ─── Helpers ─── */
const getInitials = (name?: string) => {
  if (!name) return "U";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

/* ─── Theme Toggle ─── */
function ThemeToggle({ className }: { className?: string }) {
  const { mode, setMode } = useThemeStore();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn("size-9 shrink-0", className)}
          title={`Theme: ${mode}`}
        >
          {mode === "light" ? (
            <Sun className="size-4" />
          ) : mode === "dark" ? (
            <Moon className="size-4" />
          ) : (
            <Monitor className="size-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-38 p-1.5">
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 py-2 px-2"
          onClick={() => setMode("light")}
        >
          <Sun className="size-4" />
          <span className="flex-1">Sáng</span>
          {mode === "light" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 py-2 px-2"
          onClick={() => setMode("dark")}
        >
          <Moon className="size-4" />
          <span className="flex-1">Tối</span>
          {mode === "dark" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer gap-2.5 py-2 px-2"
          onClick={() => setMode("auto")}
        >
          <Monitor className="size-4" />
          <span className="flex-1">Hệ thống</span>
          {mode === "auto" && <Check className="size-3.5 text-primary" />}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ─── Balance Badge ─── */
function BalanceBadge({ balance }: { balance: number }) {
  return (
    <Badge
      variant="secondary"
      className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold bg-gradient-brand-soft text-primary border-0 cursor-default"
    >
      <CreditCard className="size-3" />
      {formatVND(balance)}đ
    </Badge>
  );
}

/* ═══════════════════════════════════════════════════════
   Main Header Component
   ═══════════════════════════════════════════════════════ */
const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuthStore();
  const { shopName, siteConfig } = useSiteConfig();

  const [logoFailed, setLogoFailed] = useState(false);
  const hasLogo = siteConfig?.logo && !logoFailed;

  const [searchQuery, setSearchQuery] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ─── Scroll detection for header shadow ─── */
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  /* ─── Search ─── */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/tai-khoan?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  /* ─── Sign out ─── */
  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setMobileOpen(false);
  };

  /* ─── Nav active check ─── */
  const isActive = (href: string) => {
    if (href === "/") return location.pathname === "/";
    return location.pathname.startsWith(href);
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300 safe-area-top",
        "glass-strong",
        scrolled && "shadow-glow-sm",
      )}
    >
      <div className="container-wrapper">
        <div className="flex h-16 items-center justify-between gap-2 sm:gap-4">
          {/* ─── Left: Logo + Mobile Menu ─── */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Mobile hamburger */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden size-9"
                  >
                    <Menu className="size-5" />
                  </Button>
                }
              />
              <SheetContent side="left" className="w-[280px] sm:w-[320px] p-0">
                <SheetHeader className="p-4 pb-3 border-b">
                  <SheetTitle>
                    {hasLogo ? (
                      <img
                        src={siteConfig.logo}
                        alt={shopName}
                        className="h-7 w-auto max-w-[120px] object-contain"
                        onError={() => setLogoFailed(true)}
                      />
                    ) : (
                      <span className="text-xl font-bold text-gradient-brand">
                        {shopName}
                      </span>
                    )}
                  </SheetTitle>
                </SheetHeader>

                <nav className="flex flex-col gap-1 p-3">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    if (item.action === "deposit") {
                      return (
                        <DepositDialog
                          key={item.label}
                          trigger={
                            <Button
                              variant="ghost"
                              className="w-full justify-start gap-3 h-11 text-sm font-medium"
                            >
                              <Icon className="size-4 text-muted-foreground" />
                              {item.label}
                            </Button>
                          }
                        />
                      );
                    }
                    return (
                      <Button
                        key={item.href}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start gap-3 h-11 text-sm font-medium",
                          item.href && isActive(item.href) && "bg-accent text-accent-foreground",
                        )}
                        onClick={() => {
                          if (item.href) navigate(item.href);
                          setMobileOpen(false);
                        }}
                      >
                        <Icon className="size-4 text-muted-foreground" />
                        {item.label}
                      </Button>
                    );
                  })}
                </nav>

                {/* Theme toggle */}
                <Separator className="my-1" />
                <div className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-sm font-medium text-muted-foreground">
                    Giao diện
                  </span>
                  <ThemeToggle />
                </div>

                {/* Mobile user section */}
                {isAuthenticated && user ? (
                  <div className="border-t p-3 space-y-2">
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="size-9">
                        {user.avatarUrl && (
                          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                        )}
                        <AvatarFallback className="bg-gradient-brand text-white text-xs font-semibold">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{user.displayName}</p>
                        {user.balance !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {formatVND(user.balance)}đ
                          </p>
                        )}
                      </div>
                    </div>
                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Button
                          key={item.href}
                          variant="ghost"
                          className="w-full justify-start gap-3 h-10 text-sm"
                          onClick={() => {
                            navigate(item.href);
                            setMobileOpen(false);
                          }}
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          {item.label}
                        </Button>
                      );
                    })}
                    <Button
                      variant="ghost"
                      className="w-full justify-start gap-3 h-10 text-sm text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                      onClick={handleSignOut}
                    >
                      <LogOut className="size-4" />
                      Đăng xuất
                    </Button>
                  </div>
                ) : (
                  <div className="border-t p-3 flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => {
                        navigate("/signin");
                        setMobileOpen(false);
                      }}
                    >
                      Đăng nhập
                    </Button>
                    <Button
                      className="flex-1 bg-gradient-brand text-white hover:bg-gradient-brand-hover"
                      onClick={() => {
                        navigate("/signup");
                        setMobileOpen(false);
                      }}
                    >
                      Đăng ký
                    </Button>
                  </div>
                )}
              </SheetContent>
            </Sheet>

            {/* Logo — image from SiteConfig, fallback to text */}
            <Link to="/" className="flex items-center gap-2 shrink-0">
              {hasLogo ? (
                <img
                  src={siteConfig.logo}
                  alt={shopName}
                  className="h-8 sm:h-9 w-auto max-w-[140px] object-contain"
                  onError={() => setLogoFailed(true)}
                />
              ) : (
                <span className="text-xl sm:text-2xl font-bold text-gradient-brand">
                  {shopName}
                </span>
              )}
            </Link>
          </div>

          {/* ─── Center: Desktop Nav ─── */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = item.href ? isActive(item.href) : false;

              if (item.action === "deposit") {
                return (
                  <DepositDialog
                    key={item.label}
                    trigger={
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-2 h-9 text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        <Icon className="size-4" />
                        {item.label}
                      </Button>
                    }
                  />
                );
              }

              return (
                <Button
                  key={item.href}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "gap-2 h-9 text-sm font-medium transition-colors",
                    active
                      ? "text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                  onClick={() => item.href && navigate(item.href)}
                >
                  <Icon className="size-4" />
                  {item.label}
                </Button>
              );
            })}
          </nav>

          {/* ─── Right: Search + Actions ─── */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Search bar */}
            <form onSubmit={handleSearch} className="hidden sm:flex relative">
              <div className="relative group">
                <Input
                  ref={searchRef}
                  type="search"
                  placeholder="Tìm kiếm..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-36 lg:w-56 h-9 pl-9 pr-3 text-sm bg-muted/50 border-transparent focus:border-primary/30 focus:bg-background focus:w-48 lg:focus:w-64 transition-all duration-300"
                />
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              </div>
            </form>

            {/* Theme toggle */}
            <ThemeToggle className="flex" />

            {/* Logged in actions */}
            {isAuthenticated && user ? (
              <>
                {/* Balance (desktop only) */}
                {user.balance !== undefined && (
                  <BalanceBadge balance={user.balance} />
                )}

                {/* Notification bell */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative size-9 hidden sm:flex"
                >
                  <Bell className="size-5" />
                  <span className="absolute top-1.5 right-1.5 size-2 bg-red-500 rounded-full" />
                </Button>

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="gap-1.5 h-9 px-1.5 sm:px-2 rounded-full"
                    >
                      <Avatar className="size-7 sm:size-8 ring-2 ring-primary/20">
                        {user.avatarUrl && (
                          <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                        )}
                        <AvatarFallback className="bg-gradient-brand text-white text-xs font-semibold">
                          {getInitials(user.displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="size-3.5 text-muted-foreground hidden sm:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 p-2">
                    <DropdownMenuLabel className="p-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10">
                          {user.avatarUrl && (
                            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
                          )}
                          <AvatarFallback className="bg-gradient-brand text-white text-sm font-semibold">
                            {getInitials(user.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm truncate">
                            {user.displayName}
                          </p>
                          {user.balance !== undefined && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              Số dư:{" "}
                              <span className="font-medium text-green-600">
                                {formatVND(user.balance)}đ
                              </span>
                            </p>
                          )}
                        </div>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />

                    {userMenuItems.map((item) => {
                      const Icon = item.icon;
                      return (
                        <DropdownMenuItem
                          key={item.href}
                          className="cursor-pointer gap-2.5 py-2.5 px-3"
                          onClick={() => navigate(item.href)}
                        >
                          <Icon className="size-4 text-muted-foreground" />
                          {item.label}
                        </DropdownMenuItem>
                      );
                    })}

                    <DropdownMenuSeparator />

                    <DropdownMenuItem
                      className="cursor-pointer gap-2.5 py-2.5 px-3 text-red-600 focus:text-red-600"
                      onClick={handleSignOut}
                    >
                      <LogOut className="size-4" />
                      Đăng xuất
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Not logged in */}
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden sm:inline-flex text-sm font-medium btn-text"
                  onClick={() => navigate("/signin")}
                >
                  Đăng nhập
                </Button>
                <Button
                  size="sm"
                  className="hidden sm:inline-flex bg-gradient-brand text-white hover:bg-gradient-brand-hover text-sm font-medium px-4 btn-text"
                  onClick={() => navigate("/signup")}
                >
                  Đăng ký
                </Button>

                {/* Mobile search toggle */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden size-9"
                  onClick={() => setMobileSearchOpen((v) => !v)}
                >
                  {mobileSearchOpen ? <X className="size-5" /> : <Search className="size-5" />}
                </Button>
              </>
            )}

            {/* Mobile search (logged in) */}
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                className="sm:hidden size-9"
                onClick={() => setMobileSearchOpen((v) => !v)}
              >
                {mobileSearchOpen ? <X className="size-5" /> : <Search className="size-5" />}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search bar — expands below header on toggle */}
      {mobileSearchOpen && (
        <div className="sm:hidden border-t px-4 py-3 glass">
          <form onSubmit={handleSearch} className="relative">
            <Input
              autoFocus
              type="search"
              placeholder="Tìm kiếm theo tên, game..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-3 text-sm bg-muted/50"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          </form>
        </div>
      )}
    </header>
  );
};

export default Header;
