import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  LayoutDashboard, Users, Package, ShoppingCart, Wallet, UserCog,
  Search, Plus, X, Eye, EyeOff, LogOut, Bell, AlertTriangle, Check,
} from "lucide-react";
import { api, setToken, getToken, setUsuario, getUsuario } from "../lib/api";

// ─── Constants ────────────────────────────────────────────────────────────────
const COPPER = "#C8793A";
const NAVY   = "#131B2E";
const GREEN  = "#1F9D6B";
const RED    = "#D14343";
const BORDER = "#E3E6EB";
const BG     = "#F4F5F7";
const MONO   = "'IBM Plex Mono', monospace";
const DISPLAY = "'Space Grotesk', sans-serif";

type Page = "login" | "dashboard" | "clients" | "products" | "sales" | "finance" | "employees";

// ─── Static data ──────────────────────────────────────────────────────────────
const salesChartData = [
  { month: "Jan", v: 148200 },
  { month: "Fev", v: 162400 },
  { month: "Mar", v: 139800 },
  { month: "Abr", v: 185600 },
  { month: "Mai", v: 201300 },
  { month: "Jun", v: 178900 },
];

const lowStockItems = [
  { id: 1, name: "Cabo USB-C 2m",       sku: "CBL-002", stock: 3, min: 20 },
  { id: 2, name: "Filtro de Linha 6T",  sku: "FLT-006", stock: 7, min: 15 },
  { id: 3, name: "Carregador 65W GaN",  sku: "CAR-065", stock: 2, min: 10 },
  { id: 4, name: "Mouse Óptico USB",    sku: "MSE-001", stock: 5, min: 25 },
];

const initialSales = [
  { id: "VD-2024-0892", client: "Distribuidora Norte Ltda",  date: "14/06/2024", status: "pago",     total: 12480.00 },
  { id: "VD-2024-0891", client: "Tech Solutions S.A.",       date: "14/06/2024", status: "pendente", total:  8920.50 },
  { id: "VD-2024-0890", client: "Comércio Central ME",       date: "13/06/2024", status: "pago",     total:  3240.00 },
  { id: "VD-2024-0889", client: "Grupo Alfa Ind.",           date: "13/06/2024", status: "atrasado", total: 22100.00 },
  { id: "VD-2024-0888", client: "RB Logística Ltda",         date: "12/06/2024", status: "pago",     total:  6750.00 },
  { id: "VD-2024-0887", client: "Suprimentos Omega",         date: "12/06/2024", status: "cancelado",total:  4380.00 },
  { id: "VD-2024-0886", client: "Indústria Beta Ltda",       date: "11/06/2024", status: "pago",     total: 18650.00 },
  { id: "VD-2024-0885", client: "Delta Comercial S.A.",      date: "11/06/2024", status: "pendente", total:  9200.00 },
];

const initialClients = [
  { id: 1, name: "Distribuidora Norte Ltda", doc: "12.345.678/0001-90", city: "São Paulo, SP",       status: "ativo"    },
  { id: 2, name: "Tech Solutions S.A.",      doc: "98.765.432/0001-11", city: "Campinas, SP",        status: "ativo"    },
  { id: 3, name: "Comércio Central ME",      doc: "56.789.012/0001-34", city: "Rio de Janeiro, RJ",  status: "ativo"    },
  { id: 4, name: "Grupo Alfa Ind.",          doc: "34.567.890/0001-56", city: "Belo Horizonte, MG",  status: "inativo"  },
  { id: 5, name: "RB Logística Ltda",        doc: "67.890.123/0001-78", city: "Curitiba, PR",        status: "ativo"    },
  { id: 6, name: "Suprimentos Omega",        doc: "23.456.789/0001-23", city: "Porto Alegre, RS",    status: "ativo"    },
  { id: 7, name: "Delta Comercial S.A.",     doc: "89.012.345/0001-67", city: "Fortaleza, CE",       status: "bloqueado" },
  { id: 8, name: "Indústria Beta Ltda",      doc: "45.678.901/0001-89", city: "Recife, PE",          status: "ativo"    },
];

const initialProducts = [
  { id: 1,  name: "Cabo USB-C 2m",       sku: "CBL-002", category: "Cabos",        stock: 3,  minStock: 20, price:  24.90 },
  { id: 2,  name: "Filtro de Linha 6T",  sku: "FLT-006", category: "Elétrico",     stock: 7,  minStock: 15, price:  89.90 },
  { id: 3,  name: "Carregador 65W GaN",  sku: "CAR-065", category: "Carregadores", stock: 2,  minStock: 10, price: 149.90 },
  { id: 4,  name: "Mouse Óptico USB",    sku: "MSE-001", category: "Periféricos",  stock: 5,  minStock: 25, price:  45.00 },
  { id: 5,  name: "Teclado Sem Fio BT",  sku: "TEC-BT1", category: "Periféricos",  stock: 18, minStock: 15, price: 189.00 },
  { id: 6,  name: "Hub USB 7 Portas",    sku: "HUB-007", category: "Cabos",        stock: 24, minStock: 10, price: 129.90 },
  { id: 7,  name: "Webcam Full HD",      sku: "CAM-FHD", category: "Câmeras",      stock: 11, minStock: 8,  price: 299.00 },
  { id: 8,  name: "Headset Office Pro",  sku: "HDS-PRO", category: "Áudio",        stock: 6,  minStock: 10, price: 219.90 },
];

const initialReceivables = [
  { id: 1, desc: "VD-2024-0891 — Tech Solutions S.A.",     value:  8920.50, due: "18/06/2024", status: "pendente" },
  { id: 2, desc: "VD-2024-0889 — Grupo Alfa Ind.",         value: 22100.00, due: "10/06/2024", status: "atrasado" },
  { id: 3, desc: "VD-2024-0885 — Delta Comercial S.A.",    value:  9200.00, due: "20/06/2024", status: "pendente" },
  { id: 4, desc: "Contrato Mensal — RB Logística",         value:  3500.00, due: "30/06/2024", status: "pendente" },
  { id: 5, desc: "VD-2024-0880 — Distribuidora Norte",     value: 15600.00, due: "05/06/2024", status: "atrasado" },
];

