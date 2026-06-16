import { useState, useCallback, useMemo } from "react"
import type { ColDef } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { Drawer } from "@/components/ui/drawer"
import { EmployeeForm } from "./EmployeeForm"
import {
  EmploymentTypeBadge,
  ActiveToggle,
  ActionCell,
} from "@/shared/renderers"

type EmploymentType = "Full Time" | "Part Time"

export interface EmployeeRow {
  id: number
  employeeId: string
  name: string
  phone: string
  dob: string
  employmentType: EmploymentType
  active: boolean
}

const mockEmployees: EmployeeRow[] = [
  { id: 1,  employeeId: "APM0001", name: "Basheer",        phone: "9898767567", dob: "10-Apr-94", employmentType: "Full Time", active: true  },
  { id: 2,  employeeId: "APM0002", name: "Shashti Priyan", phone: "9098789876", dob: "16-Jun-93", employmentType: "Part Time", active: true  },
  { id: 3,  employeeId: "APM0003", name: "Sarath",         phone: "6754567898", dob: "31-Dec-93", employmentType: "Full Time", active: false },
  { id: 4,  employeeId: "APM0004", name: "Aravind Kumar",  phone: "9876543210", dob: "22-Mar-91", employmentType: "Full Time", active: true  },
  { id: 5,  employeeId: "APM0005", name: "Meena Devi",     phone: "8765432109", dob: "05-Jul-95", employmentType: "Part Time", active: true  },
  { id: 6,  employeeId: "APM0006", name: "Rajesh Nair",    phone: "7654321098", dob: "18-Nov-90", employmentType: "Full Time", active: false },
  { id: 7,  employeeId: "APM0007", name: "Priya Sharma",   phone: "6543210987", dob: "29-Jan-96", employmentType: "Full Time", active: true  },
  { id: 8,  employeeId: "APM0008", name: "Suresh Babu",    phone: "9123456780", dob: "14-Aug-88", employmentType: "Part Time", active: true  },
  { id: 9,  employeeId: "APM0009", name: "Kavya Menon",    phone: "8012345679", dob: "03-Feb-97", employmentType: "Full Time", active: true  },
  { id: 10, employeeId: "APM0010", name: "Dinesh Raj",     phone: "7901234568", dob: "25-Oct-92", employmentType: "Part Time", active: false },
]

interface EmployeePageProps {
  title: string
}

export function EmployeePage({ title }: EmployeePageProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRow, setEditRow] = useState<EmployeeRow | undefined>()

  const openAdd = useCallback(() => {
    setEditRow(undefined)
    setDrawerOpen(true)
  }, [])

  const openEdit = useCallback((row: EmployeeRow) => {
    setEditRow(row)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const handleSubmit = async (): Promise<void> => {
    await new Promise((r) => setTimeout(r, 1500))
    closeDrawer()
  }

  const columnDefs = useMemo<ColDef<EmployeeRow>[]>(
    () => [
      { field: "employeeId", headerName: "Employee ID" },
      { field: "name",       headerName: "Employee Name" },
      { field: "phone",      headerName: "Phone Number" },
      { field: "dob",        headerName: "DOB" },
      {
        field: "employmentType",
        headerName: "Employment Type",
        cellRenderer: EmploymentTypeBadge,
      },
      {
        field: "active",
        headerName: "Active",
        cellRenderer: ActiveToggle,
        sortable: false,
      },
      {
        headerName: "Action",
        cellRenderer: ActionCell,
        cellRendererParams: { onEdit: openEdit },
        sortable: false,
      },
    ],
    [openEdit]
  )

  return (
    <>
      <DataTable<EmployeeRow>
        title={title}
        rowData={mockEmployees}
        columnDefs={columnDefs}
        checkbox
        onAdd={openAdd}
        onDelete={(rows) => console.log("Delete", rows)}
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editRow ? `Edit ${title}` : `Add ${title}`}
      >
        <EmployeeForm
          row={editRow}
          onCancel={closeDrawer}
          onSubmit={handleSubmit}
        />
      </Drawer>
    </>
  )
}
