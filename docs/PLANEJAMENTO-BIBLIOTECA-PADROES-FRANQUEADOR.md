# Planejamento — Biblioteca de Padrões (Portal Franqueador) — Fase 2

## Objetivo
Centralizar todos os padrões do franqueador em uma “biblioteca” única, permitir consultar versões/histórico de mudanças (quem alterou, quando, o que mudou), visualizar conteúdo de versões anteriores e comparar (antes/depois). **Não substitui** as telas de edição (Metodologia e Preços sugeridos); é uma visão de auditoria/versões e consulta.

---

## Regras de acesso (RBAC + escopo)
- **Roles permitidas:** FranchisorOwner, FranchisorStaff.
- **Escopo:** Apenas padrões do `franchisor_id` do usuário.
- **Segurança:** Backend valida `franchisor_id`; conteúdo sanitizado (texto puro ou sanitizado se rich text).

---

## Rotas
| Rota | Tela |
|------|------|
| `/franchisor/standards/library` | Lista da Biblioteca |
| `/franchisor/standards/library/:item_id` | Detalhe do item (Histórico de versões) |

### Entradas
- **Dashboard:** atalho “Biblioteca de Padrões”.
- **Padrões de Metodologia:** botão “Ver histórico”.
- **Preços sugeridos:** botão “Ver histórico”.

### Navegação
- Clicar em um item na lista → detalhe `/franchisor/standards/library/{item_id}`.
- **Editar** → redireciona para a tela de edição original:
  - Metodologia → `/franchisor/standards/methodology?returnTo=...`
  - Preços sugeridos → `/franchisor/standards/pricing?returnTo=...`
- **Voltar** no detalhe → lista da biblioteca com filtros preservados na URL.

---

## Estrutura implementada

### A) Lista da Biblioteca (`BibliotecaPadroesFranqueador.jsx`)
- **Topbar:** Portal Franqueador + School Switcher (fixo “Todas as escolas” na prática, pois a biblioteca não usa `school_id`).
- **Cabeçalho:** Breadcrumb (Dashboard → Padrões → Biblioteca), título “Biblioteca de Padrões”.
- **Busca:** placeholder “Buscar por título, tipo ou versão”.
- **Filtros:** Tipo (Todos | Metodologia | Preços sugeridos), Status (Todos | Ativo | Inativo), Período (alterado de/até), “Limpar filtros”.
- **Tabela:** Tipo (badge), Título/Item (link para detalhe), Versão atual, Status, Última alteração, Alterado por, Ações (menu: Ver histórico, Editar).
- **Paginação:** page, page_size na URL.
- **Estados:** skeleton (carregando), vazio (“Nenhum padrão encontrado.”), erro (“Não foi possível carregar a biblioteca. Tente novamente.”).

### B) Detalhe do item (`DetalheBibliotecaPadraoFranqueador.jsx`)
- **Cabeçalho:** Breadcrumb (Biblioteca → {Título}), título “Histórico de versões”, subtítulo (Tipo + Status atual), botões Voltar e Editar.
- **Card Resumo:** Título/Item, Tipo, Versão atual, Status, Última alteração, Alterado por.
- **Lista de versões:** tabela com Versão, Data/hora, Autor, Resumo, Ações (Ver conteúdo, Comparar com atual).
- **Modal “Ver conteúdo”:** exibe conteúdo da versão (texto ou campos); botões Fechar e “Comparar com atual”.
- **Modal “Comparação”:** dois blocos lado a lado (Antes / Depois) com conteúdo truncável e expandir.

---

## Contrato de dados (frontend consome; backend implementa)
- **GET** `/franchisor/standards/library` — params: `search`, `type`, `status`, `from`, `to`, `page`, `page_size`. Resposta: `{ items, total }` com `item_id`, `type`, `title_or_name`, `current_version`, `status`, `updated_at`, `updated_by_name`/`updated_by_email`.
- **GET** `/franchisor/standards/library/:item_id` — resumo do item.
- **GET** `/franchisor/standards/library/:item_id/versions` — params: `page`, `page_size`. Resposta: `{ items, total }` com `version_id`, `version_label`, `created_at`, `created_by`, `summary`.
- **GET** `/franchisor/standards/library/:item_id/versions/:version_id` — resposta: `{ content_snapshot }` (objeto com campos da versão).
- (Opcional) **POST** `/franchisor/standards/library/:item_id/restore` — payload: `{ version_id }` (Fase 2 avançada; não implementado no frontend atual).

---

## Permissões de auditoria (backend)
- Franchisor_ViewStandardsLibrary  
- Franchisor_ViewStandardVersion  
- (Opcional) Franchisor_RestoreStandardVersion  

---

## Arquivos criados/alterados
- `src/api/franchisorPortal.js` — funções mock: `getStandardsLibrary`, `getStandardsLibraryItem`, `getStandardsLibraryVersions`, `getStandardsLibraryVersionContent`.
- `src/pages/franchisor/BibliotecaPadroesFranqueador.jsx` — lista.
- `src/pages/franchisor/DetalheBibliotecaPadraoFranqueador.jsx` — detalhe + modais.
- `src/App.jsx` — rotas `/franchisor/standards/library` e `/franchisor/standards/library/:item_id`.
- `src/pages/franchisor/FranchisorDashboard.jsx` — atalho “Biblioteca de Padrões”.
- `src/pages/franchisor/PadroesMetodologiaFranqueador.jsx` — link “Ver histórico”.
- `src/pages/franchisor/PrecosSugeridosFranqueador.jsx` — link “Ver histórico”.
- `docs/MAPEAMENTO-TELAS-PLATAFORMA.md` — entrada 3.3 Biblioteca de Padrões.
