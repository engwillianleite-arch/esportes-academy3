/**
 * Setup inicial (começar configurações) — Portal Escola — MVP (mock).
 * Guia o usuário na configuração mínima com checklist e links para telas existentes.
 * Rota: /school/setup
 */
import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'
import {
  getMockSession,
  getMockCounts,
} from '../../data/mockSchoolSession'

const GRID = 8

const TOTAL_STEPS = 5

/** Quais roles podem "abrir" (acessar) cada passo. MVP: bloqueio apenas exibe "Sem permissão". */
const STEP_PERMISSIONS = {
  school_data: ['SchoolOwner', 'SchoolStaff', 'Coach', 'Finance'],
  users: ['SchoolOwner', 'SchoolStaff'],
  teams: ['SchoolOwner', 'SchoolStaff', 'Coach'],
  students: ['SchoolOwner', 'SchoolStaff', 'Coach'],
  finance: ['SchoolOwner', 'SchoolStaff', 'Finance'],
}

const SETUP_STEPS = [
  {
    key: 'school_data',
    name: 'Dados da escola',
    description: 'Preencha o nome e dados básicos da sua escola.',
    to: '/school/settings',
  },
  {
    key: 'users',
    name: 'Usuários e permissões',
    description: 'Adicione usuários da equipe e defina permissões.',
    to: '/school/settings/users',
  },
  {
    key: 'teams',
    name: 'Criar primeira turma',
    description: 'Cadastre turmas para organizar os alunos.',
    to: '/school/teams',
  },
  {
    key: 'students',
    name: 'Cadastrar primeiro aluno',
    description: 'Registre os alunos da escola.',
    to: '/school/students',
  },
  {
    key: 'finance',
    name: 'Configurar financeiro (opcional)',
    description: 'Mensalidades e acompanhamento financeiro.',
    to: '/school/finance',
  },
]

const IconCheck = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
)
const IconCircle = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/></svg>
)

