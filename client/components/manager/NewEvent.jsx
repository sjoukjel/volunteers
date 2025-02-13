/* eslint-disable react/no-this-in-sfc */
import { Meteor } from 'meteor/meteor'
import React, { useEffect, useState } from 'react'
import Blaze from 'meteor/gadicc:blaze-react-component'
import { AutoForm } from 'meteor/aldeed:autoform'

import { Volunteers } from '../../../both/init'
import { fetchSettings } from '../../../both/methods'
import { EventSettings } from '../../../both/collections/settings'

export const NewEvent = ({ onSubmitted }) => {
  const [settings, setSettings] = useState()
  useEffect(() => {
    AutoForm.addHooks(
      'NewEventMigration',
      {
        onSubmit: function onSubmit(changed) {
          this.event.preventDefault()
          const toSubmit = { ...changed, eventName: Volunteers.eventName }
          Meteor.call('event.new.event', toSubmit, () => {
            this.done()
            // eslint-disable-next-line no-unused-expressions
            onSubmitted?.()
          })
        },
      },
      true,
    )

    fetchSettings.call((err, sett) => {
      if (err) {
        console.error(err)
      } else {
        setSettings({
          ...sett,
          eventName: Volunteers.eventName,
          previousEventName: sett.eventName,
        })
      }
    })
  }, [onSubmitted])

  return (
    <div>
      {settings && (
        <Blaze
          template="quickForm"
          collection={EventSettings}
          id="NewEventMigration"
          doc={settings}
          buttonContent="Overwrite current data with last year's"
          buttonClasses="btn btn-danger btn-sm"
          fields="eventName,eventPeriod"
          validation="none"
        />
      )}
    </div>
  )
}
