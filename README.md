# HenriFinance

Aplicação web de finanças pessoais para uso diário de uma família com 2 pessoas, com foco em rapidez de lançamento, análise, segurança de dados e sincronização entre dispositivos.

## Stack

- React + TypeScript + Vite
- TailwindCSS
- Recharts
- Dexie (IndexedDB)
- Supabase (Auth + backup/sync em nuvem)
- React Hook Form + Zod
- React Router (HashRouter)
- date-fns
- Vitest

## Passo a passo de execução

### 1) Instalar dependências

```bash
npm install
```

### 2) Configurar Supabase (obrigatório para sincronizar entre celulares/PCs)

1. Crie um projeto no Supabase.
2. Abra o SQL Editor do Supabase e execute o script [`supabase/schema.sql`](./supabase/schema.sql).
3. Em `Project Settings > API`, copie:
   - `Project URL`
   - `anon public key`
4. Crie um arquivo `.env` na raiz com base em [`.env.example`](./.env.example):

```bash
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SEU_ANON_KEY
```

### 3) Rodar localmente

```bash
npm run dev
```

### 4) Rodar testes

```bash
npm run test
```

### 5) Build de produção

```bash
npm run build
npm run preview
```

### 6) Deploy no GitHub Pages

1. Suba o código na branch `main`.
2. Em `Settings > Pages`, selecione `GitHub Actions` como fonte.
3. Cadastre os secrets do repositório:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. O workflow [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml) fará build e deploy automaticamente.

A aplicação usa `HashRouter`, então não depende de fallback de rota no servidor.

## Como sincronizar sem perder dados

1. Em `Configurações > Sincronização em nuvem`, faça cadastro/login no Supabase.
2. Use o mesmo login em todos os dispositivos (seu e da sua esposa).
3. Clique em `Sincronizar agora` ao finalizar lançamentos importantes.
4. O app também tenta sincronizar automaticamente quando inicia e a cada 5 minutos (se online e autenticado).

### Recuperação

- A tela mostra histórico de snapshots na nuvem.
- Você pode:
  - `Importar (merge)` um snapshot específico.
  - `Restaurar` um snapshot (sobrescreve local e já cria novo snapshot de restauração).

## Backup local (JSON)

### Exportar

1. Abra `Configurações`.
2. Clique em `Exportar JSON`.
3. Guarde o arquivo gerado com timestamp.

### Importar

1. Abra `Configurações`.
2. Escolha o modo:
   - `Mesclar`: adiciona/atualiza mantendo dados existentes.
   - `Sobrescrever`: substitui toda a base local.
3. Clique em `Importar JSON` e selecione o arquivo.

## Dados de exemplo

Na primeira execução, o app gera seed com:

- 2 pessoas
- categorias padrão
- contas e cartões de exemplo
- transações de dois meses
- metas de orçamento

Também existe botão `Reaplicar seed de exemplo` em `Configurações`.

## Estrutura

```text
src/
  app/
  db/
  domain/
  features/
    dashboard/
    transactions/
    cards/
    accounts/
    categories/
    insights/
    settings/
  shared/
    components/
    hooks/
    utils/
    charts/
    constants/
  sync/
supabase/
  schema.sql
```

## Observações

- Valores monetários são armazenados em centavos para evitar erro de ponto flutuante.
- Compras parceladas criam N transações futuras no momento do cadastro.
- Cálculo de ciclo de cartão respeita fechamento/vencimento com ajuste de dia por mês.
- Persistência local em IndexedDB via Dexie com versão de schema.
- Na nuvem, os backups são versionados por usuário autenticado (RLS no Supabase).
# financas_familiar
