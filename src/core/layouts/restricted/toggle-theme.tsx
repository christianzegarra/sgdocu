import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useThemeStore } from '@/store/theme-store'

type Props = {
  className?: string
}

export const DarkModeToggle = ({ className }: Props) => {
  const { toggleTheme } = useThemeStore()

  return (
    <Button variant='ghost' size='sm' onClick={toggleTheme} className={cn(className, 'hover:cursor-pointer')}>
      <Sun className='h-[1.2rem] w-[1.2rem] rotate-0 scale-0 transition-all dark:-rotate-90 dark:scale-100' />
      <Moon className='absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-100 transition-all dark:rotate-0 dark:scale-0' />
      <span className='sr-only'>Toggle theme</span>
    </Button>
  )
}
