# Ajustes: oficinas, promoções, avaliações e linguagem

## Oficinas

- Voltar ao formato antigo: campos de **horário de início** e **horário de término** digitados por você (some o campo "duração em minutos" e o cálculo automático).
- Na página da oficina, mostrar **apenas as vagas disponíveis** ("8 vagas disponíveis"), sem exibir o total.
- Cada inscrição continua ocupando uma vaga automaticamente; quando chega a zero entra a lista de espera, e você também segue podendo marcar "esgotado" na mão.

## Eventos privativos

- Botão de **excluir** solicitação na página de admin, além de mudar o status.
- Aviso visível no formulário: *"Entendo que precisarei acertar o valor adiantado"*.

## Produtos

- Promoção passa a ser em **porcentagem de desconto** (ex.: 20%) em vez de digitar o preço promocional; o preço final é calculado e exibido normalmente.
- As informações padrão (preço/pagamento, queima inicial, prazos, envios, retirada, cuidados) passam a aparecer já preenchidas na área de "Informações desta peça", onde você pode editar, remover ou acrescentar novas.
- Campos de nome, datas e valores promocionais ficam **maiores e mais largos** no admin, para enxergar melhor no computador.

## Avaliações

- Cartões com **cantos levemente arredondados**.
- Imagens **um pouco menores** e respeitando a proporção original de cada uma (nada de recorte quadrado).

## Linguagem

- Todo o texto do site passa para **primeira pessoa do plural** ("nós", "nosso ateliê", "pintamos à mão"), incluindo home, sobre, produtos, oficinas, eventos, carrinho e checkout.

## Detalhes técnicos

- `AdminCatalog.AdminNewWorkshop` e o editor em `AdminPanels.tsx`: trocar input de duração por input de `end_time`; manter `duration_minutes` no banco apenas como derivado opcional (ou parar de gravar). `formatDuration` deixa de ser usada em `WorkshopDetail`.
- `WorkshopDetail.tsx` linha ~251: exibir só `spotsLeft`.
- `AdminPrivateEvents` (`AdminWorkshopExtras.tsx`): adicionar delete com confirmação, invalidando a query.
- `PrivateEventPanel.tsx`: linha de aviso do pagamento adiantado (checkbox obrigatório ou texto — usarei texto com asterisco, como pedido).
- `AdminProductSale` (`AdminCatalog.tsx`): input de percentual que grava `sale_price_cents = round(price_cents * (1 - pct/100))`; mostrar o valor resultante ao lado. Inputs com largura maior (`w-40`/`w-48`) e datas em campos maiores.
- `AdminInfoBlocks`: seed de blocos padrão por produto quando a peça não tiver nenhum (botão "Usar informações padrão" + criação automática na listagem), reaproveitando os textos de pagamento/queima/prazos existentes.
- `ReviewsMarquee.tsx`: `rounded-md`, largura reduzida (`w-52 md:w-60`) e `h-auto` mantendo proporção.
- Revisão de copy em `src/data/site.ts` e nas páginas para plural.
