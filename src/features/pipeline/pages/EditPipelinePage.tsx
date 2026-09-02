import { Navigate, useParams } from 'react-router-dom'
import { PipelineEditor } from '../components/PipelineEditor'
export function EditPipelinePage() {
  const { pipelineId } = useParams()
  return pipelineId ? <PipelineEditor id={pipelineId} /> : <Navigate replace to="/pipelines" />
}
