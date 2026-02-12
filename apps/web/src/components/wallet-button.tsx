'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { shortKey } from '@/hooks/use-program'
import { cn } from '@/lib/utils'

import { Icons } from './icons'

export function WalletButton() {
  const { publicKey, disconnect, connecting } = useWallet()
  const { setVisible } = useWalletModal()
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const isHome = pathname === '/'

  useEffect(() => {
    setMounted(true)
  }, [])

  // Prevent hydration mismatch by rendering consistent initial state
  if (!mounted) {
    return (
      <Button variant="brand" size="sm" className="rounded-lg gap-1.5" disabled>
        <Icons.wallet className="size-3.5" />
        Connect
      </Button>
    )
  }

  if (publicKey) {
    return (
      <Button
        variant="outline"
        size="sm"
        className={cn(
          'rounded-lg gap-1.5 font-mono text-xs',
          isHome && 'border-white/40 bg-white/15 text-white backdrop-blur-sm hover:bg-white/25'
        )}
        onClick={() => disconnect()}
        title="Click to disconnect"
      >
        <span className="size-2 rounded-full bg-green-500" />
        {shortKey(publicKey)}
      </Button>
    )
  }

  const handleConnect = () => {
    // Show devnet reminder via native confirm dialog
    const ok = window.confirm(
      '⚠️ Solana Devnet Only\n\nThis app is running on Solana Devnet.\nPlease make sure your wallet is set to Devnet.\nDo not send real SOL — use devnet tokens only.\n\nContinue?'
    )
    if (ok) {
      setVisible(true)
    }
  }

  return (
    <Button
      variant="brand"
      size="sm"
      className="rounded-lg gap-1.5"
      onClick={handleConnect}
      disabled={connecting}
    >
      <Icons.wallet className="size-3.5" />
      {connecting ? 'Connecting…' : 'Connect'}
    </Button>
  )
}
