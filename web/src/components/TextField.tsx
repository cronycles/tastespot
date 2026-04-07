import type { InputHTMLAttributes } from 'react'

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string | null
}

export function TextField({ label, error, id, ...props }: TextFieldProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className="field">
      <label htmlFor={inputId}>{label}</label>
      <input id={inputId} {...props} />
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  )
}