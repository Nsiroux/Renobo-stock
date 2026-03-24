import Link from 'next/link'
import Image from 'next/image'

type Props = {
  href?: string
  compact?: boolean
}

export default function RenoboBrand({ href, compact = false }: Props) {
  const content = (
    <div className="flex items-center">
      <Image
        src="/renobo-logo.png"
        alt="Renobo interior acoustics"
        width={compact ? 180 : 240}
        height={compact ? 72 : 96}
        priority
        className="h-auto w-auto object-contain"
      />
    </div>
  )

  if (!href) {
    return content
  }

  return (
    <Link href={href} className="inline-flex rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand)]">
      {content}
    </Link>
  )
}
