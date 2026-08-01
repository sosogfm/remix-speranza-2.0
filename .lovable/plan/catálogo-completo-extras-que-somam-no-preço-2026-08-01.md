# Catálogo completo + Extras que somam no preço

## Por que a personalização não aparece

Verifiquei no banco: a estrutura de personalização existe e a página de produto já sabe exibi-la, mas **não há nenhum campo de personalização cadastrado** (zero registros) e a loja tem apenas 7 produtos antigos. Por isso nada aparece.

## O que vou fazer

### 1. Extras que somam sozinhos no total
Hoje um campo de personalização só permite escolher **uma** opção. Vou criar um tipo novo, "Extras", em que a cliente marca **quantos quiser** e cada um tem seu próprio preço:

```text
Extras
[x] Ouro na borda ................ + R$ 45,00
[ ] Contorno em ouro na alça ..... + R$ 15,00
[x] Borda colorida ............... + R$ 10,00
[ ] Alça em ouro ................. + R$ 40,00

Xícara com pires .................. R$ 120,00
Extras ............................ R$  55,00
Subtotal .......................... R$ 175,00
```

O valor entra no item do carrinho, no subtotal, no checkout e no pedido que você vê no admin. Os extras escolhidos ficam listados no pedido.

### 2. Opção de tamanho com preço próprio
Tipo novo "Tamanho", em que cada opção pode ter preço diferente — Urso naninha PP R$85 / P R$105 / M R$150, Nossa Senhora 11cm R$140 / 22cm R$380, Joia do dia 9,5cm R$69 / 10cm R$75 / 11,5cm R$190, canecas 350ml/360ml.

### 3. Catálogo completo cadastrado
Mantenho os 7 produtos atuais e acrescento todos do seu catálogo, com descrição, o que está incluso na personalização e os extras de cada um: Kit revelação, Kit presente, Caneca desenho, Caneca pet, Caneca retrato, Xícara com pires, Bule, Boleira, Pratos (nascimento, memórias, retrato, receita, pet, família), Nossa Senhora Aparecida, Pingente, Joia do dia, Urso naninha, Urso memória, Caixa para presente.

Bule (a partir de R$480) e Boleira (a partir de R$415) aparecem como "A partir de" com botão de orçamento no WhatsApp, sem compra direta.

### 4. Embalagem de presente R$35,00
A caixa cartonada com fita passa a ser a opção paga do "marcar como presente" no carrinho/checkout, somando R$35,00 por caixa.

### 5. Admin mais completo
No cadastro de produto você vai poder: marcar se é personalizável, escolher o tipo de cada campo (Inicial, Texto, Cor, Imagem, Escolha, **Extras**, **Tamanho**), e nos tipos Extras/Tamanho digitar opção + preço linha a linha. Também terei um botão para copiar o conjunto de extras de um produto para outro, para não redigitar.

### 6. Seu acesso de admin
Dou o papel de administradora para **sofiademello33@gmail.com**. Basta entrar com esse e-mail e /admin abre.

### 7. Informações importantes
Adiciono na página de produto/Sobre os blocos que você mandou: prazo de 20 dias úteis após confirmação, envio Correios/Jadlog com frete por conta da cliente, retirada em Videira-SC, sobre a queima a 780° e os cuidados com a peça.

## Fora deste passo

Fotos dos produtos: ainda não há nenhuma imagem no banco. Depois deste passo eu te mostro onde subir as fotos no admin, uma por produto.

## Detalhes técnicos

- Migração: novos valores `addon` e `size` no enum `personalization_field_type`; coluna `option_prices jsonb` em `product_personalization_fields` para preço por opção; papel admin para o e-mail informado.
- `PersonalizationValue` passa a aceitar múltiplos valores por campo; `extraCents` calculado a partir das opções marcadas em `PersonalizationFields.tsx` e refletido em `useCart`, `Cart`, `Checkout` e `place_guest_order`.
- Produtos e campos inseridos via insert; produtos sob orçamento com flag de "orçamento" (preço base = mínimo, botão WhatsApp em vez de comprar).
