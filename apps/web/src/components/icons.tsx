import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Bot,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  DatabaseZap,
  ExternalLink,
  FileText,
  Filter,
  Gavel,
  Github,
  Globe,
  HelpCircle,
  Layers,
  LayoutTemplate,
  Link as LinkIcon,
  ListChecks,
  Loader2,
  Lock,
  Menu,
  Moon,
  RefreshCw,
  Scale,
  Search,
  Shield,
  Sun,
  Timer,
  Trophy,
  Upload,
  User,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react'

export const Icons = {
  anchor: Anchor,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  book: BookOpen,
  bookOpen: BookOpen,
  bot: Bot,
  check: Check,
  checkCircle: CheckCircle,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  circle: Circle,
  clock: Clock,
  code: Code2,
  close: X,
  databaseSync: DatabaseZap,
  externalLink: ExternalLink,
  fileText: FileText,
  filter: Filter,
  gavel: Gavel,
  gitHub: Github,
  globe: Globe,
  help: HelpCircle,
  layers: Layers,
  layoutTemplate: LayoutTemplate,
  link: LinkIcon,
  listChecks: ListChecks,
  loader: Loader2,
  lock: Lock,
  menu: Menu,
  moon: Moon,
  refresh: RefreshCw,
  scale: Scale,
  search: Search,
  shield: Shield,
  sun: Sun,
  timer: Timer,
  trophy: Trophy,
  upload: Upload,
  user: User,
  users: Users,
  wallet: Wallet,
  zap: Zap,
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
      <defs>
        <linearGradient id="logoBg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="logoV" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e0e7ff" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="112" fill="url(#logoBg)" />
      <path
        d="M256 72 L420 148 V296 Q420 420 256 456 Q92 420 92 296 V148 Z"
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="12"
      />
      <path d="M144 136 L248 392 L256 392 L168 136 Z" fill="url(#logoV)" />
      <path d="M368 136 L264 392 L256 392 L344 136 Z" fill="url(#logoV)" />
      <path d="M256 368 L272 392 L256 416 L240 392 Z" fill="url(#logoV)" opacity="0.85" />
    </svg>
  ),
  x: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  solana: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.52 16.57a.75.75 0 0 1 .53-.22h15.13a.37.37 0 0 1 .27.64l-3.19 3.19a.75.75 0 0 1-.53.22H1.6a.37.37 0 0 1-.27-.64l3.19-3.19z" />
      <path d="M4.52 3.78A.78.78 0 0 1 5.05 3.56h15.13a.37.37 0 0 1 .27.64l-3.19 3.19a.75.75 0 0 1-.53.22H1.6a.37.37 0 0 1-.27-.64L4.52 3.78z" />
      <path d="M16.73 10.13a.75.75 0 0 0-.53-.22H1.6a.37.37 0 0 0-.27.64l3.19 3.19a.75.75 0 0 0 .53.22h15.13a.37.37 0 0 0 .27-.64l-3.19-3.19z" />
    </svg>
  ),
}
