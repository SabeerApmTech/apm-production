export interface ProcessTeamRecord {
  processTeamId: number
  processTeamName: string
  isActive: boolean
  createdAt: string
  updatedAt: string | null
}

export interface ProcessTeamRequest {
  processTeamName: string
}

export interface ProcessTeamUpdateRequest {
  processTeamName: string
  isActive: boolean
}
