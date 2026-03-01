import { Link } from 'react-router-dom'

const GRID = 8

const styles = {
  page: {
    minHeight: '100vh',
    background: 'var(--cinza-arquibancada)',
    color: 'var(--grafite-tecnico)',
  },
  header: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    background: 'var(--branco-luz)',
    boxShadow: 'var(--shadow)',
    padding: `${GRID * 2}px ${GRID * 5}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: GRID * 2,
  },
  logo: {
    fontSize: 20,
    fontWeight: 700,
    color: 'var(--azul-arena)',
    letterSpacing: '-0.02em',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: GRID * 4,
    flexWrap: 'wrap',
  },
  navLink: {
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    textDecoration: 'none',
    opacity: 0.9,
  },
  navLinkHover: {
    color: 'var(--azul-arena)',
  },
  btnPrimary: {
    padding: `${GRID * 2}px ${GRID * 4}`,
    fontSize: 14,
    fontWeight: 600,
    color: 'var(--branco-luz)',
    background: 'var(--azul-arena)',
    border: 'none',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    textDecoration: 'none',
    display: 'inline-block',
    transition: 'filter 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
  },
  hero: {
    padding: `${GRID * 16 + 56}px ${GRID * 5}px ${GRID * 12}px`,
    maxWidth: 720,
    margin: '0 auto',
    textAlign: 'center',
  },
  heroTitle: {
    margin: 0,
    fontSize: 36,
    fontWeight: 700,
    letterSpacing: '-0.03em',
    lineHeight: 1.2,
    color: 'var(--grafite-tecnico)',
  },
  heroSubtitle: {
    margin: `${GRID * 3}px 0 ${GRID * 5}px`,
    fontSize: 18,
    lineHeight: 1.5,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  heroCta: {
    marginTop: GRID * 2,
  },
  heroAux: {
    marginTop: GRID * 3,
    fontSize: 13,
    color: 'var(--grafite-tecnico)',
    opacity: 0.75,
  },
  section: {
    padding: `${GRID * 8}px ${GRID * 5}px`,
    maxWidth: 960,
    margin: '0 auto',
  },
  sectionTitle: {
    margin: `0 0 ${GRID * 5}px`,
    fontSize: 26,
    fontWeight: 700,
    letterSpacing: '-0.02em',
    color: 'var(--grafite-tecnico)',
    textAlign: 'center',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: GRID * 4,
  },
  featureCard: {
    background: 'var(--branco-luz)',
    padding: GRID * 4,
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  featureTitle: {
    margin: '0 0 8px',
    fontSize: 16,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  planCard: {
    maxWidth: 400,
    margin: '0 auto',
    background: 'var(--branco-luz)',
    padding: GRID * 6,
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '2px solid var(--azul-arena)',
    textAlign: 'center',
  },
  planName: {
    margin: '0 0 8px',
    fontSize: 22,
    fontWeight: 700,
    color: 'var(--grafite-tecnico)',
  },
  planPrice: {
    margin: `${GRID * 2}px 0`,
    fontSize: 40,
    fontWeight: 800,
    color: 'var(--azul-arena)',
    letterSpacing: '-0.02em',
  },
  planPeriod: {
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    opacity: 0.8,
    marginBottom: GRID * 4,
  },
  planList: {
    listStyle: 'none',
    padding: 0,
    margin: `0 0 ${GRID * 4}px`,
    textAlign: 'left',
  },
  planListItem: {
    padding: `${GRID}px 0`,
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    display: 'flex',
    alignItems: 'center',
    gap: GRID,
  },
  planCheck: {
    color: 'var(--verde-patrocinio)',
    fontWeight: 700,
  },
  faqList: {
    maxWidth: 640,
    margin: '0 auto',
    listStyle: 'none',
    padding: 0,
  },
  faqItem: {
    marginBottom: GRID * 3,
    background: 'var(--branco-luz)',
    padding: GRID * 4,
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  faqQuestion: {
    margin: '0 0 8px',
    fontSize: 15,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
  },
  faqAnswer: {
    margin: 0,
    fontSize: 14,
    lineHeight: 1.5,
    color: 'var(--grafite-tecnico)',
    opacity: 0.85,
  },
  footer: {
    padding: `${GRID * 6}px ${GRID * 5}px`,
    background: 'var(--grafite-tecnico)',
    color: 'var(--branco-luz)',
    textAlign: 'center',
    marginTop: GRID * 8,
  },
  footerBrand: {
    margin: '0 0 8px',
    fontSize: 16,
    fontWeight: 600,
    opacity: 0.95,
  },
  footerLink: {
    fontSize: 14,
    color: 'var(--branco-luz)',
    textDecoration: 'none',
    opacity: 0.9,
  },
}

const FEATURES = [
  'Gestão de alunos',
  'Gestão de turmas',
  'Controle de presença',
  'Avaliações',
  'Financeiro (mensalidades e inadimplência)',
  'Comunicação interna',
]

const FAQ_ITEMS = [
  {
    q: 'Como funciona o pagamento?',
    a: 'O pagamento é feito de forma segura após o cadastro. Você será direcionado ao checkout e pode pagar com cartão ou PIX.',
  },
  {
    q: 'Quando tenho acesso?',
    a: 'O acesso é liberado imediatamente após a confirmação do pagamento.',
  },
  {
    q: 'Posso cancelar?',
    a: 'Sim. Você pode cancelar sua assinatura a qualquer momento, sem multa.',
  },
]

function scrollToId(id) {
  const el = document.getElementById(id)
  if (el) el.scrollIntoView({ behavior: 'smooth' })
}

export default function LandingPage() {
  return (
    <div style={styles.page}>
      {/* Header fixo */}
      <header style={styles.header}>
        <Link to="/" style={styles.logo}>
          Esportes Academy
        </Link>
        <nav style={styles.nav}>
          <a
            href="#funcionalidades"
            style={styles.navLink}
            onClick={(e) => {
              e.preventDefault()
              scrollToId('funcionalidades')
            }}
          >
            Funcionalidades
          </a>
          <a
            href="#plano"
            style={styles.navLink}
            onClick={(e) => {
              e.preventDefault()
              scrollToId('plano')
            }}
          >
            Plano
          </a>
          <Link to="/login" style={styles.navLink}>
            Login
          </Link>
          <Link to="/signup" style={styles.btnPrimary} className="btn-hover">
            Começar agora
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <h1 style={styles.heroTitle}>
          Gerencie sua escola esportiva de forma simples.
        </h1>
        <p style={styles.heroSubtitle}>
          Controle alunos, turmas, presença e financeiro em um só lugar.
        </p>
        <div style={styles.heroCta}>
          <Link to="/signup" style={styles.btnPrimary} className="btn-hover">
            Comprar por R$ 147,00
          </Link>
        </div>
        <p style={styles.heroAux}>Acesso imediato após pagamento.</p>
      </section>

      {/* Funcionalidades */}
      <section id="funcionalidades" style={styles.section}>
        <h2 style={styles.sectionTitle}>Funcionalidades</h2>
        <div style={styles.featuresGrid}>
          {FEATURES.map((label) => (
            <div key={label} style={styles.featureCard}>
              <h3 style={styles.featureTitle}>{label}</h3>
            </div>
          ))}
        </div>
      </section>

      {/* Plano */}
      <section id="plano" style={styles.section}>
        <h2 style={styles.sectionTitle}>Plano</h2>
        <div style={styles.planCard}>
          <h3 style={styles.planName}>Plano Escola</h3>
          <div style={styles.planPrice}>R$ 147,00</div>
          <p style={styles.planPeriod}>mensal</p>
          <ul style={styles.planList}>
            <li style={styles.planListItem}>
              <span style={styles.planCheck}>✓</span> Todas as funcionalidades
            </li>
            <li style={styles.planListItem}>
              <span style={styles.planCheck}>✓</span> Usuários ilimitados
            </li>
            <li style={styles.planListItem}>
              <span style={styles.planCheck}>✓</span> Suporte básico
            </li>
          </ul>
          <Link to="/signup" style={styles.btnPrimary} className="btn-hover">
            Comprar por R$ 147,00
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Perguntas frequentes</h2>
        <ul style={styles.faqList}>
          {FAQ_ITEMS.map((item) => (
            <li key={item.q} style={styles.faqItem}>
              <p style={styles.faqQuestion}>{item.q}</p>
              <p style={styles.faqAnswer}>{item.a}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <p style={styles.footerBrand}>Esportes Academy</p>
        <Link to="/login" style={styles.footerLink}>
          Login
        </Link>
      </footer>
    </div>
  )
}
