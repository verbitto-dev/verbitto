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
  MessageCircle,
  Moon,
  RefreshCw,
  Scale,
  Search,
  Send,
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
  messageCircle: MessageCircle,
  moon: Moon,
  refresh: RefreshCw,
  scale: Scale,
  search: Search,
  send: Send,
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
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="claw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f87171" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <filter id="glow">
          <feGaussianBlur stdDeviation="10" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect width="512" height="512" rx="108" fill="url(#bg)" />

      <g filter="url(#glow)">
        <path
          d="
      M244 390
      L118 168
      L92 95
      Q82 60, 112 60
      Q140 60, 137 90
      L134 140
      L158 140
      L155 90
      Q152 60, 182 60
      Q210 60, 200 95
      L176 168
      L264 390
      Z
    "
          fill="url(#claw)"
        />

        <path
          d="
      M268 390
      L394 168
      L420 95
      Q430 60, 400 60
      Q372 60, 375 90
      L378 140
      L354 140
      L357 90
      Q360 60, 330 60
      Q302 60, 312 95
      L336 168
      L248 390
      Z
    "
          fill="url(#claw)"
        />

        <path
          d="M200 118 Q172 75, 122 48"
          fill="none"
          stroke="url(#claw)"
          strokeWidth="6"
          strokeLinecap="round"
        />
        <path
          d="M312 118 Q340 75, 390 48"
          fill="none"
          stroke="url(#claw)"
          strokeWidth="6"
          strokeLinecap="round"
        />

        <path
          d="M214 112 Q196 80, 160 62"
          fill="none"
          stroke="url(#claw)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.6"
        />
        <path
          d="M298 112 Q316 80, 352 62"
          fill="none"
          stroke="url(#claw)"
          strokeWidth="4"
          strokeLinecap="round"
          opacity="0.6"
        />

        <path
          d="
      M256 365
      L234 394 L243 425
      L256 412
      L269 425 L278 394
      Z
    "
          fill="url(#claw)"
          opacity="0.85"
        />
      </g>
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
