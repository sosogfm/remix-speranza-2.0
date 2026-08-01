# Avaliações, preços por tamanho, descontos e admin completo

## 1. Avaliações na homepage (carrossel automático)
- Nova área de "Avaliações" no admin: subir imagens de prints de avaliações (nome opcional, ordem, ativo/inativo), excluir e reordenar.
- Na homepage, uma faixa que desliza sozinha para o lado (marquee contínuo, pausa ao passar o mouse), só com as imagens. Nada de estrelas ou texto longo.

## 2. Preço próprio por tamanho (sem "+ acréscimo")
- Nos campos do tipo **Tamanho**, cada opção passa a ter **preço final** (e não acréscimo) e, opcionalmente, **imagem própria**.
- Na página do produto:
  - Ao escolher um tamanho, o preço exibido vira o preço daquela opção (ex.: Urso P → R$ X), sem "inclui R$ Y de personalização".
  - A imagem principal troca para a foto daquele tamanho, quando houver.
  - Enquanto nada estiver selecionado, mostra "A partir de" com o menor preço das opções.
- No carrinho/checkout, o item entra com o preço final do tamanho escolhido; os demais extras (ouro, borda etc.) continuam somando normalmente.
- No admin, ao criar um campo Tamanho, o formato passa a ser `Nome = preço final` + campo de imagem por opção.

## 3. Descontos com data e hora
- Cada produto ganha: preço promocional, início e fim da promoção.
- Na vitrine e na página do produto: preço antigo riscado, preço novo em destaque e selo "Oferta".
- Promoção liga/desliga sozinha pelo horário definido.
- Em /produtos, novos filtros no topo: **Com desconto** e **Últimas unidades** (estoque baixo, limite configurável — padrão 3), com selo "Últimas unidades" no card.

## 4. Detalhes editáveis do produto (prazos, envio, retirada…)
- Os blocos fixos hoje escritos no código (prazo de produção, envio, retirada, queima, cuidados) viram itens de conteúdo editáveis no admin: criar, editar, reordenar e excluir.
- Podem ser globais (valem para todas as peças) ou específicos de uma peça.

## 5. Admin de oficinas e eventos privativos
- **Criar oficina** com todos os campos: título, resumo, descrição, imagem, data, horários, local, professora, valor, vagas, esmaltação, lista de espera, publicada.
- **Editar** título e todos os detalhes de uma oficina existente (hoje só dá para mexer em vagas/valores).
- **Excluir** oficina.
- **Autoexclusão**: oficinas com data já passada saem do site automaticamente e são removidas depois de um período de carência (7 dias), mantendo as inscrições no histórico. Rotina diária automática.
- **Eventos privativos**: editar a lista de tipos de experiência oferecidos (criar, renomear, remover, ordenar), refletindo direto no formulário público.
- **Produtos**: editar nome (e slug) direto na tabela do admin.

## Detalhes técnicos
- Banco: nova tabela `reviews` (imagem, ordem, ativo); nova tabela `product_info_blocks` (título, texto, ordem, `product_id` nulo = global); nova tabela `private_event_experiences`; colunas em `products`: `sale_price_cents`, `sale_starts_at`, `sale_ends_at`, `low_stock_threshold`; coluna `option_images jsonb` em `product_personalization_fields`; semântica de `option_prices` para `size` passa a ser preço absoluto (flag `size_prices_absolute` no campo para não quebrar dados atuais — os campos existentes serão convertidos na migração).
- Bucket público novo para imagens de avaliações e de opções/tamanhos; upload pelo admin.
- Limpeza automática de oficinas vencidas via job agendado (pg_cron) chamando uma função no banco.
- Preço efetivo calculado num helper único (`effectivePriceCents`) usado em card, detalhe, carrinho e checkout.
- Frontend: `src/components/ReviewsMarquee.tsx`, painéis novos em `src/components/admin/`, ajustes em `ProductDetail.tsx`, `ProductCard.tsx`, `Products.tsx`, `useProducts.ts`, `usePersonalization.ts`, `PrivateEventPanel.tsx`.
