# Oficinas com horário e duração + gestão de imagens das peças

## Oficinas: horário, duração e local

- Campos ao criar e ao editar uma oficina: data, horário de início, duração em minutos e local.
- O término é calculado sozinho (início + duração) e salvo, então continua aparecendo "14:00 – 17:00" no site.
- A duração também aparece de forma amigável na página da oficina (ex.: "3h" ou "1h30").
- Os campos existentes (nome, resumo, descrição, valor, vagas) continuam iguais.

## Produtos: cadastro novo e imagens

- Botão "Nova peça" no painel de estoque: nome, categoria, preço, estoque, descrição, personalizável, sob orçamento, ativa — e envio de uma ou mais imagens já na criação.
- Em cada peça existente, uma área de imagens permite:
  - enviar novas imagens (várias de uma vez),
  - remover imagens,
  - definir a ordem / qual é a principal.
- Edição de nome, preço, estoque e chaves (personalizável, sob orçamento, ativa) continua como está hoje.
- Descontos/promoção ficam exatamente como estão agora — nada muda ali.

## Detalhes técnicos

- Migração: adicionar `duration_minutes` (int, opcional) em `workshops`. `end_time` passa a ser derivado de `start_time + duration_minutes` no momento de salvar.
- Novo painel `AdminProductImages` lendo/gravando em `product_images` (upload para o bucket `product-images`, URLs assinadas para pré-visualização, `position` para ordem, delete removendo linha + objeto do storage).
- Novo painel `AdminNewProduct` (insert em `products` com slug gerado a partir do nome, `category_id` via select das categorias) que, após criar, envia as imagens escolhidas para `product_images`.
- Ajustes em `AdminNewWorkshop` e no editor de oficinas em `AdminPanels.tsx`: trocar o campo "Término" por "Duração (min)"; helper `addMinutes(start, minutes)`.
- `useWorkshops`/`WorkshopDetail` passam a exibir a duração formatada.
- Verificar políticas de storage do bucket `product-images` para permitir upload/exclusão por admin (leitura já é pública).
