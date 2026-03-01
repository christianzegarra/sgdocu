import { useLocation } from 'react-router'

export const useActiveRoute = () => {
  const location = useLocation()

  return (path: string) => {
    if (path === '/') {
      return location.pathname === path
    }
    return location.pathname.startsWith(path)
  }
}
