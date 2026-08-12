import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) navigate("/");
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível entrar", description: error.message, variant: "destructive" });
      return;
    }
    navigate("/");
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: name },
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Não foi possível criar a conta", description: error.message, variant: "destructive" });
      return;
    }
    if (!data.session) {
      toast({
        title: "Confirme seu e-mail",
        description: "Enviamos um link de confirmação para o seu e-mail.",
      });
    }
  };

  const handleGoogle = async () => {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast({ title: "Erro no login com Google", variant: "destructive" });
      return;
    }
    if (result.redirected) return;
    navigate("/");
  };

  return (
    <Layout>
      <Seo
        title="Entrar | Speranza Ateliê"
        description="Acesse sua conta do Speranza Ateliê."
        path="/auth"
        noindex
      />
      <section className="py-14 md:py-20">
        <div className="container-narrow max-w-md">
          <h1 className="font-serif text-4xl mb-8 text-center">Minha conta</h1>

          <Tabs defaultValue="signin">
            <TabsList className="w-full rounded-none">
              <TabsTrigger value="signin" className="flex-1 rounded-none">Entrar</TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 rounded-none">Criar conta</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="si-email">E-mail</Label>
                  <Input id="si-email" type="email" required className="rounded-none" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="si-pass">Senha</Label>
                  <Input id="si-pass" type="password" required className="rounded-none" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase">
                  Entrar
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-5 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="su-name">Nome</Label>
                  <Input id="su-name" required className="rounded-none" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-email">E-mail</Label>
                  <Input id="su-email" type="email" required className="rounded-none" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="su-pass">Senha</Label>
                  <Input id="su-pass" type="password" required minLength={6} className="rounded-none" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <Button type="submit" disabled={loading} className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase">
                  Criar conta
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="flex items-center gap-4 my-8">
            <span className="flex-1 h-px bg-border" />
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">ou</span>
            <span className="flex-1 h-px bg-border" />
          </div>

          <Button onClick={handleGoogle} variant="outline" className="w-full rounded-none h-12 text-sm tracking-[0.15em] uppercase">
            Continuar com Google
          </Button>
        </div>
      </section>
    </Layout>
  );
};

export default Auth;
