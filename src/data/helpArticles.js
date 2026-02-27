/**
 * FAQ estático — Central de Ajuda (Fase 2).
 * Opção 1: conteúdo versionado no front. Sem endpoint.
 * Estrutura compatível com contrato futuro GET /help/articles (portal, module, question, answer, order).
 */

export const PORTALS = [
  { value: 'admin', label: 'Admin' },
  { value: 'franchise', label: 'Franqueador' },
  { value: 'school', label: 'Escola' },
]

export const MODULES_BY_PORTAL = {
  school: [
    { value: 'alunos', label: 'Alunos' },
    { value: 'turmas', label: 'Turmas' },
    { value: 'treinos', label: 'Treinos' },
    { value: 'presenca', label: 'Presença' },
    { value: 'avaliacoes', label: 'Avaliações' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'eventos', label: 'Eventos' },
    { value: 'comunicacao', label: 'Comunicação' },
    { value: 'configuracoes', label: 'Configurações' },
  ],
  franchise: [
    { value: 'escolas', label: 'Escolas' },
    { value: 'relatorios', label: 'Relatórios' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'padroes', label: 'Padrões e Metodologia' },
    { value: 'campanhas', label: 'Campanhas' },
    { value: 'exportacoes', label: 'Exportações' },
    { value: 'usuarios', label: 'Usuários' },
    { value: 'permissoes', label: 'Permissões' },
    { value: 'configuracoes', label: 'Configurações' },
  ],
  admin: [
    { value: 'franqueadores', label: 'Franqueadores' },
    { value: 'escolas', label: 'Escolas' },
    { value: 'suporte', label: 'Suporte' },
    { value: 'planos', label: 'Planos e Assinaturas' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'auditoria', label: 'Auditoria' },
    { value: 'relatorios', label: 'Relatórios' },
    { value: 'exportacoes', label: 'Exportações' },
    { value: 'configuracoes', label: 'Configurações' },
    { value: 'templates', label: 'Templates' },
  ],
}

/** Mapeia portal do usuário (ADMIN/FRANCHISOR/SCHOOL) para valor do filtro */
export function portalToFilterValue(portal) {
  const p = (portal || '').toUpperCase()
  if (p === 'ADMIN') return 'admin'
  if (p === 'FRANCHISOR') return 'franchise'
  if (p === 'SCHOOL') return 'school'
  return 'school'
}

/**
 * Lista estática de artigos FAQ.
 * items: [{ id, portal, module, question, answer, order }]
 */
