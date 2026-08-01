# Speranza Ateliê — Loja própria com pagamentos, estoque e personalização

Build a self-contained store: products, stock, personalization flags, cart, checkout, shipping and an admin panel — all inside the app. Only one external service is required (the payment processor), plus optional ones for shipping labels and tax invoices.

## Payment approach (one processor covers everything)

Mercado Pago is the single processor that natively covers everything you listed for Brazil:

- Pix (QR code + copia e cola)
- Credit card with "parcelas sem juros" (the 2x you show on product prices)
- Debit card
- Boleto bancário
- Apple Pay / Google Pay through its wallet checkout

Stripe in Brazil does not do boleto/debit/installments as cleanly, so using both would mean two dashboards, two reconciliations and two fee structures. Recommendation: start with Mercado Pago only. You bring your own Mercado Pago account credentials (access token), stored securely as a backend secret.

Payment flow: the app creates the order server-side, calls Mercado Pago Checkout Pro / Pix API, and a webhook confirms payment and marks the order paid + decrements stock. Nothing about prices or stock is trusted from the browser.

## What gets built

### 1. Backend (Lovable Cloud)
Enable Lovable Cloud (database, auth, server functions, image storage). Tables:

- `categories` — the 12 categorias (Arte Sacra, Boleiras, Canecas, Cozinha, Cuias, Home Decor, Kits para Presente, Natal, Porta Joias, Urso Petit Poá, Xícaras, Coleção Colo)
- `products` — nome, slug, descrição, preço (BRL, centavos), `stock_quantity`, `is_personalizable`, `personalization_label` (ex. "Inicial"), `personalization_max_length`, `max_installments`, ativo/destaque, categoria
- `product_images` — múltiplas fotos por produto
- `orders` + `order_items` — snapshot de preço, texto de personalização por item, endereço, frete, status de pagamento e de envio
- `shipping_zones` / `shipping_rates` — frete por região/peso, frete grátis acima de X
- `user_roles` + `has_role()` — admin separado da tabela de usuários (segurança)

RLS: público lê produtos ativos; só admin escreve; cliente vê só os próprios pedidos.

### 2. Admin panel (`/admin`, login protegido)
- Produtos: criar/editar, upload de fotos, preço, **quantidade em estoque**, e o switch **"Personalizável (sim/não)"** com o rótulo do campo que o cliente preenche
- Estoque: lista com alerta de baixo estoque, ajuste rápido
- Pedidos: status (pago, em produção, enviado, entregue), código de rastreio, marcar como enviado
- Frete: tabela de faixas de CEP e valores
- Categorias

### 3. Loja (frontend)
- Migrar os produtos mock de `src/data/products.ts` para o banco
- Página de produto: se `is_personalizable`, mostra campo de texto obrigatório (ex. inicial "N"); mostra "R$ 145,00 — 2x de R$ 72,50 sem juros" calculado a partir do preço e das parcelas
- "Esgotado" quando estoque = 0; carrinho limitado ao estoque disponível
- Carrinho e checkout já existem — checkout passa a: endereço + CEP → cálculo de frete → escolha do meio de pagamento → Pix QR / cartão / boleto
- Página de confirmação com QR Pix ou linha digitável do boleto, e página "Meus pedidos"
- Filtros por categoria, preço e personalizável

### 4. Envio (shipping)
Duas camadas:
- **Já incluso:** tabelas de frete próprias por região/CEP + frete grátis acima de um valor, rastreio manual por pedido, e-mail ao cliente quando enviado
- **Opcional (recomendado depois):** integração com Melhor Envio para cotar Correios/Jadlog automaticamente e imprimir etiquetas. Isso é um serviço externo; posso adicionar quando você quiser.

### 5. Impostos / nota fiscal
Emissão automática de NF-e/NFC-e exige um emissor autorizado (Focus NFe, eNotas ou similar) — não dá para fazer 100% dentro do app. O que faço agora: guardar CPF/CNPJ no pedido e deixar o hook pronto para plugar o emissor. Quando você tiver a conta, integro a emissão automática após o pagamento confirmado.

## Ordem de execução

1. Ativar Lovable Cloud + criar o banco e as políticas de segurança
2. Login de admin + painel de produtos/estoque/personalização
3. Migrar catálogo e conectar a loja ao banco
4. Frete por CEP no checkout
5. Mercado Pago: criar pedido, Pix/cartão/boleto, webhook de confirmação, baixa de estoque
6. Painel de pedidos + e-mails de confirmação e envio

## Notas técnicas

- Preços em centavos (integer) para evitar erro de arredondamento; formatação `pt-BR` / BRL
- Todo cálculo de total, frete e desconto é feito em edge function; o cliente nunca define preço
- Webhook do Mercado Pago valida assinatura e é idempotente (evita baixa dupla de estoque)
- Baixa de estoque em transação, só após `payment.approved`
- Secret necessário: `MERCADOPAGO_ACCESS_TOKEN` (peço quando chegarmos no passo 5)
