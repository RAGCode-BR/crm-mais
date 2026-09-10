type EdgeTable = {
  Row: Record<string, unknown>
  Insert: Record<string, unknown>
  Update: Record<string, unknown>
  Relationships: []
}

type EdgeFunction = {
  Args: Record<string, unknown>
  Returns: unknown
}

export type EdgeDatabase = {
  public: {
    Tables: Record<string, EdgeTable>
    Views: Record<string, never>
    Functions: Record<string, EdgeFunction>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
