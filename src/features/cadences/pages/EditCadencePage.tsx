import { Navigate, useParams } from 'react-router-dom'
import { CadenceEditor } from '../components/CadenceEditor'

export function EditCadencePage() {
  const { cadenceId } = useParams()
  return cadenceId ? <CadenceEditor id={cadenceId} /> : <Navigate replace to="/cadencias" />
}
