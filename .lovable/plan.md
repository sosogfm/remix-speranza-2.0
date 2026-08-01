# Corrigir erro de servidor nas oficinas e eventos privativos

## O que está acontecendo

As três tabelas novas criadas na última etapa — blocos de perguntas, vínculo de blocos com cada oficina e pedidos de evento privativo — foram criadas com as regras de acesso (quem pode ver/criar), mas **sem as permissões de leitura/escrita na API**. Confirmado no banco: elas têm políticas ativas, porém nenhuma permissão concedida a nenhum papel.

Resultado prático: qualquer tela que toque nessas tabelas (aba Oficinas do admin, formulário de evento privativo, perguntas extras na inscrição) devolve erro de servidor.

## O que será feito

1. Conceder as permissões que faltam nas três tabelas:
   - Leitura pública de blocos de perguntas e dos vínculos com oficinas (são conteúdo do site).
   - Escrita apenas para você (admin) nessas duas.
   - Envio de pedido de evento privativo liberado para visitantes (mesmo padrão das inscrições como convidada); leitura só para o admin.
2. Depois disso, abrir /oficinas e /admin no navegador e confirmar que carregam sem erro, que a criação de um bloco de perguntas funciona e que o pedido de evento privativo é gravado.

## Se o erro for em outro lugar

Se você viu o erro em outra tela (checkout, produto, conta), me diga qual página e o que estava fazendo — nesse caso investigo antes de mexer.

## Detalhes técnicos

- Migração com `GRANT` nas tabelas `workshop_question_blocks`, `workshop_question_block_links` e `private_event_requests` (`anon`/`authenticated`/`service_role` conforme as políticas já existentes).
- Sem mudanças de estrutura nem de dados; as políticas de RLS atuais permanecem como estão.
