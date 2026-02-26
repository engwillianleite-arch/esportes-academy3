import { Link, useLocation, useParams } from 'react-router-dom'
import SchoolLayout from '../../components/SchoolLayout'

const GRID = 8

const titles = {
  invoices: 'Mensalidades',
  overdue: 'Inadimplência',
  'payments/new': 'Registrar pagamento',
  invoiceDetail: 'Mensalidade',
}

export default function SchoolFinancePlaceholder() {
  const { pathname } = useLocation()
  const { invoiceId } = useParams()
  let pageTitle = 'Financeiro'
  if (invoiceId) pageTitle = titles.invoiceDetail
  else if (pathname.includes('overdue')) pageTitle = titles.overdue
  else if (pathname.includes('payments/new')) pageTitle = titles['payments/new']
  else if (pathname.includes('invoices')) pageTitle = titles.invoices

  return (
    <SchoolLayout schoolName="" pageTitle={pageTitle}>
      <div style={{
        textAlign: 'center',
        padding: GRID * 6,
        background: 'var(--branco-luz)',
        borderRadius: 'var(--radius)',
        boxShadow: 'var(--shadow)',
      }}>
        <p style={{ margin: '0 0 ' + GRID * 2 + 'px', fontSize: 16, color: 'var(--grafite-tecnico)', opacity: 0.9 }}>
          Esta tela está em construção.
        </p>
        <Link to="/school/finance" style={{ color: 'var(--azul-arena)', fontWeight: 500, textDecoration: 'none' }}>
          Voltar ao Financeiro
        </Link>
      </div>
    </SchoolLayout>
  )
}
