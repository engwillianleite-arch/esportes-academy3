import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import Login from './pages/Login'
import ForgotPassword from './pages/ForgotPassword'
import SelectAccess from './pages/SelectAccess'
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
import CriarEditarEscolaFranqueador from './pages/franchisor/CriarEditarEscolaFranqueador'
import OnboardingEscolaFranqueador from './pages/franchisor/OnboardingEscolaFranqueador'
import FranchisorReports from './pages/franchisor/FranchisorReports'
import FranchisorReportDetail from './pages/franchisor/FranchisorReportDetail'
import FranchisorFinance from './pages/franchisor/FranchisorFinance'
import FranchisorFinanceSchoolDetail from './pages/franchisor/FranchisorFinanceSchoolDetail'
import PadroesMetodologiaFranqueador from './pages/franchisor/PadroesMetodologiaFranqueador'
import PrecosSugeridosFranqueador from './pages/franchisor/PrecosSugeridosFranqueador'
import BibliotecaPadroesFranqueador from './pages/franchisor/BibliotecaPadroesFranqueador'
import DetalheBibliotecaPadraoFranqueador from './pages/franchisor/DetalheBibliotecaPadraoFranqueador'
import ListaCampanhasFranqueador from './pages/franchisor/ListaCampanhasFranqueador'
import DetalheCampanhaFranqueador from './pages/franchisor/DetalheCampanhaFranqueador'
import ResultadosCampanhaFranqueador from './pages/franchisor/ResultadosCampanhaFranqueador'
import CriarEditarCampanhaFranqueador from './pages/franchisor/CriarEditarCampanhaFranqueador'
import FranchisorExports from './pages/franchisor/FranchisorExports'
import FranchisorExportNew from './pages/franchisor/FranchisorExportNew'
import FranchisorExportDetail from './pages/franchisor/FranchisorExportDetail'
import UsuariosFranqueadorPortal from './pages/franchisor/UsuariosFranqueador'
import CriarEditarUsuarioFranqueador from './pages/franchisor/CriarEditarUsuarioFranqueador'
import PermissoesFranqueador from './pages/franchisor/PermissoesFranqueador'
import FranchisorSettingsProfile from './pages/franchisor/FranchisorSettingsProfile'
import MeuPerfil from './pages/MeuPerfil'
import SchoolDashboard from './pages/school/SchoolDashboard'
import SchoolStudents from './pages/school/SchoolStudents'
import SchoolStudentDetail from './pages/school/SchoolStudentDetail'
import SchoolStudentCreateEdit from './pages/school/SchoolStudentCreateEdit'
import SchoolPlaceholder from './pages/school/SchoolPlaceholder'
import SchoolTrainings from './pages/school/SchoolTrainings'

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Telas compartilhadas (entrada única) */}
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/select-access" element={<SelectAccess />} />

        {/* Portal Escola — destino pós-login quando portal = SCHOOL */}
        <Route path="/school/dashboard" element={<SchoolDashboard />} />
        <Route path="/school/students" element={<SchoolStudents />} />
        <Route path="/school/students/new" element={<SchoolStudentCreateEdit />} />
        <Route path="/school/students/:studentId" element={<SchoolStudentDetail />} />
        <Route path="/school/students/:studentId/edit" element={<SchoolStudentCreateEdit />} />
        <Route path="/school/teams" element={<SchoolPlaceholder />} />
        <Route path="/school/trainings" element={<SchoolTrainings />} />
        <Route path="/school/trainings/new" element={<SchoolPlaceholder />} />
        <Route path="/school/trainings/:trainingId" element={<SchoolPlaceholder />} />
        <Route path="/school/trainings/:trainingId/edit" element={<SchoolPlaceholder />} />
        <Route path="/school/attendance" element={<SchoolPlaceholder />} />
        <Route path="/school/finance" element={<SchoolPlaceholder />} />
        <Route path="/school/events" element={<SchoolPlaceholder />} />

        {/* Portal Franqueador */}
      <Route path="/franchisor/dashboard" element={<FranchisorDashboard />} />
      <Route path="/franchisor/schools" element={<ListaEscolasFranqueador />} />
      <Route path="/franchisor/schools/new" element={<CriarEditarEscolaFranqueador />} />
      <Route path="/franchisor/schools/:school_id/edit" element={<CriarEditarEscolaFranqueador />} />
      <Route path="/franchisor/schools/:school_id/onboarding" element={<OnboardingEscolaFranqueador />} />
      <Route path="/franchisor/schools/:school_id" element={<DetalheEscolaFranqueador />} />
      <Route path="/franchisor/reports" element={<FranchisorReports />} />
      <Route path="/franchisor/reports/:school_id" element={<FranchisorReportDetail />} />
      <Route path="/franchisor/finance" element={<FranchisorFinance />} />
      <Route path="/franchisor/finance/schools/:school_id" element={<FranchisorFinanceSchoolDetail />} />
      <Route path="/franchisor/standards/methodology" element={<PadroesMetodologiaFranqueador />} />
      <Route path="/franchisor/standards/pricing" element={<PrecosSugeridosFranqueador />} />
      <Route path="/franchisor/standards/library" element={<BibliotecaPadroesFranqueador />} />
      <Route path="/franchisor/standards/library/:item_id" element={<DetalheBibliotecaPadraoFranqueador />} />
      <Route path="/franchisor/campaigns" element={<ListaCampanhasFranqueador />} />
      <Route path="/franchisor/campaigns/new" element={<CriarEditarCampanhaFranqueador />} />
      <Route path="/franchisor/campaigns/:campaign_id/edit" element={<CriarEditarCampanhaFranqueador />} />
      <Route path="/franchisor/campaigns/:campaign_id" element={<DetalheCampanhaFranqueador />} />
      <Route path="/franchisor/campaigns/:campaign_id/results" element={<ResultadosCampanhaFranqueador />} />
      <Route path="/franchisor/exports" element={<FranchisorExports />} />
      <Route path="/franchisor/exports/new" element={<FranchisorExportNew />} />
      <Route path="/franchisor/exports/:export_id" element={<FranchisorExportDetail />} />
      <Route path="/franchisor/users" element={<UsuariosFranqueadorPortal />} />
      <Route path="/franchisor/users/new" element={<CriarEditarUsuarioFranqueador />} />
      <Route path="/franchisor/users/:user_id/edit" element={<CriarEditarUsuarioFranqueador />} />
      <Route path="/franchisor/permissions" element={<PermissoesFranqueador />} />
      <Route path="/franchisor/settings/profile" element={<FranchisorSettingsProfile />} />

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
      <Route path="/me" element={<MeuPerfil />} />
      <Route path="/perfil" element={<Navigate to="/me" replace />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AuthProvider>
  )
}
