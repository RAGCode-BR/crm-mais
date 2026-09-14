# Deploy no Cloudflare

O CRM+ é uma aplicação React/Vite de página única (SPA). Ela pode ser publicada no Cloudflare
Pages ou diretamente com Cloudflare Workers. Os arquivos `public/_redirects` e
`public/_headers` são incluídos no build para preservar o acesso direto às rotas do CRM e aplicar
cabeçalhos básicos de segurança.

## Variáveis de ambiente

Configure estas variáveis **no ambiente de produção do Cloudflare antes do build**:

| Variável                        | Valor                                                                                   |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | URL pública do projeto Supabase CRM+                                                    |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Publishable key (anon) do projeto Supabase                                              |
| `VITE_AI_ENABLED`               | `true` somente após configurar a Edge Function `commercial-ai`; caso contrário, `false` |

As variáveis prefixadas com `VITE_` ficam embutidas no JavaScript do navegador. Nunca informe
`service_role`, `OPENAI_API_KEY` ou qualquer outro segredo nessa configuração. Os segredos do
assistente comercial permanecem no Supabase Edge Functions.

## Cloudflare Pages

1. Conecte este repositório ao Cloudflare Pages.
2. Use `npm ci` como comando de instalação e `npm run build` como comando de build.
3. Defina `dist` como diretório de saída.
4. Cadastre as variáveis acima para Production (e Preview, se necessário).
5. Publique. O arquivo `_redirects` faz com que rotas como `/dashboard` e `/login` carreguem a SPA.

## Cloudflare Workers

Após autenticar o Wrangler na conta Cloudflare correta, valide o pacote sem publicar:

```bash
npm run deploy:cloudflare:dry-run
```

Para publicar pelo Workers, execute:

```bash
npm run deploy:cloudflare
```

O arquivo `wrangler.jsonc` usa `dist` como diretório de assets e aplica o fallback de SPA para
rotas que não correspondem a arquivos estáticos.

## Ajuste obrigatório no Supabase Auth

No projeto Supabase, em **Authentication > URL Configuration**, configure a URL de produção do
CRM como **Site URL** e inclua na lista de **Redirect URLs**:

```text
https://SEU-DOMINIO/*
```

Inclua também os domínios de preview que serão utilizados. Isso é necessário para login,
cadastro, recuperação e redefinição de senha funcionarem após a publicação.
