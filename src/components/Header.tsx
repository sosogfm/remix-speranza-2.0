import { Link, useNavigate, useLocation } from "react-router-dom";
import { Heart, Menu, X, Instagram, MessageCircle, Link2 } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useWishlistIds } from "@/hooks/useWishlist";
import { useAuth } from "@/hooks/useAuth";

import { CartIcon } from "@/components/CartIcon";
import { collections } from "@/data/products";
import { site } from "@/data/site";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

const navLinkClass =
  "text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground transition-colors duration-300 link-underline";

export const Header = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { data: wishlistIds = [] } = useWishlistIds();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const goToFavorites = () => {
    if (!user) {
      navigate(`/auth?redirect=${encodeURIComponent("/minha-conta")}`);
      return;
    }
    navigate("/minha-conta");
  };

  const links = [
    { to: "/produtos", label: "Loja" },
    { to: "/oficinas", label: "Oficinas" },
    { to: "/sobre", label: "SOBRE" },
  ];

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-500",
        scrolled
          ? "bg-background/95 backdrop-blur-md border-b border-border shadow-sm"
          : "bg-background/80 backdrop-blur-sm border-b border-transparent"
      )}
    >
      <nav className="container-full">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link
            to="/"
            className="font-serif text-2xl md:text-3xl tracking-tight text-foreground hover:text-primary transition-colors duration-300"
          >
            {site.name}
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-transparent text-xs font-medium tracking-[0.15em] uppercase text-muted-foreground hover:text-foreground">
                    Categorias
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-1 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                      {collections.map((collection) => (
                        <li key={collection.id}>
                          <NavigationMenuLink asChild>
                            <Link
                              to={`/produtos?colecao=${collection.slug}`}
                              className="block select-none space-y-1 rounded-sm p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                              <div className="text-sm font-medium leading-none">
                                {collection.name}
                              </div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                {collection.description}
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>

            {links.map((l) => (
              <Link key={l.to} to={l.to} className={navLinkClass}>
                {l.label}
              </Link>
            ))}

            {isAdmin && (
              <Link
                to="/admin"
                className="text-xs font-medium tracking-[0.15em] uppercase text-primary hover:text-foreground transition-colors duration-300 link-underline"
              >
                Admin
              </Link>
            )}

            <Link
              to={user ? "/minha-conta" : `/auth?redirect=${encodeURIComponent(location.pathname)}`}
              className={navLinkClass}
            >
              {user ? "Minha conta" : "Entrar"}
            </Link>
          </div>

          <div className="flex items-center gap-1">
            <a
              href={site.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram do ateliê"
              className="hidden sm:inline-flex p-2 hover:bg-accent transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={site.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp do ateliê"
              className="hidden sm:inline-flex p-2 hover:bg-accent transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>

            <button
              onClick={goToFavorites}
              aria-label="Meus favoritos"
              className="relative p-2 hover:bg-accent transition-colors duration-300 group"
            >
              <Heart className="w-5 h-5 transition-transform duration-300 group-hover:scale-110" />
              <AnimatePresence>
                {wishlistIds.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-primary-foreground text-[10px] font-semibold rounded-full flex items-center justify-center"
                  >
                    {wishlistIds.length > 9 ? "9+" : wishlistIds.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>

            <CartIcon />

            <button
              className="md:hidden p-2 hover:bg-accent transition-colors duration-300"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Abrir menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35 }}
              className="md:hidden border-t border-border overflow-hidden"
            >
              <div className="py-5 flex flex-col gap-4">
                {links.map((l) => (
                  <Link
                    key={l.to}
                    to={l.to}
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm tracking-[0.15em] uppercase text-muted-foreground"
                  >
                    {l.label}
                  </Link>
                ))}
                {isAdmin && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="text-sm tracking-[0.15em] uppercase text-primary"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  to={user ? "/minha-conta" : "/auth"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-sm tracking-[0.15em] uppercase text-muted-foreground"
                >
                  {user ? "Minha conta" : "Entrar"}
                </Link>
                <div className="flex items-center gap-4 pt-2">
                  <a href={site.instagram} target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href={site.whatsapp} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp">
                    <MessageCircle className="w-5 h-5" />
                  </a>
                  <a href={site.linktree} target="_blank" rel="noopener noreferrer" aria-label="Linktree">
                    <Link2 className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
};
