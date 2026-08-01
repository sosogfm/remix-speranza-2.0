# Rodapé, voz da Júlia, oficinas com vagas e eventos privativos

## 1. Rodapé
- **Categorias**: mostrar todas as 12 (hoje só aparecem 6), em duas colunas para não esticar o rodapé.
- **Atendimento**: agrupar os horários — "Seg – Sex 13:30 – 18:00", "Sáb 09:00 – 12:00", "Dom Fechado".
- **Contato**: remover a linha "Peças feitas à mão por Júlia Brandalise" e transformar o telefone em link direto do WhatsApp (wa.me/5549999951842).

## 2. Site na primeira pessoa
Revisar os textos das páginas Início, Sobre, Oficinas e detalhes de peça para a voz da Júlia ("eu pinto", "meu ateliê", "te espero"), sem mudar layout.

## 3. Vagas de oficina funcionando como estoque
Hoje as vagas não diminuem sozinhas. Passa a funcionar assim:
- Cada inscrição confirmada ocupa 1 vaga automaticamente; cancelamento devolve a vaga.
- Quando as vagas acabam, a oficina fica **ESGOTADA** sozinha e o formulário vira lista de espera.
- Se as inscrições passarem do limite ao mesmo tempo, a última entra em lista de espera em vez de estourar as vagas.
- No admin aparece "X de Y vagas ocupadas".

## 4. Aba Oficinas: bloco de Eventos Privativos sempre no topo
Card/sessão fixa antes das turmas, com o texto que você mandou:
- Chamada "Que tal transformar o seu evento em uma experiência criativa e inesquecível?", grupos de 10 a 15 pessoas, material incluso.
- Valores: pintura em taças/porcelana R$ 1.700,00 · decalque em porcelana (forno profissional) R$ 2.600,00, com a observação de que o valor pode variar conforme a peça.
- Botão "Falar comigo no WhatsApp" e formulário curto de solicitação (nome, telefone, data desejada, nº de pessoas, tipo de experiência) que fica salvo para você ver no admin.
- Abaixo das turmas, duas seções de texto: **Sobre as oficinas** e **Sobre a queima das peças**, com os textos enviados.

## 5. Blocos de pergunta reutilizáveis nas oficinas
Você cria uma vez, reaproveita sempre. No admin, aba Oficinas → "Blocos de perguntas":
- Cada bloco tem um nome (ex.: "Restrições alimentares", "Esmaltação com a Tânia"), a pergunta, o tipo (escolha única, múltipla, texto), as opções e acréscimo de preço por opção (ex.: "Sim, quero fazer a esmaltação (+R$ 150,00)").
- Ao cadastrar uma oficina, você marca quais blocos usar — sem redigitar nada.
- As respostas aparecem na inscrição, somam no valor e ficam visíveis na lista de inscritas.

## 6. Acesso ao /admin sem login
Recomendo manter a proteção e te dar acesso: me diga o e-mail que você usa para entrar no site que eu marco essa conta como administradora — aí basta entrar em /auth e o /admin abre. Se preferir, posso liberar temporariamente uma visualização do /admin sem login apenas no ambiente de pré-visualização (nunca no site publicado), mas o caminho seguro é o e-mail.

## Detalhes técnicos
- Novas tabelas: `workshop_question_blocks` (biblioteca reutilizável), `workshop_question_block_links` (bloco ↔ oficina), `private_event_requests`; coluna de respostas em `workshop_registrations`. RLS + GRANTs em todas.
- Trigger em `workshop_registrations` para incrementar/decrementar `spots_taken` e marcar `is_sold_out`; `register_workshop_guest` passa a validar vagas e gravar as respostas dos blocos.
- Rodapé, textos e página de oficinas: alterações apenas de frontend, usando `src/data/site.ts` e `collections`.

## A confirmar
1. Qual e-mail devo tornar administrador?
2. O pedido de evento privativo deve só te notificar (formulário + WhatsApp) ou virar um pedido pagável no checkout?
