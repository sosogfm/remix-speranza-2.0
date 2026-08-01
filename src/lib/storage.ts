import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const SITE_BUCKET = "site-images";

const isExternal = (p: string) => /^https?:\/\//i.test(p);

/** Gera URLs assinadas para caminhos do bucket privado de imagens do site. */
export const useSignedUrls = (paths: string[], bucket = SITE_BUCKET) => {
  const key = paths.slice().sort().join("|");
  return useQuery({
    queryKey: ["signed-urls", bucket, key],
    enabled: paths.length > 0,
    staleTime: 1000 * 60 * 30,
    queryFn: async (): Promise<Record<string, string>> => {
      const map: Record<string, string> = {};
      const internal: string[] = [];
      paths.forEach((p) => {
        if (!p) return;
        if (isExternal(p)) map[p] = p;
        else internal.push(p);
      });
      if (internal.length) {
        const { data } = await supabase.storage
          .from(bucket)
          .createSignedUrls(internal, 60 * 60);
        (data ?? []).forEach((d: any) => {
          if (d?.path && d?.signedUrl) map[d.path] = d.signedUrl;
        });
      }
      return map;
    },
  });
};

/** Envia um arquivo para o bucket do site e devolve o caminho salvo. */
export const uploadSiteImage = async (file: File, folder: string) => {
  const path = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const { error } = await supabase.storage.from(SITE_BUCKET).upload(path, file);
  if (error) throw error;
  return path;
};
