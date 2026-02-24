import { Routes, Route, Navigate } from 'react-router-dom'
import AdminDashboard from './pages/AdminDashboard'
import ListaFranqueadores from './pages/admin/ListaFranqueadores'
import ListaEscolas from './pages/admin/ListaEscolas'
import NovoFranqueador from './pages/admin/NovoFranqueador'
import DetalheFranqueador from './pages/admin/DetalheFranqueador'
import AlterarStatusFranqueador from './pages/admin/AlterarStatusFranqueador'
import UsuariosFranqueador from './pages/admin/UsuariosFranqueador'
import NovoUsuarioFranqueador from './pages/admin/NovoUsuarioFranqueador'
import EditarUsuarioFranqueador from './pages/admin/EditarUsuarioFranqueador'
import NovaEscola from './pages/admin/NovaEscola'
import DetalheEscola from './pages/admin/DetalheEscola'
import AlterarStatusEscola from './pages/admin/AlterarStatusEscola'
import UsuariosEscola from './pages/admin/UsuariosEscola'
import NovoUsuarioEscola from './pages/admin/NovoUsuarioEscola'
import EditarUsuarioEscola from './pages/admin/EditarUsuarioEscola'
import AcessoNegado from './pages/AcessoNegado'
import ListaPlanos from './pages/admin/ListaPlanos'
import CriarEditarPlano from './pages/admin/CriarEditarPlano'
import ListaAssinaturas from './pages/admin/ListaAssinaturas'
import DetalheAssinatura from './pages/admin/DetalheAssinatura'
import LogsAuditoria from './pages/admin/LogsAuditoria'
import DetalheEventoAuditoria from './pages/admin/DetalheEventoAuditoria'
import CentralSuporte from './pages/admin/CentralSuporte'
import DetalheTicket from './pages/admin/DetalheTicket'
import CategoriasSuporte from './pages/admin/CategoriasSuporte'
import ConfiguracoesSistema from './pages/admin/ConfiguracoesSistema'
import FinanceiroGlobal from './pages/admin/FinanceiroGlobal'
import InadimplenciaGlobal from './pages/admin/InadimplenciaGlobal'
import ListaTemplates from './pages/admin/ListaTemplates'
import DetalheTemplate from './pages/admin/DetalheTemplate'
import RelatoriosEstrategicos from './pages/admin/RelatoriosEstrategicos'
import Exports from './pages/admin/Exports'
import ExportNew from './pages/admin/ExportNew'
import ExportDetail from './pages/admin/ExportDetail'
import FranchisorDashboard from './pages/franchisor/FranchisorDashboard'
import ListaEscolasFranqueador from './pages/franchisor/ListaEscolasFranqueador'
import DetalheEscolaFranqueador from './pages/franchisor/DetalheEscolaFranqueador'
import FranchisorReports from './pages/franchisor/FranchisorReports'
import FranchisorFinance from './pages/franchisor/FranchisorFinance'
import Perfil from './pages/Perfil'

export default function App() {
  return (
    <Routes>
      {/* Portal Franqueador */}
      <Route path="/franchisor/dashboard" element={<FranchisorDashboard />} />
      <Route path="/franchisor/schools" element={<ListaEscolasFranqueador />} />
      <Route path="/franchisor/schools/:school_id" element={<DetalheEscolaFranqueador />} />
      <Route path="/franchisor/reports" element={<FranchisorReports />} />
      <Route path="/franchisor/finance" element={<FranchisorFinance />} />

      <Route path="/admin/dashboard" element={<AdminDashboard />} />
      <Route path="/admin/settings" element={<ConfiguracoesSistema />} />
      <Route path="/admin/templates" element={<ListaTemplates />} />
      <Route path="/admin/templates/:template_id" element={<DetalheTemplate />} />
      <Route path="/admin/audit-logs" element={<LogsAuditoria />} />
      <Route path="/admin/audit-logs/:audit_event_id" element={<DetalheEventoAuditoria />} />
      <Route path="/admin/support" element={<CentralSuporte />} />
      <Route path="/admin/support/categories" element={<CategoriasSuporte />} />
      <Route path="/admin/support/:ticketId" element={<DetalheTicket />} />
      <Route path="/admin/plans" element={<ListaPlanos />} />
      <Route path="/admin/plans/new" element={<CriarEditarPlano />} />
      <Route path="/admin/plans/:planId/edit" element={<CriarEditarPlano />} />
      <Route path="/admin/subscriptions" element={<ListaAssinaturas />} />
      <Route path="/admin/subscriptions/:subscriptionId" element={<DetalheAssinatura />} />
      <Route path="/admin/finance/global" element={<FinanceiroGlobal />} />
      <Route path="/admin/finance/delinquency" element={<InadimplenciaGlobal />} />
      <Route path="/admin/reports/strategic" element={<RelatoriosEstrategicos />} />
      <Route path="/admin/exports" element={<Exports />} />
      <Route path="/admin/exports/new" element={<ExportNew />} />
      <Route path="/admin/exports/:export_id" element={<ExportDetail />} />
      <Route path="/admin/franqueadores" element={<ListaFranqueadores />} />
      <Route path="/admin/escolas" element={<ListaEscolas />} />
      <Route path="/admin/franqueadores/novo" element={<NovoFranqueador />} />
      <Route path="/admin/franqueadores/editar/:id" element={<NovoFranqueador />} />
      <Route path="/admin/franqueadores/:id/usuarios/novo" element={<NovoUsuarioFranqueador />} />
      <Route path="/admin/franqueadores/:id/usuarios/:userId/editar" element={<EditarUsuarioFranqueador />} />
      <Route path="/admin/franqueadores/:id/usuarios" element={<UsuariosFranqueador />} />
      <Route path="/admin/franqueadores/:id" element={<DetalheFranqueador />} />
      <Route path="/admin/franqueadores/:id/status" element={<AlterarStatusFranqueador />} />
      <Route path="/admin/escolas/nova" element={<NovaEscola />} />
      <Route path="/admin/escolas/editar/:id" element={<NovaEscola />} />
      <Route path="/admin/escolas/:id/usuarios/novo" element={<NovoUsuarioEscola />} />
      <Route path="/admin/escolas/:id/usuarios/:userId/editar" element={<EditarUsuarioEscola />} />
      <Route path="/admin/escolas/:id/usuarios" element={<UsuariosEscola />} />
      <Route path="/admin/escolas/:id" element={<DetalheEscola />} />
      <Route path="/admin/escolas/:id/status" element={<AlterarStatusEscola />} />
      <Route path="/acesso-negado" element={<AcessoNegado />} />
      <Route path="/perfil" element={<Perfil />} />
      <Route path="/" element={<Navigate to="/admin/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
    </Routes>
  )
}
