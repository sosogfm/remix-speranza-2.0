# Conferir o Pix na compra de produtos

## Resposta honesta

Pelo código, sim: a tela de Pix dos **produtos** usa exatamente o mesmo componente da tela das **oficinas** (`PixPanel`), com QR Code e o campo "Pix copia e cola" com botão de copiar. A função de pagamento no servidor também é a mesma para os dois casos e devolve os mesmos campos (`qrCodeBase64`, `qrCode`, `expiresAt`).

O que eu **não** posso garantir só olhando o código é o comportamento real: se o Mercado Pago devolver o Pix vazio para um pedido de produto (por exemplo, valor inválido, dado de cliente faltando ou erro na criação do pedido), a tela aparece mas sem o código. Então, para ter certeza absoluta, é preciso rodar um teste de verdade.

## O que eu faço

1. Simulo uma compra completa no site (adicionar peça ao carrinho, preencher dados, escolher Pix) e confiro na tela se aparecem os dois: imagem do QR Code e o código copia e cola.
2. Confiro a resposta do servidor nesse teste para ver se os campos do Pix vieram preenchidos.
3. Comparo com o mesmo teste na oficina, para garantir que estão idênticos.
4. Se algo vier faltando, corrijo na hora (na função de pagamento ou na tela) e testo de novo até aparecer certo.
5. Apago o pedido de teste do painel para não sujar seus pedidos.

## Detalhes técnicos

- Teste end-to-end com Playwright em `/checkout` e `/oficinas/:slug` na pré-visualização.
- Inspeção da resposta de `mp-create-payment` (campos `pix.qrCode` / `pix.qrCodeBase64`) e dos logs da função em caso de erro.
- `PixPanel` já tem fallback: se o Mercado Pago não mandar a imagem, o QR é desenhado no navegador a partir do código copia e cola — vou validar que esse fallback funciona também no fluxo de produtos.
