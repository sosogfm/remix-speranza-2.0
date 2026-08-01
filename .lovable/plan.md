# Speranza Ateliê — site em português, oficinas, PWA e favoritos

## Respostas rápidas

- **Onde subir imagens:** duas formas. (1) Você pode anexar imagens aqui no chat (botão +) e eu uso no site. (2) Melhor para o dia a dia: vou criar um **upload de imagens dentro do /admin**, com armazenamento no backend — você sobe as fotos de cada peça/oficina sozinha, sem passar por mim.
- **Frete:** sim, só dá para calcular com o CEP de destino. No carrinho já dá para estimar digitando só o CEP; no checkout o endereço completo é preenchido automaticamente a partir dele.

## O que será feito

### 1. Tradução total para português
Todos os textos de navegação, produtos, carrinho, checkout, conta e admin em pt-BR. Título e descrição do site atualizados (hoje ainda estão com o texto padrão "Lovable App").

### 2. Identidade e contatos
- Nome, bio ("Porcelanas afetivas pintadas à mão"), endereço em Videira/SC, telefone e horário de funcionamento no rodapé e na página Sobre.
- Botões/links no cabeçalho e rodapé para Instagram, Linktree e WhatsApp.

### 3. Favoritar direto em /produtos (e login obrigatório)
- Botão de coração em cada card da listagem.
- Curtir ou adicionar ao carrinho exige estar logado: quem não estiver é levado ao login e volta para onde estava.
- Favoritos passam a ficar salvos na conta (não só no navegador), aparecendo em "Minha conta".

### 4. Personalização flexível (o ponto principal)
Hoje só existe "personalizável sim/não" com uma inicial. Vira um sistema de **campos de personalização por produto**, definidos por você no admin:

| Tipo | O que a cliente vê |
| --- | --- |
| Inicial | Campo curto com limite de caracteres |
| Texto / frase | Campo de texto com limite |
| Cor | Lista de cores que você cadastrar |
| Imagem / desenho | Upload de arquivo pela cliente |
| Escolha | Lista de opções que você define |

Cada campo tem rótulo, obrigatório ou não, e pode ter acréscimo de preço. O que a cliente preencher segue para o carrinho, o pedido e o painel admin.

### 5. Embalagem para presente
Marcação "É presente" no carrinho/checkout, com campo opcional de mensagem do cartão e (se você quiser) valor adicional configurável. Aparece destacado no pedido no admin.

### 6. Oficinas
Nova seção **/oficinas**, com cards no mesmo estilo dos produtos:
- Cada oficina tem foto, título, data, horário, local, valor, vagas totais, professora e descrição longa (o texto "um encontro com o presente" entra como conteúdo padrão editável).
- Status automático: **ESGOTADO** quando as vagas acabam; opção de **lista de espera**.
- Inscrição pede login e coleta: nome, Instagram (@usuario), telefone, restrição alimentar (Nenhuma / Vegetariano / Vegano / Sem glúten) e adicionais como "esmaltação em outro encontro (+R$150,00)".
- A inscrição vira um pedido normal, pagando pelo mesmo checkout.
- No /admin: aba **Oficinas** para cadastrar datas, preço, vagas e ver a lista de inscritas com as respostas do formulário.

As 8 datas que você mandou (27/06 porta joia G ... 12/12 taças de champagne) entram cadastradas, com a de 22/08 marcada como esgotada.

### 7. App instalável (PWA)
O site poderá ser adicionado à tela inicial do celular, com ícone e nome próprios. Sem modo offline (não é necessário para uma loja).

## Detalhes técnicos

- Novas tabelas: `product_personalization_fields`, `wishlists`, `workshops`, `workshop_registrations`; colunas de presente em `orders`; RLS + GRANTs em todas.
- Bucket de storage `product-images` (público para leitura, escrita só admin) e `personalization-uploads` (privado) para arquivos enviados pelas clientes.
- `order_items.personalization_text` passa a guardar também um JSON com os campos preenchidos, mantendo os pedidos antigos válidos.
- Manifesto PWA + ícones, sem service worker.
- Pagamento (Mercado Pago) continua como próximo passo separado — este plano não o inclui.

## Pontos a confirmar

1. A embalagem para presente é gratuita ou tem valor? Se tiver, qual?
2. Você já tem logo/ícone do ateliê para usar no app e no cabeçalho? Se não, eu gero um.
