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
import { useDialogState } from "@/hooks/useDialogState"
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
  const { data, isLoading, isFetching, refetch } =
    role === "MANAGER" ? managers : role === "SUPERVISOR" ? supervisors : operators
  const rows = data ?? []

  const [createUser] = useCreateUserMutation()
  const [updateUser] = useUpdateUserMutation()
  const [deleteUsers] = useDeleteUsersMutation()
  const [updateUserStatus] = useUpdateUserStatusMutation()

  const dialog = useDialogState<UserRecord>()
  const [formError, setFormError] = useState<string | null>(null)
  const [resetRow, setResetRow] = useState<UserRecord | undefined>()
  const [deleteRows, setDeleteRows] = useState<UserRecord[] | null>(null)
  const [togglingId, setTogglingId] = useState<number | null>(null)

  // Add/Edit/Toggle-active/Delete/Reset-password permissions vary per managed role — see canManageRole.
  const canManage = canManageRole(role)

  const openAdd = useCallback(() => {
    setFormError(null)
    dialog.openAdd()
  }, [dialog])

  const openEdit = useCallback((row: UserRecord) => {
    setFormError(null)
    dialog.openEdit(row)
  }, [dialog])

  const openResetPassword = useCallback((row: UserRecord) => setResetRow(row), [])
  const closeResetPassword = useCallback(() => setResetRow(undefined), [])

  const closeDelete = useCallback(() => setDeleteRows(null), [])

  const handleSubmit = useCallback(async (values: EmployeeFormValues) => {
    const currentUser = getAuthUser()
    if (!currentUser) return
    setFormError(null)
    try {
      if (dialog.editing) {
        await updateUser({
          employeeId: dialog.editing.employeeId,
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
          department: values.department,
        }).unwrap()
      }
      dialog.close()
    } catch (err) {
      setFormError(getApiErrorMessage(err, "Failed to save. Please try again."))
    }
  }, [dialog, role, createUser, updateUser])

  const handleDelete = useCallback(async () => {
    if (!deleteRows?.length) return
    const currentUser = getAuthUser()
    if (!currentUser) return
    try {
      await deleteUsers({
        userIds: deleteRows.map((r) => r.usersId),
        role,
        deletedByEmployeeId: currentUser.employeeId,
      }).unwrap()
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
                onResetPassword: openResetPassword,
              },
              sortable: false,
            } satisfies ColDef<UserRecord>,
          ]
        : []),
    ],
    [openEdit, openResetPassword, canManage, handleToggle, togglingId]
  )

  return (
    <>
      <DataTable<UserRecord>
        title={title}
        rowData={rows}
        columnDefs={columnDefs}
        loading={isLoading}
        onRefresh={refetch}
        refreshing={isFetching}
        checkbox={canManage}
        onAdd={canManage ? openAdd : undefined}
        onDelete={canManage ? setDeleteRows : undefined}
      />

      <Drawer
        open={dialog.isOpen}
        onClose={dialog.close}
        title={dialog.editing ? `Edit ${title}` : `Add ${title}`}
      >
        <EmployeeForm
          row={dialog.editing}
          apiError={formError}
          onCancel={dialog.close}
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
