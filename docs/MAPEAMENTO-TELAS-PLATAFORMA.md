# Mapa de Telas — Plataforma de Gestão de Escolas Esportivas

**Arquitetura:** 1 app · 3 portais (Admin, Franqueador, Escola) · Mesmo backend · Multi-tenant + RBAC + escopo

---

## 1️⃣ Portal Admin

### Gestão de Franqueadores
| # | Tela | Prioridade |
|---|------|------------|
| 1.1 | Lista de Franqueadores | MVP |
| 1.2 | Detalhe do Franqueador (visão geral + escolas vinculadas) | MVP |
| 1.3 | Criar Franqueador | MVP |
| 1.4 | Editar Franqueador | MVP |
| 1.5 | Usuários do Franqueador (lista) | MVP |
| 1.6 | Novo usuário do Franqueador | MVP |
| 1.7 | Editar usuário do Franqueador | MVP |
| 1.8 | Alterar status do Franqueador (aprovar / suspender / reativar) | Fase 2 |

### Gestão de Escolas
| # | Tela | Prioridade |
|---|------|------------|
| 2.1 | Lista de Escolas (global) | MVP |
| 2.2 | Detalhe da Escola | MVP |
| 2.3 | Nova Escola | MVP |
| 2.4 | Editar Escola | MVP |
| 2.5 | Aprovação/Status da Escola (ativar/suspender) | Fase 2 |

### Planos e Assinaturas
| # | Tela | Prioridade |
|---|------|------------|
| 3.1 | Lista de planos | Fase 2 |
| 3.2 | Criar/Editar plano | Fase 2 |
| 3.3 | Assinaturas por franqueador ou escola | Fase 2 |

### Auditoria
| # | Tela | Prioridade |
|---|------|------------|
| 4.1 | Log de auditoria (ações administrativas) | Fase 2 |
| 4.2 | Filtros por entidade, usuário, data | Fase 2 |

### Suporte
| # | Tela | Prioridade |
|---|------|------------|
| 5.1 | Lista de tickets/solicitações | Fase 2 |
| 5.2 | Detalhe e resposta de ticket | Fase 2 |

### Configurações Globais
| # | Tela | Prioridade |
|---|------|------------|
| 6.1 | Parâmetros gerais da plataforma | Fase 2 |
| 6.2 | Roles e permissões (RBAC) | Fase 2 |

### Financeiro Global
| # | Tela | Prioridade |
|---|------|------------|
| 7.1 | Visão consolidada (receita por franqueador/escola) | Fase 2 |
| 7.2 | Inadimplência global | Fase 2 |

### Relatórios Estratégicos
| # | Tela | Prioridade |
|---|------|------------|
| 8.1 | Dashboard Admin (métricas gerais) | MVP |
| 8.2 | Relatório de crescimento (franqueadores, escolas, alunos) | Fase 2 |
| 8.3 | Relatório de uso da plataforma | Fase 2 |

**Total estimado Portal Admin:** ~28 telas (MVP: ~12 · Fase 2: ~16)

---

## 2️⃣ Portal Franqueador

### Dashboard Consolidado
| # | Tela | Prioridade |
|---|------|------------|
| 1.1 | Dashboard Franqueador (métricas das escolas da rede) | MVP |
| 1.2 | Resumo por escola (acessos rápidos) | MVP |

### Gestão de Escolas
| # | Tela | Prioridade |
|---|------|------------|
| 2.1 | Lista de escolas do franqueador | MVP |
| 2.2 | Detalhe da escola (visão franqueador) | MVP |
| 2.3 | Nova escola (vinculada ao franqueador) | MVP |
| 2.4 | Editar escola | MVP |

### Padrões (metodologia, preços sugeridos)
| # | Tela | Prioridade |
|---|------|------------|
| 3.1 | Metodologia / grade padrão da rede | Fase 2 |
| 3.2 | Preços sugeridos por modalidade ou plano | Fase 2 |
| 3.3 | Modelos de turma (padrão) | Fase 2 |

### Campanhas
| # | Tela | Prioridade |
|---|------|------------|
| 4.1 | Lista de campanhas da rede | Fase 2 |
| 4.2 | Criar/Editar campanha (abrangência por escola) | Fase 2 |

### Usuários do Franqueador
| # | Tela | Prioridade |
|---|------|------------|
| 5.1 | Lista de usuários do franqueador | MVP |
| 5.2 | Novo usuário (escopo por escola(s)) | MVP |
| 5.3 | Editar usuário | MVP |

### Relatórios Consolidados
| # | Tela | Prioridade |
|---|------|------------|
| 6.1 | Relatório consolidado (alunos, turmas, presença) | Fase 2 |
| 6.2 | Comparativo entre escolas | Fase 2 |

### Financeiro
| # | Tela | Prioridade |
|---|------|------------|
| 7.1 | Resumo financeiro da rede | Fase 2 |
| 7.2 | Inadimplência por escola | Fase 2 |

