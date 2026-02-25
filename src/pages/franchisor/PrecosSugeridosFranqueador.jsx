import { useState, useEffect, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import FranchisorLayout from '../../components/FranchisorLayout'
import {
  getFranchisorMe,
  getSuggestedPricingList,
  getSuggestedPriceById,
  getSuggestedPricingCategories,
  createSuggestedPrice,
  updateSuggestedPrice,
  activateSuggestedPrice,
  inactivateSuggestedPrice,
} from '../../api/franchisorPortal'
import { useDebounce } from '../../hooks/useDebounce'

const GRID = 8
const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
]
const CURRENCIES = [{ value: 'BRL', label: 'BRL' }]
const PERIODICITY_OPTIONS = [
  { value: 'mensal', label: 'Mensal' },
  { value: 'unico', label: 'Único' },
]
const PAGE_SIZES = [10, 25, 50]

const IconSearch = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.35-4.35" />
  </svg>
)
const IconAlert = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
)
const IconMore = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="1.5" />
    <circle cx="12" cy="6" r="1.5" />
    <circle cx="12" cy="18" r="1.5" />
  </svg>
)
const IconChevronLeft = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 18l-6-6 6-6" />
  </svg>
)
const IconChevronRight = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18l6-6-6-6" />
  </svg>
)
const IconClose = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

function formatDateTime(iso) {
  if (!iso) return '—'
  try {
    const d = new Date(iso)
    return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return iso
  }
}

function formatAmount(amount, currency = 'BRL') {
  if (amount == null || amount === '') return '—'
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency || 'BRL',
    minimumFractionDigits: 2,
  }).format(amount)
}

function periodicityLabel(value) {
  const o = PERIODICITY_OPTIONS.find((p) => p.value === value)
  return o ? o.label : value || '—'
}

