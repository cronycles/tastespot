import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'danger'

type ButtonProps = PropsWithChildren<
  ButtonHTMLAttributes<HTMLButtonElement> & {
    variant?: ButtonVariant
  }
>

export function Button({ children, className, variant = 'primary', ...props }: ButtonProps) {
  const classes = ['button', `button-${variant}`, className].filter(Boolean).join(' ')

  return (
    <button {...props} className={classes}>
      {children}
    </button>
  )
}