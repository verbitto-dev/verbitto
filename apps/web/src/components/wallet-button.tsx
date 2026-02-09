'use client'

import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'

import { Button } from '@/components/ui/button'
import { shortKey } from '@/hooks/use-program'

import { Icons } from './icons'

export function WalletButton() {
  const { publicKey, disconnect, connecting } = useWallet()
  const { setVisible } = useWalletModal()

  if (publicKey) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="rounded-lg gap-1.5 font-mono text-xs"
        onClick={() => disconnect()}
        title="Click to disconnect"
      >
        <span className="size-2 rounded-full bg-green-500" />
        {shortKey(publicKey)}
      </Button>
    )
  }

  return (
    <Button
      variant="brand"
      size="sm"
      className="rounded-lg gap-1.5"
      onClick={() => setVisible(true)}
      disabled={connecting}
    >
      <Icons.wallet className="size-3.5" />
      {connecting ? 'Connecting…' : 'Connect'}
    </Button>
  )
}
