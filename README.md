# MARKETFLOW — MVP 1.0

Plataforma própria para gestão de marketing de afiliados. Esta entrega é um starter funcional:
- Dashboard com indicadores
- Cadastro, edição e listagem de produtos
- Fila de conteúdos com aprovação/rejeição
- Criação de rascunhos de roteiro com OpenAI (opcional, via API)
- Persistência no Supabase
- Estrutura para automações n8n

**Importante:** não publica automaticamente nem acessa catálogos de marketplaces por scraping. Publicação, importação de ofertas e métricas dependem de integrações oficiais/autorizadas, credenciais e aprovação nas plataformas.

## Requisitos
- Node.js 20+
- npm
- Conta Supabase
- (Opcional) chave OpenAI API

## Instalação
```bash
npm install
cp .env.example .env.local
```
Preencha `.env.local` com as chaves do Supabase. Depois:
```bash
npm run dev
```
Abra http://localhost:3000.

## Banco de dados
1. Crie um projeto no Supabase.
2. Abra SQL Editor.
3. Execute `supabase/schema.sql`.
4. Configure as variáveis de ambiente.

## Segurança antes de colocar online
- Configure autenticação Supabase e políticas RLS.
- Não exponha `SUPABASE_SERVICE_ROLE_KEY` no navegador.
- Configure domínio, HTTPS, backups e limites de uso.
- Não coloque tokens de afiliado ou redes sociais no código-fonte.
- A aprovação nesta versão altera o estado do conteúdo no banco; não publica nas redes.

## Próximas integrações
1. OAuth/autorização das plataformas de afiliados.
2. Importação de produtos por API/feed permitido.
3. Geração de vídeo por provedor compatível.
4. Armazenamento de mídia.
5. Publicação via APIs oficiais e agendamento.
6. Importação de métricas e comissões.

## Estrutura
- `src/app`: páginas e API
- `src/lib`: clientes e utilitários
- `supabase/schema.sql`: tabelas e políticas iniciais
- `n8n/`: guia de automação
