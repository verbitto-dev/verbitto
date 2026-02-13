import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  Ban,
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
  FileCheck,
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
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
  Zap,
} from 'lucide-react'

export const Icons = {
  anchor: Anchor,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  ban: Ban,
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
  fileCheck: FileCheck,
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
  userCheck: UserCheck,
  users: Users,
  wallet: Wallet,
  xCircle: XCircle,
  zap: Zap,
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1d4ed8" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
        <linearGradient id="claw" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#c7d2fe" />
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

      {/* shield outline ring */}
      <path
        d="M256 72 L420 148 V296 Q420 420 256 456 Q92 420 92 296 V148 Z"
        fill="none"
        stroke="rgba(255,255,255,0.10)"
        strokeWidth="10"
      />

      <g filter="url(#glow)">
        {/* LEFT CLAW */}
        <path
          d="
      M248 378
      L135 172
      L115 105
      Q108 78, 130 78
      Q150 78, 148 100
      L146 140
      L160 140
      L158 100
      Q156 78, 178 78
      Q198 78, 190 105
      L178 172
      L258 378
      Z
    "
          fill="url(#claw)"
        />

        {/* RIGHT CLAW */}
        <path
          d="
      M264 378
      L377 172
      L397 105
      Q404 78, 382 78
      Q362 78, 364 100
      L366 140
      L352 140
      L354 100
      Q356 78, 334 78
      Q314 78, 322 105
      L334 172
      L254 378
      Z
    "
          fill="url(#claw)"
        />

        {/* ANTENNAE long */}
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

        {/* ANTENNAE short */}
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

        {/* TAIL FAN */}
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
