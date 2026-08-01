# Pagamento direto no site + novos admins

Duas entregas: checkout com cartão dentro do próprio site (sem WhatsApp) e uma aba no admin para liberar acesso de administração a outros e-mails.

## 1. Pagamento direto no site (Stripe)

Hoje o pedido é criado no banco e o pagamento fica combinado por fora. Passa a funcionar assim:

1. Cliente preenche endereço e revisa o pedido como já faz hoje.
2. Ao clicar em "Finalizar", o servidor recalcula preços, extras, frete e embrulho a partir do banco — o navegador nunca define valor.
3. O cliente é levado à página de pagamento segura do Stripe e paga com cartão (parcelamento conforme a conta brasileira permitir).
4. Ao voltar, cai na página de confirmação do pedido.
5. Um aviso automático do Stripe confirma o pagamento no servidor, marca o pedido como **Pago** e dá baixa no estoque uma única vez.

Pedidos não pagos ficam como "Aguardando pagamento" e não reservam estoque. Peças "sob orçamento" continuam pelo WhatsApp, como hoje.

Observações sobre a conta:
- Ative os Pagamentos do Lovable com Stripe: um ambiente de teste é criado na hora, dá para testar sem dinheiro real; para receber de verdade é preciso reivindicar/verificar a conta.
- Impostos: configuro o cálculo e a cobrança automática no checkout; registro e recolhimento seguem por sua conta.
- Pix/boleto só entram se estiverem habilitados na sua conta Stripe brasileira; começamos com cartão.
- Oficinas e eventos privativos seguem no fluxo atual nesta etapa; se quiser, ligo o mesmo pagamento neles depois.

## 2. Novos administradores pelo painel

Nova aba **Acessos** no `/admin` (visível só para admin):
- Lista de quem é admin hoje, com e-mail.
- Campo para digitar um e-mail já cadastrado no site e conceder acesso de admin.
- Botão para remover o acesso de admin (sem poder remover o seu próprio, para não travar o painel).
- Mensagem clara se o e-mail ainda não tiver conta: a pessoa precisa criar conta no site primeiro.

## Detalhes técnicos

- Habilitar Lovable Payments (Stripe) e criar os produtos/preços a partir do catálogo; itens personalizados usam preço calculado em `price_data` na sessão.
- Edge function `create-checkout`: valida o carrinho (Zod), recalcula `subtotal_cents`, `gift_wrap_cents` e frete pelas `shipping_rates`, grava o pedido via `place_guest_order`, cria a Checkout Session com `automatic_tax: { enabled: true }` e `success_url`/`cancel_url` do site, e guarda o id da sessão em `payment_provider_id`.
- Edge function de webhook (`verify_jwt = false`, assinatura validada, idempotente por `payment_provider_id`): em `checkout.session.completed` marca `payment_status = 'paid'`, decrementa `stock_quantity` e seta `stock_committed = true`.
- `Checkout.tsx` passa a redirecionar para a URL da sessão em vez de ir direto à confirmação; a validação de campos atual continua.
- Admins: função `SECURITY DEFINER` `grant_admin_by_email(_email text)` / `revoke_admin(_user_id uuid)` que consulta `auth.users` por e-mail e insere/remove em `user_roles`, executável só por quem já tem `has_role(auth.uid(), 'admin')`; view/função de leitura para listar admins com e-mail. Nenhuma role sai da tabela `user_roles`.