const styles = {
  header: {
    marginBottom: GRID * 4,
  },
  title: {
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
    letterSpacing: '-0.02em',
  },
  subtitle: {
    margin: `${GRID}px 0 0`,
    fontSize: 15,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  progressBar: {
    marginBottom: GRID * 4,
    padding: GRID * 3,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  progressText: {
    margin: '0 0 ' + GRID + 'px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  progressTrack: {
    height: 8,
    background: 'var(--cinza-arquibancada)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    background: 'var(--azul-arena)',
    borderRadius: 4,
    transition: 'width 0.25s ease',
  },
  checklistCard: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
    marginBottom: GRID * 4,
    overflow: 'hidden',
  },
  stepItem: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    borderBottom: '1px solid #eee',
  },
  stepItemLast: {
    borderBottom: 'none',
  },
  stepIcon: {
    flexShrink: 0,
    marginTop: 2,
  },
  stepBody: {
    flex: 1,
    minWidth: 0,
  },
  stepName: {
    margin: 0,
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  stepDesc: {
    margin: `${GRID}px 0 0`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  stepMeta: {
    marginTop: GRID,
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: 600,
    padding: `${GRID / 2}px ${GRID}px`,
    borderRadius: 6,
  },
  statusPendente: {
    background: 'rgba(0,0,0,0.06)',
    color: 'var(--grafite-tecnico)',
  },
  statusConcluido: {
    background: 'rgba(0,180,120,0.12)',
    color: 'var(--verde-patrocinio)',
  },
  btnAbrir: {
    padding: `${GRID}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--branco-luz)',
    background: 'var(--azul-arena)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  btnAbrirDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
    pointerEvents: 'none',
  },
  noPermission: {
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.75,
    fontStyle: 'italic',
  },
  dicasCard: {
    background: 'rgba(0,180,120,0.06)',
    borderRadius: 'var(--radius)',
    border: '1px solid rgba(0,180,120,0.2)',
    padding: GRID * 3,
    marginBottom: GRID * 4,
  },
  dicasTitle: {
    margin: '0 0 ' + GRID + 'px',
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  dicasList: {
    margin: 0,
    paddingLeft: GRID * 3,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.9,
    lineHeight: 1.6,
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: GRID * 2,
    alignItems: 'center',
  },
  btnPrimary: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--branco-luz)',
    background: 'var(--azul-arena)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  btnPrimaryDisabled: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  btnSecondary: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid rgba(58,58,60,0.25)',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: GRID * 2,
    padding: GRID * 3,
    background: '#FEF2F2',
    border: '1px solid #FECACA',
    borderRadius: 'var(--radius)',
    marginBottom: GRID * 4,
  },
  skeletonStep: {
    padding: GRID * 3,
    borderBottom: '1px solid #eee',
  },
  skeletonLine: {
    height: 16,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
    marginBottom: GRID,
  },
}

function useSetupStatus() {
  const session = getMockSession()
  const counts = getMockCounts()

  const schoolNameFilled = !!(session?.school_name?.trim?.())
  const usersOk = (counts.users_count ?? 0) >= 2
  const teamsOk = (counts.teams_count ?? 0) > 0
  const studentsOk = (counts.students_count ?? 0) > 0
  const financeOk = (counts.invoices_count ?? 0) > 0

  const completed = {
    school_data: schoolNameFilled,
    users: usersOk,
    teams: teamsOk,
    students: studentsOk,
    finance: financeOk,
  }

  const completedCount = Object.values(completed).filter(Boolean).length
  const progressPercent = TOTAL_STEPS > 0 ? Math.round((completedCount / TOTAL_STEPS) * 100) : 0

  const canCompleteSetup = completed.school_data && (completed.teams || completed.students)

  return { completed, completedCount, progressPercent, canCompleteSetup }
}

export default function SchoolSetup() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)

  const session = getMockSession()
  const hasAccess = session != null && session.stage === 'active'
  const role = session?.role ?? 'SchoolOwner'

  const { completed, completedCount, progressPercent, canCompleteSetup } = useSetupStatus()

  useEffect(() => {
    if (!hasAccess) {
      navigate('/login', { replace: true })
      return
    }
  }, [hasAccess, navigate])

  useEffect(() => {
    if (permissionDenied) {
      navigate('/acesso-negado?from=school', { replace: true })
    }
  }, [permissionDenied, navigate])

  const handleCompleteSetup = () => {
    if (!canCompleteSetup) return
    navigate('/school/dashboard', { replace: true })
  }

  const canAccessStep = (stepKey) => {
    const allowed = STEP_PERMISSIONS[stepKey]
    return allowed && allowed.includes(role)
  }

  if (!hasAccess) return null
  if (permissionDenied) return null

  const schoolName = session?.school_name ?? ''

  return (
    <SchoolLayout schoolName={schoolName}>
      <header style={styles.header}>
        <h1 style={styles.title}>Configuração inicial</h1>
        <p style={styles.subtitle}>
          Siga estes passos para começar a usar o sistema.
        </p>
      </header>

      {error && (
        <div style={styles.errorBox} role="alert">
          <div style={{ flex: 1 }}>
            <strong>Erro</strong>
            <p style={{ margin: `${GRID}px 0 0`, fontSize: 14 }}>{error}</p>
            <p style={{ margin: `${GRID}px 0 0`, fontSize: 13, opacity: 0.9 }}>
              Não foi possível carregar o status do setup. Tente novamente.
            </p>
          </div>
        </div>
      )}

      {/* Barra de progresso */}
      <section style={styles.progressBar} aria-label="Progresso do setup">
        <p style={styles.progressText}>
          {completedCount} de {TOTAL_STEPS} concluídos — {progressPercent}%
        </p>
        <div style={styles.progressTrack}>
          <div
            style={{ ...styles.progressFill, width: `${progressPercent}%` }}
            role="progressbar"
            aria-valuenow={progressPercent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${completedCount} de ${TOTAL_STEPS} passos concluídos`}
          />
        </div>
      </section>

      {/* Checklist */}
      <section aria-label="Checklist de configuração">
        <div style={styles.checklistCard}>
          {loading ? (
            <>
              {SETUP_STEPS.map((_, i) => (
                <div key={i} style={styles.skeletonStep}>
                  <div style={{ ...styles.skeletonLine, width: '60%' }} />
                  <div style={{ ...styles.skeletonLine, width: '90%', height: 12 }} />
                </div>
              ))}
            </>
          ) : (
            SETUP_STEPS.map((step, i) => {
              const stepCompleted = completed[step.key]
              const hasPermission = canAccessStep(step.key)
              return (
                <div
                  key={step.key}
                  style={{
                    ...styles.stepItem,
                    ...(i === SETUP_STEPS.length - 1 ? styles.stepItemLast : {}),
                  }}
                >
                  <span
                    style={{
                      ...styles.stepIcon,
                      color: stepCompleted ? 'var(--azul-arena)' : 'var(--cinza-arquibancada)',
                      opacity: stepCompleted ? 1 : 0.6,
                    }}
                    aria-hidden
                  >
                    {stepCompleted ? <IconCheck /> : <IconCircle />}
                  </span>
                  <div style={styles.stepBody}>
                    <h3 style={styles.stepName}>{step.name}</h3>
                    <p style={styles.stepDesc}>{step.description}</p>
                    <div style={styles.stepMeta}>
                      <span
                        style={{
                          ...styles.statusBadge,
                          ...(stepCompleted ? styles.statusConcluido : styles.statusPendente),
                        }}
                      >
                        {stepCompleted ? 'Concluído' : 'Pendente'}
                      </span>
                      {hasPermission ? (
                        <Link
                          to={step.to}
                          style={styles.btnAbrir}
                          className="btn-hover"
                        >
                          Abrir
                        </Link>
                      ) : (
                        <span style={styles.noPermission}>
                          Sem permissão. Fale com o administrador da escola.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </section>

      {/* Dicas rápidas */}
      <section style={styles.dicasCard} aria-label="Dicas rápidas">
        <h2 style={styles.dicasTitle}>Dicas rápidas</h2>
        <ul style={styles.dicasList}>
          <li>Comece criando uma turma</li>
          <li>Depois cadastre alunos</li>
          <li>Registre presenças para acompanhar evolução</li>
        </ul>
      </section>

      {/* Ações finais */}
      <section style={styles.actions}>
        <button
          type="button"
          style={{
            ...styles.btnPrimary,
            ...(canCompleteSetup ? {} : styles.btnPrimaryDisabled),
          }}
          onClick={handleCompleteSetup}
          disabled={!canCompleteSetup}
          aria-disabled={!canCompleteSetup}
        >
          Concluir setup
        </button>
        <Link to="/school/dashboard" style={styles.btnSecondary} className="btn-hover">
          Pular por agora
        </Link>
      </section>
    </SchoolLayout>
  )
}
