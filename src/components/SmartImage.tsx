import { ImgHTMLAttributes } from "react";
import { useSignedUrls } from "@/lib/storage";

interface Props extends ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
}

/**
 * <img> que entende tanto URLs externas quanto caminhos do bucket privado
 * de imagens do site (gera a URL assinada automaticamente).
 */
export const SmartImage = ({ src, ...rest }: Props) => {
  const path = src ?? "";
  const isExternal = /^(https?:|data:|blob:|\/)/i.test(path);
  const { data: signed = {} } = useSignedUrls(isExternal || !path ? [] : [path]);
  const resolved = isExternal ? path : signed[path];
  return <img {...rest} src={resolved || undefined} />;
};
