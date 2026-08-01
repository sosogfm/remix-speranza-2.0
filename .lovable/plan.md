# Ajustes de imagens, categorias e vitrine

## 1. Imagens de fundo (troca manual)
Nada de painel no admin. As fotos de fundo hoje estão espalhadas pelo código; vou juntar todas em **um único arquivo** (`src/data/images.ts`), com nomes claros (`homeHero`, `sobreHero`, `sobreBloco1`, etc.). Para trocar, basta substituir o link/arquivo nesse arquivo — ou me pedir a troca.

## 2. Home
- Remover o "Role" e a setinha do topo.
- Subir a faixa de avaliações na página (menos espaço acima).

## 3. Avaliações
- Altura fixa para todos os cards (a largura se ajusta à proporção de cada imagem), com cantos arredondados.

## 4. Instagram automático
A grade de fotos abaixo de "Bastidores do ateliê" hoje é fixa. Vou fazê-la puxar os posts reais do Instagram da Júlia e atualizar sozinha (cache de algumas horas). Isso exige uma conexão com o Instagram: preciso de um **token de acesso da conta profissional** (Instagram/Facebook). Vou montar a função no servidor e, na hora, peço o token pelo formulário seguro — se não houver token, a grade continua com as fotos atuais.

## 5. Oficinas
Continuam com data **e** horários, como estão. O que muda é o admin de **descontos das peças**: as datas de início/fim do desconto passam a ser **só data, sem horário** (e o campo fica mais largo para dar para ler).

## 6. Categorias
- Painel para **criar, renomear e excluir categorias**.
- Uma peça pode ficar em **mais de uma categoria**.
- Categorias sempre em **ordem alfabética** automática (filtros da loja, rodapé, admin).

## 7. Vitrine das peças
- Selo de oferta vira uma faixa **horizontal no canto superior direito** com a porcentagem (ex.: "-20%").
- Peças com mais de uma foto mantêm a **troca no hover**, mas com a segunda imagem **deslizando para o lado**, sem gradiente nem fade.

## Detalhes técnicos
- `src/data/images.ts` centraliza as URLs de fundo; `Index.tsx`/`About.tsx`/demais páginas passam a importar de lá.
- Banco: tabela de ligação `product_categories` (produto ↔ categoria) com migração dos vínculos atuais de `products.category_id`; `useProducts` traz a lista de categorias e o filtro de `Products.tsx` considera qualquer uma; `collections` deixa de ser lista fixa e vem do banco ordenada por nome.
- `ProductCard`: badge calculado de `sale_price_cents` vs `price_cents`; segunda imagem em `translate-x` no hover, removendo o overlay em gradiente e o fade.
- Instagram: edge function `instagram-feed` chamando a Graph API com token guardado como segredo, cache no cliente via React Query.
- `AdminProductSale`: inputs `type="date"` (sem hora) e largura maior.
