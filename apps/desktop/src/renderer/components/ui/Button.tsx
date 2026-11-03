import type { ButtonHTMLAttributes, ReactNode } from 'react'
import s from './Button.module.css'

export type ButtonVariant = 'primary-gold' | 'secondary' | 'ghost' | 'danger'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  icon?: ReactNode
  iconOnly?: boolean
}

export function Button({ variant = 'secondary', icon, iconOnly, className, children, type = 'button', ...rest }: Props) {
  const cls = [s.btn, s[variant], iconOnly ? s.iconOnly : '', className ?? ''].join(' ')
  return (
    <button type={type} className={cls} {...rest}>
      {icon}
      {children}
    </button>
  )
}
