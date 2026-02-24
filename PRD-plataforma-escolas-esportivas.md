# [PLANEJAMENTO] Plataforma de gestão de escolas esportivas — 1 app, 3 portais (mesmo backend)

Quero que você **proponha a arquitetura e o plano de implementação** para uma plataforma SaaS com **multi-tenant + hierarquia** e **3 portais** (mesmo backend), evitando duplicação de código e garantindo segurança.

## Modelo mental (não mudar)

- **1 app, 3 portais** (mesmo backend):
  - **Admin (Super Admin):** vê tudo, configura planos, aprova escolas, gerencia franqueadores, suporte e auditoria.
  - **Franqueador:** gerencia suas escolas, relatórios consolidados, padrões (metodologia, preços sugeridos, campanhas) e usuários do franqueado.
  - **Escola:** operação (alunos, turmas, treinos, presença, mensalidades, avaliações, eventos).

## Base (multi-tenant + hierarquia)

Estrutura mínima de "dono dos dados":

- `Org/Tenant` (organização "pai") com `type: ADMIN | FRANCHISOR | SCHOOL`
- `Franchisor` -> tem várias `Schools`
- `School` -> tem dados operacionais (students, teams, payments, etc.)

**Regra obrigatória de modelagem**

Todo registro operacional deve carregar `school_id` (ou `org_id`) para filtro e segurança consistentes:

- `students.school_id`
- `teams.school_id`
- `payments.school_id`
- etc.

## Permissões (RBAC + escopo)

Não basta role; precisa **role + scope**:

- **Roles:** `Admin`, `FranchisorOwner`, `FranchisorStaff`, `SchoolOwner`, `SchoolStaff`, `Coach`, `Finance`…
- **Scope:** quais `school_ids` (ou `franchisor_id`) o usuário pode acessar.

Exemplos:

- Usuário do franqueador: acesso a todas as escolas onde `school.franchisor_id = X`
- Usuário da escola: acesso apenas a `school_id = Y`

## UI/UX (navegação por contexto)

- Para Admin/Franqueador: **School Switcher** no topo
  - Admin: escolhe qualquer escola
  - Franqueador: escolhe apenas entre suas escolas
  - Escola: contexto fixo (sem seletor)
- O mesmo conjunto de telas deve adaptar ao contexto.

## Organização de código (recomendação)

Sugira estrutura **monorepo**:

- `apps/admin-portal`
- `apps/franchisor-portal`
- `apps/school-portal`
- `packages/ui` (componentes compartilhados)
- `packages/core` (tipos, validações, helpers)
- `packages/auth` (RBAC, guards)
- `packages/api` (SDK/client)

(Alternativa aceitável: único front com rotas `/admin`, `/franchisor`, `/school` + guards, mas explique tradeoffs.)

## Back-end (policy-first) — obrigatório

- Nunca confiar no front.
- Toda query/mutation valida: **user can access school_id**.
- Logs/auditoria para ações administrativas (quem mudou o quê e quando).

---

## O que eu quero que você entregue (sem gerar código ainda)

1) **Mapa de entidades (tabelas/coleções) mínimo** para MVP + campos essenciais e relacionamentos (inclua `memberships`/`role assignments` e como guardar o `scope`).

2) **Modelo de autorização**: descreva as regras de acesso (em linguagem clara) e como aplicar em:
   - listagem por escola
   - leitura de um registro
   - criação/edição/remoção
   - ações cross-school (admin e franqueador)

3) **Arquitetura dos 3 portais**:
   - quais rotas principais em cada portal
   - quais módulos são compartilhados
   - como o "contexto de escola" flui (Switcher, URL, estado, etc.)

4) **Sequência prática de construção (roadmap)** seguindo:
   - dados base -> auth/escopo -> portal Escola (MVP) -> portal Franqueador -> portal Admin
   Inclua milestones e critérios de pronto por etapa.

5) **Guardrails obrigatórios**
   - não inventar funcionalidades fora do escopo
   - priorizar simplicidade e consistência de segurança
   - sugerir mock data antes de integrações externas
   - nenhuma sugestão que exponha segredos no front

### Formato

Responda em Markdown, bem estruturado, com listas e seções claras.