### Configurações
| # | Tela | Prioridade |
|---|------|------------|
| 8.1 | Dados do franqueador (perfil da rede) | MVP |
| 8.2 | Preferências de notificação e relatórios | Fase 2 |

**Total estimado Portal Franqueador:** ~20 telas (MVP: ~10 · Fase 2: ~10)

---

## 3️⃣ Portal Escola

### Dashboard Operacional
| # | Tela | Prioridade |
|---|------|------------|
| 1.1 | Dashboard Escola (alunos, turmas, presença, financeiro) | MVP |
| 1.2 | Resumo do dia / semana | MVP |

### Alunos
| # | Tela | Prioridade |
|---|------|------------|
| 2.1 | Lista de alunos | MVP |
| 2.2 | Detalhe do aluno | MVP |
| 2.3 | Novo aluno | MVP |
| 2.4 | Editar aluno | MVP |
| 2.5 | Histórico do aluno (turmas, presenças, pagamentos) | Fase 2 |

### Turmas
| # | Tela | Prioridade |
|---|------|------------|
| 3.1 | Lista de turmas | MVP |
| 3.2 | Detalhe da turma (alunos, horários) | MVP |
| 3.3 | Nova turma | MVP |
| 3.4 | Editar turma | MVP |
| 3.5 | Matricular aluno em turma | MVP |

### Treinos
| # | Tela | Prioridade |
|---|------|------------|
| 4.1 | Calendário / lista de treinos | MVP |
| 4.2 | Detalhe do treino (presenças, observações) | MVP |
| 4.3 | Criar/Editar treino | MVP |

### Presença
| # | Tela | Prioridade |
|---|------|------------|
| 5.1 | Registro de presença (por treino ou por turma) | MVP |
| 5.2 | Histórico de presenças por aluno | Fase 2 |

### Avaliações
| # | Tela | Prioridade |
|---|------|------------|
| 6.1 | Lista de avaliações (físicas, técnicas) | Fase 2 |
| 6.2 | Registrar avaliação por aluno | Fase 2 |
| 6.3 | Evolução do aluno (gráficos) | Fase 2 |

### Financeiro (mensalidades, inadimplência)
| # | Tela | Prioridade |
|---|------|------------|
| 7.1 | Lista de mensalidades / cobranças | MVP |
| 7.2 | Detalhe de cobrança e pagamento | MVP |
| 7.3 | Inadimplência da escola | MVP |
| 7.4 | Relatório financeiro da escola | Fase 2 |

### Eventos
| # | Tela | Prioridade |
|---|------|------------|
| 8.1 | Lista de eventos (campeonatos, festivais) | Fase 2 |
| 8.2 | Criar/Editar evento | Fase 2 |
| 8.3 | Inscrições no evento | Fase 2 |

### Professores/Treinadores
| # | Tela | Prioridade |
|---|------|------------|
| 9.1 | Lista de professores/treinadores | MVP |
| 9.2 | Novo/Editar professor | MVP |
| 9.3 | Vincular professor a turmas | MVP |

### Comunicação
| # | Tela | Prioridade |
|---|------|------------|
| 10.1 | Envio de comunicados (turma ou escola) | Fase 2 |
| 10.2 | Histórico de comunicados | Fase 2 |

### Relatórios
| # | Tela | Prioridade |
|---|------|------------|
| 11.1 | Relatório de alunos e turmas | Fase 2 |
| 11.2 | Relatório de presença | Fase 2 |
| 11.3 | Relatório de inadimplência | Fase 2 |

### Configurações da Escola
| # | Tela | Prioridade |
|---|------|------------|
| 12.1 | Dados da escola (nome, endereço, contato) | MVP |
| 12.2 | Modalidades ofertadas | MVP |
| 12.3 | Horários padrão e calendário letivo | Fase 2 |

**Total estimado Portal Escola:** ~38 telas (MVP: ~22 · Fase 2: ~16)

---

## 4️⃣ Telas Compartilhadas

| # | Tela | Observação |
|---|------|------------|
| 1 | Login | Único ponto de entrada; redireciona por role/portal |
| 2 | Recuperação de senha | Fluxo único |
| 3 | Redefinir senha (token) | Após link do email |
| 4 | Perfil do usuário | Dados pessoais, alterar senha |
| 5 | Notificações | Lista e leitura (pode variar por portal) |
| 6 | Centro de ajuda / FAQ | Conteúdo por contexto (admin, franqueador, escola) |
| 7 | Auditoria pessoal | “Minhas ações” (opcional, Fase 2) |

**Total estimado compartilhadas:** 7 telas

---

## 📊 Resumo geral

| Portal | MVP | Fase 2 | Total |
|--------|-----|--------|-------|
| Admin | 12 | 16 | 28 |
| Franqueador | 10 | 10 | 20 |
| Escola | 22 | 16 | 38 |
| Compartilhadas | 5 | 2 | 7 |
| **Total** | **49** | **44** | **93** |

*Contagem por prioridade é aproximada; algumas telas podem ser reunidas (ex.: criar/editar em uma única tela) reduzindo o número total.*
