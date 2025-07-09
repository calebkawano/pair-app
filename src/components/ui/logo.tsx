import { useDarkMode } from '@/hooks/use-dark-mode';
import { cn } from '@/lib/utils';
import Image from 'next/image';

interface LogoProps {
  variant?: 'full' | 'minimal';
  className?: string;
  size?: number;
  forceLightMode?: boolean;
}

export function Logo({ 
  variant = 'full',
  className,
  size = 40,
  forceLightMode = false
}: LogoProps) {
  const [isDark] = useDarkMode();
  const theme = (!forceLightMode && isDark) ? 'dark' : 'light';
  
  return (
    <div className={cn('relative', className)}>
      <Image
        src={`/images/logos/pair-logo-${variant}-${theme}.png`}
        alt="pAIr Logo"
        width={size}
        height={size}
        priority
        className="object-contain"
      />
    </div>
  );
} 