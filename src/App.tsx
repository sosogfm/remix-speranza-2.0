import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";
import { AuthProvider } from "./hooks/useAuth";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import Workshops from "./pages/Workshops";
import WorkshopDetail from "./pages/WorkshopDetail";
import WorkshopCheckout from "./pages/WorkshopCheckout";
import Account from "./pages/Account";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/produtos" element={<Products />} />
            <Route path="/produto/:slug" element={<ProductDetail />} />
            <Route path="/sobre" element={<About />} />
            <Route path="/sacola" element={<Cart />} />
            <Route path="/finalizar" element={<Checkout />} />
            <Route path="/oficinas" element={<Workshops />} />
            <Route path="/oficinas/pagamento/:registrationId" element={<WorkshopCheckout />} />
            <Route path="/oficinas/:slug" element={<WorkshopDetail />} />
            <Route path="/minha-conta" element={<Account />} />
            <Route path="/pedido/:id" element={<OrderConfirmation />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/admin" element={<Admin />} />

            {/* Rotas antigas em inglês */}
            <Route path="/products" element={<Navigate to="/produtos" replace />} />
            <Route path="/product/:slug" element={<ProductDetail />} />
            <Route path="/about" element={<Navigate to="/sobre" replace />} />
            <Route path="/cart" element={<Navigate to="/sacola" replace />} />
            <Route path="/checkout" element={<Navigate to="/finalizar" replace />} />

            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
