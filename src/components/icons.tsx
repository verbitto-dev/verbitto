import {
  Anchor,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  Check,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock,
  Code2,
  ExternalLink,
  FileText,
  Gavel,
  Github,
  Globe,
  HelpCircle,
  Layers,
  LayoutTemplate,
  Link as LinkIcon,
  ListChecks,
  Lock,
  Menu,
  Moon,
  Scale,
  Search,
  Shield,
  Sun,
  Timer,
  Trophy,
  Users,
  Wallet,
  X,
  Zap,
} from 'lucide-react'

export const Icons = {
  anchor: Anchor,
  arrowRight: ArrowRight,
  arrowUpRight: ArrowUpRight,
  bookOpen: BookOpen,
  check: Check,
  checkCircle: CheckCircle,
  chevronDown: ChevronDown,
  chevronRight: ChevronRight,
  circle: Circle,
  clock: Clock,
  code: Code2,
  close: X,
  externalLink: ExternalLink,
  fileText: FileText,
  gavel: Gavel,
  gitHub: Github,
  globe: Globe,
  help: HelpCircle,
  layers: Layers,
  layoutTemplate: LayoutTemplate,
  link: LinkIcon,
  listChecks: ListChecks,
  lock: Lock,
  menu: Menu,
  moon: Moon,
  scale: Scale,
  search: Search,
  shield: Shield,
  sun: Sun,
  timer: Timer,
  trophy: Trophy,
  users: Users,
  wallet: Wallet,
  zap: Zap,
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" {...props}>
      <rect width="32" height="32" rx="6" fill="#2563eb" />
      <text
        x="16"
        y="23"
        fontFamily="system-ui,sans-serif"
        fontSize="20"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
      >
        V
      </text>
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
