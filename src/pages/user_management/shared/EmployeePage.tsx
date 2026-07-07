import { useState, useCallback, useMemo } from "react"
import type { ColDef, ValueFormatterParams } from "ag-grid-community"
import { DataTable } from "@/shared/DataTable"
import { Drawer } from "@/components/ui/drawer"
import { EmployeeForm } from "./EmployeeForm"
import type { EmployeeFormValues } from "./EmployeeForm"
import { ResetPasswordDialog } from "@/shared/ResetPasswordDialog"
import { DeleteDialog } from "@/shared/DeleteDialog"
import { canManageRole, getAuthUser } from "@/utils/auth"
import { getApiErrorMessage } from "@/utils/apiError"
import { fromIsoDate } from "@/utils/date"
import type { ManagedRole, UserRecord } from "@/types/userManagement"
import {
  useGetManagersQuery,
  useGetSupervisorsQuery,
  useGetOperatorsQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUsersMutation,
  useUpdateUserStatusMutation,
} from "@/store/services/userManagementApi"
import {
  EmploymentTypeBadge,
  ActiveToggle,
  ActionCell,
} from "@/shared/renderers"

interface EmployeePageProps {
  title: string
  role: ManagedRole
}

export function EmployeePage({ title, role }: EmployeePageProps) {
  const managers = useGetManagersQuery(undefined, { skip: role !== "MANAGER" })
  const supervisors = useGetSupervisorsQuery(undefined, { skip: role !== "SUPERVISOR" })
  const operators = useGetOperatorsQuery(undefined, { skip: role !== "OPERATOR" })
  const { data, isLoading } =
    role === "MANAGER" ? managers : role === "SUPERVISOR" ? supervisors : operators
  const rows = useMemo(() => data ?? [], [data])

  const [createUser] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()
  const [deleteUsers] = useDeleteUsersMutation()
  const [updateUserStatus] = useUpdateUserStatusMutation()

  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editRow, setEditRow] = useState<UserRecord | undefined>()
  const [formError, setFormError] = useState<string | null>(null)
  const [resetRow, setResetRow] = useState<UserRecord | undefined>()
  const [deleteRows, setDeleteRows] = useState<UserRecord[] | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Add/Edit/Toggle-active/Delete permissions vary per managed role — see canManageRole.
  const canManage = canManageRole(role)
  // Reset-password only applies to login-capable roles (Manager/Supervisor), not Operators.
  const canResetPassword = canManage && role !== "OPERATOR"

  const openAdd = useCallback(() => {
    setEditRow(undefined)
    setFormError(null)
    setDrawerOpen(true)
  }, [])

  const openEdit = useCallback((row: UserRecord) => {
    setEditRow(row)
    setFormError(null)
    setDrawerOpen(true)
  }, [])

  const closeDrawer = useCallback(() => setDrawerOpen(false), [])

  const openResetPassword = useCallback((row: UserRecord) => setResetRow(row), [])
  const closeResetPassword = useCallback(() => setResetRow(undefined), [])

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const handleSubmit = useCallback(async (values: EmployeeFormValues) => {
    const currentUser = getAuthUser()
    if (!currentUser) return
    setFormError(null)
    try {
      if (editRow) {
        await updateUser({
          employeeId: editRow.employeeId,
          role,
          body: {
            employeeName: values.employeeName,
            phoneNumber: values.phoneNumber,
            dateOfBirth: values.dateOfBirth,
            employmentType: values.employmentType,
            editedByEmployeeId: currentUser.employeeId,
          },
        }).unwrap()
      } else {
        await createUser({
          createdByEmpID: currentUser.employeeId,
          createdByEmpName: currentUser.employeeName,
          createdByEmpRole: currentUser.employeeRole,
          employeeId: values.employeeId,
          employeeName: values.employeeName,
          phoneNumber: values.phoneNumber,
          dateOfBirth: values.dateOfBirth,
          employmentType: values.employmentType,
          employeeRole: role,
        }).unwrap()
      }
      setDrawerOpen(false)
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to save. Please try again."))
    }
  }, [editRow, role, createUser, updateUser])

  const handleDelete = useCallback(async () => {
    if (!deleteRows?.length) return
    try {
      await deleteUsers({ userIds: deleteRows.map((r) => r.usersId), role }).unwrap()
    } catch {
      // The row list will simply reflect whatever the server actually deleted on refetch.
    }
  }, [deleteRows, role, deleteUsers])

  const handleToggle = useCallback(async (row: UserRecord, next: boolean) => {
    const currentUser = getAuthUser()
    if (!currentUser) return
    setTogglingId(row.usersId)
    try {
      await updateUserStatus({
        employeeId: row.employeeId,
        role,
        body: { status: next, editedByEmployeeId: currentUser.employeeId },
      }).unwrap()
    } finally {
      setTogglingId(null)
    }
  }, [role, updateUserStatus])

  const columnDefs = useMemo<ColDef<UserRecord>[]>(
    () => [
      { field: "employeeId", headerName: "Employee ID" },
      { field: "employeeName", headerName: "Employee Name" },
      { field: "phoneNumber", headerName: "Phone Number" },
      {
        field: "dateOfBirth",
        headerName: "DOB",
        valueFormatter: (p: ValueFormatterParams<UserRecord>) =>
          p.value ? fromIsoDate(p.value) : "",
      },
      {
        field: "employmentType",
        headerName: "Employment Type",
        cellRenderer: EmploymentTypeBadge,
      },
      {
        field: "isActive",
        headerName: "Active",
        cellRenderer: ActiveToggle,
        cellRendererParams: {
          onToggle: canManage ? handleToggle : undefined,
          pendingId: togglingId,
        },
        sortable: false,
      },
      ...(canManage
        ? [
            {
              headerName: "Action",
              cellRenderer: ActionCell,
              cellRendererParams: {
                onEdit: openEdit,
                onResetPassword: canResetPassword ? openResetPassword : undefined,
              },
              sortable: false,
            } satisfies ColDef<UserRecord>,
          ]
        : []),
    ],
    [openEdit, openResetPassword, canManage, canResetPassword, handleToggle, togglingId]
  )

  return (
    <>
      <DataTable<UserRecord>
        title={title}
        rowData={rows}
        columnDefs={columnDefs}
        loading={isLoading}
        checkbox={canManage}
        onAdd={canManage ? openAdd : undefined}
        onDelete={canManage ? setDeleteRows : undefined}
      />

      <Drawer
        open={drawerOpen}
        onClose={closeDrawer}
        title={editRow ? `Edit ${title}` : `Add ${title}`}
      >
        <EmployeeForm
          row={editRow}
          apiError={formError}
          onCancel={closeDrawer}
          onSubmit={handleSubmit}
        />
      </Drawer>

      <ResetPasswordDialog
        open={!!resetRow}
        onClose={closeResetPassword}
        userId={resetRow?.usersId ?? null}
        employeeName={resetRow?.employeeName}
      />

      <DeleteDialog
        open={!!deleteRows}
        onClose={closeDelete}
        onConfirm={handleDelete}
        title={`Delete ${title}`}
        description={`Are you sure you want to delete the selected ${title.toLowerCase()}${deleteRows && deleteRows.length > 1 ? "s" : ""}? This action cannot be undone.`}
      />
    </>
  )
}
