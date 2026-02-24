import { useState, useEffect } from 'react'

/**
 * Retorna valor debounced (atraso em ms).
 * Útil para busca: aplica após usuário parar de digitar.
 */
export function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
