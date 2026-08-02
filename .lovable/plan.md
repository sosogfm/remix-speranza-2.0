# Checkout Mercado Pago: Pix, Boleto e Cartão com parcelamento

## O que será construído

Um checkout próprio, dentro do site, com três abas:

- **Pix** — QR Code + código "copia e cola", com contador de expiração.
- **Boleto** — link do boleto + linha digitável para copiar.
- **Cartão de crédito** — formulário com número, nome, validade, CVV, CPF e **seleção de parcelas**.

No cartão, assim que a cliente digitar os **6 primeiros dígitos** (BIN), o site consulta o Mercado Pago e mostra as opções reais de parcelamento (1x até 12x) já com o valor de cada parcela e a indicação de "sem juros" quando for o caso. O valor considerado é o total do pedido (peças + extras + frete + embrulho).

## Sobre a chave fictícia

Posso deixar tudo pronto usando `APP_USR-TESTE-123` como valor temporário do token — o código fica completo e o site não quebra. Dois pontos importantes para você saber:

- Com a chave fictícia, **nenhum pagamento é gerado de verdade**: Pix, boleto e cartão retornarão erro de credencial ao serem acionados.
- A **consulta de parcelas pelo BIN também depende de credencial** (chave pública). Enquanto a real não estiver salva, mostro uma lista de parcelas calculada localmente (1x a 12x sem juros, mínimo de R$ 5 por parcela) e troco automaticamente para a consulta oficial assim que a chave real entrar.

Quando o painel do Mercado Pago voltar, você me manda o Access Token e a Public Key e eu só substituo os valores — nenhuma mudança de código será necessária.

## Detalhes técnicos

**Segredos** (temporários agora, reais depois): `MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_WEBHOOK_SECRET`, e `VITE_MERCADOPAGO_PUBLIC_KEY` no front.

**`mp-create-payment`** (nova função de backend)
- Recebe carrinho, dados da cliente, método (`pix` | `bolbradesco` | `card`) e, no cartão, o token do cartão + número de parcelas.
- Recalcula **no servidor** preço de cada peça (incluindo promoção ativa), extras de personalização, frete por CEP e embrulho — o valor enviado pelo navegador nunca é confiado.
- Cria o pedido em `orders`/`order_items` com `payment_status = 'pending'` e chama `POST /v1/payments` do Mercado Pago com chave de idempotência.
- Devolve: Pix (QR base64 + copia e cola), Boleto (URL + linha digitável), Cartão (status aprovado/recusado/em análise).

**`mp-installments`** (nova função de backend)
- Recebe BIN (6 dígitos) e valor total; consulta `/v1/payment_methods/installments` e devolve a lista de parcelas. Fica no servidor para não expor credenciais e evitar bloqueio de CORS.
- Sem credencial válida, responde com a lista calculada localmente descrita acima.

**`mp-webhook`** (nova função de backend)
- Valida a assinatura `x-signature`, busca o pagamento na API e atualiza o pedido: `approved` → marca **Pago**, baixa estoque uma única vez (idempotente), confirma vaga de oficina quando houver; `rejected`/`cancelled` → cancela sem baixar estoque; `in_process` → mantém aguardando.

**Front-end**
- `src/lib/mercadopago.ts`: carrega o SDK oficial (MercadoPago.js v2) para tokenizar o cartão — os dados do cartão nunca passam pelo nosso servidor.
- `src/components/checkout/`: `PaymentTabs`, `PixPanel`, `BoletoPanel`, `CardPanel` (com `InstallmentsSelect` disparado no 6º dígito, com debounce).
- `src/pages/Checkout.tsx`: mantém o formulário de dados/entrega atual e troca o bloco do Stripe pelas novas abas.
- `src/pages/OrderConfirmation.tsx`: passa a mostrar estado de Pix/boleto aguardando pagamento e atualiza sozinha quando o webhook confirmar.

**Stripe**: o código atual (`create-checkout`, `payments-webhook`, componentes Stripe) fica no projeto, desativado, até você confirmar que o Mercado Pago está aprovando pagamentos de verdade. Depois eu removo.