const styles = {
  section: { marginBottom: GRID * 4 },
  headerRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  searchRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 3,
  },
  searchWrap: {
    position: 'relative',
    flex: '1 1 280px',
    minWidth: 200,
  },
  searchIcon: {
    position: 'absolute',
    left: GRID * 2 + 4,
    top: '50%',
    transform: 'translateY(-50%)',
    color: 'var(--grafite-tecnico)',
    opacity: 0.5,
    pointerEvents: 'none',
  },
  searchInput: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px ${GRID * 1.5}px 40px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    background: 'var(--branco-luz)',
  },
  filtersRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: GRID * 2,
    marginBottom: GRID * 4,
  },
  select: {
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    background: 'var(--branco-luz)',
    color: 'var(--grafite-tecnico)',
    minWidth: 140,
  },
  btnPrimario: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 3}px`,
    background: 'var(--azul-arena)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
    textDecoration: 'none',
  },
  btnSecundario: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: GRID,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--grafite-tecnico)',
    background: 'transparent',
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
  },
  tableWrap: {
    overflowX: 'auto',
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  table: { width: '100%', borderCollapse: 'collapse', fontSize: 14 },
  th: {
    textAlign: 'left',
    padding: `${GRID * 2}px ${GRID * 3}px`,
    fontWeight: 600,
    color: 'var(--grafite-tecnico)',
    borderBottom: '2px solid var(--cinza-arquibancada)',
  },
  td: {
    padding: `${GRID * 2}px ${GRID * 3}px`,
    borderBottom: '1px solid #eee',
    color: 'var(--grafite-tecnico)',
    verticalAlign: 'middle',
  },
  badge: {
    display: 'inline-block',
    padding: `${GRID / 2}px ${GRID * 1.5}px`,
    borderRadius: 8,
    fontSize: 12,
    fontWeight: 600,
    textTransform: 'capitalize',
  },
  statusAtivo: { background: 'rgba(76, 203, 138, 0.2)', color: 'var(--verde-patrocinio)' },
  statusInativo: { background: 'rgba(58, 58, 60, 0.12)', color: 'var(--grafite-tecnico)', opacity: 0.9 },
  actionsCell: { width: 56, textAlign: 'right' },
  btnActions: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 36,
    padding: 0,
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  dropdown: {
    position: 'absolute',
    right: 0,
    top: '100%',
    marginTop: 4,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    border: '1px solid #E5E5E7',
    minWidth: 180,
    zIndex: 50,
    padding: GRID,
  },
  dropdownItem: {
    display: 'block',
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: 'none',
    borderRadius: 8,
    background: 'none',
    textAlign: 'left',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: GRID * 2,
    marginTop: GRID * 3,
    padding: `${GRID * 2} 0`,
  },
  paginationInfo: { fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.9 },
  paginationControls: { display: 'flex', alignItems: 'center', gap: GRID },
  btnPage: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 36,
    height: 36,
    padding: `0 ${GRID}`,
    border: '1px solid #E5E5E7',
    borderRadius: 8,
    background: 'var(--branco-luz)',
    fontSize: 14,
    color: 'var(--grafite-tecnico)',
    cursor: 'pointer',
  },
  btnPageDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  skeleton: {
    height: 20,
    background: 'linear-gradient(90deg, var(--cinza-arquibancada) 25%, #eee 50%, var(--cinza-arquibancada) 75%)',
    backgroundSize: '200% 100%',
    animation: 'shimmer 1.2s ease-in-out infinite',
    borderRadius: 4,
  },
  emptyState: {
    textAlign: 'center',
    padding: GRID * 6,
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow)',
    border: '1px solid rgba(0,0,0,0.04)',
  },
  emptyTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  emptyText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: 'var(--grafite-tecnico)', opacity: 0.85 },
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
  errorIcon: { color: '#DC2626', flexShrink: 0 },
  errorContent: { flex: 1 },
  errorTitle: { margin: '0 0 ' + GRID + 'px', fontSize: 15, fontWeight: 600, color: '#991B1B' },
  errorText: { margin: '0 0 ' + GRID * 2 + 'px', fontSize: 14, color: '#991B1B', opacity: 0.9 },
  btnReload: {
    background: '#DC2626',
    color: '#fff',
    border: 'none',
    padding: `${GRID}px ${GRID * 2}px`,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: 'pointer',
  },
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0,0,0,0.4)',
    zIndex: 1000,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: GRID * 4,
  },
  modal: {
    background: 'var(--branco-luz)',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    maxWidth: 560,
    width: '100%',
    maxHeight: '90vh',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    padding: GRID * 3,
    borderBottom: '1px solid #eee',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: { margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--grafite-tecnico)' },
  modalClose: {
    padding: GRID,
    border: 'none',
    background: 'none',
    cursor: 'pointer',
    color: 'var(--grafite-tecnico)',
    borderRadius: 8,
  },
  modalBody: {
    padding: GRID * 3,
    overflowY: 'auto',
    flex: 1,
  },
  modalFooter: {
    padding: GRID * 3,
    borderTop: '1px solid #eee',
    display: 'flex',
    gap: GRID * 2,
    justifyContent: 'flex-end',
  },
  label: { display: 'block', marginBottom: GRID, fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' },
  input: {
    width: '100%',
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    marginBottom: GRID * 2,
  },
  textarea: {
    width: '100%',
    minHeight: 100,
    padding: `${GRID * 1.5}px ${GRID * 2}px`,
    border: '1px solid #E5E5E7',
    borderRadius: 'var(--radius)',
    fontSize: 14,
    outline: 'none',
    resize: 'vertical',
    marginBottom: GRID * 2,
  },
  toast: {
    position: 'fixed',
    bottom: GRID * 4,
    right: GRID * 4,
    padding: `${GRID * 2}px ${GRID * 3}px`,
    background: 'var(--grafite-tecnico)',
    color: '#fff',
    borderRadius: 'var(--radius)',
    boxShadow: 'var(--shadow-hover)',
    zIndex: 1100,
    fontSize: 14,
    fontWeight: 500,
  },
  toastErro: { background: '#DC2626' },
}

const ALLOWED_ROLES = ['FranchisorOwner', 'FranchisorStaff']

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase()
  const style = s === 'ativo' ? { ...styles.badge, ...styles.statusAtivo } : { ...styles.badge, ...styles.statusInativo }
  return <span style={style}>{status === 'ativo' ? 'Ativo' : 'Inativo'}</span>
}

function SkeletonRow() {
  return (
    <tr>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: '70%' }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 60 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 80 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 50 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 40 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 100 }} /></td>
      <td style={styles.td}><div style={{ ...styles.skeleton, width: 40 }} /></td>
    </tr>
  )
}

function RowActions({ item, onEdit, onActivate, onInactivate }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const isActive = (item.status || '').toLowerCase() === 'ativo'

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) {
      document.addEventListener('click', handleClickOutside)
      return () => document.removeEventListener('click', handleClickOutside)
    }
  }, [open])

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={ref}>
      <button
        type="button"
        style={styles.btnActions}
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
        aria-label="Ações"
        aria-haspopup="true"
        aria-expanded={open}
      >
        <IconMore />
      </button>
      {open && (
        <div style={styles.dropdown} role="menu">
          <button type="button" style={styles.dropdownItem} role="menuitem" onClick={() => { setOpen(false); onEdit(item); }}>
            Editar
          </button>
          {!isActive && (
            <button type="button" style={styles.dropdownItem} role="menuitem" onClick={() => { setOpen(false); onActivate(item); }}>
              Ativar
            </button>
          )}
          {isActive && (
            <button type="button" style={styles.dropdownItem} role="menuitem" onClick={() => { setOpen(false); onInactivate(item); }}>
              Inativar
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function PrecosSugeridosFranqueador() {
  const [searchParams, setSearchParams] = useSearchParams()
  const navigate = useNavigate()

  const searchParam = searchParams.get('search') || ''
  const statusParam = searchParams.get('status') || ''
  const categoryParam = searchParams.get('category') || ''
  const pageParam = parseInt(searchParams.get('page'), 10) || 1
  const pageSizeParam = Math.min(50, Math.max(10, parseInt(searchParams.get('page_size'), 10) || 10))

  const [searchInput, setSearchInput] = useState(searchParam)
  const debouncedSearch = useDebounce(searchInput, 400)

  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [permissionDenied, setPermissionDenied] = useState(false)
  const [initialLoad, setInitialLoad] = useState(true)
  const [toast, setToast] = useState(null)

  const categories = getSuggestedPricingCategories()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalEditingId, setModalEditingId] = useState(null)
  const [modalForm, setModalForm] = useState({
    name: '',
    category: '',
    amount: '',
    currency: 'BRL',
    periodicity: 'unico',
    status: 'inativo',
    notes: '',
  })
  const [modalSaving, setModalSaving] = useState(false)

  const [confirmActivateOpen, setConfirmActivateOpen] = useState(false)
  const [confirmActivateItem, setConfirmActivateItem] = useState(null)
  const [confirmActivateLoading, setConfirmActivateLoading] = useState(false)

  const [confirmInactivateOpen, setConfirmInactivateOpen] = useState(false)
  const [confirmInactivateItem, setConfirmInactivateItem] = useState(null)
  const [confirmInactivateLoading, setConfirmInactivateLoading] = useState(false)

  useEffect(() => {
    const next = new URLSearchParams(searchParams)
    if ((searchParams.get('search') || '') !== debouncedSearch) {
      if (debouncedSearch) next.set('search', debouncedSearch)
      else next.delete('search')
      next.set('page', '1')
      setSearchParams(next, { replace: true })
    }
  }, [debouncedSearch])

  useEffect(() => {
    let cancelled = false
    getFranchisorMe()
      .then((me) => {
        if (!cancelled && !ALLOWED_ROLES.includes(me.user_role)) setPermissionDenied(true)
      })
      .catch(() => { if (!cancelled) setPermissionDenied(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (permissionDenied) return
    let cancelled = false
    setError(null)
    setLoading(true)
    const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
    const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('page_size'), 10) || 10))
    getSuggestedPricingList({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      category: searchParams.get('category') || '',
      page,
      page_size: pageSize,
    })
      .then((res) => {
        if (!cancelled) {
          setItems(res.items || [])
          setTotal(res.total ?? 0)
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || 'Não foi possível carregar os preços sugeridos.')
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
          setInitialLoad(false)
        }
      })
    return () => { cancelled = true }
  }, [permissionDenied, searchParams])

  useEffect(() => {
    if (permissionDenied) navigate('/acesso-negado?from=franchisor', { replace: true })
  }, [permissionDenied, navigate])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 4000)
    return () => clearTimeout(t)
  }, [toast])

  const refetchList = () => {
    const page = Math.max(1, parseInt(searchParams.get('page'), 10) || 1)
    const pageSize = Math.min(50, Math.max(10, parseInt(searchParams.get('page_size'), 10) || 10))
    getSuggestedPricingList({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      category: searchParams.get('category') || '',
      page,
      page_size: pageSize,
    })
      .then((res) => {
        setItems(res.items || [])
        setTotal(res.total ?? 0)
      })
      .catch(() => {})
  }

  const openNewModal = () => {
    setModalEditingId(null)
    setModalForm({
      name: '',
      category: '',
      amount: '',
      currency: 'BRL',
      periodicity: 'unico',
      status: 'inativo',
      notes: '',
    })
    setModalOpen(true)
  }

  const openEditModal = async (item) => {
    setModalEditingId(item.id)
    try {
      const full = await getSuggestedPriceById(item.id)
      if (full) {
        setModalForm({
          name: full.name || '',
          category: full.category || '',
          amount: full.amount != null ? String(full.amount) : '',
          currency: full.currency || 'BRL',
          periodicity: (full.periodicity || 'unico').toLowerCase() === 'mensal' ? 'mensal' : 'unico',
          status: (full.status || 'inativo').toLowerCase(),
          notes: full.notes || '',
        })
        setModalOpen(true)
      }
    } catch {
      setToast('Não foi possível carregar o preço.')
    }
  }

  const handleSaveModal = async () => {
    const name = (modalForm.name || '').trim()
    if (!name) {
      setToast('Preencha o nome do item.')
      return
    }
    const amount = parseFloat(modalForm.amount)
    if (isNaN(amount) || amount < 0) {
      setToast('Valor sugerido deve ser maior ou igual a zero.')
      return
    }
    setModalSaving(true)
    try {
      const payload = {
        name,
        category: (modalForm.category || '').trim() || undefined,
        amount,
        currency: (modalForm.currency || 'BRL').trim().toUpperCase(),
        periodicity: modalForm.periodicity,
        status: modalForm.status,
        notes: (modalForm.notes || '').trim() || undefined,
      }
      if (modalEditingId) {
        await updateSuggestedPrice(modalEditingId, payload)
        setToast('Preço sugerido salvo com sucesso!')
      } else {
        await createSuggestedPrice(payload)
        setToast('Preço sugerido salvo com sucesso!')
      }
      setModalOpen(false)
      refetchList()
    } catch {
      setToast('Não foi possível salvar. Verifique os campos e tente novamente.')
    } finally {
      setModalSaving(false)
    }
  }

  const openConfirmActivate = (item) => {
    setConfirmActivateItem(item)
    setConfirmActivateOpen(true)
  }

  const openConfirmInactivate = (item) => {
    setConfirmInactivateItem(item)
    setConfirmInactivateOpen(true)
  }

  const handleConfirmActivate = async () => {
    if (!confirmActivateItem) return
    setConfirmActivateLoading(true)
    try {
      await activateSuggestedPrice(confirmActivateItem.id)
      setToast('Item ativado.')
      setConfirmActivateOpen(false)
      setConfirmActivateItem(null)
      refetchList()
    } catch {
      setToast('Não foi possível ativar. Tente novamente.')
    } finally {
      setConfirmActivateLoading(false)
    }
  }

  const handleConfirmInactivate = async () => {
    if (!confirmInactivateItem) return
    setConfirmInactivateLoading(true)
    try {
      await inactivateSuggestedPrice(confirmInactivateItem.id)
      setToast('Item inativado. Ele não aparecerá mais como sugestão.')
      setConfirmInactivateOpen(false)
      setConfirmInactivateItem(null)
      refetchList()
    } catch {
      setToast('Não foi possível inativar. Tente novamente.')
    } finally {
      setConfirmInactivateLoading(false)
    }
  }

  const setPage = (p) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(Math.max(1, p)))
    setSearchParams(next, { replace: true })
  }

  const setPageSize = (size) => {
    const next = new URLSearchParams(searchParams)
    next.set('page_size', String(size))
    next.set('page', '1')
    setSearchParams(next, { replace: true })
  }

  const clearFilters = () => {
    setSearchInput('')
    const next = new URLSearchParams()
    next.set('page', '1')
    if (pageSizeParam) next.set('page_size', String(pageSizeParam))
    setSearchParams(next, { replace: true })
  }

  const totalPages = Math.max(1, Math.ceil(total / pageSizeParam))
  const currentPage = Math.min(pageParam, totalPages)
  const hasFilters =
    (searchParams.get('search') || '').trim() ||
    (searchParams.get('status') || '').trim() ||
    (searchParams.get('category') || '').trim()

  const breadcrumb = [
    { label: 'Dashboard', to: '/franchisor/dashboard' },
    { label: 'Padrões' },
    { label: 'Preços sugeridos' },
  ]

  if (permissionDenied) return null

  return (
    <FranchisorLayout pageTitle="Preços sugeridos" breadcrumb={breadcrumb}>
      <section style={styles.section} aria-label="Preços sugeridos">
        <div style={styles.headerRow}>
          <div style={{ ...styles.searchRow, marginBottom: 0, flex: '1 1 280px' }}>
            <div style={styles.searchWrap}>
              <span style={styles.searchIcon} aria-hidden="true"><IconSearch /></span>
              <input
                type="search"
                placeholder="Buscar por nome do item"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                style={styles.searchInput}
                aria-label="Buscar por nome do item"
              />
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: GRID * 2 }}>
            <Link to="/franchisor/standards/library" style={styles.btnSecundario}>
              Ver histórico
            </Link>
            <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={openNewModal}>
              Novo preço
            </button>
          </div>
        </div>

        <div style={styles.filtersRow}>
          <label htmlFor="filtro-status-pricing" style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' }}>
            Status
          </label>
          <select
            id="filtro-status-pricing"
            value={statusParam}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('status', e.target.value)
              else next.delete('status')
              next.set('page', '1')
              setSearchParams(next, { replace: true })
            }}
            style={styles.select}
            aria-label="Filtrar por status"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value || 'todos'} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <label htmlFor="filtro-categoria-pricing" style={{ fontSize: 14, fontWeight: 500, color: 'var(--grafite-tecnico)' }}>
            Categoria
          </label>
          <select
            id="filtro-categoria-pricing"
            value={categoryParam}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams)
              if (e.target.value) next.set('category', e.target.value)
              else next.delete('category')
              next.set('page', '1')
              setSearchParams(next, { replace: true })
            }}
            style={styles.select}
            aria-label="Filtrar por categoria"
          >
            <option value="">Todas</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          {hasFilters && (
            <button type="button" style={styles.btnSecundario} onClick={clearFilters}>
              Limpar filtros
            </button>
          )}
        </div>

        {error && (
          <div style={styles.errorBox} role="alert">
            <span style={styles.errorIcon}><IconAlert /></span>
            <div style={styles.errorContent}>
              <div style={styles.errorTitle}>Erro</div>
              <div style={styles.errorText}>{error}</div>
              <button type="button" style={styles.btnReload} onClick={() => window.location.reload()}>
                Recarregar
              </button>
            </div>
          </div>
        )}

        {!error && (
          <div style={styles.tableWrap}>
            {loading ? (
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Item</th>
                    <th style={styles.th}>Categoria</th>
                    <th style={styles.th}>Valor sugerido</th>
                    <th style={styles.th}>Periodicidade</th>
                    <th style={styles.th}>Status</th>
                    <th style={styles.th}>Última atualização</th>
                    <th style={styles.actionsCell} />
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
                </tbody>
              </table>
            ) : items.length === 0 ? (
              <div style={styles.emptyState}>
                <h2 style={styles.emptyTitle}>Nenhum preço sugerido cadastrado.</h2>
                <p style={styles.emptyText}>
                  {initialLoad && !hasFilters
                    ? 'Cadastre um preço sugerido para orientar suas escolas.'
                    : 'Nenhum item encontrado com os filtros atuais.'}
                </p>
                {initialLoad && !hasFilters && (
                  <button type="button" style={styles.btnPrimario} className="btn-hover" onClick={openNewModal}>
                    Novo preço
                  </button>
                )}
              </div>
            ) : (
              <>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Item</th>
                      <th style={styles.th}>Categoria</th>
                      <th style={styles.th}>Valor sugerido</th>
                      <th style={styles.th}>Periodicidade</th>
                      <th style={styles.th}>Status</th>
                      <th style={styles.th}>Última atualização</th>
                      <th style={styles.actionsCell} aria-label="Ações" />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((row) => (
                      <tr key={row.id}>
                        <td style={styles.td}>{row.name}</td>
                        <td style={styles.td}>{row.category || '—'}</td>
                        <td style={styles.td}>{formatAmount(row.amount, row.currency)}</td>
                        <td style={styles.td}>{periodicityLabel(row.periodicity)}</td>
                        <td style={styles.td}><StatusBadge status={row.status} /></td>
                        <td style={styles.td}>{formatDateTime(row.updated_at)}</td>
                        <td style={styles.td}>
                          <RowActions
                            item={row}
                            onEdit={openEditModal}
                            onActivate={openConfirmActivate}
                            onInactivate={openConfirmInactivate}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={styles.footer}>
                  <div style={styles.paginationInfo}>
                    {total} {total === 1 ? 'item' : 'itens'}
                    {totalPages > 1 && ` · Página ${currentPage} de ${totalPages}`}
                  </div>
                  <div style={styles.paginationControls}>
                    <button
                      type="button"
                      style={{ ...styles.btnPage, ...(currentPage <= 1 ? styles.btnPageDisabled : {}) }}
                      onClick={() => setPage(currentPage - 1)}
                      disabled={currentPage <= 1}
                      aria-label="Página anterior"
                    >
                      <IconChevronLeft />
                    </button>
                    <span style={{ padding: `0 ${GRID}`, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                      {currentPage} / {totalPages}
                    </span>
                    <button
                      type="button"
                      style={{ ...styles.btnPage, ...(currentPage >= totalPages ? styles.btnPageDisabled : {}) }}
                      onClick={() => setPage(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      aria-label="Próxima página"
                    >
                      <IconChevronRight />
                    </button>
                    <label htmlFor="page-size-pricing" style={{ marginLeft: GRID * 2, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                      Itens por página
                    </label>
                    <select
                      id="page-size-pricing"
                      value={pageSizeParam}
                      onChange={(e) => setPageSize(Number(e.target.value))}
                      style={{ ...styles.select, marginLeft: GRID, minWidth: 70 }}
                      aria-label="Itens por página"
                    >
                      {PAGE_SIZES.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Modal Novo/Editar preço */}
        {modalOpen && (
          <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="modal-edit-pricing-title">
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 id="modal-edit-pricing-title" style={styles.modalTitle}>
                  {modalEditingId ? 'Editar preço' : 'Novo preço'}
                </h2>
                <button
                  type="button"
                  style={styles.modalClose}
                  onClick={() => setModalOpen(false)}
                  aria-label="Fechar"
                >
                  <IconClose />
                </button>
              </div>
              <div style={styles.modalBody}>
                <label htmlFor="modal-name" style={styles.label}>Nome do item (obrigatório)</label>
                <input
                  id="modal-name"
                  type="text"
                  value={modalForm.name}
                  onChange={(e) => setModalForm((f) => ({ ...f, name: e.target.value }))}
                  style={styles.input}
                  placeholder="Ex.: Mensalidade padrão, Matrícula"
                />
                <label htmlFor="modal-category" style={styles.label}>Categoria (opcional)</label>
                <select
                  id="modal-category"
                  value={modalForm.category}
                  onChange={(e) => setModalForm((f) => ({ ...f, category: e.target.value }))}
                  style={styles.select}
                >
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <label htmlFor="modal-amount" style={{ ...styles.label, marginTop: GRID * 2 }}>Valor sugerido (obrigatório, &gt;= 0)</label>
                <input
                  id="modal-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={modalForm.amount}
                  onChange={(e) => setModalForm((f) => ({ ...f, amount: e.target.value }))}
                  style={styles.input}
                  placeholder="0,00"
                />
                <label htmlFor="modal-currency" style={styles.label}>Moeda (obrigatório)</label>
                <select
                  id="modal-currency"
                  value={modalForm.currency}
                  onChange={(e) => setModalForm((f) => ({ ...f, currency: e.target.value }))}
                  style={styles.select}
                >
                  {CURRENCIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
                <label htmlFor="modal-periodicity" style={styles.label}>Periodicidade (opcional)</label>
                <select
                  id="modal-periodicity"
                  value={modalForm.periodicity}
                  onChange={(e) => setModalForm((f) => ({ ...f, periodicity: e.target.value }))}
                  style={styles.select}
                >
                  {PERIODICITY_OPTIONS.map((p) => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <label htmlFor="modal-status" style={styles.label}>Status (obrigatório)</label>
                <select
                  id="modal-status"
                  value={modalForm.status}
                  onChange={(e) => setModalForm((f) => ({ ...f, status: e.target.value }))}
                  style={styles.select}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
                <label htmlFor="modal-notes" style={styles.label}>Observações (opcional)</label>
                <textarea
                  id="modal-notes"
                  value={modalForm.notes}
                  onChange={(e) => setModalForm((f) => ({ ...f, notes: e.target.value }))}
                  style={styles.textarea}
                  placeholder="Observações internas"
                />
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnSecundario} onClick={() => setModalOpen(false)} disabled={modalSaving}>
                  Cancelar
                </button>
                <button type="button" style={styles.btnPrimario} onClick={handleSaveModal} disabled={modalSaving} className="btn-hover">
                  {modalSaving ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmação Ativar */}
        {confirmActivateOpen && confirmActivateItem && (
          <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-activate-pricing-title">
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 id="confirm-activate-pricing-title" style={styles.modalTitle}>Ativar este item?</h2>
                <button type="button" style={styles.modalClose} onClick={() => { setConfirmActivateOpen(false); setConfirmActivateItem(null); }} aria-label="Fechar">
                  <IconClose />
                </button>
              </div>
              <div style={styles.modalBody}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                  O item voltará a aparecer como sugestão para as escolas.
                </p>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnSecundario} onClick={() => { setConfirmActivateOpen(false); setConfirmActivateItem(null); }} disabled={confirmActivateLoading}>
                  Cancelar
                </button>
                <button type="button" style={styles.btnPrimario} onClick={handleConfirmActivate} disabled={confirmActivateLoading} className="btn-hover">
                  {confirmActivateLoading ? 'Ativando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmação Inativar */}
        {confirmInactivateOpen && confirmInactivateItem && (
          <div style={styles.overlay} role="dialog" aria-modal="true" aria-labelledby="confirm-inactivate-pricing-title">
            <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
              <div style={styles.modalHeader}>
                <h2 id="confirm-inactivate-pricing-title" style={styles.modalTitle}>Inativar este item?</h2>
                <button type="button" style={styles.modalClose} onClick={() => { setConfirmInactivateOpen(false); setConfirmInactivateItem(null); }} aria-label="Fechar">
                  <IconClose />
                </button>
              </div>
              <div style={styles.modalBody}>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--grafite-tecnico)' }}>
                  Ele não aparecerá mais como sugestão para as escolas. O histórico não será apagado.
                </p>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" style={styles.btnSecundario} onClick={() => { setConfirmInactivateOpen(false); setConfirmInactivateItem(null); }} disabled={confirmInactivateLoading}>
                  Cancelar
                </button>
                <button type="button" style={styles.btnPrimario} onClick={handleConfirmInactivate} disabled={confirmInactivateLoading} className="btn-hover">
                  {confirmInactivateLoading ? 'Inativando...' : 'Confirmar'}
                </button>
              </div>
            </div>
          </div>
        )}

        {toast && (
          <div
            style={{
              ...styles.toast,
              ...(toast.includes('Não foi') ? styles.toastErro : {}),
            }}
            role="status"
            aria-live="polite"
          >
            {toast}
          </div>
        )}
      </section>
    </FranchisorLayout>
  )
}
