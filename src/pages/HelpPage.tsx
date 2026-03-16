import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

/* ------------------------------------------------------------------ */
/*  Inline SVG icons for the help page                                 */
/* ------------------------------------------------------------------ */

const helpIcons = {
  search: (
    <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
    </svg>
  ),
  chevronDown: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  ),
  chevronUp: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
    </svg>
  ),
  clock: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  ),
  calendar: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  ),
  checkCircle: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a10 10 0 11-20 0 10 10 0 0120 0z" />
    </svg>
  ),
  chart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 17V5h2v12H3zm6-4V3h2v10H9zm6 2V7h2v8h-2zm6-6v10h-2V9h2z" />
    </svg>
  ),
  settings: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37 1.066.426 2.573-.104 2.573-1.066z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  users: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m9-4a4 4 0 10-8 0 4 4 0 008 0zm6 4a4 4 0 10-8 0" />
    </svg>
  ),
  book: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
    </svg>
  ),
  question: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  key: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
  ),
};

/* ------------------------------------------------------------------ */
/*  Section types                                                       */
/* ------------------------------------------------------------------ */

interface GuideSection {
  id: string;
  title: string;
  icon: React.ReactNode;
  color: string;
  roles?: string[];
  content: React.ReactNode;
}

interface FaqItem {
  question: string;
  answer: string;
  roles?: string[];
}

/* ------------------------------------------------------------------ */
/*  Accordion component                                                 */
/* ------------------------------------------------------------------ */

