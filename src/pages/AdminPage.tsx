import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useToast } from '../context/ToastContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Badge } from '../components/ui/Badge';
import { Toggle } from '../components/ui/Toggle';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { useSettings, useUpdateSettings } from '../hooks/useSettings';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '../hooks/useUsers';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject, useAssignProjectEmployees } from '../hooks/useProjects';
import { useMyReports, useUserManagers, useAssignManagers } from '../hooks/useTeam';
import { useAuth } from '../context/AuthContext';
import {
  useLeaveTypes,
  useCreateLeaveType,
  useUpdateLeaveType,
  useDeleteLeaveType,
} from '../hooks/useLeaveTypes';
import { useHolidays, useCreateHoliday, useDeleteHoliday } from '../hooks/useHolidays';
import { formatDate } from '../utils/dateHelpers';
import { getErrorMessage } from '../utils/getErrorMessage';
import type { OrgSettings, FullUser, Project, LeaveType, Holiday } from '../types';

/* ---------- sidebar nav items ---------- */

const ADMIN_TABS = [
  { key: 'general', label: 'General Settings', icon: 'cog' },
  { key: 'users', label: 'Users & Roles', icon: 'users' },
  { key: 'projects', label: 'Projects', icon: 'folder' },
  { key: 'leaveTypes', label: 'Leave Types', icon: 'calendar' },
  { key: 'holidays', label: 'Holidays', icon: 'sun' },
  { key: 'notifications', label: 'Notifications', icon: 'bell' },
  { key: 'integrations', label: 'Integrations', icon: 'link' },
] as const;

type AdminTab = (typeof ADMIN_TABS)[number]['key'];

/* ---------- icons ---------- */

function TabIcon({ icon }: { icon: string }) {
  const iconPaths: Record<string, string> = {
    cog: 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z',
    users: 'M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z',
    folder: 'M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z',
    calendar: 'M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5',
    sun: 'M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z',
    bell: 'M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0',
    link: 'M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244',
  };

  return (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d={iconPaths[icon] ?? iconPaths.cog} />
    </svg>
  );
}

/* ---------- AdminSidebar ---------- */

interface AdminSidebarProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
}

