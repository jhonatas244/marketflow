# Automações n8n — plano inicial

Não importe automações que publiquem sem revisão. A regra obrigatória é `pending_approval`.

## Workflow A — Rascunho de conteúdo
1. Trigger: Cron (ex.: diariamente às 09:00).
2. Buscar produtos com status `selected` no Supabase.
3. Enviar dados do produto à OpenAI para criar roteiro/legenda.
4. Salvar registro em `content_queue` com `status = pending_approval`.
5. Notificar o administrador (e-mail/Telegram, opcional).

## Workflow B — Publicação aprovada (fase posterior)
1. Trigger: Cron a cada 5 minutos.
2. Buscar conteúdos com `status = approved` e horário elegível.
3. Validar link, mídia, disclosure de afiliado e regras da plataforma.
4. Publicar somente via API oficial autorizada.
5. Atualizar para `published` e guardar ID externo.
6. Em erro, manter registro e notificar; nunca marcar sucesso sem confirmação da API.

## Workflow C — Métricas (fase posterior)
Importar cliques/conversões/comissões de fontes autorizadas e inserir em `performance_events`.

## Cuidados
- Credenciais no cofre do n8n, nunca no frontend ou Git.
- Respeitar limites de API, políticas de afiliados e direitos de uso de mídia.
- Não fazer scraping não autorizado.
