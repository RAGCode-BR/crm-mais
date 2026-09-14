# Deploy no Cloudflare

O CRM+ é uma aplicação React/Vite de página única (SPA), preparada para publicação com Cloudflare
Workers. O `wrangler.jsonc` usa `assets.not_found_handling` como
`single-page-application`, preservando o acesso direto às rotas do CRM. O arquivo
`public/_headers` é incluído no build para aplicar cabeçalhos básicos de segurança.

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
rotas que não correspondem a arquivos estáticos. Não use um arquivo `_redirects` com a regra
`/* /index.html 200`: em Workers, ela entra em conflito com o fallback nativo e pode gerar um
loop de redirecionamento.

## Ajuste obrigatório no Supabase Auth

No projeto Supabase, em **Authentication > URL Configuration**, configure a URL de produção do
CRM como **Site URL** e inclua na lista de **Redirect URLs**:

```text
https://SEU-DOMINIO/*
```

Inclua também os domínios de preview que serão utilizados. Isso é necessário para login,
cadastro, recuperação e redefinição de senha funcionarem após a publicação.