const initialPayables = [
  { id: 1, desc: "Fornecedor Eletro Peças Ltda",    value: 14200.00, due: "20/06/2024", status: "pendente" },
  { id: 2, desc: "Aluguel Depósito Industrial",     value:  5800.00, due: "10/06/2024", status: "atrasado" },
  { id: 3, desc: "Seguro Empresarial Anual",        value:  3240.00, due: "25/06/2024", status: "pendente" },
  { id: 4, desc: "Serviços de TI — Cloud Infra",   value:  1890.00, due: "30/06/2024", status: "pendente" },
  { id: 5, desc: "Energia Elétrica — Junho",        value:  2140.00, due: "15/06/2024", status: "pago"     },
];

// ─── Utils ────────────────────────────────────────────────────────────────────
const brl = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

// ─── UI Primitives ────────────────────────────────────────────────────────────
const statusMap: Record<string, [string, string]> = {
  ativo:      ["bg-[#E8F7F1] text-[#1F9D6B]", "Ativo"],
  inativo:    ["bg-gray-100 text-gray-500",    "Inativo"],
  bloqueado:  ["bg-[#FDEAEA] text-[#D14343]",  "Bloqueado"],
  pago:       ["bg-[#E8F7F1] text-[#1F9D6B]",  "Pago"],
  pendente:   ["bg-amber-50 text-amber-700",    "Pendente"],
  atrasado:   ["bg-[#FDEAEA] text-[#D14343]",  "Atrasado"],
  cancelado:  ["bg-gray-100 text-gray-500",     "Cancelado"],
  confirmada: ["bg-[#E8F7F1] text-[#1F9D6B]",  "Confirmada"],
  cancelada:  ["bg-gray-100 text-gray-500",     "Cancelada"],
};

const SBadge = ({ s }: { s: string }) => {
  const [cls, label] = statusMap[s] ?? ["bg-gray-100 text-gray-500", s];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium ${cls}`}>
      {label}
    </span>
  );
};

const KpiCard = ({
  title, value, delta, sub,
}: { title: string; value: string; delta: number; sub: string }) => (
  <div className="bg-white rounded-[10px] p-5 border border-[#E3E6EB]">
    <p className="text-xs font-medium text-gray-500 mb-3">{title}</p>
    <p className="text-[26px] font-semibold text-gray-900 mb-2.5 leading-none tracking-tight"
      style={{ fontFamily: DISPLAY }}>
      {value}
    </p>
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-medium ${
          delta >= 0 ? "bg-[#E8F7F1] text-[#1F9D6B]" : "bg-[#FDEAEA] text-[#D14343]"
        }`}
        style={{ fontFamily: MONO }}
      >
        {delta >= 0 ? "▲" : "▼"} {delta >= 0 ? "+" : ""}{delta}%
      </span>
      <span className="text-[11px] text-gray-400">{sub}</span>
    </div>
  </div>
);

const Modal = ({
  open, onClose, title, width = "max-w-lg", children,
}: {
  open: boolean; onClose: () => void; title: string; width?: string; children: React.ReactNode;
}) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        className={`relative bg-white rounded-[10px] w-full ${width} max-h-[90vh] overflow-y-auto border border-[#E3E6EB]`}
        style={{ boxShadow: "0 24px 48px rgba(0,0,0,0.14)" }}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E3E6EB]">
          <h2 className="text-[15px] font-semibold text-gray-900" style={{ fontFamily: DISPLAY }}>
            {title}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors p-0.5">
            <X size={17} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const Inp = ({
  label, placeholder = "", type = "text", value, onChange,
}: {
  label: string; placeholder?: string; type?: string; value: string; onChange: (v: string) => void;
}) => (
  <div>
    <label className="block text-xs font-medium text-gray-600 mb-1.5">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E3E6EB] bg-white focus:outline-none focus:border-[#C8793A] focus:ring-2 focus:ring-[#C8793A]/10 transition-colors placeholder:text-gray-300 text-gray-800"
    />
  </div>
);

