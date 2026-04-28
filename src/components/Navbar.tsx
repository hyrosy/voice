import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HashLink } from "react-router-hash-link";
import {
  Menu,
  Home,
  Users,
  Package,
  Phone,
  Youtube,
  GalleryHorizontalEnd,
  BracesIcon,
  AudioLinesIcon,
  MegaphoneIcon,
  LogIn,
  UserCircle,
  UserCheck,
  Heart,
  LayoutDashboard,
  LogOut,
  Loader2,
} from "lucide-react";

// --- Local Components ---
import LanguageSwitcher from "./LanguageSwitcher";
import ThemeToggle from "./ThemeToggle";
import { cn } from "@/lib/utils";

// --- shadcn/ui Component Imports ---
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// ----------------------------------------------------------------------
// 🚨 MOCK AUTH HOOK: Replace this with your actual Supabase Auth context
// Example: import { useAuth } from '@/context/AuthContext';
// ----------------------------------------------------------------------
const useAuth = () => {
  // Toggle these to test different states:
  return {
    user: null, // Set to { name: "Alex" } to test logged-in state
    role: null as "actor" | "client" | null, // 'actor' or 'client'
    isLoading: false,
    signOut: async () => console.log("Signed out"),
  };
};

// --- Data Arrays ---
const allMenuItems = [
  { icon: Home, label: "Home", to: "/", type: "link" },
  { icon: AudioLinesIcon, label: "Voice Over", to: "/voiceover", type: "link" },
  {
    icon: Youtube,
    label: "Cinematography",
    to: "/cinema-portfolio",
    type: "link",
  },
  {
    icon: BracesIcon,
    label: "Software Development",
    to: "/software-development",
    type: "link",
  },
  {
    icon: MegaphoneIcon,
    label: "Digital Marketing",
    to: "/digital-marketing",
    type: "link",
  },
  {
    icon: GalleryHorizontalEnd,
    label: "Gallery Room",
    to: "/portfolio",
    type: "link",
  },
  { icon: Package, label: "Packages", to: "/#packages", type: "hash" },
  { icon: Users, label: "Team", to: "/members", type: "link" },
  { icon: Phone, label: "Contact Us", to: "/contact", type: "link" },
  { icon: Heart, label: "My Shortlist", to: "/my-shortlist", type: "link" },
];

const serviceDropdownItems = [
  { label: "Voice Over", to: "/voiceover" },
  { label: "Cinematography", to: "/cinema-portfolio" },
  { label: "Software Development", to: "/software-development" },
  { label: "Digital Marketing", to: "/digital-marketing" },
];

const desktopNavLinks = [
  { label: "Gallery", to: "/portfolio", type: "link" as const },
  { label: "Packages", to: "/#packages", type: "hash" as const },
  { label: "Shortlist", to: "/my-shortlist", type: "link" as const },
  { label: "Team", to: "/members", type: "link" as const },
  { label: "Contact", to: "/contact", type: "link" as const },
];

