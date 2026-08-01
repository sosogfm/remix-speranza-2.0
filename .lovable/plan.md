# Ajustes de imagens, categorias e vitrine

## 1. Imagens de fundo das abas (hoje não dá para trocar)
As imagens grandes de topo da home, do Sobre e das outras abas estão fixas no código (fotos de banco de imagens). Vou criar um painel no admin **"Imagens do site"** onde você faz upload da foto de cada fundo:

- Home (topo), Sobre (topo e blocos internos), Oficinas, Peças.
- Upload direto para o armazenamento do site, com prévia e botão de trocar/remover.
- Se nenhuma imagem for enviada, continua a imagem atual como padrão.

## 2. Home
- Remover o "Role" e a setinha do rodapé do topo.
- Subir a faixa de avaliações (menos espaço acima e posição mais alta na página).

## 3. Oficinas com data sem horário
- Início e término passam a ser opcionais: se ficarem vazios, a oficina mostra só a data, sem "às 14:00".

## 4. Categorias
- Novo painel para **criar, renomear e excluir categorias** no admin.
- Uma peça pode ficar em **mais de uma categoria** (seleção múltipla no cadastro e na edição).
- Categorias aparecem sempre em **ordem alfabética** automaticamente (filtros da loja, rodapé, admin) — sem precisar arrastar ordem.

## 5. Vitrine das peças
- Selo de oferta vira uma faixa **horizontal no canto superior direito** com a porcentagem (ex.: "-20%").
- Peças com mais de uma foto passam as imagens **sozinhas, deslizando para o lado**, sem o efeito de troca no hover.

## Detalhes técnicos
- Banco: tabela `site_images` (chave + caminho da imagem) com leitura pública e escrita só para admin; tabela de ligação `product_categories` (produto ↔ categoria) com migração dos vínculos atuais de `products.category_id`, mantendo a coluna antiga como categoria principal para compatibilidade.
- Consultas de produto (`useProducts`) passam a trazer a lista de categorias; filtro em `Products.tsx` considera qualquer categoria da peça; `collections` deixa de ser lista fixa e passa a vir do banco ordenada por nome.
- `ProductCard`: badge de desconto calculado de `sale_price_cents` vs `price_cents`; carrossel automático (intervalo ~4s) quando houver 2+ imagens.
- `Index.tsx`/`About.tsx`/`Workshops.tsx` leem os fundos de `site_images` via novo hook em `useSiteContent.ts`, com fallback para as URLs atuais.