const Btn = ({
  children, onClick, variant = "primary", size = "md", disabled = false, className = "",
}: {
  children: React.ReactNode; onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md"; disabled?: boolean; className?: string;
}) => {
  const sizes = { sm: "px-3 py-1.5 text-xs", md: "px-4 py-2 text-sm" };
  if (variant === "primary") {
    return (
      <button
        onClick={onClick} disabled={disabled}
        className={`inline-flex items-center gap-1.5 font-medium rounded-[8px] text-white transition-opacity hover:opacity-90 disabled:opacity-40 cursor-pointer ${sizes[size]} ${className}`}
        style={{ backgroundColor: COPPER }}
      >
        {children}
      </button>
    );
  }
  if (variant === "secondary") {
    return (
      <button
        onClick={onClick} disabled={disabled}
        className={`inline-flex items-center gap-1.5 font-medium rounded-[8px] bg-white text-gray-700 border border-[#E3E6EB] hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer ${sizes[size]} ${className}`}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 font-medium rounded-[8px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-40 cursor-pointer ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const StockBar = ({ stock, min }: { stock: number; min: number }) => {
  const pct = Math.min((stock / min) * 100, 100);
  const color = pct <= 30 ? RED : pct <= 65 ? "#B45309" : GREEN;
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden" style={{ minWidth: 64 }}>
        <div style={{ width: `${pct}%`, backgroundColor: color, height: "100%" }} className="rounded-full" />
      </div>
      <span className="text-xs shrink-0 w-6 text-right" style={{ fontFamily: MONO, color }}>
        {stock}
      </span>
    </div>
  );
};

const SearchBar = ({
  value, onChange, placeholder,
}: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative max-w-xs w-full">
    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full pl-9 pr-3 py-2 text-sm rounded-[8px] border border-[#E3E6EB] bg-white focus:outline-none focus:border-[#C8793A] focus:ring-2 focus:ring-[#C8793A]/10 transition-colors placeholder:text-gray-300 text-gray-700"
    />
  </div>
);

// ─── Sidebar ──────────────────────────────────────────────────────────────────
const navItems = [
  { id: "dashboard",  Icon: LayoutDashboard, label: "Painel",       adminOnly: false },
  { id: "clients",    Icon: Users,           label: "Clientes",     adminOnly: false },
  { id: "products",   Icon: Package,         label: "Estoque",      adminOnly: false },
  { id: "sales",      Icon: ShoppingCart,    label: "Vendas",       adminOnly: false },
  { id: "finance",    Icon: Wallet,          label: "Financeiro",   adminOnly: true  },
  { id: "employees",  Icon: UserCog,         label: "Funcionários", adminOnly: true  },
] as const;

const Sidebar = ({
  page, setPage, onLogout, nome, cargo,
}: { page: Page; setPage: (p: Page) => void; onLogout: () => void; nome: string; cargo: string }) => {
  const isAdmin = cargo === "Administrador";
  const iniciais = nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "U";

  return (
    <div className="fixed top-0 left-0 bottom-0 w-[220px] flex flex-col z-20" style={{ backgroundColor: NAVY }}>
      {/* Logo */}
      <div className="px-5 py-[18px] border-b border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-[6px] flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ backgroundColor: COPPER }}
          >
            N
          </div>
          <div>
            <div className="text-white text-[13px] font-bold tracking-widest" style={{ fontFamily: DISPLAY }}>
              NEXUS
            </div>
            <div className="text-[9px] tracking-[0.2em] uppercase" style={{ color: "rgba(255,255,255,0.3)" }}>
              ERP
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2">
        {navItems.filter((item) => !item.adminOnly || isAdmin).map(({ id, Icon, label }) => {
          const active = page === id;
          return (
            <button
              key={id}
              onClick={() => setPage(id as Page)}
              className="relative w-full flex items-center gap-3 px-5 py-2.5 text-left transition-all group"
              style={{
                color: active ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.48)",
                backgroundColor: active ? "rgba(255,255,255,0.07)" : "transparent",
              }}
              onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.04)"; }}
              onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = "transparent"; }}
            >
              {active && (
                <span
                  className="absolute left-0 top-[6px] bottom-[6px] w-[3px] rounded-r-[2px]"
                  style={{ backgroundColor: COPPER }}
                />
              )}
              <Icon size={15} className="shrink-0" />
              <span className="text-[13px] font-medium">{label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-4 py-4 border-t border-white/[0.07]">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
            style={{ backgroundColor: `${COPPER}30`, color: COPPER }}
          >
            {iniciais}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-white text-xs font-medium truncate">{nome}</div>
            <div className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.32)" }}>
              {cargo}
            </div>
          </div>
          <button
            onClick={onLogout}
            className="transition-colors p-1"
            style={{ color: "rgba(255,255,255,0.28)" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.28)")}
            title="Sair"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Layout ───────────────────────────────────────────────────────────────────
const pageTitles: Record<string, string> = {
  dashboard: "Painel",
  clients:   "Clientes",
  products:  "Estoque",
  sales:     "Vendas",
  finance:   "Financeiro",
  employees: "Funcionários",
};

const Layout = ({
  page, setPage, onLogout, nome, cargo, children,
}: { page: Page; setPage: (p: Page) => void; onLogout: () => void; nome: string; cargo: string; children: React.ReactNode }) => {
  const iniciais = nome.split(" ").filter(Boolean).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "U";

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: BG }}>
      <Sidebar page={page} setPage={setPage} onLogout={onLogout} nome={nome} cargo={cargo} />
      <div className="flex flex-col flex-1 overflow-hidden" style={{ marginLeft: 220 }}>
        <header
          className="h-14 flex items-center px-6 shrink-0 bg-white"
          style={{ borderBottom: `1px solid ${BORDER}`, zIndex: 10 }}
        >
          <h1 className="flex-1 text-[15px] font-semibold text-gray-900" style={{ fontFamily: DISPLAY }}>
            {pageTitles[page] ?? ""}
          </h1>
          <div className="flex items-center gap-2">
            <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
              <Bell size={16} />
            </button>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ml-1"
              style={{ backgroundColor: `${COPPER}20`, color: COPPER }}
            >
              {iniciais}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-[1320px] mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  );
};


// ─── Login ────────────────────────────────────────────────────────────────────
const LoginPage = ({ onLogin }: { onLogin: (usuario: any) => void }) => {
  const [email,    setEmail]    = useState("");
  const [pass,     setPass]     = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [erro,     setErro]     = useState<string | null>(null);

  const handleLogin = async () => {
    setErro(null);
    setLoading(true);
    try {
      const data = await api.post("/auth/login", { email, senha: pass });
      setToken(data.token);
      onLogin(data.usuario);
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[46%] p-12 shrink-0"
        style={{ backgroundColor: NAVY }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-[7px] flex items-center justify-center text-white text-sm font-bold"
            style={{ backgroundColor: COPPER }}
          >N</div>
          <span className="text-white text-[13px] font-bold tracking-widest" style={{ fontFamily: DISPLAY }}>
            NEXUS ERP
          </span>
        </div>

        <div>
          <h2
            className="text-[38px] font-bold text-white leading-[1.15] mb-5 tracking-tight"
            style={{ fontFamily: DISPLAY }}
          >
            Operações em<br />um só lugar.
          </h2>
          <p className="text-[14px] leading-relaxed max-w-sm" style={{ color: "rgba(255,255,255,0.48)" }}>
            Vendas, estoque, financeiro e clientes integrados em uma plataforma feita para equipes que precisam de velocidade e clareza.
          </p>

          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { v: "12.4k",  l: "Pedidos processados" },
              { v: "R$ 2.1M", l: "Volume transacionado" },
              { v: "99.8%",  l: "Disponibilidade" },
            ].map((s) => (
              <div key={s.l}>
                <div className="text-[22px] font-bold text-white mb-1 tracking-tight" style={{ fontFamily: DISPLAY }}>
                  {s.v}
                </div>
                <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.38)" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="text-[11px]" style={{ color: "rgba(255,255,255,0.2)", fontFamily: MONO }}>
          © 2024 Nexus ERP • v3.14.2
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col items-center justify-center p-8" style={{ backgroundColor: BG }}>
        <div className="w-full max-w-[360px] bg-white rounded-[12px] p-8 border border-[#E3E6EB]">
          <div className="mb-7">
            <h3 className="text-[18px] font-semibold text-gray-900 mb-1" style={{ fontFamily: DISPLAY }}>
              Entrar na plataforma
            </h3>
            <p className="text-sm text-gray-500">Informe suas credenciais de acesso.</p>
          </div>

          <div className="space-y-4 mb-5">
            <Inp label="E-mail" placeholder="usuario@empresa.com.br" type="email" value={email} onChange={setEmail} />
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  placeholder="••••••••"
                  onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E3E6EB] bg-white focus:outline-none focus:border-[#C8793A] focus:ring-2 focus:ring-[#C8793A]/10 transition-colors placeholder:text-gray-300 text-gray-800 pr-10"
                />
                <button
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded accent-[#C8793A]" defaultChecked />
              <span className="text-xs text-gray-500">Manter conectado</span>
            </label>
            <button className="text-xs font-medium hover:underline" style={{ color: COPPER }}>
              Esqueci a senha
            </button>
          </div>

          {erro && (
            <p className="text-xs text-[#D14343] mb-3 -mt-3">{erro}</p>
          )}

          <Btn onClick={handleLogin} className="w-full justify-center py-2.5" disabled={loading}>
            {loading ? "Autenticando…" : "Entrar"}
          </Btn>
        </div>
        <p className="mt-5 text-xs text-gray-400">
          Problemas de acesso?{" "}
          <span className="font-medium cursor-pointer hover:underline" style={{ color: COPPER }}>
            Fale com o suporte
          </span>
        </p>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const DashboardPage = () => {
  const [dados, setDados] = useState<any>(null);
  const [erro,  setErro]  = useState<string | null>(null);

  useEffect(() => {
    api.get("/dashboard/resumo")
      .then(setDados)
      .catch((e) => setErro(e.message));
  }, []);

  if (erro)   return <p className="text-sm text-[#D14343]">Erro ao carregar o painel: {erro}</p>;
  if (!dados) return <p className="text-sm text-gray-400">Carregando painel…</p>;

  const chartData = dados.vendasPorMes.map((m: any) => ({ month: m.mes, v: m.total }));
  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="grid grid-cols-4 gap-4 mb-5">
        <KpiCard title="Receita do Mês"   value={brl(dados.receitaMesAtual)}        delta={dados.variacaoReceita ?? 0} sub="vs. mês anterior" />
        <KpiCard title="Contas a Receber" value={brl(dados.receberPendente.soma)}   delta={0} sub={`${dados.receberPendente.qtd} em aberto`} />
        <KpiCard title="Contas a Pagar"   value={brl(dados.pagarPendente.soma)}     delta={0} sub={`${dados.pagarPendente.qtd} em aberto`} />
        <KpiCard title="Saldo Projetado"  value={brl(dados.saldoProjetado)}         delta={0} sub="receber − pagar" />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="col-span-2 bg-white rounded-[10px] p-5 border border-[#E3E6EB]">
          <h3 className="text-sm font-semibold text-gray-800 mb-4" style={{ fontFamily: DISPLAY }}>
            Vendas por Mês
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} barSize={36} margin={{ top: 4, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#9CA3AF" }} axisLine={false} tickLine={false} />
              <YAxis
                tick={{ fontSize: 11, fill: "#9CA3AF" }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} width={36}
              />
              <Tooltip
                formatter={(v: number) => [brl(v), "Vendas"]}
                contentStyle={{
                  border: `1px solid ${BORDER}`, borderRadius: 8,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.07)", fontSize: 12,
                  fontFamily: MONO,
                }}
                cursor={{ fill: "rgba(0,0,0,0.025)" }}
              />
              <Bar dataKey="v" fill={COPPER} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-[10px] p-5 border border-[#E3E6EB]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-800" style={{ fontFamily: DISPLAY }}>Estoque Crítico</h3>
            <AlertTriangle size={14} className="text-amber-500" />
          </div>
          <div className="space-y-4">
            {dados.produtosBaixoEstoque.map((p: any) => (
              <div key={p.id} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-xs font-medium text-gray-800 truncate">{p.nome}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5" style={{ fontFamily: MONO }}>{p.sku}</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-xs font-semibold" style={{ fontFamily: MONO, color: RED }}>{p.estoque_atual} {p.unidade}</div>
                  <div className="text-[10px] text-gray-400">mín: {p.estoque_minimo}</div>
                </div>
              </div>
            ))}
            {dados.produtosBaixoEstoque.length === 0 && (
              <p className="text-xs text-gray-400">Nenhum produto em estoque crítico.</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#E3E6EB]">
        <div className="px-5 py-4 flex items-center justify-between border-b border-[#E3E6EB]">
          <h3 className="text-sm font-semibold text-gray-800" style={{ fontFamily: DISPLAY }}>Vendas Recentes</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E3E6EB]">
              {["Pedido", "Cliente", "Data", "Status", "Total"].map((h, i) => (
                <th key={h} className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dados.vendasRecentes.map((s: any, i: number) => (
              <tr key={s.id} className="hover:bg-gray-50/80 transition-colors"
                style={i < dados.vendasRecentes.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                <td className="px-4 py-3 text-xs text-gray-700" style={{ fontFamily: MONO }}>{s.numero}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{s.cliente_nome}</td>
                <td className="px-4 py-3 text-xs text-gray-500" style={{ fontFamily: MONO }}>{formatDate(s.data_venda)}</td>
                <td className="px-4 py-3"><SBadge s={s.status} /></td>
                <td className="px-4 py-3 text-xs font-semibold text-gray-800 text-right" style={{ fontFamily: MONO }}>{brl(s.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── Clients ──────────────────────────────────────────────────────────────────
const ClientsPage = () => {
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [list,      setList]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [erro,      setErro]      = useState<string | null>(null);
  const [salvando,  setSalvando]  = useState(false);
  const [erroForm,  setErroForm]  = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    nome: "", tipo_pessoa: "PJ", documento: "", email: "", telefone: "", cidade: "", estado: "", status: "ativo",
  });

  const carregarClientes = () => {
    setLoading(true);
    api.get("/clientes")
      .then(setList)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarClientes();
  }, []);

  const filtered = list.filter(
    (c) => c.nome.toLowerCase().includes(search.toLowerCase()) || (c.documento ?? "").includes(search)
  );

  const abrirNovo = () => {
    setEditingId(null);
    setForm({ nome: "", tipo_pessoa: "PJ", documento: "", email: "", telefone: "", cidade: "", estado: "", status: "ativo" });
    setErroForm(null);
    setShowModal(true);
  };

  const abrirEdicao = (cliente: any) => {
    setEditingId(cliente.id);
    setForm({
      nome: cliente.nome ?? "",
      tipo_pessoa: cliente.tipo_pessoa ?? "PJ",
      documento: cliente.documento ?? "",
      email: cliente.email ?? "",
      telefone: cliente.telefone ?? "",
      cidade: cliente.cidade ?? "",
      estado: cliente.estado ?? "",
      status: cliente.status ?? "ativo",
    });
    setErroForm(null);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.nome.trim()) return;
    setErroForm(null);
    setSalvando(true);
    try {
      if (editingId) await api.put(`/clientes/${editingId}`, form);
      else            await api.post("/clientes", form);
      setShowModal(false);
      carregarClientes();
    } catch (e: any) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Carregando clientes…</p>;
  if (erro)    return <p className="text-sm text-[#D14343]">Erro ao carregar clientes: {erro}</p>;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-3 mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou CNPJ…" />
        <div className="flex-1" />
        <Btn onClick={abrirNovo}><Plus size={14} /> Novo Cliente</Btn>
      </div>

      <div className="bg-white rounded-[10px] border border-[#E3E6EB]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E3E6EB]">
              {["Nome / Razão Social", "CNPJ / CPF", "Cidade", "Status", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={c.id} className="hover:bg-gray-50/80 transition-colors"
                style={i < filtered.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{c.nome}</td>
                <td className="px-4 py-3 text-xs text-gray-500" style={{ fontFamily: MONO }}>{c.documento}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{c.cidade ? `${c.cidade}, ${c.estado}` : "—"}</td>
                <td className="px-4 py-3"><SBadge s={c.status} /></td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirEdicao(c)} className="text-xs font-medium hover:underline" style={{ color: COPPER }}>Editar</button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Nenhum cliente encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Editar Cliente" : "Novo Cliente"}>
        <div className="space-y-4">
          <Inp label="Nome / Razão Social" placeholder="Ex: Distribuidora Norte Ltda" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Inp label="CNPJ / CPF" placeholder="00.000.000/0001-00" value={form.documento} onChange={(v) => setForm({ ...form, documento: v })} />
            <Inp label="Telefone" placeholder="(11) 99999-9999" value={form.telefone} onChange={(v) => setForm({ ...form, telefone: v })} />
          </div>
          <Inp label="E-mail" type="email" placeholder="contato@empresa.com.br" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Inp label="Cidade" placeholder="São Paulo" value={form.cidade} onChange={(v) => setForm({ ...form, cidade: v })} />
            <Inp label="Estado (UF)" placeholder="SP" value={form.estado} onChange={(v) => setForm({ ...form, estado: v })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo</label>
              <select
                value={form.tipo_pessoa}
                onChange={(e) => setForm({ ...form, tipo_pessoa: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E3E6EB] bg-white focus:outline-none focus:border-[#C8793A] text-gray-800"
              >
                <option value="PJ">Pessoa Jurídica</option>
                <option value="PF">Pessoa Física</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1.5">Status</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E3E6EB] bg-white focus:outline-none focus:border-[#C8793A] text-gray-800"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          {erroForm && <p className="text-xs text-[#D14343]">{erroForm}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={salvando}>{salvando ? "Salvando…" : editingId ? "Salvar Alterações" : "Salvar Cliente"}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─── Products ─────────────────────────────────────────────────────────────────
const ProductsPage = () => {
  const [search,    setSearch]    = useState("");
  const [showModal, setShowModal] = useState(false);
  const [list,      setList]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [erro,      setErro]      = useState<string | null>(null);
  const [salvando,  setSalvando]  = useState(false);
  const [erroForm,  setErroForm]  = useState<string | null>(null);
  const [form, setForm] = useState({ productId: "", tipo: "entrada", qty: "", obs: "" });

  const carregarProdutos = () => {
    setLoading(true);
    api.get("/produtos")
      .then(setList)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarProdutos();
  }, []);

  const filtered = list.filter(
    (p) => p.nome.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const save = async () => {
    const qty = parseInt(form.qty) || 0;
    if (!form.productId || qty <= 0) return;
    setErroForm(null);
    setSalvando(true);
    try {
      await api.post(`/produtos/${form.productId}/movimentacao`, {
        tipo: form.tipo,
        quantidade: qty,
        motivo: form.obs || undefined,
      });
      setForm({ productId: "", tipo: "entrada", qty: "", obs: "" });
      setShowModal(false);
      carregarProdutos();
    } catch (e: any) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Carregando produtos…</p>;
  if (erro)    return <p className="text-sm text-[#D14343]">Erro ao carregar produtos: {erro}</p>;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-3 mb-5">
        <SearchBar value={search} onChange={setSearch} placeholder="Buscar por nome ou SKU…" />
        <div className="flex-1" />
        <Btn onClick={() => setShowModal(true)}><Plus size={14} /> Registrar Movimentação</Btn>
      </div>

      <div className="bg-white rounded-[10px] border border-[#E3E6EB]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E3E6EB]">
              {["Produto", "SKU", "Categoria", "Estoque", "Preço"].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((p, i) => (
              <tr key={p.id} className="hover:bg-gray-50/80 transition-colors"
                style={i < filtered.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{p.nome}</td>
                <td className="px-4 py-3 text-xs text-gray-500" style={{ fontFamily: MONO }}>{p.sku}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{p.categoria}</span>
                </td>
                <td className="px-4 py-3" style={{ minWidth: 160 }}>
                  <StockBar stock={p.estoque_atual} min={p.estoque_minimo} />
                  <div className="text-[10px] text-gray-400 mt-0.5">mín: {p.estoque_minimo} {p.unidade}</div>
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-800" style={{ fontFamily: MONO }}>{brl(p.preco_venda)}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Movimentação">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Tipo de Movimentação</label>
            <div className="flex gap-3">
              {(["entrada", "saida"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setForm({ ...form, tipo: t })}
                  className="flex-1 py-2.5 text-sm font-medium rounded-[8px] transition-all capitalize"
                  style={{
                    border: `1px solid ${form.tipo === t ? COPPER : BORDER}`,
                    backgroundColor: form.tipo === t ? `${COPPER}12` : "#fff",
                    color: form.tipo === t ? COPPER : "#6B7280",
                  }}
                >
                  {t === "entrada" ? "↓ Entrada" : "↑ Saída"}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Produto</label>
            <select
              value={form.productId}
              onChange={(e) => setForm({ ...form, productId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E3E6EB] bg-white focus:outline-none focus:border-[#C8793A] text-gray-800"
            >
              <option value="">Selecionar produto…</option>
              {list.map((p) => (
                <option key={p.id} value={p.id}>{p.nome} — {p.sku} ({p.estoque_atual} em estoque)</option>
              ))}
            </select>
          </div>
          <Inp label="Quantidade" placeholder="0" type="number" value={form.qty} onChange={(v) => setForm({ ...form, qty: v })} />
          <Inp label="Observação (opcional)" placeholder="Ex: Recebimento NF 1234" value={form.obs} onChange={(v) => setForm({ ...form, obs: v })} />
          {erroForm && <p className="text-xs text-[#D14343]">{erroForm}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={!form.productId || !form.qty || salvando}>{salvando ? "Registrando…" : "Registrar"}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// ─── Sales ────────────────────────────────────────────────────────────────────
type SaleItem = { productId: string; qty: number };

const SalesPage = () => {
  const [showModal,    setShowModal]    = useState(false);
  const [list,         setList]         = useState<any[]>([]);
  const [clientes,     setClientes]     = useState<any[]>([]);
  const [produtos,     setProdutos]     = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [erro,         setErro]         = useState<string | null>(null);
  const [salvando,     setSalvando]     = useState(false);
  const [erroForm,     setErroForm]     = useState<string | null>(null);
  const [viewingVenda, setViewingVenda] = useState<any | null>(null);
  const [saleForm,     setSaleForm]     = useState<{ clientId: string; items: SaleItem[] }>({
    clientId: "", items: [{ productId: "", qty: 1 }],
  });

  const carregarTudo = () => {
    setLoading(true);
    Promise.all([api.get("/vendas"), api.get("/clientes"), api.get("/produtos")])
      .then(([vendas, cli, prod]) => {
        setList(vendas);
        setClientes(cli);
        setProdutos(prod);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const verDetalhe = async (id: number) => {
    try {
      const data = await api.get(`/vendas/${id}`);
      setViewingVenda(data);
    } catch (e: any) {
      setErro(e.message);
    }
  };

  const getItemTotal = (item: SaleItem) => {
    const p = produtos.find((x) => x.id === parseInt(item.productId));
    return p ? p.preco_venda * item.qty : 0;
  };

  const grandTotal = saleForm.items.reduce((sum, item) => sum + getItemTotal(item), 0);

  const addItem    = () => setSaleForm({ ...saleForm, items: [...saleForm.items, { productId: "", qty: 1 }] });
  const removeItem = (i: number) => setSaleForm({ ...saleForm, items: saleForm.items.filter((_, idx) => idx !== i) });
  const updateItem = (i: number, field: keyof SaleItem, value: string | number) =>
    setSaleForm({ ...saleForm, items: saleForm.items.map((item, idx) => idx === i ? { ...item, [field]: value } : item) });

  const saveSale = async () => {
    if (!saleForm.clientId) return;
    setErroForm(null);
    setSalvando(true);
    try {
      await api.post("/vendas", {
        cliente_id: parseInt(saleForm.clientId),
        forma_pagamento: "boleto",
        prazo_dias: 30,
        itens: saleForm.items
          .filter((i) => i.productId)
          .map((i) => ({ produto_id: parseInt(i.productId), quantidade: i.qty })),
      });
      setSaleForm({ clientId: "", items: [{ productId: "", qty: 1 }] });
      setShowModal(false);
      carregarTudo();
    } catch (e: any) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Carregando vendas…</p>;
  if (erro)    return <p className="text-sm text-[#D14343]">Erro ao carregar vendas: {erro}</p>;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-3 mb-5">
        <SearchBar value="" onChange={() => {}} placeholder="Buscar venda ou cliente…" />
        <div className="flex-1" />
        <Btn onClick={() => setShowModal(true)}><Plus size={14} /> Nova Venda</Btn>
      </div>

      <div className="bg-white rounded-[10px] border border-[#E3E6EB]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E3E6EB]">
              {["Pedido", "Cliente", "Data", "Status", "Total", ""].map((h, i) => (
                <th key={i} className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${i >= 4 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((s, i) => (
              <tr key={s.id} className="hover:bg-gray-50/80 transition-colors"
                style={i < list.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                <td className="px-4 py-3 text-xs font-medium text-gray-700" style={{ fontFamily: MONO }}>{s.numero}</td>
                <td className="px-4 py-3 text-sm text-gray-700">{s.cliente_nome}</td>
                <td className="px-4 py-3 text-xs text-gray-500" style={{ fontFamily: MONO }}>{formatDate(s.data_venda)}</td>
                <td className="px-4 py-3"><SBadge s={s.status} /></td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-800 text-right" style={{ fontFamily: MONO }}>{brl(s.total)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => verDetalhe(s.id)} className="text-xs font-medium hover:underline" style={{ color: COPPER }}>Ver</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">Nenhuma venda registrada.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Nova Venda Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Nova Venda" width="max-w-2xl">
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cliente</label>
            <select
              value={saleForm.clientId}
              onChange={(e) => setSaleForm({ ...saleForm, clientId: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E3E6EB] bg-white focus:outline-none focus:border-[#C8793A] text-gray-800"
            >
              <option value="">Selecionar cliente…</option>
              {clientes.filter((c) => c.status === "ativo").map((c) => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium text-gray-600">Itens do Pedido</label>
              <button
                onClick={addItem}
                className="text-xs font-medium flex items-center gap-1 hover:underline"
                style={{ color: COPPER }}
              >
                <Plus size={11} /> Adicionar item
              </button>
            </div>

            <div className="rounded-[8px] overflow-hidden border border-[#E3E6EB]">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
                    <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Produto</th>
                    <th className="text-center px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20">Qtd</th>
                    <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-28">Unit.</th>
                    <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-28">Subtotal</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody>
                  {saleForm.items.map((item, i) => {
                    const prod = produtos.find((x) => x.id === parseInt(item.productId));
                    return (
                      <tr key={i} style={i < saleForm.items.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                        <td className="px-3 py-2">
                          <select
                            value={item.productId}
                            onChange={(e) => updateItem(i, "productId", e.target.value)}
                            className="w-full text-xs rounded-[6px] px-2 py-1.5 focus:outline-none text-gray-800 border border-[#E3E6EB] bg-white focus:border-[#C8793A]"
                          >
                            <option value="">Selecionar…</option>
                            {produtos.map((x) => (
                              <option key={x.id} value={x.id}>{x.nome}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="number" min={1} value={item.qty}
                            onChange={(e) => updateItem(i, "qty", parseInt(e.target.value) || 1)}
                            className="w-full text-xs text-center rounded-[6px] px-2 py-1.5 focus:outline-none text-gray-800 border border-[#E3E6EB] bg-white"
                            style={{ fontFamily: MONO }}
                          />
                        </td>
                        <td className="px-3 py-2 text-xs text-right text-gray-500" style={{ fontFamily: MONO }}>
                          {prod ? brl(prod.preco_venda) : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs text-right font-semibold text-gray-800" style={{ fontFamily: MONO }}>
                          {prod ? brl(prod.preco_venda * item.qty) : "—"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {saleForm.items.length > 1 && (
                            <button onClick={() => removeItem(i)} className="text-gray-300 hover:text-red-400 transition-colors">
                              <X size={13} />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "#F9FAFB" }}>
                    <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">
                      Total do Pedido
                    </td>
                    <td className="px-3 py-2.5 text-sm font-bold text-right" style={{ fontFamily: MONO, color: COPPER }}>
                      {brl(grandTotal)}
                    </td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {erroForm && <p className="text-xs text-[#D14343]">{erroForm}</p>}

          <div className="flex justify-end gap-3 pt-1">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn onClick={saveSale} disabled={!saleForm.clientId || salvando}>{salvando ? "Criando…" : "Criar Venda"}</Btn>
          </div>
        </div>
      </Modal>

      {/* Detalhe da Venda Modal */}
      <Modal open={!!viewingVenda} onClose={() => setViewingVenda(null)} title={viewingVenda ? `Venda ${viewingVenda.numero}` : ""} width="max-w-2xl">
        {viewingVenda && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-xs text-gray-400 mb-1">Cliente</div>
                <div className="font-medium text-gray-800">{viewingVenda.cliente_nome}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Status</div>
                <SBadge s={viewingVenda.status} />
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Data</div>
                <div style={{ fontFamily: MONO }}>{new Date(viewingVenda.data_venda).toLocaleDateString("pt-BR")}</div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-1">Forma de pagamento</div>
                <div className="capitalize">{viewingVenda.forma_pagamento}</div>
              </div>
            </div>

            <div>
              <div className="text-xs font-medium text-gray-600 mb-2">Itens</div>
              <div className="rounded-[8px] overflow-hidden border border-[#E3E6EB]">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: "#F9FAFB", borderBottom: `1px solid ${BORDER}` }}>
                      <th className="text-left px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Produto</th>
                      <th className="text-center px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-20">Qtd</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-28">Unit.</th>
                      <th className="text-right px-3 py-2 text-[11px] font-semibold text-gray-400 uppercase tracking-wider w-28">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingVenda.itens.map((item: any, i: number) => (
                      <tr key={item.id} style={i < viewingVenda.itens.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                        <td className="px-3 py-2 text-sm text-gray-700">{item.produto_nome}</td>
                        <td className="px-3 py-2 text-xs text-center" style={{ fontFamily: MONO }}>{item.quantidade}</td>
                        <td className="px-3 py-2 text-xs text-right text-gray-500" style={{ fontFamily: MONO }}>{brl(item.preco_unitario)}</td>
                        <td className="px-3 py-2 text-xs text-right font-semibold text-gray-800" style={{ fontFamily: MONO }}>{brl(item.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr style={{ borderTop: `1px solid ${BORDER}`, backgroundColor: "#F9FAFB" }}>
                      <td colSpan={3} className="px-3 py-2.5 text-xs font-semibold text-gray-500 text-right">Total</td>
                      <td className="px-3 py-2.5 text-sm font-bold text-right" style={{ fontFamily: MONO, color: COPPER }}>{brl(viewingVenda.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {viewingVenda.contaReceber && (
              <div className="flex items-center justify-between text-sm bg-gray-50 rounded-[8px] px-4 py-3">
                <span className="text-gray-600">Conta a receber — vencimento {new Date(viewingVenda.contaReceber.data_vencimento).toLocaleDateString("pt-BR")}</span>
                <SBadge s={viewingVenda.contaReceber.status} />
              </div>
            )}

            <div className="flex justify-end pt-1">
              <Btn variant="secondary" onClick={() => setViewingVenda(null)}>Fechar</Btn>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

// ─── Finance ──────────────────────────────────────────────────────────────────
const FinancePage = () => {
  const [tab,     setTab]     = useState<"receber" | "pagar">("receber");
  const [recs,    setRecs]    = useState<any[]>([]);
  const [pays,    setPays]    = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro,    setErro]    = useState<string | null>(null);
  const [pagando, setPagando] = useState<number | null>(null);

  const carregarTudo = () => {
    setLoading(true);
    Promise.all([api.get("/financeiro/receber"), api.get("/financeiro/pagar")])
      .then(([receber, pagar]) => {
        setRecs(receber);
        setPays(pagar);
      })
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregarTudo();
  }, []);

  const items = tab === "receber" ? recs : pays;

  const markPaid = async (id: number) => {
    setPagando(id);
    try {
      if (tab === "receber") await api.put(`/financeiro/receber/${id}/pagar`);
      else                   await api.put(`/financeiro/pagar/${id}/pagar`);
      carregarTudo();
    } catch (e: any) {
      setErro(e.message);
    } finally {
      setPagando(null);
    }
  };

  const totalPending = items.filter((i) => i.status !== "pago").reduce((s, i) => s + i.valor, 0);
  const totalOverdue = items.filter((i) => i.status === "atrasado").reduce((s, i) => s + i.valor, 0);

  if (loading) return <p className="text-sm text-gray-400">Carregando financeiro…</p>;
  if (erro)    return <p className="text-sm text-[#D14343]">Erro ao carregar financeiro: {erro}</p>;

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString("pt-BR");

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-2 mb-5">
        {(["receber", "pagar"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-5 py-2 text-sm font-medium rounded-[8px] transition-all"
            style={{
              backgroundColor: tab === t ? COPPER : "#fff",
              color: tab === t ? "#fff" : "#6B7280",
              border: `1px solid ${tab === t ? COPPER : BORDER}`,
            }}
          >
            {t === "receber" ? "A Receber" : "A Pagar"}
          </button>
        ))}

        <div className="flex-1" />

        <div className="flex items-center gap-6 mr-1">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Em aberto</div>
            <div className="text-sm font-semibold" style={{ fontFamily: MONO, color: COPPER }}>{brl(totalPending)}</div>
          </div>
          <div className="w-px h-8 bg-[#E3E6EB]" />
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wider text-gray-400 mb-0.5">Atrasado</div>
            <div className="text-sm font-semibold" style={{ fontFamily: MONO, color: RED }}>{brl(totalOverdue)}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[10px] border border-[#E3E6EB]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E3E6EB]">
              {["Descrição", "Valor", "Vencimento", "Status", ""].map((h, i) => (
                <th key={i} className={`px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400 ${i === 4 ? "text-right" : "text-left"}`}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} className="hover:bg-gray-50/80 transition-colors"
                style={i < items.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                <td className="px-4 py-3 text-sm text-gray-700">
                  {item.descricao}{tab === "receber" && item.cliente_nome ? ` — ${item.cliente_nome}` : ""}
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-gray-800" style={{ fontFamily: MONO }}>{brl(item.valor)}</td>
                <td className="px-4 py-3 text-xs text-gray-500" style={{ fontFamily: MONO }}>{formatDate(item.data_vencimento)}</td>
                <td className="px-4 py-3"><SBadge s={item.status} /></td>
                <td className="px-4 py-3 text-right">
                  {item.status !== "pago" && item.status !== "cancelado" && (
                    <button
                      onClick={() => markPaid(item.id)}
                      disabled={pagando === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-[6px] transition-colors"
                      style={{ backgroundColor: "#E8F7F1", color: GREEN, border: `1px solid ${GREEN}28` }}
                      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D1EFE5")}
                      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E8F7F1")}
                    >
                      <Check size={11} /> {pagando === item.id ? "Atualizando…" : "Marcar como pago"}
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-gray-400">Nenhum lançamento encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// ─── App ──────────────────────────────────────────────────────────────────────
// ─── Employees ────────────────────────────────────────────────────────────────
const EmployeesPage = () => {
  const [list,      setList]      = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [erro,      setErro]      = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [salvando,  setSalvando]  = useState(false);
  const [erroForm,  setErroForm]  = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ nome: "", email: "", senha: "", cargo: "Operador" });

  const carregar = () => {
    setLoading(true);
    api.get("/usuarios")
      .then(setList)
      .catch((e) => setErro(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    carregar();
  }, []);

  const abrirNovo = () => {
    setEditingId(null);
    setForm({ nome: "", email: "", senha: "", cargo: "Operador" });
    setErroForm(null);
    setShowModal(true);
  };

  const abrirEdicao = (u: any) => {
    setEditingId(u.id);
    setForm({ nome: u.nome, email: u.email, senha: "", cargo: u.cargo });
    setErroForm(null);
    setShowModal(true);
  };

  const save = async () => {
    if (!form.nome.trim() || !form.email.trim()) return;
    setErroForm(null);
    setSalvando(true);
    try {
      if (editingId) {
        await api.put(`/usuarios/${editingId}`, { nome: form.nome, email: form.email, cargo: form.cargo });
      } else {
        await api.post("/usuarios", form);
      }
      setShowModal(false);
      carregar();
    } catch (e: any) {
      setErroForm(e.message);
    } finally {
      setSalvando(false);
    }
  };

  const excluir = async (id: number) => {
    if (!confirm("Excluir este funcionário?")) return;
    try {
      await api.del(`/usuarios/${id}`);
      carregar();
    } catch (e: any) {
      setErro(e.message);
    }
  };

  if (loading) return <p className="text-sm text-gray-400">Carregando funcionários…</p>;
  if (erro)    return <p className="text-sm text-[#D14343]">Erro ao carregar funcionários: {erro}</p>;

  const limite = list.length >= 10;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div className="flex items-center gap-3 mb-5">
        <p className="text-sm text-gray-500">{list.length}/10 usuários cadastrados</p>
        <div className="flex-1" />
        <Btn onClick={abrirNovo} disabled={limite}>
          <Plus size={14} /> {limite ? "Limite atingido" : "Novo Funcionário"}
        </Btn>
      </div>

      <div className="bg-white rounded-[10px] border border-[#E3E6EB]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#E3E6EB]">
              {["Nome", "E-mail", "Cargo", ""].map((h) => (
                <th key={h} className="text-left px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {list.map((u, i) => (
              <tr key={u.id} className="hover:bg-gray-50/80 transition-colors"
                style={i < list.length - 1 ? { borderBottom: `1px solid ${BORDER}` } : undefined}>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{u.nome}</td>
                <td className="px-4 py-3 text-xs text-gray-500" style={{ fontFamily: MONO }}>{u.email}</td>
                <td className="px-4 py-3">
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">{u.cargo}</span>
                </td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => abrirEdicao(u)} className="text-xs font-medium hover:underline mr-3" style={{ color: COPPER }}>Editar</button>
                  <button onClick={() => excluir(u.id)} className="text-xs font-medium hover:underline text-red-400 hover:text-red-500">Excluir</button>
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-gray-400">Nenhum funcionário cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingId ? "Editar Funcionário" : "Novo Funcionário"}>
        <div className="space-y-4">
          <Inp label="Nome" placeholder="Nome completo" value={form.nome} onChange={(v) => setForm({ ...form, nome: v })} />
          <Inp label="E-mail" type="email" placeholder="email@empresa.com.br" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          {!editingId && (
            <Inp label="Senha" type="password" placeholder="Senha inicial" value={form.senha} onChange={(v) => setForm({ ...form, senha: v })} />
          )}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Cargo</label>
            <select
              value={form.cargo}
              onChange={(e) => setForm({ ...form, cargo: e.target.value })}
              className="w-full px-3 py-2 text-sm rounded-[8px] border border-[#E3E6EB] bg-white focus:outline-none focus:border-[#C8793A] text-gray-800"
            >
              <option value="Operador">Operador</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>
          {erroForm && <p className="text-xs text-[#D14343]">{erroForm}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <Btn variant="secondary" onClick={() => setShowModal(false)}>Cancelar</Btn>
            <Btn onClick={save} disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default function App() {
  const [page, setPage] = useState<Page>(getToken() ? "dashboard" : "login");
  const [usuarioLogado, setUsuarioLogado] = useState<any>(getUsuario());

  if (page === "login") {
    return (
      <LoginPage
        onLogin={(u) => {
          setUsuario(u);
          setUsuarioLogado(u);
          setPage("dashboard");
        }}
      />
    );
  }

  const handleLogout = () => {
    setToken(null);
    setUsuario(null);
    setUsuarioLogado(null);
    setPage("login");
  };

  const content: Record<string, React.ReactNode> = {
    dashboard: <DashboardPage />,
    clients:   <ClientsPage />,
    products:  <ProductsPage />,
    sales:     <SalesPage />,
    finance:   <FinancePage />,
    employees: <EmployeesPage />,
  };

  return (
    <Layout
      page={page}
      setPage={setPage}
      onLogout={handleLogout}
      nome={usuarioLogado?.nome ?? "Usuário"}
      cargo={usuarioLogado?.cargo ?? "Operador"}
    >
      {content[page]}
    </Layout>
  );
}
