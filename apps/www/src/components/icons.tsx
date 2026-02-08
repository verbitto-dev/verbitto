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
} from 'lucide-react';

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
  // VERBITTO logo — rocket landing on droneship
  logo: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
      <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
      <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
      <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
    </svg>
  ),
  solana: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M4.52 16.57a.75.75 0 0 1 .53-.22h15.13a.37.37 0 0 1 .27.64l-3.19 3.19a.75.75 0 0 1-.53.22H1.6a.37.37 0 0 1-.27-.64l3.19-3.19z" />
      <path d="M4.52 3.78A.78.78 0 0 1 5.05 3.56h15.13a.37.37 0 0 1 .27.64l-3.19 3.19a.75.75 0 0 1-.53.22H1.6a.37.37 0 0 1-.27-.64L4.52 3.78z" />
      <path d="M16.73 10.13a.75.75 0 0 0-.53-.22H1.6a.37.37 0 0 0-.27.64l3.19 3.19a.75.75 0 0 0 .53.22h15.13a.37.37 0 0 0 .27-.64l-3.19-3.19z" />
    </svg>
  ),
};