function Accordion({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left text-sm font-medium text-gray-800 hover:bg-gray-50 transition-colors"
      >
        <span>{question}</span>
        {isOpen ? helpIcons.chevronUp : helpIcons.chevronDown}
      </button>
      {isOpen && (
        <div className="px-5 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
          {answer}
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Status badge legend                                                 */
/* ------------------------------------------------------------------ */

function StatusBadge({ label, className }: { label: string; className: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Guide content sections                                              */
/* ------------------------------------------------------------------ */

const gettingStartedContent = (
  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
    <h4 className="text-base font-semibold text-gray-800">Welcome to TrackZen</h4>
    <p>
      TrackZen is a unified workforce management platform that combines <strong>Timesheet Management</strong> and{' '}
      <strong>Leave Management</strong> into a single application. Log hours, apply for leave, and manage approvals
      &mdash; all in one place.
    </p>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Logging In</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li>Navigate to the login page and enter your email and password.</li>
      <li>Alternatively, use <strong>Sign in with Google</strong> or <strong>Sign in with Microsoft</strong> if SSO is configured by your organisation.</li>
      <li>After login you will land on the <strong>Dashboard</strong>, which shows a summary of your timesheets, leave, and notifications.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Navigation</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li>Use the <strong>sidebar</strong> on the left to switch between modules.</li>
      <li>Click the <strong>collapse button</strong> at the bottom of the sidebar to minimise it.</li>
      <li>The <strong>notification bell</strong> in the top-right shows recent alerts.</li>
      <li>Click your <strong>avatar</strong> to access your profile or log out.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Roles</h4>
    <p>Your role determines what you can see and do:</p>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-gray-700">Role</th>
            <th className="text-left px-4 py-2 font-medium text-gray-700">Capabilities</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Employee</td>
            <td className="px-4 py-2">Submit timesheets and leave requests, view own data</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Manager</td>
            <td className="px-4 py-2">All employee features + approve/reject for direct reports, view reports and team calendar</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Admin</td>
            <td className="px-4 py-2">All manager features + manage users, projects, leave types, holidays, and organisation settings</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const timesheetContent = (
  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
    <h4 className="text-base font-semibold text-gray-800">Creating a Timesheet</h4>
    <ol className="list-decimal pl-5 space-y-2">
      <li>Navigate to <strong>My Timesheet</strong> from the sidebar.</li>
      <li>Select the <strong>week</strong> you want to log hours for using the week picker.</li>
      <li>Click <strong>Create Timesheet</strong> &mdash; a new draft timesheet is created for that week.</li>
      <li>Only one timesheet per week is allowed. If one already exists you will be taken to it.</li>
    </ol>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Adding Time Entries</h4>
    <ol className="list-decimal pl-5 space-y-2">
      <li>Click <strong>Add Row</strong> to add a new time entry line.</li>
      <li>Select a <strong>Project</strong> from the dropdown. Employees only see projects they are assigned to.</li>
      <li>Toggle <strong>Billable</strong> on or off as appropriate.</li>
      <li>Enter hours for each day of the week (Mon&ndash;Sun).</li>
      <li>Optionally add a <strong>description</strong> for each day (required if your org has mandatory descriptions enabled).</li>
      <li>Click <strong>Save</strong> to persist your changes.</li>
    </ol>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Validation Rules</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>Max hours per day</strong> &mdash; cannot exceed the limit set in organisation settings (default: 24h).</li>
      <li><strong>Max hours per week</strong> &mdash; total across all entries cannot exceed the weekly limit (default: 168h).</li>
      <li><strong>Mandatory descriptions</strong> &mdash; when enabled, any day with hours &gt; 0 must have a description.</li>
      <li><strong>Back-dating</strong> &mdash; creating timesheets for past weeks may be blocked depending on org settings.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Submitting a Timesheet</h4>
    <ol className="list-decimal pl-5 space-y-2">
      <li>Ensure all entries are saved and the timesheet is in <strong>Draft</strong> status.</li>
      <li>Click <strong>Submit</strong> to send it for manager approval.</li>
      <li>Once submitted, the timesheet cannot be edited unless it is rejected.</li>
    </ol>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Copy Previous Week</h4>
    <p>
      Use the <strong>Copy Previous Week</strong> button to create a new timesheet with the same project structure
      (projects and billable flags) as last week &mdash; hours and descriptions start at zero.
      This feature can be disabled by your admin.
    </p>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Timesheet Statuses</h4>
    <div className="flex flex-wrap gap-2 pt-1">
      <StatusBadge label="Draft" className="bg-gray-100 text-gray-700" />
      <StatusBadge label="Submitted" className="bg-blue-100 text-blue-700" />
      <StatusBadge label="Approved" className="bg-green-100 text-green-700" />
      <StatusBadge label="Rejected" className="bg-red-100 text-red-700" />
    </div>
    <ul className="list-disc pl-5 space-y-1 pt-2">
      <li><strong>Draft</strong> &mdash; editable, not yet sent for approval.</li>
      <li><strong>Submitted</strong> &mdash; pending manager review. Cannot be edited.</li>
      <li><strong>Approved</strong> &mdash; accepted by manager. Locked.</li>
      <li><strong>Rejected</strong> &mdash; returned with feedback. Can be edited and re-submitted.</li>
    </ul>
  </div>
);

const leaveContent = (
  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
    <h4 className="text-base font-semibold text-gray-800">Applying for Leave</h4>
    <ol className="list-decimal pl-5 space-y-2">
      <li>Navigate to <strong>My Leave</strong> from the sidebar.</li>
      <li>Click <strong>Apply for Leave</strong>.</li>
      <li>Select the <strong>Leave Type</strong> (e.g., Annual, Sick, Unpaid).</li>
      <li>Choose <strong>Start Date</strong> and <strong>End Date</strong>.</li>
      <li>Optionally add a <strong>reason</strong> for the leave.</li>
      <li>The system automatically calculates business days (excluding weekends and holidays).</li>
      <li>Click <strong>Submit</strong> to send the request for approval.</li>
    </ol>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Leave Balances</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li>Your current leave balances are displayed on the My Leave page.</li>
      <li>Each leave type shows: <strong>Allocated</strong>, <strong>Used</strong>, and <strong>Remaining</strong> days.</li>
      <li>You cannot submit a leave request if it exceeds your remaining balance (except for Unpaid leave).</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Overlap Detection</h4>
    <p>
      The system prevents overlapping leave requests. If you already have an approved or pending leave request
      that overlaps with a new one, the submission will be blocked.
    </p>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Cancelling Leave</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li>You can cancel a leave request while it is still in <strong>Pending</strong> status.</li>
      <li>Provide a cancellation reason when cancelling.</li>
      <li>Once approved, leave cannot be cancelled by the employee &mdash; contact your manager.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Leave Statuses</h4>
    <div className="flex flex-wrap gap-2 pt-1">
      <StatusBadge label="Pending" className="bg-yellow-100 text-yellow-700" />
      <StatusBadge label="Approved" className="bg-green-100 text-green-700" />
      <StatusBadge label="Rejected" className="bg-red-100 text-red-700" />
      <StatusBadge label="Cancelled" className="bg-gray-100 text-gray-700" />
    </div>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Leave Types</h4>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-gray-700">Type</th>
            <th className="text-left px-4 py-2 font-medium text-gray-700">Paid</th>
            <th className="text-left px-4 py-2 font-medium text-gray-700">Documentation</th>
            <th className="text-left px-4 py-2 font-medium text-gray-700">Notes</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Annual</td>
            <td className="px-4 py-2">Yes</td>
            <td className="px-4 py-2">Not required</td>
            <td className="px-4 py-2">Standard vacation days</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Sick</td>
            <td className="px-4 py-2">Yes</td>
            <td className="px-4 py-2">Required</td>
            <td className="px-4 py-2">Medical certificate may be needed</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Unpaid</td>
            <td className="px-4 py-2">No</td>
            <td className="px-4 py-2">Not required</td>
            <td className="px-4 py-2">No balance limit</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

const approvalsContent = (
  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
    <h4 className="text-base font-semibold text-gray-800">Timesheet Approvals</h4>
    <ol className="list-decimal pl-5 space-y-2">
      <li>Navigate to <strong>Approvals</strong> from the sidebar (available to Managers and Admins).</li>
      <li>You will see a list of timesheets submitted by your direct reports.</li>
      <li>Click on a timesheet to review the detailed time entries.</li>
      <li>Click <strong>Approve</strong> to accept, or <strong>Reject</strong> and provide a reason.</li>
      <li>The approval stats panel shows counts of pending, approved, and rejected timesheets.</li>
    </ol>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Leave Approvals</h4>
    <ol className="list-decimal pl-5 space-y-2">
      <li>Navigate to <strong>Leave Approvals</strong> from the sidebar.</li>
      <li>Review pending leave requests from your direct reports.</li>
      <li>Check the employee's leave balance before approving.</li>
      <li>Click <strong>Approve</strong> or <strong>Reject</strong> (with a comment).</li>
      <li>Approved leave automatically deducts from the employee's balance.</li>
    </ol>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Important Rules</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>Self-approval is forbidden</strong> &mdash; you cannot approve your own timesheets or leave requests.</li>
      <li>Managers only see submissions from their <strong>direct reports</strong>.</li>
      <li>Admins can see and approve submissions from <strong>all users</strong> in the organisation.</li>
      <li>Rejected timesheets can be edited and re-submitted by the employee.</li>
    </ul>
  </div>
);

const reportsContent = (
  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
    <h4 className="text-base font-semibold text-gray-800">Viewing Reports</h4>
    <ol className="list-decimal pl-5 space-y-2">
      <li>Navigate to <strong>Reports</strong> from the sidebar (Managers and Admins only).</li>
      <li>Use the filters to narrow results by <strong>date range</strong>, <strong>user</strong>, <strong>project</strong>, or <strong>status</strong>.</li>
      <li>View aggregated data including total hours, billable hours, and utilisation rates.</li>
    </ol>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Exporting Data</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li><strong>CSV</strong> &mdash; comma-separated file for spreadsheet import.</li>
      <li><strong>Excel</strong> &mdash; formatted .xlsx workbook.</li>
      <li><strong>PDF</strong> &mdash; printable report format.</li>
      <li><strong>Monthly Export</strong> &mdash; generates a detailed monthly timesheet workbook.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Team Calendar</h4>
    <p>
      The <strong>Team Calendar</strong> page (under Leave) provides a visual month view of approved leave
      across your team. Use the navigation arrows to switch months. Holidays are highlighted in a different colour.
    </p>
  </div>
);

const adminContent = (
  <div className="space-y-4 text-sm text-gray-600 leading-relaxed">
    <h4 className="text-base font-semibold text-gray-800">Admin Panel</h4>
    <p>The Admin page is only available to users with the <strong>Admin</strong> role. It provides tabs for managing:</p>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Users</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li>View all users in the organisation.</li>
      <li>Create new users with a role (Employee, Manager, Admin).</li>
      <li>Edit user details (name, email, department, role).</li>
      <li>Deactivate users (soft delete &mdash; data is preserved).</li>
      <li>Assign manager-employee relationships.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Projects</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li>Create, edit, and archive projects.</li>
      <li>Each project has a unique code, name, and client.</li>
      <li>Assign managers and employees to projects.</li>
      <li>Employees can only log time against projects they are assigned to.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Leave Types</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li>Create and manage leave types (Annual, Sick, Unpaid, etc.).</li>
      <li>Configure annual quota, paid/unpaid, carry-forward, and documentation requirements.</li>
      <li>Deactivate leave types that are no longer needed.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Holidays</h4>
    <ul className="list-disc pl-5 space-y-1">
      <li>Add public holidays for your organisation.</li>
      <li>Holidays are excluded from leave day calculations.</li>
      <li>Mark holidays as recurring for automatic yearly inclusion.</li>
    </ul>

    <h4 className="text-base font-semibold text-gray-800 pt-2">Organisation Settings</h4>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="text-left px-4 py-2 font-medium text-gray-700">Setting</th>
            <th className="text-left px-4 py-2 font-medium text-gray-700">Description</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Max Hours Per Day</td>
            <td className="px-4 py-2">Maximum hours an employee can log in a single day</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Max Hours Per Week</td>
            <td className="px-4 py-2">Maximum total hours across all entries in one week</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Mandatory Descriptions</td>
            <td className="px-4 py-2">Require a description for each day with hours logged</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Allow Back-dated</td>
            <td className="px-4 py-2">Allow creating timesheets for past weeks</td>
          </tr>
          <tr>
            <td className="px-4 py-2 font-medium text-gray-800">Allow Copy Week</td>
            <td className="px-4 py-2">Enable the copy-previous-week feature</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  FAQ data                                                            */
/* ------------------------------------------------------------------ */

const faqItems: FaqItem[] = [
  {
    question: 'How do I change my password?',
    answer: 'Navigate to your profile by clicking your avatar in the top-right corner and selecting "Profile". You can update your password from there. If you signed in via Google or Microsoft SSO, your password is managed by that provider.',
  },
  {
    question: 'I submitted a timesheet by mistake. Can I undo it?',
    answer: 'Once a timesheet is submitted, it cannot be edited by the employee. Ask your manager to reject the timesheet — once rejected, it will return to an editable state so you can make changes and re-submit.',
  },
  {
    question: 'Why can\'t I see certain projects in the timesheet dropdown?',
    answer: 'Employees can only log time against projects they are assigned to. If you need access to a project, ask your manager or admin to assign you to that project in the Admin panel.',
  },
  {
    question: 'What happens when my leave is rejected?',
    answer: 'The leave days are returned to your balance automatically. You will receive a notification with the rejection comment. You can submit a new leave request with different dates if needed.',
  },
  {
    question: 'Can I log time for weekends?',
    answer: 'Yes, the timesheet includes Saturday and Sunday columns. Weekend hours are included in your weekly total and count towards the max-hours-per-week limit.',
  },
  {
    question: 'How are leave business days calculated?',
    answer: 'The system counts only Monday through Friday between your start and end dates, excluding any public holidays defined by your organisation. Weekends are always excluded.',
  },
  {
    question: 'Why does it say "back-dated timesheets are not allowed"?',
    answer: 'Your organisation has disabled back-dating. You can only create timesheets for the current week or future weeks. Ask your admin to enable the "Allow Back-dated" setting if you need to log hours for past weeks.',
  },
  {
    question: 'Can I copy last week\'s timesheet?',
    answer: 'Yes, use the "Copy Previous Week" button on the timesheet page. It creates a new timesheet with the same projects and billable flags but with all hours set to zero. This feature must be enabled in organisation settings.',
  },
  {
    question: 'How do I export my timesheet data?',
    answer: 'Managers and admins can export data from the Reports page. Choose from CSV, Excel, or PDF formats. There is also a monthly export option that generates a detailed Excel workbook.',
    roles: ['MANAGER', 'ADMIN'],
  },
  {
    question: 'What does the "Mandatory Descriptions" setting do?',
    answer: 'When enabled, every day that has hours logged must also have a description. This ensures team members document what they worked on each day. The setting applies to all users in the organisation.',
    roles: ['ADMIN'],
  },
  {
    question: 'How do I assign employees to a project?',
    answer: 'Go to the Admin panel, navigate to the Projects tab, and edit the project. You can add or remove employees and managers from the project assignment section.',
    roles: ['ADMIN'],
  },
  {
    question: 'Can I approve my own timesheet or leave?',
    answer: 'No, self-approval is not allowed. Your timesheet or leave request must be approved by another manager or admin in the organisation.',
    roles: ['MANAGER', 'ADMIN'],
  },
];

/* ------------------------------------------------------------------ */
/*  Keyboard shortcut data                                              */
/* ------------------------------------------------------------------ */

const shortcuts = [
  { keys: ['Tab'], description: 'Move between fields in the timesheet' },
  { keys: ['Enter'], description: 'Confirm / submit a form' },
  { keys: ['Esc'], description: 'Close modals and dropdowns' },
];

/* ------------------------------------------------------------------ */
/*  Main HelpPage component                                             */
/* ------------------------------------------------------------------ */

export default function HelpPage() {
  const { user } = useAuth();
  const role = user?.role ?? 'EMPLOYEE';

  const [activeSection, setActiveSection] = useState('getting-started');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const guideSections: GuideSection[] = [
    { id: 'getting-started', title: 'Getting Started', icon: helpIcons.book, color: 'text-brand-primary', content: gettingStartedContent },
    { id: 'timesheets', title: 'Timesheets', icon: helpIcons.clock, color: 'text-brand-primary', content: timesheetContent },
    { id: 'leave', title: 'Leave Management', icon: helpIcons.calendar, color: 'text-brand-secondary', content: leaveContent },
    { id: 'approvals', title: 'Approvals', icon: helpIcons.checkCircle, color: 'text-brand-success', roles: ['MANAGER', 'ADMIN'], content: approvalsContent },
    { id: 'reports', title: 'Reports & Exports', icon: helpIcons.chart, color: 'text-brand-accent', roles: ['MANAGER', 'ADMIN'], content: reportsContent },
    { id: 'admin', title: 'Administration', icon: helpIcons.settings, color: 'text-gray-600', roles: ['ADMIN'], content: adminContent },
  ];

  const visibleSections = guideSections.filter(
    (s) => !s.roles || s.roles.includes(role),
  );

  const visibleFaqs = faqItems.filter(
    (f) => !f.roles || f.roles.includes(role),
  );

  const filteredFaqs = searchQuery
    ? visibleFaqs.filter(
        (f) =>
          f.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          f.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : visibleFaqs;

  const currentSection = visibleSections.find((s) => s.id === activeSection) ?? visibleSections[0];

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Help & User Guide</h1>
        <p className="mt-1 text-sm text-gray-500">
          Everything you need to know about using TrackZen
        </p>
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {visibleSections.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all text-center ${
              activeSection === section.id
                ? 'border-brand-primary bg-brand-primary/5 shadow-sm'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <span className={section.color}>{section.icon}</span>
            <span className="text-xs font-medium text-gray-700">{section.title}</span>
          </button>
        ))}
      </div>

      {/* Main content area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar TOC */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sticky top-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
              Table of Contents
            </h3>
            <ul className="space-y-1">
              {visibleSections.map((section) => (
                <li key={section.id}>
                  <button
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors text-left ${
                      activeSection === section.id
                        ? 'bg-brand-primary/10 text-brand-primary font-medium'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span className={section.color}>{section.icon}</span>
                    {section.title}
                  </button>
                </li>
              ))}
            </ul>

            {/* Keyboard shortcuts */}
            <div className="mt-6 pt-4 border-t border-gray-100">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">
                Keyboard Shortcuts
              </h3>
              <ul className="space-y-2">
                {shortcuts.map((sc) => (
                  <li key={sc.description} className="flex items-center gap-2 text-xs text-gray-600">
                    <span className="flex gap-1">
                      {sc.keys.map((k) => (
                        <kbd
                          key={k}
                          className="inline-flex items-center px-1.5 py-0.5 rounded border border-gray-300 bg-gray-50 font-mono text-[10px] text-gray-600"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                    <span>{sc.description}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Guide content */}
        <div className="lg:col-span-3 space-y-6">
          {/* Active section content */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
              <span className={currentSection.color}>{currentSection.icon}</span>
              <h2 className="text-lg font-semibold text-gray-900">{currentSection.title}</h2>
            </div>
            {currentSection.content}
          </div>

          {/* FAQ section */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-brand-secondary">{helpIcons.question}</span>
              <h2 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h2>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {helpIcons.search}
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setOpenFaqIndex(null);
                }}
                placeholder="Search FAQs..."
                className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
              />
            </div>

            {/* FAQ list */}
            <div className="space-y-2">
              {filteredFaqs.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-6">
                  No matching questions found. Try a different search term.
                </p>
              ) : (
                filteredFaqs.map((faq, idx) => (
                  <Accordion
                    key={idx}
                    question={faq.question}
                    answer={faq.answer}
                    isOpen={openFaqIndex === idx}
                    onToggle={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Workflow diagrams */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-brand-primary">{helpIcons.key}</span>
              <h2 className="text-lg font-semibold text-gray-900">Workflow Reference</h2>
            </div>

            <div className="space-y-6">
              {/* Timesheet workflow */}
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Timesheet Lifecycle</h4>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium">Draft</span>
                  <span className="text-gray-400">&rarr;</span>
                  <span className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-medium">Submitted</span>
                  <span className="text-gray-400">&rarr;</span>
                  <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium">Approved</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2 ml-[calc(theme(spacing.3)+theme(spacing.3)+4.5rem)]">
                  <span className="text-gray-400">&darr;</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm ml-[calc(theme(spacing.3)+theme(spacing.3)+3rem)]">
                  <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-medium">Rejected</span>
                  <span className="text-gray-400">&rarr; (edit & re-submit) &rarr;</span>
                  <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium">Draft</span>
                </div>
              </div>

              {/* Leave workflow */}
              <div className="pt-4 border-t border-gray-100">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Leave Request Lifecycle</h4>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="px-3 py-1.5 rounded-lg bg-yellow-100 text-yellow-700 font-medium">Pending</span>
                  <span className="text-gray-400">&rarr;</span>
                  <span className="px-3 py-1.5 rounded-lg bg-green-100 text-green-700 font-medium">Approved</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-2 ml-[calc(theme(spacing.3)+theme(spacing.3)+4rem)]">
                  <span className="text-gray-400">&darr;</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm ml-[calc(theme(spacing.3)+theme(spacing.3)+2.5rem)]">
                  <span className="px-3 py-1.5 rounded-lg bg-red-100 text-red-700 font-medium">Rejected</span>
                  <span className="mx-2 text-gray-300">|</span>
                  <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium">Cancelled</span>
                  <span className="text-xs text-gray-400">(by employee, while pending)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
