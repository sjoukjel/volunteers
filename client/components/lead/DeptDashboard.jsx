import { Meteor } from 'meteor/meteor'
import React, { useCallback, useEffect, useState } from 'react'
import Fa from 'react-fontawesome'
import { Link, useParams } from 'react-router-dom'
import { BuildAndStrikeVolunteerReport } from 'meteor/goingnowhere:volunteers'
import { AutoFormComponents } from 'meteor/abate:autoform-components'
import { AutoForm } from 'meteor/aldeed:autoform'

import { T, t } from '../common/i18n'
import { CsvExportButton } from './CsvExportButton.jsx'
import { SignupApprovalList } from './SignupApprovalList.jsx'
import { Volunteers } from '../../../both/init'
import { TeamList } from './TeamList.jsx'

// TODO combine with LeadDashboard to make it 'unit' agnostic
export const DeptDashboard = () => {
  const { deptId } = useParams()
  const [{ dept, pendingLeadRequests }, setStats] = useState({ dept: {}, pendingLeadRequests: [] })

  const editDept = () =>
    AutoFormComponents.ModalShowWithTemplate('insertUpdateTemplate',
      { form: { collection: Volunteers.collections.department }, data: dept }, '', 'lg')
  const addTeam = () =>
    AutoFormComponents.ModalShowWithTemplate('insertUpdateTemplate',
      { form: { collection: Volunteers.collections.team }, data: { parentId: deptId } }, '', 'lg')
  const earlyEntry = () =>
    AutoFormComponents.ModalShowWithTemplate('earlyEntry', dept, 'Early Entries')

  const reloadStats = useCallback(() => Meteor.call(`${Volunteers.eventName}.Volunteers.getDeptStats`, { deptId }, (err, teamStats) => {
    if (err) console.error(err)
    else {
      setStats(teamStats)
    }
  }), [deptId])
  useEffect(reloadStats, [reloadStats])

  useEffect(() => {
    AutoForm.addHooks([
      'InsertTeamFormId',
      'UpdateTeamFormId',
      'InsertDepartmentFormId',
      'UpdateDepartmentFormId',
    ], {
      onSuccess() {
        reloadStats()
        AutoFormComponents.modalHide()
      },
    })
  }, [reloadStats])

  const thisTeam = dept?.teams?.find((team) => team._id === deptId)

  return (
    <div className="container-fluid">
      {!dept ? (
        <div className="row">
          <p>Department not found</p>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-2 bg-grey dashboard-side-panel">
            <h3>
              { dept.name }
              <small>
                <Link to={`/department/${dept._id}`} title={t('public_link')}>
                  <Fa name="link" />
                </Link>
              </small>
            </h3>
            <h5 className="mb-2 dark-text"><T>leads</T></h5>
            <ul>
              {thisTeam?.leads?.map((lead) => (
                <li key={lead._id}>{lead.profile.nickname || lead.profile.firstName}</li>
              ))}
            </ul>
            <h5 className="mb-2 dark-text"><T>information</T></h5>
            <ul>
              <li>
                <div title={t('total_number_of_teams')}>
                  <T>teams</T>: {dept.teamsNumber}
                </div>
              </li>
              <li>
                <div title={`${t('confirmed')}/${t('needed')}`}>
                  <T>leads</T>: {dept.leadRate && `${dept.leadRate.confirmed}/${dept.leadRate.needed}`}
                </div>
              </li>
              <li>
                <div title={`${t('confirmed')}/${t('needed')}`}>
                  <T>shifts</T>: {dept.shiftRate && `${dept.shiftRate.confirmed}/${dept.shiftRate.needed}`}
                </div>
              </li>
              <li>
                <div title={t('volunteers')}>
                  <T>volunteers</T>: {dept.volunteerNumber}
                </div>
              </li>
              <li>
                <div title={t('pending_requests')}>
                  <T>pending_requests</T>: {pendingLeadRequests.length}
                </div>
              </li>
            </ul>
            <button type="button" className="btn btn-light btn-sm d-block" onClick={editDept}>
              <Fa name="wrench" /> <T>settings</T>
            </button>
            <button type="button" className="btn btn-light btn-sm d-block" onClick={addTeam}>
              <Fa name="wrench" /> <T>add_team</T>
            </button>
            <button type="button" className="btn btn-light btn-sm d-block" onClick={earlyEntry}>
              <Fa name="wrench" /> <T>early_entry</T>
            </button>
            <CsvExportButton
              method="dept.rota"
              buttonText="rota_export"
              filename="rota"
              methodArgs={{ parentId: deptId }}
            />
            <CsvExportButton
              method="ee.csv"
              buttonText="early_entry"
              filename="ee"
              methodArgs={{ parentId: deptId }}
            />
          </div>
          <div className="col-md-10">
            <div className="row">
              <div className="col">
                <h2 className="header"><T>staffing_report</T>: <T>build_strike</T></h2>
                <BuildAndStrikeVolunteerReport type="build-strike" deptId={deptId} />
              </div>
            </div>
            <div className="row">
              {pendingLeadRequests.length > 0 && (
                <div className="col-md-6 order-md-last">
                  <h2 className="header"><T>pending_lead_requests</T></h2>
                  <SignupApprovalList
                    query={{ parentId: { $in: [deptId, ...dept.teamIds] }, type: 'lead', status: 'pending' }}
                  />
                </div>
              )}
              <div className={`${
pendingLeadRequests.length > 0 ? 'col-md-6' : 'col'
} pl-1 user-top`}
              >
                <TeamList deptId={deptId} teams={dept.teams} reload={reloadStats} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
