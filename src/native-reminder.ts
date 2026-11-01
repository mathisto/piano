// The iPad app's practice reminder (horizon decision 29): the local notifications and Settings' row. Lazy, apart from the app shell
// (src/native-app.ts), so its imports do not reshape the boot chunks.
import { LocalNotifications } from '@capacitor/local-notifications'
import { focus } from './drill'
import { reminders, reminderText } from './reminder'
import { save, settings } from './settings'
import { getDrill, getPractice } from './store'

const ids = [1, 2, 3].map((id) => ({ id }))

/**
 * The next three practice reminders (src/reminder.ts), in place of the last: on each trip to the background and when the setting changes.
 * Never asks for permission, wireReminder does when the switch is turned on.
 */
export async function scheduleReminders() {
  try {
    const on = settings.remind !== undefined && (await LocalNotifications.checkPermissions()).display === 'granted'
    if (!on) return void (await LocalNotifications.cancel({ notifications: ids }))
    const when = reminders(settings.remind, await getPractice())
    const next = focus(await getDrill()) // what Today's Read row names
    const body = reminderText(settings.planMin, next.due ? `Review: ${next.stage.name}` : next.stage.name)
    await LocalNotifications.cancel({ notifications: ids })
    if (when.length) await LocalNotifications.schedule({ notifications: when.map((at, i) => ({ id: i + 1, title: 'Time for the piano', body, schedule: { at } })) })
  } catch (e) {
    console.warn('Practice reminder', e)
  }
}

/** Settings' Practice reminder row (src/ui-drawer.ts): Off or On, and a time. The iPad asks for permission when it is turned on, not before. */
export function wireReminder(d: HTMLElement) {
  const at = d.querySelector<HTMLInputElement>('#sRemindAt')
  const note = d.querySelector<HTMLElement>('#sRemindNote')
  if (!at || !note) return
  const denied = 'Notifications are off for Piano Forte. Turn them on in iPad Settings > Notifications, then try again.'
  const minutes = () => Number(at.value.slice(0, 2)) * 60 + Number(at.value.slice(3))
  if (settings.remind !== undefined) void LocalNotifications.checkPermissions().then((p) => p.display !== 'granted' && (note.textContent = denied))
  d.querySelectorAll<HTMLInputElement>('input[name=remind]').forEach((r) => {
    r.onchange = async () => {
      const want = r.value === '1'
      note.textContent = ''
      if (want && (await LocalNotifications.requestPermissions()).display !== 'granted') {
        d.querySelector<HTMLInputElement>('input[name=remind][value="0"]')!.checked = true
        note.textContent = denied
        return
      }
      settings.remind = want ? minutes() : undefined
      at.disabled = !want
      save()
      void scheduleReminders()
    }
  })
  at.onchange = () => {
    if (!at.value) return
    settings.remind = minutes()
    save()
    void scheduleReminders()
  }
}