export const HELP_ARTICLES = [
  // —— Escola
  { id: 's1', portal: 'school', module: 'alunos', question: 'Como cadastrar um novo aluno?', answer: 'Acesse Alunos no menu, clique em "Novo aluno" e preencha os dados obrigatórios (nome, data de nascimento, contato). Salve para criar o cadastro.', order: 1 },
  { id: 's2', portal: 'school', module: 'alunos', question: 'Posso editar os dados de um aluno depois de cadastrado?', answer: 'Sim. Na lista de alunos, clique no nome do aluno ou no ícone de edição. Altere os campos desejados e salve.', order: 2 },
  { id: 's3', portal: 'school', module: 'turmas', question: 'Como criar uma turma?', answer: 'Em Turmas, use o botão "Nova turma". Defina nome, horário e capacidade. Depois você pode vincular alunos e treinos à turma.', order: 1 },
  { id: 's4', portal: 'school', module: 'treinos', question: 'O que são treinos e como registrá-los?', answer: 'Treinos são as sessões de atividade. Crie um treino em Treinos e associe à turma. Use Presença para marcar quem compareceu.', order: 1 },
  { id: 's5', portal: 'school', module: 'presenca', question: 'Como marcar presença dos alunos?', answer: 'Vá em Presença, selecione a data e a turma/treino. Marque os alunos presentes. O histórico fica disponível em Presença > Histórico.', order: 1 },
  { id: 's6', portal: 'school', module: 'avaliacoes', question: 'Onde ficam as avaliações dos alunos?', answer: 'Em Avaliações você cria e consulta avaliações por aluno. Use "Nova avaliação" para registrar resultados e acompanhar evolução.', order: 1 },
  { id: 's7', portal: 'school', module: 'financeiro', question: 'Como gerar cobrança ou mensalidade?', answer: 'No módulo Financeiro você acessa Faturas e pode gerar cobranças. Em Inadimplência verá os atrasados; em Pagamentos pode registrar pagamentos recebidos.', order: 1 },
  { id: 's8', portal: 'school', module: 'eventos', question: 'Como criar um evento?', answer: 'Em Eventos, clique em "Novo evento". Informe título, data, local e descrição. Os eventos podem ser divulgados para as turmas ou para a escola.', order: 1 },
  { id: 's9', portal: 'school', module: 'comunicacao', question: 'Como enviar um comunicado?', answer: 'Use o módulo Comunicação (Comunicados). Crie um novo comunicado, escolha o público (turma ou geral) e envie. O histórico de envios fica na lista.', order: 1 },
  { id: 's10', portal: 'school', module: 'configuracoes', question: 'Onde altero dados da escola ou usuários?', answer: 'Em Configurações você encontra preferências da escola e a gestão de usuários (Configurações > Usuários) para adicionar ou editar acessos.', order: 1 },
  // —— Franqueador
  { id: 'f1', portal: 'franchise', module: 'escolas', question: 'Como adicionar uma nova escola à rede?', answer: 'Em Escolas, clique em "Nova escola". Preencha os dados e conclua o cadastro. Use Onboarding para guiar a ativação da escola.', order: 1 },
  { id: 'f2', portal: 'franchise', module: 'relatorios', question: 'Onde vejo os relatórios das escolas?', answer: 'Acesse Relatórios. Selecione a escola (ou "Todas as escolas") e o período. Os relatórios podem ser exportados conforme sua permissão.', order: 1 },
  { id: 'f3', portal: 'franchise', module: 'financeiro', question: 'Como acompanhar o financeiro das escolas?', answer: 'Em Financeiro você vê o resumo por escola. Clique em uma escola para ver detalhes de faturamento, inadimplência e pagamentos.', order: 1 },
  { id: 'f4', portal: 'franchise', module: 'usuarios', question: 'Como gerencio usuários do franqueador?', answer: 'Em Usuários você adiciona e edita usuários do portal Franqueador. Em Permissões define quais módulos cada perfil pode acessar.', order: 1 },
  { id: 'f5', portal: 'franchise', module: 'configuracoes', question: 'Onde altero o perfil do franqueador?', answer: 'Use Configurações > Perfil para alterar dados do franqueador. Outras opções de configuração aparecem conforme seu perfil.', order: 1 },
  // —— Admin
  { id: 'a1', portal: 'admin', module: 'franqueadores', question: 'Como cadastrar um novo franqueador?', answer: 'Em Franqueadores, use "Novo franqueador". Preencha os dados e salve. Depois você pode vincular escolas e usuários a esse franqueador.', order: 1 },
  { id: 'a2', portal: 'admin', module: 'escolas', question: 'Como gerencio as escolas no sistema?', answer: 'Em Escolas você vê todas as escolas. Use "Nova escola" para cadastrar ou edite uma existente. É possível vincular à rede de um franqueador.', order: 1 },
  { id: 'a3', portal: 'admin', module: 'suporte', question: 'Onde fica a central de solicitações?', answer: 'Em Suporte > Central de solicitações você visualiza e responde tickets. Em Categorias pode configurar as categorias de suporte.', order: 1 },
  { id: 'a4', portal: 'admin', module: 'planos', question: 'Como configuro planos e assinaturas?', answer: 'Em Planos você cria e edita planos. Em Assinaturas acompanha as assinaturas ativas por franqueador ou escola.', order: 1 },
  { id: 'a5', portal: 'admin', module: 'auditoria', question: 'Onde vejo os logs de auditoria?', answer: 'Acesse Auditoria para ver os eventos do sistema. Clique em um evento para ver detalhes (quem, quando, o que foi alterado).', order: 1 },
  { id: 'a6', portal: 'admin', module: 'configuracoes', question: 'Onde ficam as configurações globais?', answer: 'Em Configurações você define parâmetros globais do sistema. Templates ficam em Templates para personalizar comunicações e documentos.', order: 1 },
]