// --- Helper Component for Dropdown Links ---
const ListItem = React.forwardRef<
  React.ElementRef<"a">,
  React.ComponentPropsWithoutRef<"a">
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            "block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground",
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Bring in Auth State
  const { user, role, isLoading, signOut } = useAuth();

  // AAA+ Performance Scroll Listener
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          setIsScrolled(window.scrollY > 20);
          ticking = false;
        });
        ticking = true;
      }
    };

    handleScroll(); // Set initial state
    // Passive flag ensures scrolling remains buttery smooth
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  return (
    <nav
      aria-label="Main Navigation"
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 ease-in-out",
        isScrolled
          ? "bg-background/80 backdrop-blur-xl shadow-sm border-b py-3"
          : "bg-transparent py-4"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0" aria-label="Go to homepage">
            <img
              src="https://ucpmarocgo.s3.us-east-1.amazonaws.com/logo-ucp-maroc.png"
              alt="UCP Maroc Logo"
              className="w-32 md:w-48 transition-transform duration-300 hover:scale-105"
            />
          </Link>

          {/* Desktop Menu Center */}
          <div className="hidden lg:flex items-center gap-1">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <Link to="/" className={navigationMenuTriggerStyle()}>
                    Home
                  </Link>
                </NavigationMenuItem>

                <NavigationMenuItem>
                  <NavigationMenuTrigger>Services</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-56 p-2">
                      {serviceDropdownItems.map((item) => (
                        <ListItem
                          key={item.label}
                          href={item.to}
                          title={item.label}
                        />
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>

                {desktopNavLinks.map((item) => {
                  const LinkComponent = item.type === "hash" ? HashLink : Link;
                  return (
                    <NavigationMenuItem key={item.label}>
                      <LinkComponent
                        to={item.to}
                        className={navigationMenuTriggerStyle()}
                      >
                        {item.label}
                      </LinkComponent>
                    </NavigationMenuItem>
                  );
                })}
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Desktop Auth & Actions */}
            <div className="hidden lg:flex items-center gap-2">
              <LanguageSwitcher />

              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground ml-2" />
              ) : user ? (
                // --- LOGGED IN STATE (DESKTOP) ---
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className="relative h-10 w-10 rounded-full border border-border/50 hover:bg-accent focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    >
                      <Avatar className="h-9 w-9">
                        <AvatarImage
                          src={(user as any)?.avatar_url}
                          alt="Profile"
                        />
                        <AvatarFallback className="bg-primary/10 text-primary font-medium">
                          {(user as any)?.name?.charAt(0) || (
                            <UserCircle className="h-5 w-5" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">
                          {(user as any)?.name || "My Account"}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground capitalize">
                          {role || "User"} Portal
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link
                        to={
                          role === "actor" ? "/dashboard" : "/client-dashboard"
                        }
                        className="cursor-pointer"
                      >
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </Link>
                    </DropdownMenuItem>
                    {role === "client" && (
                      <DropdownMenuItem asChild>
                        <Link to="/my-shortlist" className="cursor-pointer">
                          <Heart className="mr-2 h-4 w-4" />
                          <span>My Shortlist</span>
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleSignOut}
                      className="text-red-500 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                // --- LOGGED OUT STATE (DESKTOP) ---
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button className="rounded-full shadow-sm hover:shadow-md transition-all">
                      <LogIn size={16} className="mr-2" />
                      My Account
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-48" align="end">
                    <DropdownMenuItem asChild>
                      <Link
                        to="/client-dashboard"
                        className="flex items-center gap-3 w-full cursor-pointer"
                      >
                        <UserCircle size={16} className="text-primary" />
                        Client Portal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to="/dashboard"
                        className="flex items-center gap-3 w-full cursor-pointer"
                      >
                        <UserCheck
                          size={16}
                          className="text-muted-foreground"
                        />
                        Talent Portal
                      </Link>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex lg:hidden items-center gap-2">
              <LanguageSwitcher />

              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="Open mobile menu"
                    className="rounded-full"
                  >
                    <Menu size={20} />
                  </Button>
                </SheetTrigger>
                <SheetContent
                  side="right"
                  className="w-80 max-w-[85vw] flex flex-col p-0"
                >
                  <SheetHeader className="px-6 pt-5 pb-4 border-b text-left">
                    <SheetTitle className="text-xl font-bold tracking-tight">
                      Navigation
                    </SheetTitle>
                  </SheetHeader>

                  <ScrollArea className="flex-1">
                    <div className="p-4">
                      <ul className="space-y-1">
                        {allMenuItems.map((item) => {
                          const IconComponent = item.icon;
                          const LinkComponent =
                            item.type === "hash" ? HashLink : Link;
                          return (
                            <li key={item.label}>
                              <Button
                                asChild
                                variant="ghost"
                                className="w-full justify-start gap-4 p-3 h-auto rounded-lg hover:bg-accent"
                              >
                                <LinkComponent
                                  to={item.to}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                >
                                  <IconComponent
                                    size={18}
                                    className="text-primary/80"
                                  />
                                  <span className="font-medium text-[15px]">
                                    {item.label}
                                  </span>
                                </LinkComponent>
                              </Button>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </ScrollArea>

                  {/* Mobile Footer Auth Section */}
                  <div className="p-6 mt-auto border-t bg-muted/20">
                    {isLoading ? (
                      <div className="flex justify-center p-4">
                        <Loader2 className="animate-spin text-primary" />
                      </div>
                    ) : user ? (
                      // --- LOGGED IN MOBILE ---
                      <div className="space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                          <Avatar className="h-10 w-10 border border-border">
                            <AvatarImage src={(user as any)?.avatar_url} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {(user as any)?.name?.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold leading-none">
                              {(user as any)?.name}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize mt-1">
                              {role} Portal
                            </span>
                          </div>
                        </div>

                        <Button
                          asChild
                          className="w-full rounded-full"
                          size="lg"
                        >
                          <Link
                            to={
                              role === "actor"
                                ? "/dashboard"
                                : "/client-dashboard"
                            }
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <LayoutDashboard size={18} className="mr-2" />
                            Go to Dashboard
                          </Link>
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full rounded-full text-red-500 hover:text-red-600 hover:bg-red-50"
                          size="lg"
                          onClick={handleSignOut}
                        >
                          <LogOut size={18} className="mr-2" />
                          Sign Out
                        </Button>
                      </div>
                    ) : (
                      // --- LOGGED OUT MOBILE ---
                      <div className="space-y-3">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                          Access Portals
                        </h4>
                        <Button
                          asChild
                          className="w-full rounded-full shadow-sm"
                          size="lg"
                        >
                          <Link
                            to="/client-auth"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <UserCircle size={18} className="mr-2" />
                            Client Login
                          </Link>
                        </Button>
                        <Button
                          asChild
                          variant="secondary"
                          className="w-full rounded-full"
                          size="lg"
                        >
                          <Link
                            to="/actor-login"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            <UserCheck size={18} className="mr-2" />
                            Talent Login
                          </Link>
                        </Button>

                        <Separator className="my-4" />

                        <Button
                          asChild
                          variant="outline"
                          className="w-full rounded-full"
                          size="lg"
                        >
                          <Link
                            to="/customized-package"
                            onClick={() => setIsMobileMenuOpen(false)}
                          >
                            Customized Package
                          </Link>
                        </Button>
                      </div>
                    )}
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
