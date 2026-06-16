import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"

interface DepartmentRow {
  department: string
  managersCount: number
  supervisorCount: number
  operatorsCount: number
}

const rowData: DepartmentRow[] = [
  { department: "Production",   managersCount: 2, supervisorCount: 4, operatorsCount: 5  },
  { department: "Quality",      managersCount: 1, supervisorCount: 3, operatorsCount: 8  },
  { department: "Maintenance",  managersCount: 1, supervisorCount: 2, operatorsCount: 6  },
  { department: "HR",           managersCount: 1, supervisorCount: 2, operatorsCount: 3  },
  { department: "Finance",      managersCount: 1, supervisorCount: 1, operatorsCount: 4  },
  { department: "IT",           managersCount: 2, supervisorCount: 3, operatorsCount: 7  },
  { department: "Logistics",    managersCount: 1, supervisorCount: 4, operatorsCount: 10 },
  { department: "Safety",       managersCount: 1, supervisorCount: 2, operatorsCount: 5  },
  { department: "Admin",        managersCount: 1, supervisorCount: 1, operatorsCount: 3  },
  { department: "R&D",          managersCount: 2, supervisorCount: 2, operatorsCount: 4  },
]

const columnDefs: ColDef<DepartmentRow>[] = [
  { field: "department",      headerName: "Department" },
  { field: "managersCount",   headerName: "Managers Count" },
  { field: "supervisorCount", headerName: "Supervisor Count" },
  { field: "operatorsCount",  headerName: "Operators Count" },
  {
    headerName: "Total",
    valueGetter: (p) =>
      (p.data?.managersCount ?? 0) +
      (p.data?.supervisorCount ?? 0) +
      (p.data?.operatorsCount ?? 0),
  },
]

export function Department() {
  return (
    <DataTable<DepartmentRow>
      title="Department"
      rowData={rowData}
      columnDefs={columnDefs}
    />
  )
}