function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  return (
    <nav className="w-full shrink-0 lg:w-56">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
        {ADMIN_TABS.map((tab) => (
          <li key={tab.key}>
            <button
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex w-full items-center gap-2.5 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? 'bg-brand-primary/10 text-brand-primary'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <TabIcon icon={tab.icon} />
              {tab.label}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ========================================================================== */
/*  GENERAL SETTINGS TAB                                                      */
/* ========================================================================== */

function GeneralSettingsTab() {
  const { showToast } = useToast();
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const settings: OrgSettings | null = settingsData?.data ?? null;

  const { register, handleSubmit, control, reset } = useForm<OrgSettings>();

  React.useEffect(() => {
    if (settings) reset(settings);
  }, [settings, reset]);

  const onSubmit = async (data: OrgSettings) => {
    try {
      await updateSettings.mutateAsync(data as unknown as Record<string, unknown>);
      showToast('Settings saved successfully', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!settings) {
    return <p className="text-sm text-gray-500">Unable to load settings.</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {/* TMS Settings */}
      <div>
        <h3 className="mb-4 text-base font-semibold text-gray-900">Timesheet Settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Select
            label="Work Week Start"
            options={[
              { value: 'MONDAY', label: 'Monday' },
              { value: 'SUNDAY', label: 'Sunday' },
              { value: 'SATURDAY', label: 'Saturday' },
            ]}
            {...register('workWeekStart')}
          />
          <Input label="Standard Hours" type="number" step="0.5" {...register('standardHours', { valueAsNumber: true })} />
          <Select
            label="Time Format"
            options={[
              { value: 'DECIMAL', label: 'Decimal (8.5)' },
              { value: 'HH:MM', label: 'HH:MM (8:30)' },
            ]}
            {...register('timeFormat')}
          />
          <Input label="Time Increment (min)" type="number" {...register('timeIncrement', { valueAsNumber: true })} />
          <Input label="Max Hours / Day" type="number" step="0.5" {...register('maxHoursPerDay', { valueAsNumber: true })} />
          <Input label="Max Hours / Week" type="number" step="0.5" {...register('maxHoursPerWeek', { valueAsNumber: true })} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Controller
            name="requireApproval"
            control={control}
            render={({ field }) => (
              <Toggle label="Require Approval" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name="allowBackdated"
            control={control}
            render={({ field }) => (
              <Toggle label="Allow Backdated Entries" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name="enableOvertime"
            control={control}
            render={({ field }) => (
              <Toggle label="Enable Overtime" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name="mandatoryDesc"
            control={control}
            render={({ field }) => (
              <Toggle label="Mandatory Descriptions" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name="allowCopyWeek"
            control={control}
            render={({ field }) => (
              <Toggle label="Allow Copy Previous Week" checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </div>

      {/* LMS Settings */}
      <div className="border-t border-gray-200 pt-6">
        <h3 className="mb-4 text-base font-semibold text-gray-900">Leave Settings</h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Controller
            name="leaveRequireApproval"
            control={control}
            render={({ field }) => (
              <Toggle label="Require Approval" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name="leaveAllowBackdated"
            control={control}
            render={({ field }) => (
              <Toggle label="Allow Backdated Requests" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name="accrualEnabled"
            control={control}
            render={({ field }) => (
              <Toggle label="Accrual Enabled" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Controller
            name="carryForwardEnabled"
            control={control}
            render={({ field }) => (
              <Toggle label="Carry Forward Enabled" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Input label="Carry Forward Max Days" type="number" {...register('carryForwardMaxDays', { valueAsNumber: true })} />
          <Select
            label="Approval Levels"
            options={[
              { value: '1', label: '1 Level' },
              { value: '2', label: '2 Levels' },
            ]}
            {...register('leaveApprovalLevels', { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="flex justify-end border-t border-gray-200 pt-4">
        <Button type="submit" loading={updateSettings.isPending}>
          Save Settings
        </Button>
      </div>
    </form>
  );
}

/* ========================================================================== */
/*  USERS TAB                                                                 */
/* ========================================================================== */

function UsersTab() {
  const { showToast } = useToast();
  const { data: usersData, isLoading } = useUsers();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();

  const assignManagers = useAssignManagers();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<FullUser | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [assignManagerUserId, setAssignManagerUserId] = useState<number | null>(null);
  const [selectedManagerIds, setSelectedManagerIds] = useState<number[]>([]);
  const [newUserManagerId, setNewUserManagerId] = useState<string>('');
  const [newUserManagerError, setNewUserManagerError] = useState<string>('');

  const users: FullUser[] = usersData?.data ?? [];
  const managers = users.filter((u) => u.role === 'MANAGER' || u.role === 'ADMIN');

  const { data: currentManagersData } = useUserManagers(assignManagerUserId ?? undefined);
  const { data: editUserManagersData } = useUserManagers(editingUser?.role === 'EMPLOYEE' ? editingUser?.id : undefined);

  const openAssignManager = (u: FullUser) => {
    setAssignManagerUserId(u.id);
    const current: { id: number }[] = currentManagersData?.data ?? [];
    setSelectedManagerIds(current.map((m) => m.id));
  };

  // Sync selected IDs when data loads for the standalone assign-manager modal
  React.useEffect(() => {
    if (assignManagerUserId && currentManagersData) {
      const current: { id: number }[] = currentManagersData?.data ?? [];
      setSelectedManagerIds(current.map((m) => m.id));
    }
  }, [currentManagersData, assignManagerUserId]);

  // Pre-populate manager dropdown when editing an employee
  React.useEffect(() => {
    if (editingUser && editUserManagersData) {
      const current: { id: number }[] = editUserManagersData?.data ?? [];
      setNewUserManagerId(current.length > 0 ? String(current[0].id) : '');
    }
  }, [editUserManagersData, editingUser]);

  const handleAssignManagerSave = async () => {
    if (!assignManagerUserId) return;
    try {
      await assignManagers.mutateAsync({ userId: assignManagerUserId, managerIds: selectedManagerIds });
      showToast('Manager(s) assigned successfully', 'success');
      setAssignManagerUserId(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const toggleManager = (id: number) => {
    setSelectedManagerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<{
    name: string;
    email: string;
    password: string;
    role: string;
    department: string;
  }>();

  const watchedRole = watch('role', 'EMPLOYEE');

  const openAdd = () => {
    setEditingUser(null);
    setNewUserManagerId('');
    setNewUserManagerError('');
    reset({ name: '', email: '', password: '', role: 'EMPLOYEE', department: '' });
    setModalOpen(true);
  };

  const openEdit = (user: FullUser) => {
    setEditingUser(user);
    setNewUserManagerId('');
    setNewUserManagerError('');
    reset({
      name: user.name,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department ?? '',
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    if (data.role === 'EMPLOYEE' && !newUserManagerId) {
      setNewUserManagerError('Manager is required for employees');
      return;
    }
    try {
      if (editingUser) {
        const payload = { ...data };
        if (!payload.password) delete payload.password;
        await updateUser.mutateAsync({ id: editingUser.id, data: payload });
        if (data.role === 'EMPLOYEE' && newUserManagerId) {
          await assignManagers.mutateAsync({ userId: editingUser.id, managerIds: [parseInt(newUserManagerId, 10)] });
        }
        showToast('User updated', 'success');
      } else {
        const created = await createUser.mutateAsync(data);
        const newId: number = created?.data?.id;
        if (newId && data.role === 'EMPLOYEE' && newUserManagerId) {
          await assignManagers.mutateAsync({ userId: newId, managerIds: [parseInt(newUserManagerId, 10)] });
        }
        showToast('User created', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteUser.mutateAsync(id);
      showToast('User deactivated', 'success');
      setDeleteConfirm(null);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  function roleBadgeVariant(role: string) {
    if (role === 'ADMIN') return 'rejected' as const;
    if (role === 'MANAGER') return 'submitted' as const;
    return 'draft' as const;
  }

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Users</h3>
        <Button size="sm" onClick={openAdd}>
          Add User
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[700px] text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Email</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Role</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Department</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-sm text-gray-400">
                  No users found.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{u.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <Badge variant={roleBadgeVariant(u.role)}>{u.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{u.department ?? '-'}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.status === 'ACTIVE' ? 'approved' : 'cancelled'}>
                      {u.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(u)}>
                        Edit
                      </Button>
                      {u.role === 'EMPLOYEE' && (
                        <Button variant="ghost" size="sm" onClick={() => openAssignManager(u)}>
                          Assign Manager
                        </Button>
                      )}
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteConfirm(u.id)}
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? 'Edit User' : 'Add User'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input
            label="Email"
            type="email"
            error={errors.email?.message}
            {...register('email', { required: 'Email is required' })}
          />
          <Input
            label={editingUser ? 'Password (leave blank to keep)' : 'Password'}
            type="password"
            error={errors.password?.message}
            {...register('password', {
              required: editingUser ? false : 'Password is required',
            })}
          />
          <Select
            label="Role"
            options={[
              { value: 'EMPLOYEE', label: 'Employee' },
              { value: 'MANAGER', label: 'Manager' },
              { value: 'ADMIN', label: 'Admin' },
            ]}
            {...register('role', {
              onChange: () => {
                setNewUserManagerId('');
                setNewUserManagerError('');
              },
            })}
          />
          {watchedRole === 'EMPLOYEE' && (
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">
                Manager <span className="text-red-500">*</span>
              </label>
              <select
                value={newUserManagerId}
                onChange={(e) => {
                  setNewUserManagerId(e.target.value);
                  if (e.target.value) setNewUserManagerError('');
                }}
                className="w-full appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-brand-primary/30"
              >
                <option value="">Select a manager…</option>
                {managers.map((m) => (
                  <option key={m.id} value={String(m.id)}>
                    {m.name} ({m.role})
                  </option>
                ))}
              </select>
              {newUserManagerError && (
                <p className="text-xs text-red-500">{newUserManagerError}</p>
              )}
            </div>
          )}
          <Input label="Department" {...register('department')} />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={createUser.isPending || updateUser.isPending}>
              {editingUser ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Manager Modal */}
      <Modal
        isOpen={assignManagerUserId !== null}
        onClose={() => setAssignManagerUserId(null)}
        title={`Assign Manager — ${users.find((u) => u.id === assignManagerUserId)?.name ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          {managers.length === 0 ? (
            <p className="text-sm text-gray-500">No managers available.</p>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200">
              {managers.map((m) => (
                <label
                  key={m.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary"
                    checked={selectedManagerIds.includes(m.id)}
                    onChange={() => toggleManager(m.id)}
                  />
                  <span className="text-sm text-gray-800">{m.name}</span>
                  <span className="ml-auto text-xs text-gray-400">{m.role}</span>
                </label>
              ))}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAssignManagerUserId(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleAssignManagerSave}
              loading={assignManagers.isPending}
              disabled={managers.length === 0}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        title="Confirm Deactivation"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Are you sure you want to deactivate this user? They will no longer be able to log in.
          </p>
          <div className="flex items-center justify-end gap-3">
            <Button variant="ghost" size="sm" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              loading={deleteUser.isPending}
            >
              Deactivate
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ========================================================================== */
/*  PROJECTS TAB                                                              */
/* ========================================================================== */

function ProjectsTab() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { data: projectsData, isLoading } = useProjects();
  const { data: usersData } = useUsers();
  const { data: myReports } = useMyReports();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const assignProjectEmployees = useAssignProjectEmployees();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assigningProject, setAssigningProject] = useState<Project | null>(null);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  const projects: Project[] = projectsData?.data ?? [];

  // For managers, the assignable pool is their direct reports.
  // For admins, it's all employees.
  const assignableEmployees = React.useMemo((): { id: number; name: string; email: string }[] => {
    if (user?.role === 'MANAGER') {
      return myReports?.data ?? [];
    }
    const allUsers: { id: number; name: string; email: string; role: string }[] =
      usersData?.data ?? [];
    return allUsers.filter((u) => u.role === 'EMPLOYEE');
  }, [user?.role, myReports, usersData]);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{
    code: string;
    name: string;
    client: string;
    budgetHours: number;
    status: string;
  }>();

  const openAdd = () => {
    setEditingProject(null);
    reset({ code: '', name: '', client: '', budgetHours: 0, status: 'ACTIVE' });
    setModalOpen(true);
  };

  const openEdit = (p: Project) => {
    setEditingProject(p);
    reset({
      code: p.code,
      name: p.name,
      client: p.client,
      budgetHours: p.budgetHours,
      status: p.status,
    });
    setModalOpen(true);
  };

  const openAssign = (p: Project) => {
    setAssigningProject(p);
    setSelectedEmployeeIds(p.assignedEmployees?.map((ae) => ae.employeeId) ?? []);
    setAssignModalOpen(true);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editingProject) {
        await updateProject.mutateAsync({ id: editingProject.id, data });
        showToast('Project updated', 'success');
      } else {
        const payload = { ...data };
        if (user?.role === 'MANAGER') {
          payload.managerIds = [user.userId];
        }
        await createProject.mutateAsync(payload);
        showToast('Project created', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProject.mutateAsync(id);
      showToast('Project deleted', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleAssignSave = async () => {
    if (!assigningProject) return;
    try {
      await assignProjectEmployees.mutateAsync({
        id: assigningProject.id,
        employeeIds: selectedEmployeeIds,
      });
      showToast('Employees assigned successfully', 'success');
      setAssignModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const toggleEmployee = (id: number) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(id) ? prev.filter((eid) => eid !== id) : [...prev, id],
    );
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Projects</h3>
        <Button size="sm" onClick={openAdd}>
          Add Project
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[900px] text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Code</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Client</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Budget Hrs</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Used Hrs</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Employees</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-gray-400">
                  No projects found.
                </td>
              </tr>
            ) : (
              projects.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 font-mono text-sm font-semibold text-gray-900">
                    {p.code}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{p.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{p.client}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{p.budgetHours}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{p.usedHours}</td>
                  <td className="px-4 py-3">
                    <Badge variant={p.status === 'ACTIVE' ? 'approved' : 'cancelled'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {p.assignedEmployees?.length
                      ? p.assignedEmployees.map((ae) => ae.employee.name).join(', ')
                      : <span className="text-gray-400">None</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(p)}>
                        Edit
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openAssign(p)}>
                        Assign
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(p.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingProject ? 'Edit Project' : 'Add Project'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Code"
            error={errors.code?.message}
            {...register('code', { required: 'Code is required' })}
          />
          <Input
            label="Name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <Input label="Client" {...register('client')} />
          <Input
            label="Budget Hours"
            type="number"
            {...register('budgetHours', { valueAsNumber: true })}
          />
          <Select
            label="Status"
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'ARCHIVED', label: 'Archived' },
            ]}
            {...register('status')}
          />
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={createProject.isPending || updateProject.isPending}>
              {editingProject ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Employees Modal */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={`Assign Employees — ${assigningProject?.name ?? ''}`}
        size="md"
      >
        <div className="space-y-4">
          {assignableEmployees.length === 0 ? (
            <p className="text-sm text-gray-500">
              {user?.role === 'MANAGER'
                ? 'You have no direct reports to assign.'
                : 'No employees available.'}
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto divide-y divide-gray-100 rounded-lg border border-gray-200">
              {assignableEmployees.map((emp) => (
                <label
                  key={emp.id}
                  className="flex cursor-pointer items-center gap-3 px-4 py-3 hover:bg-gray-50"
                >
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-gray-300 text-brand-primary"
                    checked={selectedEmployeeIds.includes(emp.id)}
                    onChange={() => toggleEmployee(emp.id)}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{emp.name}</p>
                    <p className="text-xs text-gray-500">{emp.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setAssignModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button
              onClick={handleAssignSave}
              loading={assignProjectEmployees.isPending}
              disabled={assignableEmployees.length === 0}
            >
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/* ========================================================================== */
/*  LEAVE TYPES TAB                                                           */
/* ========================================================================== */

function LeaveTypesTab() {
  const { showToast } = useToast();
  const { data: typesData, isLoading } = useLeaveTypes();
  const createType = useCreateLeaveType();
  const updateType = useUpdateLeaveType();
  const deleteType = useDeleteLeaveType();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  const leaveTypes: LeaveType[] = typesData?.data ?? [];

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<{
    name: string;
    annualQuota: number;
    accrualRate: number;
    carryForward: boolean;
    paid: boolean;
    active: boolean;
  }>();

  const openAdd = () => {
    setEditingType(null);
    reset({ name: '', annualQuota: 0, accrualRate: 0, carryForward: false, paid: true, active: true });
    setModalOpen(true);
  };

  const openEdit = (lt: LeaveType) => {
    setEditingType(lt);
    reset({
      name: lt.name,
      annualQuota: lt.annualQuota,
      accrualRate: lt.accrualRate,
      carryForward: lt.carryForward,
      paid: lt.paid,
      active: lt.active,
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      if (editingType) {
        await updateType.mutateAsync({ id: editingType.id, data });
        showToast('Leave type updated', 'success');
      } else {
        await createType.mutateAsync(data);
        showToast('Leave type created', 'success');
      }
      setModalOpen(false);
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteType.mutateAsync(id);
      showToast('Leave type deleted', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Leave Types</h3>
        <Button size="sm" onClick={openAdd}>
          Add Leave Type
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white shadow-sm">
        <table className="w-full min-w-[750px] text-left">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Name</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Annual Quota</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Accrual Rate</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Carry Forward</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Paid</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Status</th>
              <th className="px-4 py-3 text-xs font-semibold uppercase text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {leaveTypes.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-gray-400">
                  No leave types configured.
                </td>
              </tr>
            ) : (
              leaveTypes.map((lt) => (
                <tr key={lt.id} className="border-b border-gray-100 last:border-b-0">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{lt.name}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{lt.annualQuota}</td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-700">{lt.accrualRate}</td>
                  <td className="px-4 py-3">
                    <Badge variant={lt.carryForward ? 'approved' : 'draft'}>
                      {lt.carryForward ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={lt.paid ? 'approved' : 'draft'}>
                      {lt.paid ? 'Yes' : 'No'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={lt.active ? 'approved' : 'cancelled'}>
                      {lt.active ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(lt)}>
                        Edit
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => handleDelete(lt.id)}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingType ? 'Edit Leave Type' : 'Add Leave Type'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Annual Quota"
              type="number"
              {...register('annualQuota', { valueAsNumber: true })}
            />
            <Input
              label="Accrual Rate"
              type="number"
              step="0.01"
              {...register('accrualRate', { valueAsNumber: true })}
            />
          </div>
          <div className="flex flex-wrap gap-6">
            <Controller
              name="carryForward"
              control={control}
              render={({ field }) => (
                <Toggle label="Carry Forward" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name="paid"
              control={control}
              render={({ field }) => (
                <Toggle label="Paid Leave" checked={field.value} onChange={field.onChange} />
              )}
            />
            <Controller
              name="active"
              control={control}
              render={({ field }) => (
                <Toggle label="Active" checked={field.value} onChange={field.onChange} />
              )}
            />
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button variant="ghost" size="sm" onClick={() => setModalOpen(false)} type="button">
              Cancel
            </Button>
            <Button type="submit" loading={createType.isPending || updateType.isPending}>
              {editingType ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ========================================================================== */
/*  HOLIDAYS TAB                                                              */
/* ========================================================================== */

function HolidaysTab() {
  const { showToast } = useToast();
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const { data: holidaysData, isLoading } = useHolidays(selectedYear);
  const createHoliday = useCreateHoliday();
  const deleteHoliday = useDeleteHoliday();

  const holidays: Holiday[] = holidaysData?.data ?? [];

  const { register, handleSubmit, reset, control, formState: { errors } } = useForm<{
    name: string;
    date: string;
    recurring: boolean;
  }>({ defaultValues: { name: '', date: '', recurring: false } });

  const onSubmit = async (data: Record<string, unknown>) => {
    try {
      await createHoliday.mutateAsync(data);
      showToast('Holiday added', 'success');
      reset({ name: '', date: '', recurring: false });
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteHoliday.mutateAsync(id);
      showToast('Holiday deleted', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">Holidays</h3>
        <Select
          options={[
            { value: String(currentYear - 1), label: String(currentYear - 1) },
            { value: String(currentYear), label: String(currentYear) },
            { value: String(currentYear + 1), label: String(currentYear + 1) },
          ]}
          value={String(selectedYear)}
          onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          className="w-28"
        />
      </div>

      {/* Add Holiday form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="mb-6 rounded-xl bg-white p-5 shadow-sm"
      >
        <h4 className="mb-3 text-sm font-semibold text-gray-700">Add Holiday</h4>
        <div className="flex flex-wrap items-end gap-4">
          <Input
            label="Name"
            error={errors.name?.message}
            {...register('name', { required: 'Name is required' })}
            className="max-w-xs"
          />
          <Input
            label="Date"
            type="date"
            error={errors.date?.message}
            {...register('date', { required: 'Date is required' })}
            className="max-w-[180px]"
          />
          <Controller
            name="recurring"
            control={control}
            render={({ field }) => (
              <Toggle label="Recurring" checked={field.value} onChange={field.onChange} />
            )}
          />
          <Button type="submit" size="sm" loading={createHoliday.isPending}>
            Add
          </Button>
        </div>
      </form>

      {/* Holiday list */}
      <div className="space-y-2">
        {holidays.length === 0 ? (
          <div className="rounded-xl bg-white px-5 py-10 text-center shadow-sm">
            <p className="text-sm text-gray-400">No holidays configured for {selectedYear}.</p>
          </div>
        ) : (
          holidays.map((h) => (
            <div
              key={h.id}
              className="flex items-center justify-between rounded-lg bg-white px-5 py-3 shadow-sm"
            >
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-gray-900">{h.name}</span>
                <span className="text-sm text-gray-500">{formatDate(h.date)}</span>
                {h.recurring && (
                  <Badge variant="pending">Recurring</Badge>
                )}
              </div>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleDelete(h.id)}
                loading={deleteHoliday.isPending}
              >
                Delete
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  NOTIFICATIONS TAB                                                         */
/* ========================================================================== */

function NotificationsTab() {
  return (
    <div>
      <h3 className="mb-4 text-base font-semibold text-gray-900">Notification Preferences</h3>
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Email Notifications</p>
              <p className="text-xs text-gray-500">Receive email notifications for approvals and reminders</p>
            </div>
            <Toggle label="" checked={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between border-b border-gray-100 pb-4">
            <div>
              <p className="text-sm font-medium text-gray-900">Daily Reminders</p>
              <p className="text-xs text-gray-500">Remind team members to fill their timesheets</p>
            </div>
            <Toggle label="" checked={true} onChange={() => {}} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Weekly Deadline Alerts</p>
              <p className="text-xs text-gray-500">Alert before weekly submission deadline</p>
            </div>
            <Toggle label="" checked={false} onChange={() => {}} />
          </div>
        </div>
        <p className="mt-6 text-xs text-gray-400">
          Full notification configuration coming soon. Contact support for custom notification rules.
        </p>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  INTEGRATIONS TAB                                                          */
/* ========================================================================== */

function IntegrationsTab() {
  const { showToast } = useToast();
  const { data: settingsData, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const settings: OrgSettings | null = settingsData?.data ?? null;

  const handleToggle = async (key: keyof OrgSettings, value: boolean) => {
    try {
      await updateSettings.mutateAsync({ [key]: value });
      showToast('Integration setting updated', 'success');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h3 className="text-base font-semibold text-gray-900">Integrations</h3>

      {/* SSO */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-sm font-semibold text-gray-700">Single Sign-On (SSO)</h4>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Google SSO</p>
              <p className="text-xs text-gray-500">Allow users to sign in with Google accounts</p>
            </div>
            <Toggle
              checked={settings?.ssoGoogleEnabled ?? false}
              onChange={(val) => handleToggle('ssoGoogleEnabled', val)}
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">Microsoft SSO</p>
              <p className="text-xs text-gray-500">Allow users to sign in with Microsoft accounts</p>
            </div>
            <Toggle
              checked={settings?.ssoMicrosoftEnabled ?? false}
              onChange={(val) => handleToggle('ssoMicrosoftEnabled', val)}
            />
          </div>
        </div>
      </div>

      {/* Email */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-sm font-semibold text-gray-700">Email Provider</h4>
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
          <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
          </svg>
          <span className="text-sm text-gray-700">
            Email provider is configured via environment variables (EMAIL_PROVIDER).
          </span>
        </div>
      </div>

      {/* Payroll */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-sm font-semibold text-gray-700">Payroll Integration</h4>
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center">
          <p className="text-sm text-gray-500">Payroll integration coming soon.</p>
          <p className="mt-1 text-xs text-gray-400">Connect with popular payroll providers to automate time data sync.</p>
        </div>
      </div>

      {/* Project Management */}
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h4 className="mb-4 text-sm font-semibold text-gray-700">Project Management</h4>
        <div className="rounded-lg border border-dashed border-gray-300 px-6 py-8 text-center">
          <p className="text-sm text-gray-500">PM tool integration coming soon.</p>
          <p className="mt-1 text-xs text-gray-400">Import projects and tasks from Jira, Asana, and more.</p>
        </div>
      </div>
    </div>
  );
}

/* ========================================================================== */
/*  MAIN ADMIN PAGE                                                           */
/* ========================================================================== */

export default function AdminPage() {
  const { user } = useAuth();
  const isManager = user?.role === 'MANAGER';

  const [activeTab, setActiveTab] = useState<AdminTab>(isManager ? 'projects' : 'general');

  const renderTab = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettingsTab />;
      case 'users':
        return <UsersTab />;
      case 'projects':
        return <ProjectsTab />;
      case 'leaveTypes':
        return <LeaveTypesTab />;
      case 'holidays':
        return <HolidaysTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'integrations':
        return <IntegrationsTab />;
      default:
        return <GeneralSettingsTab />;
    }
  };

  // Managers only see the Projects tab
  if (isManager) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="mt-1 text-sm text-gray-500">
            Assign employees to projects.
          </p>
        </div>
        <div className="rounded-xl bg-gray-50 p-6">
          <ProjectsTab />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Administration</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage organisation settings, users, projects, and integrations.
        </p>
      </div>

      {/* Layout: sidebar + content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />
        <div className="min-w-0 flex-1 rounded-xl bg-gray-50 p-6">{renderTab()}</div>
      </div>
    </div>
  );
}
